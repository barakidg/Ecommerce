import axios from "axios";
import db from "../config/db.js";
import { applyPaymentSuccessInTransaction } from "../lib/paymentSuccess.js";

export const initiatePayment = async (payment, user) => {
    try {
        const useMockChapa =
            String(process.env.MOCK_CHAPA).toLowerCase() === "true" ||
            String(process.env.CHAPA_MOCK).toLowerCase() === "true"
        if (useMockChapa) {
            const paymentId = payment.id;
            setTimeout(async () => {
                try {
                    await db.$transaction(async (tx) => {
                        await applyPaymentSuccessInTransaction(tx, paymentId, {
                            providerRef: `mock_${Date.now()}`
                        });
                    });
                } catch (e) {
                    console.error("Mock Webhook Error:", e);
                }
            }, 1000);

            return `${process.env.FRONTEND_URL}/my-order`;
        }

        const response = await axios.post(
            "https://api.chapa.co/v1/transaction/initialize",
            {
                amount: payment.amount,
                currency: "ETB",
                email: user.email,
                first_name: user.name?.split(" ")[0] || "Customer",
                last_name: user.name?.split(" ")[1] || "User",
                tx_ref: payment.id,
                callback_url: `${process.env.BACKEND_URL}/api/webhooks/payment`,
                return_url: `${process.env.FRONTEND_URL}/payment-success`,
                "customization[title]": "Platform Order",
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET}`,
                    "Content-Type": "application/json"
                }
            }
        );

        await db.paymentEvent.create({
            data: {
                paymentId: payment.id,
                eventType: "PAYMENT_INITIALIZED",
                payload: { request: response.data }
            }
        });

        return response.data.data.checkout_url;
    } catch (err) {
        throw new Error("Chapa initialization failed");
    }
};