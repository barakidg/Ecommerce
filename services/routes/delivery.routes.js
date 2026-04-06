import { Router } from "express"
import protect from "../middlewares/jwt.middleware.js"
import isDelivery from "../middlewares/delivery.middleware.js"
import validate from "../middlewares/validator.middleware.js"
import {
    acceptOrderSchema,
    confirmHandoffSchema,
    setAvailabilitySchema,
    requestDeliveryPayoutSchema,
    updateDeliveryPayoutProfileSchema
} from "../config/delivery.validator.js"
import {
    getDeliveryProfile,
    setAvailability,
    updateDeliveryPayoutProfile,
    listQueueOrders,
    listMyActiveOrders,
    acceptOrder,
    confirmHandoff,
    getDeliveryFinances,
    requestDeliveryPayout,
    listDeliveryPayouts
} from "../controllers/delivery.controller.js"

const router = Router()

router.use(protect, isDelivery)

router.get("/profile", getDeliveryProfile)
router.patch("/availability", validate(setAvailabilitySchema), setAvailability)
router.patch("/profile/payout", validate(updateDeliveryPayoutProfileSchema), updateDeliveryPayoutProfile)

router.get("/orders/queue", listQueueOrders)
router.get("/orders/active", listMyActiveOrders)
router.post("/orders/:orderId/accept", validate(acceptOrderSchema), acceptOrder)
router.post("/orders/:orderId/confirm-handoff", validate(confirmHandoffSchema), confirmHandoff)

router.get("/finances", getDeliveryFinances)
router.post("/payouts", validate(requestDeliveryPayoutSchema), requestDeliveryPayout)
router.get("/payouts", listDeliveryPayouts)

export default router
