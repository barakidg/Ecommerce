import db from "../config/db.js";
import crypto from "crypto";
import {
    applyPaymentFailureInTransaction,
    applyPaymentSuccessInTransaction
} from "../lib/paymentSuccess.js";

export const paymentWebhook = async (req, res) => {
    const hash = crypto.createHmac('sha256', process.env.CHAPA_WEBHOOK_SECRET)
        .update(req.rawBody || JSON.stringify(req.body))
        .digest('hex');

    if (hash !== req.headers['x-chapa-signature']) {
        return res.status(401).send("Invalid signature");
    }

    try {
        const { tx_ref, status, reference } = req.body;

        const payment = await db.payment.findUnique({
            where: { id: tx_ref },
            include: {
                order: {
                    include: { items: true }
                }
            }
        });

        if (!payment || payment.status === "SUCCESS") {
            if (payment) {
                await db.paymentEvent.create({
                    data: {
                        paymentId: payment.id,
                        eventType: "WEBHOOK_IGNORED_OR_DUPLICATE",
                        payload: req.body
                    }
                });
            }
            return res.sendStatus(200);
        }

        if (status === "success") {
            await db.paymentEvent.create({
                data: {
                    paymentId: payment.id,
                    eventType: "WEBHOOK_SUCCESS_RECEIVED",
                    payload: req.body
                }
            });

            await db.$transaction(async (tx) => {
                await applyPaymentSuccessInTransaction(tx, payment.id, { providerRef: reference });
            });
        } else {
            if (payment) {
                await db.paymentEvent.create({
                    data: {
                        paymentId: payment.id,
                        eventType: "WEBHOOK_FAILED_RECEIVED",
                        payload: req.body
                    }
                });
            }
            await db.$transaction(async (tx) => {
                await applyPaymentFailureInTransaction(tx, payment.id, { providerRef: reference });
            });
        }
        res.sendStatus(200);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
    }
};