import { Router } from "express"
import authorize from "../middlewares/jwt.middleware.js"
import validate from "../middlewares/validator.middleware.js"
import { upload } from "../middlewares/multer.middleware.js"
import {
    updateProfileSchema,
    addToCartSchema,
    updateCartItemSchema,
    removeFromCartSchema,
    wishlistProductParamsSchema,
    applyDiscountSchema,
    createOrderSchema,
    cancelOrderSchema,
    viewProductsSchema,
    viewOnSaleSchema,
    viewCategoriesSchema,
    writeReviewSchema,
    deleteReviewSchema,
    openDisputeSchema,
    updateReviewSchema,
    closeDisputeSchema,
    getOrderByIdSchema,
    getMyOrdersSchema,
    searchProductsSchema
} from "../config/user.validator.js"
import {
    getProfile,
    updateProfile,
    deleteAccount,

    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,

    getWishlist,
    addToWishlist,
    removeFromWishlist,

    createOrder,
    cancelOrder,
    getMyOrders,
    getOrderById,

    writeReview,
    updateReview,
    deleteReview,

    getLedger,

    viewProducts,
    viewCategories,
    listCategoryProductCounts,
    getFeaturedProducts,
    listProductsOnSale,
    getProduct,

    validateDiscount,
    openDispute,
    closeDispute,
    getMyDisputes,
    searchProducts
} from "../controllers/user.controllers.js"

const router = Router()

router.get("/profile", authorize, getProfile)
router.patch("/profile", authorize, upload.single("profilePicture"), validate(updateProfileSchema), updateProfile)
router.delete("/account", authorize, deleteAccount)

router.get("/cart", authorize, getCart)
router.post("/cart/:productId", authorize, validate(addToCartSchema), addToCart)
router.patch("/cart/:productId", authorize, validate(updateCartItemSchema), updateCartItem)
router.delete("/cart/:productId", authorize, validate(removeFromCartSchema), removeFromCart)
router.delete("/cart", authorize, clearCart)

router.get("/wishlist", authorize, getWishlist)
router.post("/wishlist/:productId", authorize, validate(wishlistProductParamsSchema), addToWishlist)
router.delete("/wishlist/:productId", authorize, validate(wishlistProductParamsSchema), removeFromWishlist)

router.post("/orders", authorize, validate(createOrderSchema), createOrder)
router.get("/orders", authorize, validate(getMyOrdersSchema), getMyOrders)
router.get("/orders/:orderId", authorize, validate(getOrderByIdSchema), getOrderById)
router.patch("/orders/:orderId/cancel", authorize, validate(cancelOrderSchema), cancelOrder)

router.post("/discounts/validate", authorize, validate(applyDiscountSchema), validateDiscount)

router.post("/disputes/:orderId", authorize, validate(openDisputeSchema), openDispute)
router.patch("/disputes/:disputeId/close", authorize, validate(closeDisputeSchema), closeDispute)
router.get("/disputes", authorize, getMyDisputes)

router.post("/reviews/:productId", authorize, validate(writeReviewSchema), writeReview)
router.patch("/reviews/:reviewId", authorize, validate(updateReviewSchema), updateReview)
router.delete("/reviews/:reviewId", authorize, validate(deleteReviewSchema), deleteReview)

router.get("/ledger", authorize, getLedger)

router.get("/products", validate(viewProductsSchema), viewProducts)
router.get("/products/category", validate(viewCategoriesSchema), viewCategories)
router.get("/products/categories-summary", listCategoryProductCounts)
router.get("/products/featured", getFeaturedProducts)
router.get("/products/on-sale", validate(viewOnSaleSchema), listProductsOnSale)

router.get("/search", validate(searchProductsSchema), searchProducts)

router.get("/products/:productId", getProduct)

export default router