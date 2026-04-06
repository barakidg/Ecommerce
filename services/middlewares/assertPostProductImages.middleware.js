import { postProductImagesCountSchema } from "../config/seller.validator.js"

const assertPostProductHasImages = (req, res, next) => {
    const result = postProductImagesCountSchema.safeParse({
        count: req.files?.length ?? 0
    })
    if (!result.success) {
        const msg =
            result.error.issues[0]?.message ??
            "At least one product image is required."
        return res.status(422).json({
            errors: [{ path: "images", message: msg }]
        })
    }
    next()
}

export default assertPostProductHasImages
