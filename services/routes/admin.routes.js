import { Router } from "express"
import { 
    getAllUsers, getAllSellers, getAllSellerRequests, verifySeller, 
    getUserById, updateSellerStatus, getDisputes, resolveDispute,
    getPayouts, processPayout, getDeliveryPayouts, processDeliveryPayout, getOrders, getOrderById, 
    getProducts, archiveProduct, getDashboardStats, getAuditLogs, getPaymentEvents,
    getFeaturedProductRequests, getAdminFeaturedProducts, reviewFeaturedRequest, removeFeaturedProduct
} from "../controllers/admin.controller.js"
import protect from "../middlewares/jwt.middleware.js"
import isAdmin from "../middlewares/admin.middleware.js"
import validate from "../middlewares/validator.middleware.js"
import { 
    getAllUsersSchema, getAllSellersSchema, getAllSellerRequestsSchema, 
    verifySellerSchema, getUserByIdSchema, updateSellerStatusSchema,
    resolveDisputeSchema, processPayoutSchema, processDeliveryPayoutSchema, getOrderByIdAdminSchema,
    archiveProductSchema,
    reviewFeaturedRequestSchema,
    removeFeaturedProductSchema
} from "../config/admin.validator.js"

const router = Router()

router.get("/dashboard/stats", protect, isAdmin, getDashboardStats)
router.get("/audit-logs", protect, isAdmin, getAuditLogs)
router.get("/payment-events", protect, isAdmin, getPaymentEvents)

router.get("/users", protect, isAdmin, validate(getAllUsersSchema), getAllUsers)
router.get("/user/:userId", protect, isAdmin, validate(getUserByIdSchema), getUserById)
router.get("/sellers", protect, isAdmin, validate(getAllSellersSchema), getAllSellers)
router.get("/requests", protect, isAdmin, validate(getAllSellerRequestsSchema), getAllSellerRequests)
router.put("/verify/:sellerProfileId", protect, isAdmin, validate(verifySellerSchema), verifySeller)
router.put("/seller/:sellerProfileId", protect, isAdmin, validate(updateSellerStatusSchema), updateSellerStatus)

router.get("/disputes", protect, isAdmin, getDisputes)
router.patch("/disputes/:disputeId/resolve", protect, isAdmin, validate(resolveDisputeSchema), resolveDispute)

router.get("/payouts", protect, isAdmin, getPayouts)
router.patch("/payouts/:payoutId", protect, isAdmin, validate(processPayoutSchema), processPayout)

router.get("/delivery-payouts", protect, isAdmin, getDeliveryPayouts)
router.patch("/delivery-payouts/:payoutId", protect, isAdmin, validate(processDeliveryPayoutSchema), processDeliveryPayout)

router.get("/orders", protect, isAdmin, getOrders)
router.get("/orders/:orderId", protect, isAdmin, validate(getOrderByIdAdminSchema), getOrderById)

router.get("/products", protect, isAdmin, getProducts)
router.patch("/products/:productId/archive", protect, isAdmin, validate(archiveProductSchema), archiveProduct)

router.get("/featured/requests", protect, isAdmin, getFeaturedProductRequests)
router.get("/featured/products", protect, isAdmin, getAdminFeaturedProducts)
router.patch("/featured/requests/:requestId", protect, isAdmin, validate(reviewFeaturedRequestSchema), reviewFeaturedRequest)
router.delete("/featured/products/:productId", protect, isAdmin, validate(removeFeaturedProductSchema), removeFeaturedProduct)

export default router