import express from "express"
import authorize from "../middlewares/jwt.middleware.js"
import isSeller from "../middlewares/seller.middleware.js"
import {
    requestSellerAccount,
    updateSellerProfile,
    deleteSellerProfile,
    getSellerProfile,
    postProduct,
    updateProduct,
    deleteProduct,
    getProducts,
    getProduct,
    getSellerDashboardSummary,
    getSales,
    getSaleById,
    updateSaleStatus,
    getFinances,
    getLedger,
    requestPayout,
    getPayouts,
    createDiscount,
    getDiscounts,
    toggleDiscount,
    requestProductFeature
} from "../controllers/seller.controller.js"
import validate from "../middlewares/validator.middleware.js"
import {
    updateSellerProfileSchema,
    postProductSchema,
    updateProductSchema,
    deleteProductSchema,
    getSalesSchema,
    getSaleByIdSchema,
    updateSaleStatusSchema,
    getLedgerSchema,
    requestPayoutSchema,
    createDiscountSchema,
    toggleDiscountSchema,
    requestProductFeatureSchema
} from "../config/seller.validator.js"
import { upload } from "../middlewares/multer.middleware.js"
import assertPostProductHasImages from "../middlewares/assertPostProductImages.middleware.js"

const router = express.Router()

router.post('/request-seller-account', authorize, requestSellerAccount)
router.get('/profile', authorize, isSeller, getSellerProfile)

router.put('/profile', authorize, isSeller, validate(updateSellerProfileSchema), updateSellerProfile)
router.delete('/profile', authorize, isSeller, deleteSellerProfile)

router.post(
    "/product",
    authorize,
    isSeller,
    upload.array("images", 10),
    assertPostProductHasImages,
    validate(postProductSchema),
    postProduct
)
router.put(
    "/product/:id",
    authorize,
    isSeller,
    upload.array("images", 10),
    validate(updateProductSchema),
    updateProduct
)
router.delete('/product/:id', authorize, isSeller, validate(deleteProductSchema), deleteProduct)
router.get('/products', authorize, isSeller, getProducts)
router.get('/product/:id', authorize, isSeller, getProduct)
router.post(
    '/product/:productId/feature-request',
    authorize,
    isSeller,
    validate(requestProductFeatureSchema),
    requestProductFeature
)

router.get('/dashboard/summary', authorize, isSeller, getSellerDashboardSummary)

router.get('/sales', authorize, isSeller, validate(getSalesSchema), getSales)
router.get('/sales/:id', authorize, isSeller, validate(getSaleByIdSchema), getSaleById)
router.patch('/sales/:id/status', authorize, isSeller, validate(updateSaleStatusSchema), updateSaleStatus)

router.get('/finances', authorize, isSeller, getFinances)
router.get('/ledger', authorize, isSeller, validate(getLedgerSchema), getLedger)

router.post('/payouts', authorize, isSeller, validate(requestPayoutSchema), requestPayout)
router.get('/payouts', authorize, isSeller, getPayouts)

router.post('/discounts', authorize, isSeller, validate(createDiscountSchema), createDiscount)
router.get('/discounts', authorize, isSeller, getDiscounts)
router.patch('/discounts/:id', authorize, isSeller, validate(toggleDiscountSchema), toggleDiscount)

export default router