import db from "../config/db.js"
import { disputeWindowEndFrom, generateHandoffCode } from "../lib/orderFlow.js"
import { initiateChapaTransfer } from "./payout.controller.js"
import { ensureCompanyAccount } from "../lib/companyAccount.js"

export const getDeliveryProfile = async (req, res) => {
    const profile = await db.deliveryProfile.findUnique({
        where: { userId: req.user.id },
        include: { user: { select: { name: true, email: true } } }
    })
    if (!profile) return res.status(404).json({ message: "Profile not found" })
    res.json({ profile })
}

export const updateDeliveryPayoutProfile = async (req, res) => {
    const {
        payoutMethod,
        payoutAccountNumber,
        payoutAccountHolder,
        payoutBankName,
        baseDeliveryFeeAmount
    } = req.body

    const updated = await db.deliveryProfile.update({
        where: { userId: req.user.id },
        data: {
            ...(payoutMethod !== undefined && { payoutMethod }),
            ...(payoutAccountNumber !== undefined && { payoutAccountNumber }),
            ...(payoutAccountHolder !== undefined && { payoutAccountHolder }),
            ...(payoutBankName !== undefined && { payoutBankName }),
            ...(baseDeliveryFeeAmount !== undefined && { baseDeliveryFeeAmount })
        }
    })

    res.json({ profile: updated })
}

export const setAvailability = async (req, res) => {
    const { isAvailable } = req.body
    const updated = await db.deliveryProfile.update({
        where: { userId: req.user.id },
        data: { isAvailable }
    })
    res.json({ profile: updated })
}

export const listQueueOrders = async (req, res) => {
    const orders = await db.order.findMany({
        where: {
            status: "CONFIRMED",
            deliveryProfileId: null,
            payments: { some: { status: "SUCCESS" } }
        },
        orderBy: { createdAt: "asc" },
        take: 50,
        include: {
            user: { select: { name: true, email: true } },
            items: {
                include: { product: { select: { name: true, productImages: { take: 1 } } } }
            },
            payments: { where: { status: "SUCCESS" }, take: 1 }
        }
    })
    res.json({ orders })
}

export const listMyActiveOrders = async (req, res) => {
    const pid = req.deliveryProfile.id
    const orders = await db.order.findMany({
        where: {
            deliveryProfileId: pid,
            status: { in: ["PROCESSING"] }
        },
        orderBy: { updatedAt: "desc" },
        include: {
            user: { select: { name: true, email: true } },
            items: {
                include: { product: { select: { name: true, productImages: { take: 1 } } } }
            }
        }
    })
    res.json({ orders })
}

export const acceptOrder = async (req, res) => {
    const { orderId } = req.params
    const profile = req.deliveryProfile

    if (!profile.isAvailable) {
        return res.status(400).json({ message: "Turn on availability to accept orders." })
    }

    try {
        const code = generateHandoffCode()

        await db.$transaction(async (tx) => {
            const targetOrder = await tx.order.findUnique({
                where: { id: orderId },
                select: { deliveryFeeAmount: true }
            })
            const updated = await tx.order.updateMany({
                where: {
                    id: orderId,
                    status: "CONFIRMED",
                    deliveryProfileId: null
                },
                data: {
                    deliveryProfileId: profile.id,
                    status: "PROCESSING",
                    deliveryConfirmationCode: code
                }
            })

            if (updated.count !== 1) {
                throw new Error("ORDER_UNAVAILABLE")
            }

            await tx.orderItem.updateMany({
                where: { orderId },
                data: {
                    deliveryProfileId: profile.id,
                    status: "PROCESSING"
                }
            })

            const fee = Number(targetOrder?.deliveryFeeAmount || 0)
            if (fee > 0) {
                await tx.deliveryProfile.update({
                    where: { id: profile.id },
                    data: { heldBalance: { increment: fee } }
                })
            }
        })

        const order = await db.order.findUnique({
            where: { id: orderId },
            include: {
                user: { select: { name: true, email: true } },
                items: { include: { product: { select: { name: true } } } }
            }
        })

        res.json({
            message:
                "Order accepted. The buyer sees a 6-digit handoff code on their order page — they enter it here so you can complete delivery.",
            order
        })
    } catch (e) {
        if (e.message === "ORDER_UNAVAILABLE") {
            return res.status(409).json({ message: "This order is no longer available." })
        }
        throw e
    }
}

export const confirmHandoff = async (req, res) => {
    const { orderId } = req.params
    const { code } = req.body
    const profile = req.deliveryProfile

    const order = await db.order.findFirst({
        where: { id: orderId, deliveryProfileId: profile.id }
    })

    if (!order) return res.status(404).json({ message: "Order not found" })

    if (order.status === "DELIVERED") {
        return res.status(400).json({ message: "This order is already marked delivered." })
    }

    if (order.status !== "PROCESSING") {
        return res.status(400).json({ message: "Handoff can only be confirmed while the order is out for delivery." })
    }

    if (!order.deliveryConfirmationCode || order.deliveryConfirmationCode !== String(code).trim()) {
        return res.status(400).json({ message: "Invalid confirmation code." })
    }

    const ends = disputeWindowEndFrom(new Date())

    await db.$transaction(async (tx) => {
        await tx.order.update({
            where: { id: orderId },
            data: {
                status: "DELIVERED",
                buyerConfirmedAt: new Date(),
                disputeWindowEndsAt: ends
            }
        })

        await tx.orderItem.updateMany({
            where: { orderId },
            data: { status: "DELIVERED" }
        })

        const fee = Number(order.deliveryFeeAmount || 0)
        if (fee > 0) {
            await tx.deliveryProfile.update({
                where: { id: profile.id },
                data: {
                    heldBalance: { decrement: fee },
                    balance: { increment: fee }
                }
            })

            const company = await ensureCompanyAccount(tx)
            const successPayment = await tx.payment.findFirst({
                where: { orderId, status: "SUCCESS" },
                orderBy: { createdAt: "asc" }
            })
            await tx.companyAccount.update({
                where: { id: company.id },
                data: {
                    totalDeliveryFeesCollected: { increment: fee }
                }
            })
            if (successPayment) {
                await tx.companyLedgerEntry.create({
                    data: {
                        companyAccountId: company.id,
                        paymentId: successPayment.id,
                        orderId,
                        type: "DEBIT",
                        bucket: "DELIVERY_FEE",
                        amount: fee,
                        fromEntityType: "COMPANY",
                        fromEntityId: company.id,
                        toEntityType: "DELIVERY_PROFILE",
                        toEntityId: profile.id,
                        note: "Delivery fee moved to courier available balance after buyer confirmation."
                    }
                })
            }
        }
    })

    const fresh = await db.order.findUnique({
        where: { id: orderId },
        include: { items: true }
    })

    res.json({
        message: "Delivery confirmed. Seller funds stay in escrow until the dispute window closes.",
        order: fresh
    })
}

export const getDeliveryFinances = async (req, res) => {
    const p = await db.deliveryProfile.findUnique({
        where: { id: req.deliveryProfile.id },
        include: {
            orders: {
                where: { status: "PROCESSING" },
                select: { deliveryFeeAmount: true }
            }
        }
    })
    const pendingConfirmationHold = (p?.orders || []).reduce(
        (sum, o) => sum + Number(o.deliveryFeeAmount || 0),
        0
    )
    res.json({
        balance: p?.balance ?? 0,
        heldBalance: p?.heldBalance ?? 0,
        payoutHoldBalance: p?.payoutHoldBalance ?? 0,
        pendingConfirmationHold
    })
}

export const requestDeliveryPayout = async (req, res) => {
    const { amount, provider } = req.body
    const profile = await db.deliveryProfile.findUnique({
        where: { id: req.deliveryProfile.id }
    })

    if (!profile) {
        return res.status(404).json({ message: "Delivery profile not found" })
    }

    if (!profile.payoutAccountHolder || !profile.payoutAccountNumber) {
        return res.status(400).json({
            message: "Please complete payout account details before requesting payout."
        })
    }

    if (Number(profile.balance) < amount) {
        return res.status(400).json({ message: "Insufficient balance" })
    }

    const payout = await db.$transaction(async (tx) => {
        const row = await tx.deliveryPayout.create({
            data: {
                deliveryProfileId: profile.id,
                amount,
                provider: provider || "CHAPA",
                status: "PENDING"
            }
        })

        await tx.deliveryProfile.update({
            where: { id: profile.id },
            data: {
                balance: { decrement: amount },
                payoutHoldBalance: { increment: amount }
            }
        })

        return row
    })

    const transfer = await initiateChapaTransfer({
        referenceId: payout.id,
        amount,
        currency: payout.currency,
        accountName: profile.payoutAccountHolder,
        accountNumber: profile.payoutAccountNumber,
        bankCode: profile.payoutBankName || profile.payoutMethod || "CHAPA",
        narration: "Delivery partner payout"
    })

    if (!transfer.success) {
        await db.$transaction(async (tx) => {
            await tx.deliveryPayout.update({
                where: { id: payout.id },
                data: { status: "FAILED" }
            })
            await tx.deliveryProfile.update({
                where: { id: profile.id },
                data: {
                    balance: { increment: amount },
                    payoutHoldBalance: { decrement: amount }
                }
            })
        })
        return res.status(502).json({
            message: transfer.errorMessage || "Payout transfer failed"
        })
    }

    const settledPayout = await db.$transaction(async (tx) => {
        await tx.deliveryPayout.update({
            where: { id: payout.id },
            data: {
                status: "SUCCESS",
                providerRef: transfer.providerRef
            }
        })

        await tx.deliveryProfile.update({
            where: { id: profile.id },
            data: {
                payoutHoldBalance: { decrement: amount }
            }
        })

        return tx.deliveryPayout.findUnique({ where: { id: payout.id } })
    })

    res.status(201).json({ message: "Payout transfer completed.", payout: settledPayout })
}

export const listDeliveryPayouts = async (req, res) => {
    const payouts = await db.deliveryPayout.findMany({
        where: { deliveryProfileId: req.deliveryProfile.id },
        orderBy: { createdAt: "desc" }
    })
    res.json({ payouts })
}
