import db from "../config/db.js"

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

    for (const item of payment.order.items) {
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

/** For mock Chapa / fire-and-forget paths outside an existing transaction. */
export async function applyPaymentSuccess(paymentId, opts = {}) {
    return db.$transaction(async (tx) => applyPaymentSuccessInTransaction(tx, paymentId, opts))
}
