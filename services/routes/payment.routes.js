import { Router } from "express"
import { paymentWebhook } from "../webhooks/payment.webhook.js"

const router = Router()

router.post("/webhooks/payment", paymentWebhook)

export default router