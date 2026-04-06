import db from "../config/db.js"

const isDelivery = async (req, res, next) => {
    if (req.user?.role !== "DELIVERY") {
        return res.status(403).json({ message: "Delivery account required." })
    }

    const profile = await db.deliveryProfile.findUnique({
        where: { userId: req.user.id }
    })

    if (!profile) {
        return res.status(403).json({ message: "No delivery profile on this account." })
    }

    req.deliveryProfile = profile
    next()
}

export default isDelivery
