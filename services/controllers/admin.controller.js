import db from "../config/db.js"
import { ensureCompanyAccountOutsideTransaction } from "../lib/companyAccount.js"

const paginationHelper = (cursor, limit) => {
    return {
        take: limit,
        skip: cursor ? 1 : 0,
        cursor: cursor,
        orderBy: { id: "asc" },
    }
}
export const getAllUsers = async (req, res) => {
    try {
        const cursor = req.query.cursor ? { id: req.query.cursor } : undefined
        const limit = req.query.limit || 20

        const users = await db.user.findMany({
            ...paginationHelper(cursor, limit),
            select: { id: true, email: true, name: true, role: true, createdAt: true }
        })

        res.status(200).json({
            users,
            nextCursor: users.length === limit ? users[users.length - 1].id : null
        })
    } catch (error) {
        res.status(500).json({ message: "server error." })
        console.log("controller: ", error)
    }
}

export const getUserById = async (req, res) => {
    try {
        const { userId } = req.params
        const user = await db.user.findUnique({ where: { id: userId } })
        res.status(200).json({ user })
    } catch (error) {
        res.status(500).json({ message: "server error." })
        console.log("controller: ", error)
    }
}

export const updateSellerStatus = async (req, res) => {
    try {
        const { sellerProfileId } = req.params;
        const { status } = req.body;

        const profile = await db.sellerProfile.findUnique({
            where: { id: sellerProfileId }
        });

        if (!profile) return res.status(404).json({ message: "seller not found." });

        const newStatus = status.toUpperCase();
        const newRoleVal =
            newStatus === "VERIFIED" || newStatus === "SUSPENDED" ? "SELLER" : "USER";

        await db.$transaction([
            db.sellerProfile.update({
                where: { id: sellerProfileId },
                data: { status: newStatus }
            }),
            db.user.update({
                where: { id: profile.userId },
                data: { role: newRoleVal }
            }),
            db.auditLog.create({
                data: {
                    action: "ADMIN_UPDATE_SELLER_STATUS",
                    userId: req.user?.id,
                    entityId: sellerProfileId,
                    entityType: "SELLER_PROFILE",
                    metadata: { newStatus }
                }
            })
        ]);

        res.status(200).json({ message: "Seller status updated successfully!" });
    } catch (error) {
        res.status(500).json({ message: "server error." });
        console.log("controller: ", error);
    }
}

export const getAllSellers = async (req, res) => {
    try {
        const cursor = req.query.cursor ? { id: req.query.cursor } : undefined
        const limit = req.query.limit || 20

        const sellers = await db.sellerProfile.findMany({
            ...paginationHelper(cursor, limit),
            where: { status: { in: ["VERIFIED", "SUSPENDED"] } },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })
        res.status(200).json({
            sellers,
            nextCursor: sellers.length === limit ? sellers[sellers.length - 1].id : null
        })
    } catch (error) {
        res.status(500).json({ message: "server error." })
        console.log("controller: ", error)
    }
}

export const getAllSellerRequests = async (req, res) => {
    try {
        const sellerRequests = await db.sellerProfile.findMany({
            where: { status: "PENDING" },
            include: {
                user: {
                    select: { name: true, email: true }
                }
            }
        })
        res.status(200).json({ sellerRequests })
    } catch (error) {
        res.status(500).json({ message: "server error." })
        console.log("controller: ", error)
    }
}

export const verifySeller = async (req, res) => {
    try {
        const { sellerProfileId } = req.params
        const { status, rejectionNote } = req.body

        const profile = await db.sellerProfile.findUnique({
            where: { id: sellerProfileId }
        })

        if (!profile) {
            return res.status(404).json({ message: "seller profile not found." })
        }

        const upperStatus = status.toUpperCase()

        const profileUpdate = { status: upperStatus }
        if (upperStatus === "VERIFIED") {
            profileUpdate.verifiedAt = new Date()
            profileUpdate.rejectionNote = null
        }
        if (upperStatus === "REJECTED" && rejectionNote) {
            profileUpdate.rejectionNote = rejectionNote
        }

        const actions = [
            db.sellerProfile.update({
                where: { id: sellerProfileId },
                data: profileUpdate
            })
        ]

        if (upperStatus === "VERIFIED") {
            actions.push(
                db.user.update({
                    where: { id: profile.userId }, data: { role: "SELLER" }
                })
            )
        } else if (upperStatus === "REJECTED") {
            actions.push(
                db.user.update({
                    where: { id: profile.userId }, data: { role: "USER" }
                })
            )
        }

        actions.push(
            db.auditLog.create({
                data: {
                    action: "ADMIN_VERIFY_SELLER",
                    userId: req.user?.id,
                    entityId: sellerProfileId,
                    entityType: "SELLER_PROFILE",
                    metadata: { status: upperStatus, ...(rejectionNote && { rejectionNote }) }
                }
            })
        )

        await db.$transaction(actions)
        res.status(201).json({ message: `seller request ${status.toLowerCase()}` })
    } catch (error) {
        res.status(500).json({ message: "server error." })
        console.log("controller: ", error)
    }
}

export const getDisputes = async (req, res) => {
    try {
        const disputes = await db.dispute.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, email: true } },
                order: { select: { id: true, status: true } },
                orderItem: { select: { id: true, productId: true } }
            }
        });
        res.status(200).json({ disputes });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

const takeSellerFundsForRefund = async (tx, sellerProfileId, sellerEarnings) => {
    const profile = await tx.sellerProfile.findUnique({ where: { id: sellerProfileId } });
    if (!profile) return;

    const held = Number(profile.heldBalance);
    const bal = Number(profile.balance);
    let left = sellerEarnings;
    const fromHeld = Math.min(left, held);
    left -= fromHeld;
    const fromBal = Math.min(left, bal);
    left -= fromBal;

    await tx.sellerProfile.update({
        where: { id: sellerProfileId },
        data: {
            heldBalance: { decrement: fromHeld },
            balance: { decrement: fromBal }
        }
    });

    return { fromHeld, fromBal, shortfall: left };
};

export const resolveDispute = async (req, res) => {
    try {
        const { disputeId } = req.params;
        const { status, adminResolutionNote } = req.body;

        const dispute = await db.dispute.findUnique({
            where: { id: disputeId },
            include: { order: { include: { items: true, payments: true } } }
        });
        if (!dispute) return res.status(404).json({ message: "Dispute not found" });

        if (dispute.orderItemId) {
            const hit = dispute.order.items.find((i) => i.id === dispute.orderItemId);
            if (!hit) {
                return res.status(400).json({ message: "Dispute line item not found on this order" });
            }
        }

        const newStatus = status.toUpperCase();
        let updated;

        await db.$transaction(async (tx) => {
            updated = await tx.dispute.update({
                where: { id: disputeId },
                data: {
                    status: newStatus,
                    ...(adminResolutionNote !== undefined && { adminResolutionNote }),
                    resolvedAt: new Date()
                }
            });

            if (newStatus === "RESOLVED_IN_FAVOR_OF_BUYER") {
                const payment = dispute.order.payments.find((p) => p.status === "SUCCESS");

                if (payment) {
                    const items = dispute.orderItemId
                        ? dispute.order.items.filter((i) => i.id === dispute.orderItemId)
                        : dispute.order.items;

                    let totalRefund = 0;

                    for (const item of items) {
                        if (item.refundedAt) continue;

                        const lineGross = Number(item.priceAtPurchase) * item.quantity;
                        const sellerEarnings = lineGross - Number(item.commissionAmount);
                        totalRefund += lineGross;

                        await takeSellerFundsForRefund(tx, item.sellerProfileId, sellerEarnings);

                        await tx.ledgerEntry.create({
                            data: {
                                sellerProfileId: item.sellerProfileId,
                                type: "DEBIT",
                                amount: sellerEarnings,
                                referenceId: updated.id,
                                referenceType: "DISPUTE_REFUND"
                            }
                        });

                        await tx.refund.create({
                            data: {
                                paymentId: payment.id,
                                orderItemId: item.id,
                                amount: lineGross,
                                reason: dispute.reason,
                                status: "SUCCESS"
                            }
                        });

                        await tx.orderItem.update({
                            where: { id: item.id },
                            data: { refundedAt: new Date() }
                        });
                    }

                    if (totalRefund > 0) {
                        await tx.ledgerEntry.create({
                            data: {
                                userId: dispute.userId,
                                type: "CREDIT",
                                amount: totalRefund,
                                referenceId: payment.id,
                                referenceType: "REFUND"
                            }
                        });
                    }
                }
            }

            await tx.auditLog.create({
                data: {
                    action: "ADMIN_RESOLVE_DISPUTE",
                    userId: req.user?.id,
                    entityId: disputeId,
                    entityType: "DISPUTE",
                    metadata: { newStatus, note: adminResolutionNote || null }
                }
            });
        });

        res.status(200).json({ message: "Dispute resolved", dispute: updated });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getPayouts = async (req, res) => {
    try {
        const { status: queryStatus } = req.query;
        const payouts = await db.payout.findMany({
            where: queryStatus ? { status: queryStatus.toUpperCase() } : undefined,
            orderBy: { createdAt: "desc" },
            include: { sellerProfile: { select: { businessName: true } } }
        });
        res.status(200).json({ payouts });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const processPayout = async (req, res) => {
    try {
        const { payoutId } = req.params;
        const { status } = req.body; 

        const payout = await db.payout.findUnique({ where: { id: payoutId } });
        if (!payout) return res.status(404).json({ message: "Payout not found" });

        if (payout.status !== "PENDING") {
            return res.status(400).json({ message: `Payout is already ${payout.status}` });
        }

        const newStatus = status.toUpperCase();
        
        await db.$transaction(async (tx) => {
            await tx.payout.update({
                where: { id: payoutId },
                data: { status: newStatus }
            });

            if (newStatus === "FAILED") {
                await tx.sellerProfile.update({
                    where: { id: payout.sellerProfileId },
                    data: {
                        balance: { increment: payout.amount },
                        payoutHoldBalance: { decrement: payout.amount }
                    }
                });
            } else if (newStatus === "SUCCESS") {
                await tx.sellerProfile.update({
                    where: { id: payout.sellerProfileId },
                    data: {
                        payoutHoldBalance: { decrement: payout.amount }
                    }
                });

                await tx.ledgerEntry.create({
                    data: {
                        sellerProfileId: payout.sellerProfileId,
                        type: "DEBIT",
                        amount: payout.amount,
                        referenceId: payoutId,
                        referenceType: "PAYOUT_MANUAL"
                    }
                });
            }

            await tx.auditLog.create({
                data: {
                    action: "ADMIN_PROCESS_PAYOUT",
                    userId: req.user?.id,
                    entityId: payoutId,
                    entityType: "PAYOUT",
                    metadata: { newStatus, amount: payout.amount }
                }
            });
        });

        res.status(200).json({ message: `Payout marked as ${newStatus}` });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getDeliveryPayouts = async (req, res) => {
    try {
        const { status: queryStatus } = req.query;
        const payouts = await db.deliveryPayout.findMany({
            where: queryStatus ? { status: queryStatus.toUpperCase() } : undefined,
            orderBy: { createdAt: "desc" },
            include: {
                deliveryProfile: {
                    include: { user: { select: { name: true, email: true } } }
                }
            }
        });
        res.status(200).json({ deliveryPayouts: payouts });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const processDeliveryPayout = async (req, res) => {
    try {
        const { payoutId } = req.params;
        const { status } = req.body;

        const payout = await db.deliveryPayout.findUnique({ where: { id: payoutId } });
        if (!payout) return res.status(404).json({ message: "Payout not found" });

        if (payout.status !== "PENDING") {
            return res.status(400).json({ message: `Payout is already ${payout.status}` });
        }

        const newStatus = status.toUpperCase();

        await db.$transaction(async (tx) => {
            await tx.deliveryPayout.update({
                where: { id: payoutId },
                data: { status: newStatus }
            });

            if (newStatus === "FAILED") {
                await tx.deliveryProfile.update({
                    where: { id: payout.deliveryProfileId },
                    data: {
                        balance: { increment: payout.amount },
                        payoutHoldBalance: { decrement: payout.amount }
                    }
                });
            } else if (newStatus === "SUCCESS") {
                await tx.deliveryProfile.update({
                    where: { id: payout.deliveryProfileId },
                    data: {
                        payoutHoldBalance: { decrement: payout.amount }
                    }
                });
            }

            await tx.auditLog.create({
                data: {
                    action: "ADMIN_PROCESS_DELIVERY_PAYOUT",
                    userId: req.user?.id,
                    entityId: payoutId,
                    entityType: "DELIVERY_PAYOUT",
                    metadata: { newStatus, amount: payout.amount }
                }
            });
        });

        res.status(200).json({ message: `Delivery payout marked as ${newStatus}` });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getOrders = async (req, res) => {
    try {
        const limit = 20;
        const cursor = req.query.cursor ? { id: req.query.cursor } : undefined;
        
        const orders = await db.order.findMany({
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { name: true, email: true } }, payments: { select: { amount: true, status: true } } }
        });
        res.status(200).json({ 
            orders,
            nextCursor: orders.length === limit ? orders.at(-1)?.id : null 
        });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getOrderById = async (req, res) => {
    try {
        const order = await db.order.findUnique({
            where: { id: req.params.orderId },
            include: { 
                items: { include: { product: true } },
                user: { select: { name: true, email: true } },
                payments: true,
                disputes: true
            }
        });
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ order });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getProducts = async (req, res) => {
    try {
        const limit = 20;
        const cursor = req.query.cursor ? { id: req.query.cursor } : undefined;

        const products = await db.product.findMany({
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor,
            orderBy: { createdAt: "desc" },
            include: {
                sellerProfile: { select: { businessName: true } },
                productImages: { take: 1 }
            }
        });
        res.status(200).json({ 
            products,
            nextCursor: products.length === limit ? products.at(-1)?.id : null 
        });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const archiveProduct = async (req, res) => {
    try {
        const product = await db.product.findUnique({ where: { id: req.params.productId } });
        if (!product) return res.status(404).json({ message: "Product not found" });

        await db.product.update({
            where: { id: product.id },
            data: { archived: true }
        });

        await db.auditLog.create({
            data: {
                action: "ADMIN_ARCHIVE_PRODUCT",
                userId: req.user?.id,
                entityId: product.id,
                entityType: "PRODUCT"
            }
        });

        res.status(200).json({ message: "Product archived successfully" });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getDashboardStats = async (req, res) => {
    try {
        const company = await ensureCompanyAccountOutsideTransaction();
        const totalRegisteredUsers = await db.user.count({ where: { deletedAt: null } });
        const totalSellers = await db.sellerProfile.count({ where: { status: "VERIFIED", deletedAt: null } });
        const pendingSellerApprovals = await db.sellerProfile.count({ where: { status: "PENDING", deletedAt: null } });
        const openDisputes = await db.dispute.count({ where: { status: "OPEN" } });
        const pendingPayouts = await db.payout.count({ where: { status: "PENDING" } });
        const pendingDeliveryPayouts = await db.deliveryPayout.count({ where: { status: "PENDING" } });

        const payments = await db.payment.aggregate({
            _sum: { amount: true },
            where: { status: "SUCCESS" }
        });

        res.status(200).json({
            stats: {
                totalRegisteredUsers,
                totalSellers,
                pendingSellerApprovals,
                openDisputes,
                pendingPayouts,
                pendingDeliveryPayouts,
                totalVolume: payments._sum.amount || 0,
                companyHeldBalance: company.heldBalance,
                companyBalance: company.balance
            }
        });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getCompanyOverview = async (req, res) => {
    try {
        const company = await ensureCompanyAccountOutsideTransaction();

        const recentEntries = await db.companyLedgerEntry.findMany({
            where: { companyAccountId: company.id },
            orderBy: { createdAt: "desc" },
            take: 100,
            include: {
                payment: {
                    select: {
                        id: true,
                        orderId: true,
                        amount: true,
                        status: true
                    }
                }
            }
        });

        const payoutHoldSellers = await db.sellerProfile.aggregate({
            _sum: { payoutHoldBalance: true }
        });
        const payoutHoldDelivery = await db.deliveryProfile.aggregate({
            _sum: { payoutHoldBalance: true }
        });
        const sellerHeld = await db.sellerProfile.aggregate({
            _sum: { heldBalance: true }
        });
        const deliveryHeld = await db.deliveryProfile.aggregate({
            _sum: { heldBalance: true }
        });

        res.status(200).json({
            company,
            totals: {
                sellerEscrowHeld: sellerHeld._sum.heldBalance || 0,
                courierHeldBeforeConfirmation: deliveryHeld._sum.heldBalance || 0,
                sellerPayoutHold: payoutHoldSellers._sum.payoutHoldBalance || 0,
                deliveryPayoutHold: payoutHoldDelivery._sum.payoutHoldBalance || 0
            },
            recentEntries
        });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor ? { id: req.query.cursor } : undefined;

        const logs = await db.auditLog.findMany({
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor,
            orderBy: { createdAt: "desc" },
            include: { user: { select: { email: true, role: true } } }
        });
        
        res.status(200).json({ 
            logs,
            nextCursor: logs.length === limit ? logs.at(-1)?.id : null 
        });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getPaymentEvents = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const cursor = req.query.cursor ? { id: req.query.cursor } : undefined;

        const events = await db.paymentEvent.findMany({
            take: limit,
            skip: cursor ? 1 : 0,
            cursor: cursor,
            orderBy: { createdAt: "desc" },
            include: { payment: { select: { amount: true, status: true, orderId: true } } }
        });
        
        res.status(200).json({ 
            events,
            nextCursor: events.length === limit ? events.at(-1)?.id : null 
        });
    } catch (error) {
        res.status(500).json({ message: "server error." });
    }
};

export const getFeaturedProductRequests = async (req, res) => {
    try {
        const requests = await db.featuredProductRequest.findMany({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
            include: {
                product: { include: { productImages: { take: 1 } } },
                sellerProfile: {
                    include: { user: { select: { email: true, name: true } } }
                }
            }
        });
        res.status(200).json({ requests });
    } catch (error) {
        console.error("getFeaturedProductRequests:", error);
        res.status(500).json({ message: "server error." });
    }
};

export const getAdminFeaturedProducts = async (req, res) => {
    try {
        const now = new Date();
        await db.product.updateMany({
            where: { isFeatured: true, featuredUntil: { not: null, lt: now } },
            data: { isFeatured: false, featuredUntil: null }
        });

        const products = await db.product.findMany({
            where: {
                archived: false,
                isFeatured: true,
                OR: [{ featuredUntil: null }, { featuredUntil: { gt: now } }]
            },
            include: {
                productImages: { take: 1 },
                sellerProfile: { select: { businessName: true } }
            },
            orderBy: { updatedAt: "desc" }
        });
        res.status(200).json({ products });
    } catch (error) {
        console.error("getAdminFeaturedProducts:", error);
        res.status(500).json({ message: "server error." });
    }
};

export const reviewFeaturedRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { decision, rejectionNote } = req.body;

        const request = await db.featuredProductRequest.findUnique({
            where: { id: requestId },
            include: { product: true }
        });
        if (!request || request.status !== "PENDING") {
            return res.status(404).json({ message: "Request not found or already processed" });
        }

        if (decision === "reject") {
            await db.featuredProductRequest.update({
                where: { id: requestId },
                data: {
                    status: "REJECTED",
                    reviewedAt: new Date(),
                    reviewedById: req.user?.id,
                    rejectionNote: rejectionNote || null
                }
            });
            return res.status(200).json({ message: "Request rejected" });
        }

        if (decision !== "approve") {
            return res.status(400).json({ message: "Invalid decision" });
        }

        const until = new Date();
        until.setDate(until.getDate() + request.durationDays);

        await db.$transaction([
            db.featuredProductRequest.update({
                where: { id: requestId },
                data: {
                    status: "APPROVED",
                    reviewedAt: new Date(),
                    reviewedById: req.user?.id
                }
            }),
            db.product.update({
                where: { id: request.productId },
                data: { isFeatured: true, featuredUntil: until }
            }),
            db.auditLog.create({
                data: {
                    action: "ADMIN_APPROVE_FEATURED",
                    userId: req.user?.id,
                    entityId: request.productId,
                    entityType: "PRODUCT",
                    metadata: { requestId, durationDays: request.durationDays }
                }
            })
        ]);

        res.status(200).json({ message: "Product featured", featuredUntil: until });
    } catch (error) {
        console.error("reviewFeaturedRequest:", error);
        res.status(500).json({ message: "server error." });
    }
};

export const removeFeaturedProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        await db.product.updateMany({
            where: { id: productId },
            data: { isFeatured: false, featuredUntil: null }
        });
        await db.auditLog.create({
            data: {
                action: "ADMIN_REMOVE_FEATURED",
                userId: req.user?.id,
                entityId: productId,
                entityType: "PRODUCT"
            }
        });
        res.status(200).json({ message: "Removed from featured" });
    } catch (error) {
        console.error("removeFeaturedProduct:", error);
        res.status(500).json({ message: "server error." });
    }
};
