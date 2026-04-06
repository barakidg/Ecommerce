import db from "../config/db.js"
import { uploadToCloudinary } from "../config/cloudinary.js"
import { v2 as cloudinary } from "cloudinary"
import { initiatePayment } from "./payment.controller.js"
import {
    attachEffectivePrice,
    getEffectiveUnitPrice,
    mapProductsWithEffectivePrice
} from "../lib/productPricing.js"
import { getDefaultDeliveryFeeAmount } from "../lib/orderFlow.js"

const USER_SELECT = {
    id: true,
    name: true,
    email: true,
    profilePic: true,
    role: true,
    status: true,
    createdAt: true,
    sellerProfile: true
}

const ensureActiveUser = (user) => {
    return user && !user.deletedAt && user.status === "ACTIVE"
}

export const getProfile = async (req, res) => {
    const user = await db.user.findUnique({
        where: { id: req.user.id },
        select: USER_SELECT
    })

    if (!ensureActiveUser(user)) {
        return res.status(404).json({ message: "User not found or inactive" })
    }

    res.json({ user })
}

export const updateProfile = async (req, res) => {
    let imageData = null
    try {
        const user = await db.user.findUnique({ where: { id: req.user.id } })
        if (!ensureActiveUser(user)) return res.status(404).json({ message: "User not found" })

        const { name, email } = req.body

        if (req.file) {
            if (user.picPublicId) await cloudinary.uploader.destroy(user.picPublicId)
            imageData = await uploadToCloudinary(req.file.buffer, "profile_pictures")
        }

        const updated = await db.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(email && { email }),
                ...(imageData && {
                    profilePic: imageData.url,
                    picPublicId: imageData.public_id
                })
            },
            select: USER_SELECT
        })

        res.json({ user: updated })
    } catch (err) {
        if (imageData?.public_id) await cloudinary.uploader.destroy(imageData.public_id)
        res.status(500).json({ message: "Update failed" })
    }
}


export const createOrder = async (req, res) => {
    const userId = req.user.id;
    const {
        shippingAddress, shippingPhone, shippingCity, shippingCountry
    } = req.body;

    const user = await db.user.findUnique({ where: { id: userId } });
    const cartItems = await db.cartItem.findMany({
        where: { userId },
        include: { product: { include: { sellerProfile: true } } }
    });

    if (!cartItems.length) return res.status(400).json({ message: "Cart empty" });

    try {
        const result = await db.$transaction(async (tx) => {
            let subtotal = 0;
            let discountedSubtotal = 0;
            let totalTax = 0;
            let totalCommission = 0;
            const orderItemsData = [];

            for (const item of cartItems) {
                const product = item.product;
                if (!product || product.stock < item.quantity) throw new Error(`${product.name} out of stock`);

                const listPrice = Number(product.price);
                const price = getEffectiveUnitPrice(product);
                const lineSubtotal = listPrice * item.quantity;
                const itemSubtotal = price * item.quantity;
                const commRate = Number(product.sellerProfile.commissionRate || 0.1);
                const taxRate = Number(product.sellerProfile.taxPercentage || 0.15);

                const itemCommission = itemSubtotal * commRate;
                const itemTax = itemSubtotal * taxRate;

                subtotal += lineSubtotal;
                discountedSubtotal += itemSubtotal;
                totalTax += itemTax;
                totalCommission += itemCommission;

                orderItemsData.push({
                    productId: product.id,
                    sellerProfileId: product.sellerProfileId,
                    quantity: item.quantity,
                    priceAtPurchase: price,
                    commissionAmount: itemCommission,
                    taxAmount: itemTax,
                    status: "PENDING"
                });
            }

            const discountAmount = Math.max(0, subtotal - discountedSubtotal);

            const availableDeliveryProfile = await tx.deliveryProfile.findFirst({
                where: { isAvailable: true },
                orderBy: { updatedAt: "desc" },
                select: { baseDeliveryFeeAmount: true }
            });
            const deliveryFeeAmount = Number(
                availableDeliveryProfile?.baseDeliveryFeeAmount ??
                getDefaultDeliveryFeeAmount()
            );
            const totalAmount = (subtotal - discountAmount) + totalTax + deliveryFeeAmount;

            const order = await tx.order.create({
                data: {
                    userId,
                    subtotalAmount: subtotal,
                    taxAmount: totalTax,
                    commissionAmount: totalCommission,
                    discountAmount,
                    deliveryFeeAmount,
                    totalAmount,
                    shippingAddress, shippingPhone, shippingCity, shippingCountry,
                    status: "PENDING",
                    items: { create: orderItemsData }
                }
            });

            const payment = await tx.payment.create({
                data: {
                    orderId: order.id,
                    amount: totalAmount,
                    provider: "CHAPA",
                    status: "PENDING",
                    providerRef: `pending_order_${order.id}`
                }
            });

            const checkoutUrl = await initiatePayment(payment, user);

            for (const item of cartItems) {
                await tx.product.update({
                    where: { id: item.productId },
                    data: { stock: { decrement: item.quantity } }
                });
            }

            await tx.cartItem.deleteMany({ where: { userId } });

            return { order, payment, checkoutUrl };
        });

        res.json({ orderId: result.order.id, checkoutUrl: result.checkoutUrl });

    } catch (err) {
        console.error("DEBUG ERROR in createOrder:", err);
        res.status(400).json({ message: err.message });
    }
};

export const viewCategories = async (req, res) => {
    const { category, cursor, limit = 20, sort } = req.query
    if (!category) return res.status(400).json({ message: "Category required" })

    let orderBy = undefined
    if (sort === "newest") {
        orderBy = { createdAt: "desc" }
    }

    const products = await db.product.findMany({
        take: parseInt(limit),
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        where: { archived: false, category },
        orderBy,
        include: {
            productImages: true,
            sellerProfile: { select: { businessName: true } },
            reviews: { select: { rating: true } }
        }
    })

    res.json({
        products: mapProductsWithEffectivePrice(products),
        nextCursor: products.length === parseInt(limit) ? products.at(-1).id : null
    })
}

export const listCategoryProductCounts = async (req, res) => {
    try {
        const rows = await db.product.groupBy({
            by: ["category"],
            where: {
                archived: false,
                category: { not: null }
            },
            _count: { id: true }
        })

        const categories = rows
            .filter((r) => r.category && String(r.category).trim() !== "")
            .map((r) => ({
                name: r.category,
                count: r._count.id
            }))

        res.json({ categories })
    } catch (err) {
        console.error("listCategoryProductCounts:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}

export const writeReview = async (req, res) => {
    const { rating, comment } = req.body
    if (rating < 1 || rating > 5) return res.status(400).json({ message: "Rating must be 1-5" })

    const existing = await db.review.findFirst({
        where: { userId: req.user.id, productId: req.params.productId }
    })

    if (existing) return res.status(400).json({ message: "Already reviewed" })

    await db.review.create({
        data: {
            userId: req.user.id,
            productId: req.params.productId,
            rating: parseInt(rating),
            comment
        }
    })
    res.json({ message: "Review added" })
}

export const deleteAccount = async (req, res) => {
    await db.user.update({
        where: { id: req.user.id },
        data: {
            deletedAt: new Date(),
            status: "BANNED"
        }
    })

    res.json({ message: "Account deleted" })
}

export const getCart = async (req, res) => {
    const cartItems = await db.cartItem.findMany({
        where: { userId: req.user.id },
        include: {
            product: {
                include: { productImages: true }
            }
        }
    })

    const out = cartItems.map((row) => ({
        ...row,
        product: row.product ? attachEffectivePrice(row.product) : null
    }))

    res.json({ cartItems: out })
}

export const addToCart = async (req, res) => {
    const { productId } = req.params
    const quantity = Number(req.body.quantity)

    const product = await db.product.findUnique({
        where: { id: productId }
    })

    if (!product || product.archived) {
        return res.status(404).json({ message: "Product not found" })
    }

    const item = await db.cartItem.upsert({
        where: {
            userId_productId: {
                userId: req.user.id,
                productId
            }
        },
        update: { quantity: { increment: quantity } },
        create: {
            userId: req.user.id,
            productId,
            quantity
        }
    })

    res.json({ item })
}

export const updateCartItem = async (req, res) => {
    const { productId } = req.params
    const quantity = Number(req.body.quantity)

    const item = await db.cartItem.findUnique({
        where: {
            userId_productId: {
                userId: req.user.id,
                productId
            }
        }
    })

    if (!item) {
        return res.status(404).json({ message: "Item not found" })
    }

    const updated = await db.cartItem.update({
        where: {
            userId_productId: {
                userId: req.user.id,
                productId
            }
        },
        data: { quantity }
    })

    res.json({ updated })
}

export const removeFromCart = async (req, res) => {
    const { productId } = req.params

    const item = await db.cartItem.findUnique({
        where: {
            userId_productId: {
                userId: req.user.id,
                productId
            }
        }
    })

    if (!item) {
        return res.status(404).json({ message: "Item not found" })
    }

    await db.cartItem.delete({
        where: {
            userId_productId: {
                userId: req.user.id,
                productId
            }
        }
    })

    res.json({ message: "Removed" })
}

export const clearCart = async (req, res) => {
    await db.cartItem.deleteMany({
        where: { userId: req.user.id }
    })

    res.json({ message: "Cart cleared" })
}

export const getWishlist = async (req, res) => {
    const rows = await db.wishlistItem.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" },
        include: {
            product: {
                include: { productImages: true, sellerProfile: { select: { businessName: true } } }
            }
        }
    })

    const items = rows.map((row) => ({
        ...row,
        product: row.product ? attachEffectivePrice(row.product) : null
    }))

    res.json({ items })
}

export const addToWishlist = async (req, res) => {
    const { productId } = req.params

    const product = await db.product.findUnique({
        where: { id: productId }
    })

    if (!product || product.archived) {
        return res.status(404).json({ message: "Product not found" })
    }

    const existing = await db.wishlistItem.findUnique({
        where: {
            userId_productId: {
                userId: req.user.id,
                productId
            }
        }
    })

    if (existing) {
        return res.json({ item: existing, alreadySaved: true })
    }

    const item = await db.wishlistItem.create({
        data: {
            userId: req.user.id,
            productId
        }
    })

    res.status(201).json({ item })
}

export const removeFromWishlist = async (req, res) => {
    const { productId } = req.params

    const deleted = await db.wishlistItem.deleteMany({
        where: {
            userId: req.user.id,
            productId
        }
    })

    if (deleted.count === 0) {
        return res.status(404).json({ message: "Not in wishlist" })
    }

    res.json({ message: "Removed from wishlist" })
}

export const cancelOrder = async (req, res) => {
    const { orderId } = req.params

    const order = await db.order.findFirst({
        where: {
            id: orderId,
            userId: req.user.id
        },
        include: { items: true }
    })

    if (!order) {
        return res.status(404).json({ message: "Order not found" })
    }

    if (order.status !== "PENDING") {
        return res.status(400).json({ message: "Cannot cancel" })
    }

    await db.$transaction(async (tx) => {

        await tx.order.update({
            where: { id: orderId },
            data: { status: "CANCELLED" }
        })

        for (const item of order.items) {
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: { increment: item.quantity }
                }
            })
        }
    })

    res.json({ message: "Cancelled" })
}

export const deleteReview = async (req, res) => {
    const { reviewId } = req.params

    const review = await db.review.findFirst({
        where: {
            id: reviewId,
            userId: req.user.id
        }
    })

    if (!review) {
        return res.status(404).json({ message: "Not found" })
    }

    await db.review.delete({
        where: { id: reviewId }
    })

    res.json({ message: "Deleted" })
}


export const getLedger = async (req, res) => {
    const entries = await db.ledgerEntry.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: "desc" }
    })

    res.json({ entries })
}

export const getFeaturedProducts = async (req, res) => {
    try {
        const now = new Date();
        await db.product.updateMany({
            where: {
                isFeatured: true,
                featuredUntil: { not: null, lt: now }
            },
            data: { isFeatured: false, featuredUntil: null }
        });

        const products = await db.product.findMany({
            where: {
                archived: false,
                isFeatured: true,
                OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }]
            },
            include: {
                productImages: true,
                sellerProfile: { select: { businessName: true } },
                reviews: { select: { rating: true } }
            },
            orderBy: { updatedAt: "desc" },
            take: 48
        });

        res.json({ products: mapProductsWithEffectivePrice(products) });
    } catch (e) {
        console.error("getFeaturedProducts:", e);
        res.status(500).json({ message: "Failed to load featured products." });
    }
};

export const listProductsOnSale = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit, 10) || 24;
        const now = new Date();
        const candidates = await db.product.findMany({
            take: Math.min(limit * 3, 120),
            where: {
                archived: false,
                saleEndsAt: { gt: now },
                OR: [{ productDiscountAmount: { not: null } }]
            },
            include: {
                productImages: true,
                sellerProfile: { select: { businessName: true } },
                reviews: { select: { rating: true } }
            },
            orderBy: { saleEndsAt: "asc" }
        });

        const filtered = candidates
            .filter((p) => getEffectiveUnitPrice(p) < Number(p.price))
            .slice(0, limit);

        res.json({ products: mapProductsWithEffectivePrice(filtered) });
    } catch (e) {
        console.error("listProductsOnSale:", e);
        res.status(500).json({ message: "Failed to load sale products." });
    }
};

export const viewProducts = async (req, res) => {
    const { cursor: queryCursor, limit: queryLimit, sort, timeFilter } = req.query;
    const cursor = queryCursor ? { id: queryCursor } : undefined;
    const limit = parseInt(queryLimit) || 20;

    let orderBy = undefined;
    let createdAtFilter = undefined;

    if (sort === "best-sellers") {
        orderBy = { orderItems: { _count: 'desc' } };
    } else if (sort === "new-releases") {
        orderBy = { createdAt: 'desc' };

        if (timeFilter) {
            const now = new Date();
            let startDate = new Date();
            switch (timeFilter) {
                case 'Last 1 hr':
                    startDate = new Date(now.getTime() - 60 * 60 * 1000);
                    break;
                case 'Today':
                    startDate.setHours(0, 0, 0, 0);
                    break;
                case 'This Week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'This Month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = undefined;
            }
            if (startDate) {
                createdAtFilter = { gte: startDate };
            }
        }
    }

    const whereClause = {
        archived: false,
        ...(createdAtFilter && { createdAt: createdAtFilter })
    };

    const products = await db.product.findMany({
        take: limit,
        skip: cursor ? 1 : 0,
        cursor,
        where: whereClause,
        orderBy,
        include: {
            productImages: true,
            sellerProfile: true,
            reviews: { select: { rating: true } }
        }
    });

    res.json({
        products: mapProductsWithEffectivePrice(products),
        nextCursor: products.length === limit ? products.at(-1).id : null
    });
}

export const getProduct = async (req, res) => {
    const product = await db.product.findUnique({
        where: { id: req.params.productId },
        include: {
            productImages: true,
            sellerProfile: true,
            reviews: {
                include: {
                    user: { select: { name: true } }
                }
            }
        }
    })

    if (!product || product.archived) {
        return res.status(404).json({ message: "Not found" })
    }

    res.json(attachEffectivePrice(product))
}


export const validateDiscount = async (req, res) => {
    const { code, orderAmount } = req.body;

    const discount = await db.discount.findUnique({
        where: { code }
    });

    if (!discount || !discount.active) {
        return res.status(404).json({ message: "Invalid or inactive discount code" });
    }

    if (discount.expiresAt && new Date() > discount.expiresAt) {
        return res.status(400).json({ message: "Discount has expired" });
    }

    if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
        return res.status(400).json({ message: "Discount usage limit reached" });
    }

    if (discount.minOrderAmount && orderAmount < Number(discount.minOrderAmount)) {
        return res.status(400).json({
            message: `Minimum order amount of ${discount.minOrderAmount} required`
        });
    }

    let saving = 0;
    if (discount.type === "PERCENTAGE") {
        saving = orderAmount * (Number(discount.value) / 100);
        if (discount.maxDiscount && saving > Number(discount.maxDiscount)) {
            saving = Number(discount.maxDiscount);
        }
    } else {
        saving = Number(discount.value);
    }

    res.json({
        valid: true,
        discountId: discount.id,
        saving: Number(saving.toFixed(2))
    });
};


export const openDispute = async (req, res) => {
    const { orderId } = req.params;
    const { reason, orderItemId } = req.body;

    const order = await db.order.findFirst({
        where: { id: orderId, userId: req.user.id },
        include: {
            items: true,
            payments: { where: { status: "SUCCESS" }, take: 1 },
            disputes: { where: { status: "OPEN" } }
        }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status === "CANCELLED") {
        return res.status(400).json({ message: "Cannot dispute a cancelled order" });
    }

    if (!order.payments.length) {
        return res.status(400).json({ message: "Order is not paid yet" });
    }

    if (!order.buyerConfirmedAt) {
        return res.status(400).json({
            message: "You can open a dispute only after delivery is confirmed with the handoff code."
        });
    }

    const now = new Date();
    if (!order.disputeWindowEndsAt || now > order.disputeWindowEndsAt) {
        return res.status(400).json({
            message: "The dispute window for this order has ended. Please contact support if you still need help."
        });
    }

    if (order.disputes.length) {
        return res.status(400).json({ message: "There is already an open dispute for this order" });
    }

    if (orderItemId) {
        const line = order.items.find((i) => i.id === orderItemId);
        if (!line) {
            return res.status(400).json({ message: "Order line not found on this order" });
        }
    }

    const dispute = await db.dispute.create({
        data: {
            orderId,
            orderItemId: orderItemId || null,
            userId: req.user.id,
            reason,
            status: "OPEN"
        }
    });

    await db.auditLog.create({
        data: {
            action: "DISPUTE_OPENED",
            userId: req.user.id,
            entityId: dispute.id,
            entityType: "DISPUTE",
            metadata: { orderId: order.id, orderItemId: orderItemId || null }
        }
    });

    res.status(201).json({ message: "Dispute opened successfully", dispute });
};

export const getMyDisputes = async (req, res) => {
    const disputes = await db.dispute.findMany({
        where: { userId: req.user.id },
        include: { order: true },
        orderBy: { createdAt: "desc" }
    });
    res.json(disputes);
};

export const getMyOrders = async (req, res) => {
    const { cursor, limit = 20, status } = req.query;

    const orders = await db.order.findMany({
        where: {
            userId: req.user.id,
            ...(status && { status })
        },
        take: parseInt(limit),
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
            items: {
                include: { product: { select: { name: true, productImages: { take: 1 } } } }
            },
            payments: { select: { status: true, amount: true } }
        }
    });

    res.json({
        orders,
        nextCursor: orders.length === parseInt(limit) ? orders.at(-1).id : null
    });
};

export const getOrderById = async (req, res) => {
    const { orderId } = req.params;

    const order = await db.order.findFirst({
        where: { id: orderId, userId: req.user.id },
        include: {
            items: {
                include: { product: true }
            },
            payments: true,
            disputes: true
        }
    });

    if (!order) return res.status(404).json({ message: "Order not found" });

    res.json(order);
};

export const updateReview = async (req, res) => {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await db.review.findFirst({
        where: { id: reviewId, userId: req.user.id }
    });

    if (!review) return res.status(404).json({ message: "Review not found" });

    const updated = await db.review.update({
        where: { id: reviewId },
        data: {
            ...(rating && { rating: parseInt(rating) }),
            ...(comment !== undefined && { comment })
        }
    });

    res.json({ message: "Review updated", review: updated });
};

export const closeDispute = async (req, res) => {
    const { disputeId } = req.params;

    const dispute = await db.dispute.findFirst({
        where: { id: disputeId, userId: req.user.id }
    });

    if (!dispute) return res.status(404).json({ message: "Dispute not found" });
    if (dispute.status !== "OPEN") return res.status(400).json({ message: "Only open disputes can be closed" });

    const closed = await db.dispute.update({
        where: { id: disputeId },
        data: { status: "CLOSED_BY_USER" }
    });

    res.json({ message: "Dispute closed", dispute: closed });
};

export const searchProducts = async (req, res) => {
    const { q, categories, minPrice, maxPrice, minRating, sort, cursor: queryCursor, limit: queryLimit } = req.query;
    const limit = parseInt(queryLimit) || 20;

    const whereClause = { archived: false };

    if (q) {
        const trimmed = q.trim();
        const words = trimmed.split(/\s+/).filter(Boolean);
        whereClause.AND = words.map((word) => ({
            OR: [
                { name: { contains: word, mode: "insensitive" } },
                { description: { contains: word, mode: "insensitive" } },
                { category: { contains: word, mode: "insensitive" } },
                { sellerProfile: { businessName: { contains: word, mode: "insensitive" } } }
            ]
        }));
    }

    if (categories) {
        const cats = categories.split(',').map(c => c.trim()).filter(Boolean);
        if (cats.length > 0) {
            whereClause.category = { in: cats };
        }
    }

    const priceFilter = {};
    if (minPrice !== undefined && minPrice !== null && String(minPrice) !== "") {
        const n = Number(minPrice);
        if (!Number.isNaN(n)) priceFilter.gte = n;
    }
    if (maxPrice !== undefined && maxPrice !== null && String(maxPrice) !== "") {
        const n = Number(maxPrice);
        if (!Number.isNaN(n)) priceFilter.lte = n;
    }
    if (Object.keys(priceFilter).length > 0) {
        whereClause.price = priceFilter;
    }

    let orderBy = undefined;
    if (sort === 'price-asc') orderBy = { price: 'asc' };
    else if (sort === 'price-desc') orderBy = { price: 'desc' };
    else if (sort === 'newest') orderBy = { createdAt: 'desc' };
    else if (sort === 'rating') orderBy = { reviews: { _avg: { rating: 'desc' } } };
    else if (sort === 'relevance' && !q) orderBy = { orderItems: { _count: 'desc' } };
    else if (sort === 'relevance' && q) orderBy = [{ orderItems: { _count: 'desc' } }, { createdAt: 'desc' }];

    if (minRating !== undefined && minRating !== null && String(minRating) !== '') {
        const threshold = parseFloat(minRating);
        if (!Number.isNaN(threshold) && threshold > 0) {
            const grouped = await db.review.groupBy({
                by: ['productId'],
                where: { product: { archived: false } },
                having: {
                    rating: {
                        _avg: { gte: threshold }
                    }
                }
            });
            const ids = grouped.map((g) => g.productId);
            if (ids.length === 0) {
                return res.json({ products: [], nextCursor: null });
            }
            whereClause.id = { in: ids };
        }
    }

    const products = await db.product.findMany({
        take: limit,
        skip: queryCursor ? 1 : 0,
        cursor: queryCursor ? { id: queryCursor } : undefined,
        where: whereClause,
        orderBy,
        include: {
            productImages: true,
            sellerProfile: { select: { businessName: true } },
            reviews: { select: { rating: true } }
        }
    });

    res.json({
        products: mapProductsWithEffectivePrice(products),
        nextCursor: products.length === limit ? products.at(-1).id : null
    });
};

