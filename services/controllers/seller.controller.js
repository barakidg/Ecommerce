import db from "../config/db.js"
import { attachEffectivePrice, buildSellerSaleFields } from "../lib/productPricing.js"
import { uploadToCloudinary } from "../config/cloudinary.js"
import { initiateChapaTransfer } from "./payout.controller.js"

export const requestSellerAccount = async (req, res) => {
    try {
        const { businessName,
            taxId,
            paymentMethod,
            accountNumber,
            accountHolder,
            bankName
        } = req.body
        const userId = req.user?.id

        const existingProfile = await db.sellerProfile.findUnique({
            where: { userId }
        })

        if (existingProfile) {
            return res.status(400).json({ message: "request/account already exists" })
        }
        const request = await db.sellerProfile.create({
            data: {
                userId,
                businessName,
                taxId,
                paymentMethod,
                accountNumber,
                accountHolder,
                bankName
            }
        })

        res.status(201).json({ message: "application submitted for review. ", request })
    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again." })
        console.log("controller: ", error)
    }
}

export const getSellerProfile = async (req, res) => {
    try {
        const userId = req.user?.id

        const profile = await db.sellerProfile.findFirst({
            where: { userId, deletedAt: null }
        })

        if (!profile) {
            return res.status(404).json({ message: "Profile not found" })
        } else if (profile.status === "PENDING") {
            return res.status(403).json({ message: "Account is under review. Please wait for approval." })
        } else if (profile.status === "REJECTED") {
            return res.status(403).json({
                message: "Account is rejected. Please contact support for assistance.",
                rejectionNote: profile.rejectionNote ?? null
            })
        } else if (profile.status === "SUSPENDED") {
            return res.status(403).json({ message: "Account is suspended. Please contact support for assistance." })
        }

        res.status(200).json({ profile })
    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again." })
        console.log("controller: ", error)
    }
}

export const updateSellerProfile = async (req, res) => {
    try {
        const { businessName,
            taxId,
            paymentMethod,
            accountNumber,
            accountHolder,
            bankName
        } = req.body
        const userId = req.user?.id

        const existingProfile = await db.sellerProfile.findFirst({
            where: { userId, deletedAt: null, status: "VERIFIED" }
        })

        if (!existingProfile) {
            return res.status(404).json({ message: "Profile not found" })
        }

        const updatedProfile = await db.sellerProfile.update({
            where: { userId },
            data: {
                businessName,
                taxId,
                paymentMethod,
                accountNumber,
                accountHolder,
                bankName
            }
        })

        res.status(200).json({ message: "Profile updated successfully", updatedProfile })
    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again." })
        console.log("controller: ", error)
    }
}

export const deleteSellerProfile = async (req, res) => {
    try {
        const userId = req.user?.id

        const existingProfile = await db.sellerProfile.findUnique({
            where: { userId }
        })

        if (!existingProfile) {
            return res.status(404).json({ message: "Profile not found" })
        }

        await db.$transaction(async (tx) => {
            await tx.sellerProfile.update({
                where: { userId },
                data: {
                    archived: true
                }
            })

            await tx.user.update({
                where: { id: userId },
                data: {
                    role: "USER"
                }
            })
        })

        res.status(200).json({ message: "Profile deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again." })
        console.log("controller: ", error)
    }
}

const parseAttributesFromBody = (raw) => {
    if (raw == null || raw === "") return null
    try {
        const parsed = typeof raw === "string" ? JSON.parse(raw) : raw
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed
    } catch (_) { }
    return null
}

export const postProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category } = req.body
        const attributes = parseAttributesFromBody(req.body.attributes)
        const userId = req.user?.id

        const saleResult = buildSellerSaleFields(price, req.body)
        if (saleResult.error) {
            return res.status(400).json({ message: saleResult.error })
        }

        const images = []
        for (const file of req.files) {
            const result = await uploadToCloudinary(file.buffer, "products")
            images.push({
                url: result.url,
                publicId: result.public_id
            })
        }

        const product = await db.product.create({
            data: {
                name,
                description,
                price,
                stock,
                category,
                attributes: attributes ?? undefined,
                ...saleResult.data,
                sellerProfile: {
                    connect: { userId }
                },
                productImages: {
                    create: images
                }
            },
            include: {
                productImages: true
            }
        })

        res.status(201).json({
            message: "Product created successfully",
            product: attachEffectivePrice(product)
        })
    } catch (error) {
        console.error("postProduct error: ", error)
        res.status(500).json({ message: "Internal server error. please try again." })
    }
}

export const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, attributes } = req.body
        const userId = req.user?.id
        const productId = req.params?.id

        const existingProduct = await db.product.findFirst({
            where: {
                id: productId,
                sellerProfile: { userId },
                archived: false
            },
            include: {
                productImages: true
            }
        })

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" })
        }

        const updateData = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (price !== undefined) updateData.price = price
        if (stock !== undefined) updateData.stock = stock
        if (category !== undefined) updateData.category = category
        if (attributes !== undefined) updateData.attributes = attributes

        const listPrice =
            price !== undefined ? Number(price) : Number(existingProduct.price)
        const saleTouched =
            Object.prototype.hasOwnProperty.call(req.body, "salePrice") ||
            Object.prototype.hasOwnProperty.call(req.body, "productDiscountAmount") ||
            Object.prototype.hasOwnProperty.call(req.body, "saleEndsAt")

        if (saleTouched) {
            const spRaw = req.body.salePrice
            const pdRaw = req.body.productDiscountAmount
            const endRaw = req.body.saleEndsAt
            const allBlank = [spRaw, pdRaw, endRaw].every(
                (v) =>
                    v === undefined ||
                    v === null ||
                    (typeof v === "string" && v.trim() === "")
            )
            if (allBlank) {
                updateData.salePrice = null
                updateData.productDiscountAmount = null
                updateData.saleEndsAt = null
            } else {
                const saleResult = buildSellerSaleFields(listPrice, req.body)
                if (saleResult.error) {
                    return res.status(400).json({ message: saleResult.error })
                }
                Object.assign(updateData, saleResult.data)
            }
        }

        if (req.files && req.files.length > 0) {
            const newImages = []
            for (const file of req.files) {
                if (!file.buffer) continue
                const result = await uploadToCloudinary(file.buffer, "products")
                newImages.push({
                    url: result.url,
                    publicId: result.public_id
                })
            }
            if (newImages.length > 0) {
                updateData.productImages = {
                    deleteMany: {},
                    create: newImages
                }
            }
        }

        const updatedProduct = await db.product.update({
            where: { id: productId },
            data: updateData,
            include: {
                productImages: true
            }
        })

        res.status(200).json({
            message: "Product updated successfully",
            updatedProduct: attachEffectivePrice(updatedProduct)
        })
    } catch (error) {
        console.error("updateProduct error: ", error)
        res.status(500).json({ message: "Internal server error." })
    }
}

export const deleteProduct = async (req, res) => {
    try {
        const userId = req.user?.id
        const productId = req.params?.id

        const existingProduct = await db.product.findFirst({
            where: { id: productId, sellerProfile: { userId } }
        })

        if (!existingProduct) {
            return res.status(404).json({ message: "Product not found" })
        }

        await db.product.update({
            where: { id: productId },
            data: {
                archived: true
            }
        })

        res.status(200).json({ message: "Product deleted successfully" })
    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again." })
        console.log("controller: ", error)
    }
}

export const getProducts = async (req, res) => {
    try {
        const userId = req.user?.id

        const products = await db.product.findMany({
            where: { sellerProfile: { userId }, archived: false },
            include: {
                productImages: true,
                featuredProductRequests: {
                    where: { status: "PENDING" },
                    take: 1,
                    select: { id: true, durationDays: true }
                }
            }
        })

        res.status(200).json({
            products: products.map((p) => attachEffectivePrice(p))
        })
    } catch (error) {
        res.status(500).json({ message: "Internal server error. please try again." })
        console.log("controller: ", error)
    }
}

export const getProduct = async (req, res) => {
    try {
        const userId = req.user?.id
        const productId = req.params?.id

        const product = await db.product.findFirst({
            where: { id: productId, sellerProfile: { userId } },
            include: {
                productImages: true
            }
        })

        if (!product) {
            return res.status(404).json({ message: "Product not found" })
        }

        res.status(200).json({ product: attachEffectivePrice(product) })
    } catch (error) {
        res.status(500).json({ message: "Internal server error." })
    }
}

const EXCLUDED_REVENUE_STATUSES = ["CANCELLED", "REFUNDED"]

export const getSellerDashboardSummary = async (req, res) => {
    try {
        const userId = req.user?.id
        const profile = await db.sellerProfile.findUnique({ where: { userId } })
        if (!profile) {
            return res.status(404).json({ message: "Seller profile not found" })
        }

        const productCount = await db.product.count({
            where: { sellerProfileId: profile.id, archived: false }
        })

        const lowStockCount = await db.product.count({
            where: { sellerProfileId: profile.id, archived: false, stock: { lte: 10 } }
        })

        const revenueRows = await db.orderItem.findMany({
            where: {
                sellerProfileId: profile.id,
                status: { notIn: EXCLUDED_REVENUE_STATUSES }
            },
            select: { priceAtPurchase: true, quantity: true }
        })
        const totalRevenue = revenueRows.reduce(
            (sum, row) => sum + Number(row.priceAtPurchase) * row.quantity,
            0
        )
        const unitsSold = revenueRows.reduce((sum, row) => sum + row.quantity, 0)

        const activeOrderRows = await db.orderItem.findMany({
            where: {
                sellerProfileId: profile.id,
                status: { in: ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED"] }
            },
            select: { orderId: true },
            distinct: ["orderId"]
        })
        const activeOrderCount = activeOrderRows.length

        const recentSales = await db.orderItem.findMany({
            where: { sellerProfileId: profile.id },
            take: 6,
            orderBy: { id: "desc" },
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        productImages: { take: 1, select: { url: true } }
                    }
                },
                order: {
                    select: {
                        id: true,
                        status: true,
                        totalAmount: true,
                        createdAt: true,
                        user: { select: { name: true, email: true } }
                    }
                }
            }
        })

        res.status(200).json({
            stats: {
                totalRevenue,
                activeOrders: activeOrderCount,
                productCount,
                lowStockCount,
                unitsSold
            },
            recentSales
        })
    } catch (error) {
        console.error("getSellerDashboardSummary:", error)
        res.status(500).json({ message: "Internal server error." })
    }
}

export const getSales = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { cursor, limit = 20, status } = req.query;

        const sellerProfile = await db.sellerProfile.findUnique({ where: { userId } });
        if (!sellerProfile) return res.status(404).json({ message: "Seller profile not found" });

        const sales = await db.orderItem.findMany({
            where: {
                sellerProfileId: sellerProfile.id,
                ...(status && { status })
            },
            take: parseInt(limit),
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { id: "desc" },
            include: {
                product: { select: { name: true, price: true, productImages: { take: 1 } } },
                order: {
                    select: {
                        id: true,
                        shippingAddress: true,
                        shippingCity: true,
                        shippingCountry: true,
                        status: true,
                        createdAt: true,
                        user: { select: { name: true, email: true } }
                    }
                }
            }
        });

        res.status(200).json({
            sales,
            nextCursor: sales.length === parseInt(limit) ? sales.at(-1).id : null
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const getSaleById = async (req, res) => {
    try {
        const userId = req.user?.id;
        const itemId = req.params?.id;

        const sellerProfile = await db.sellerProfile.findUnique({ where: { userId } });

        const sale = await db.orderItem.findFirst({
            where: {
                id: itemId,
                sellerProfileId: sellerProfile?.id
            },
            include: {
                product: true,
                order: { include: { user: { select: { name: true, email: true } } } }
            }
        });

        if (!sale) return res.status(404).json({ message: "Sale not found" });

        res.status(200).json({ sale });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};

export const updateSaleStatus = async (req, res) => {
    try {
        const userId = req.user?.id;
        const itemId = req.params?.id;
        const { status } = req.body;

        const sellerProfile = await db.sellerProfile.findUnique({ where: { userId } });

        const existingSale = await db.orderItem.findFirst({
            where: { id: itemId, sellerProfileId: sellerProfile?.id }
        });

        if (!existingSale) return res.status(404).json({ message: "Sale not found" });

        const updatedSale = await db.orderItem.update({
            where: { id: itemId },
            data: { status }
        });

        res.status(200).json({ message: "Status updated", sale: updatedSale });
    } catch (error) {
        res.status(500).json({ message: "Internal server error." });
    }
};


export const getFinances = async (req, res) => {
    try {
        const userId = req.user?.id;
        const profile = await db.sellerProfile.findUnique({ where: { userId } });
        if (!profile) return res.status(404).json({ message: "Not found" });

        res.status(200).json({
            balance: profile.balance,
            heldBalance: profile.heldBalance
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getLedger = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { cursor, limit = 20 } = req.query;

        const profile = await db.sellerProfile.findUnique({ where: { userId } });

        const entries = await db.ledgerEntry.findMany({
            where: { sellerProfileId: profile?.id },
            take: parseInt(limit),
            skip: cursor ? 1 : 0,
            cursor: cursor ? { id: cursor } : undefined,
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json({
            entries,
            nextCursor: entries.length === parseInt(limit) ? entries.at(-1).id : null
        });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


export const requestPayout = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { amount, provider } = req.body;

        const profile = await db.sellerProfile.findUnique({ where: { userId } });

        if (!profile) {
            return res.status(404).json({ message: "Seller profile not found" });
        }

        if (!profile.accountHolder || !profile.accountNumber) {
            return res.status(400).json({
                message: "Please complete payout account details in your store profile."
            });
        }

        if (Number(profile.balance) < amount) {
            const msg =
                profile && Number(profile.heldBalance) > 0 && Number(profile.balance) < amount
                    ? "Insufficient available balance. Recent sales may still be in escrow until the buyer confirms delivery and the dispute window ends."
                    : "Insufficient balance";
            return res.status(400).json({ message: msg });
        }

        const payout = await db.$transaction(async (tx) => {
            const newPayout = await tx.payout.create({
                data: {
                    sellerProfileId: profile.id,
                    amount,
                    provider,
                    status: "PENDING"
                }
            });

            await tx.sellerProfile.update({
                where: { id: profile.id },
                data: {
                    balance: { decrement: amount },
                    payoutHoldBalance: { increment: amount }
                }
            });

            return newPayout;
        });

        const transfer = await initiateChapaTransfer({
            referenceId: payout.id,
            amount,
            currency: payout.currency,
            accountName: profile.accountHolder,
            accountNumber: profile.accountNumber,
            bankCode: profile.bankName || profile.paymentMethod || "CHAPA",
            narration: `${profile.businessName || "Seller"} payout`
        });

        if (!transfer.success) {
            await db.$transaction(async (tx) => {
                await tx.payout.update({
                    where: { id: payout.id },
                    data: { status: "FAILED" }
                });

                await tx.sellerProfile.update({
                    where: { id: profile.id },
                    data: {
                        balance: { increment: amount },
                        payoutHoldBalance: { decrement: amount }
                    }
                });
            });

            return res.status(502).json({
                message: transfer.errorMessage || "Payout transfer failed"
            });
        }

        const settledPayout = await db.$transaction(async (tx) => {
            await tx.payout.update({
                where: { id: payout.id },
                data: {
                    status: "SUCCESS",
                    providerRef: transfer.providerRef
                }
            });

            await tx.sellerProfile.update({
                where: { id: profile.id },
                data: {
                    payoutHoldBalance: { decrement: amount }
                }
            });

            await tx.ledgerEntry.create({
                data: {
                    sellerProfileId: profile.id,
                    type: "DEBIT",
                    amount,
                    referenceId: payout.id,
                    referenceType: "PAYOUT_TRANSFER"
                }
            });

            return tx.payout.findUnique({ where: { id: payout.id } });
        });

        res.status(201).json({ message: "Payout transferred successfully", payout: settledPayout });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getPayouts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const profile = await db.sellerProfile.findUnique({ where: { userId } });

        const payouts = await db.payout.findMany({
            where: { sellerProfileId: profile?.id },
            orderBy: { createdAt: "desc" }
        });

        res.status(200).json({ payouts });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};


export const createDiscount = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { code, type, value, maxDiscount, minOrderAmount, usageLimit, expiresAt } = req.body;

        const profile = await db.sellerProfile.findUnique({ where: { userId } });

        const existing = await db.discount.findUnique({ where: { code } });
        if (existing) return res.status(400).json({ message: "Code already exists" });

        const discount = await db.discount.create({
            data: {
                sellerProfileId: profile.id,
                code: code.toUpperCase(),
                type,
                value,
                maxDiscount,
                minOrderAmount,
                usageLimit,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                active: true
            }
        });

        res.status(201).json({ message: "Discount created", discount });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const getDiscounts = async (req, res) => {
    try {
        const userId = req.user?.id;
        const profile = await db.sellerProfile.findUnique({ where: { userId } });

        const discounts = await db.discount.findMany({
            where: { sellerProfileId: profile?.id },
            orderBy: { code: "asc" }
        });

        res.status(200).json({ discounts });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const toggleDiscount = async (req, res) => {
    try {
        const userId = req.user?.id;
        const discountId = req.params?.id;
        const { active } = req.body;

        const profile = await db.sellerProfile.findUnique({ where: { userId } });

        const existing = await db.discount.findFirst({
            where: { id: discountId, sellerProfileId: profile?.id }
        });

        if (!existing) return res.status(404).json({ message: "Discount not found" });

        const updated = await db.discount.update({
            where: { id: discountId },
            data: { active }
        });

        res.status(200).json({ message: "Discount updated", discount: updated });
    } catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
};

export const requestProductFeature = async (req, res) => {
    try {
        const userId = req.user?.id;
        const productId = req.params.productId;
        const durationDays = parseInt(req.body?.durationDays, 10);

        const profile = await db.sellerProfile.findFirst({
            where: { userId, deletedAt: null, status: "VERIFIED" }
        });
        if (!profile) {
            return res.status(403).json({ message: "Verified seller profile required" });
        }

        const product = await db.product.findFirst({
            where: { id: productId, sellerProfileId: profile.id, archived: false }
        });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        const now = new Date();
        const stillFeatured =
            product.isFeatured &&
            (!product.featuredUntil || product.featuredUntil > now);
        if (stillFeatured) {
            return res.status(400).json({ message: "This product is already featured" });
        }

        const pending = await db.featuredProductRequest.findFirst({
            where: { productId, status: "PENDING" }
        });
        if (pending) {
            return res.status(400).json({ message: "A feature request is already pending" });
        }

        const request = await db.featuredProductRequest.create({
            data: {
                productId,
                sellerProfileId: profile.id,
                durationDays
            }
        });

        res.status(201).json({ message: "Feature request sent to admin", request });
    } catch (error) {
        console.error("requestProductFeature:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};
