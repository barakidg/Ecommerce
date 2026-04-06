import db from "../config/db.js"

function sellerEarningsForItem(item) {
    return Number(item.priceAtPurchase) * item.quantity - Number(item.commissionAmount)
}

export async function releaseDueEscrowForOrders() {
    const now = new Date()

    const orders = await db.order.findMany({
        where: {
            buyerConfirmedAt: { not: null },
            disputeWindowEndsAt: { lt: now },
            status: "DELIVERED"
        },
        include: {
            items: true,
            disputes: true
        }
    })

    let releasedOrders = 0

    for (const order of orders) {
        await db.$transaction(async (tx) => {
            const fresh = await tx.order.findUnique({
                where: { id: order.id },
                include: { items: true, disputes: true }
            })
            if (!fresh || !fresh.buyerConfirmedAt || fresh.disputeWindowEndsAt > now) return

            const openBlocksOrder = fresh.disputes.some((d) => d.status === "OPEN" && !d.orderItemId)
            if (openBlocksOrder) return

            let anyReleased = false

            for (const item of fresh.items) {
                if (item.escrowReleasedAt || item.refundedAt) continue

                const openForLine = fresh.disputes.some(
                    (d) => d.status === "OPEN" && d.orderItemId === item.id
                )
                if (openForLine) continue

                const earn = sellerEarningsForItem(item)
                if (earn <= 0) {
                    await tx.orderItem.update({
                        where: { id: item.id },
                        data: { escrowReleasedAt: now }
                    })
                    anyReleased = true
                    continue
                }

                await tx.sellerProfile.update({
                    where: { id: item.sellerProfileId },
                    data: {
                        heldBalance: { decrement: earn },
                        balance: { increment: earn }
                    }
                })

                await tx.ledgerEntry.create({
                    data: {
                        sellerProfileId: item.sellerProfileId,
                        type: "CREDIT",
                        amount: earn,
                        referenceId: fresh.id,
                        referenceType: "ESCROW_RELEASED"
                    }
                })

                await tx.orderItem.update({
                    where: { id: item.id },
                    data: { escrowReleasedAt: now }
                })
                anyReleased = true
            }

            const allItemsDone = (
                await tx.orderItem.findMany({ where: { orderId: fresh.id } })
            ).every((i) => i.escrowReleasedAt != null || i.refundedAt != null)

            if (allItemsDone) {
                await tx.order.update({
                    where: { id: fresh.id },
                    data: { fundsReleasedAt: now }
                })
            }

            if (anyReleased) releasedOrders += 1
        })
    }

    return { releasedOrders }
}
