import db from "../config/db.js"
import { ensureCompanyAccount } from "./companyAccount.js"

/**
 * Completes a successful payment: CONFIRMED order, line items CONFIRMED, seller earnings in heldBalance (escrow).
 * Replace MOCK_CHAPA path only for display URLs; this logic should run from Chapa webhooks in production.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {string} paymentId
 * @param {{ providerRef?: string }} [opts]
 */
export async function applyPaymentSuccessInTransaction(tx, paymentId, opts = {}) {
    const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
            order: {
                include: { items: true }
            }
        }
    })

    if (!payment) {
        throw new Error("Payment not found")
    }

    if (payment.status === "SUCCESS") {
        return { alreadyApplied: true }
    }

    const providerRef = opts.providerRef ?? payment.providerRef

    await tx.payment.update({
        where: { id: payment.id },
        data: {
            status: "SUCCESS",
            paidAt: new Date(),
            providerRef
        }
    })

    await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" }
    })

    const company = await ensureCompanyAccount(tx)
    await tx.companyAccount.update({
        where: { id: company.id },
        data: {
            heldBalance: { increment: payment.amount }
        }
    })
    await tx.companyLedgerEntry.create({
        data: {
            companyAccountId: company.id,
            paymentId: payment.id,
            orderId: payment.orderId,
            type: "CREDIT",
            bucket: "BUYER_HELD",
            amount: payment.amount,
            fromEntityType: "USER",
            fromEntityId: payment.order.userId,
            toEntityType: "COMPANY",
            toEntityId: company.id,
            note: "Buyer payment captured and held in platform escrow."
        }
    })

    for (const item of payment.order.items) {
        const stockUpdate = await tx.product.updateMany({
            where: {
                id: item.productId,
                stock: { gte: item.quantity },
                reservedStock: { gte: item.quantity }
            },
            data: {
                stock: { decrement: item.quantity },
                reservedStock: { decrement: item.quantity }
            }
        })
        if (stockUpdate.count === 0) {
            throw new Error(`Unable to allocate stock for product ${item.productId}`)
        }

        const sellerEarnings =
            Number(item.priceAtPurchase) * item.quantity - Number(item.commissionAmount)

        await tx.orderItem.update({
            where: { id: item.id },
            data: { status: "CONFIRMED" }
        })

        await tx.sellerProfile.update({
            where: { id: item.sellerProfileId },
            data: { heldBalance: { increment: sellerEarnings } }
        })

        await tx.ledgerEntry.create({
            data: {
                sellerProfileId: item.sellerProfileId,
                type: "CREDIT",
                amount: sellerEarnings,
                referenceId: payment.orderId,
                referenceType: "ORDER_SALE_ESCROW"
            }
        })
    }

    await tx.ledgerEntry.create({
        data: {
            userId: payment.order.userId,
            type: "DEBIT",
            amount: payment.amount,
            referenceId: payment.orderId,
            referenceType: "PURCHASE"
        }
    })

    return { alreadyApplied: false }
}

/**
 * Marks payment/order as failed and releases reserved inventory.
 *
 * @param {import('@prisma/client').Prisma.TransactionClient} tx
 * @param {string} paymentId
 * @param {{ providerRef?: string }} [opts]
 */
export async function applyPaymentFailureInTransaction(tx, paymentId, opts = {}) {
    const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
            order: {
                include: { items: true }
            }
        }
    })

    if (!payment) {
        throw new Error("Payment not found")
    }

    if (payment.status === "SUCCESS") {
        return { alreadyApplied: true }
    }

    const providerRef = opts.providerRef ?? payment.providerRef

    await tx.payment.update({
        where: { id: payment.id },
        data: {
            status: "FAILED",
            failedAt: new Date(),
            providerRef
        }
    })

    await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "CANCELLED" }
    })

    for (const item of payment.order.items) {
        await tx.orderItem.update({
            where: { id: item.id },
            data: { status: "CANCELLED" }
        })

        await tx.product.updateMany({
            where: {
                id: item.productId,
                reservedStock: { gte: item.quantity }
            },
            data: { reservedStock: { decrement: item.quantity } }
        })
    }

    return { alreadyApplied: false }
}

/** For mock Chapa / fire-and-forget paths outside an existing transaction. */
export async function applyPaymentSuccess(paymentId, opts = {}) {
    return db.$transaction(async (tx) => applyPaymentSuccessInTransaction(tx, paymentId, opts))
}
