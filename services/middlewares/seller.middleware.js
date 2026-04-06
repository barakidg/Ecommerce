import db from "../config/db.js"

const isSeller = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" })
    }
    if (req.user.role !== "SELLER") {
        return res.status(403).json({ message: "can't access this resource. Your account is not verified yet" })
    }
    const profile = await db.sellerProfile.findFirst({
        where: { userId: req.user.id, deletedAt: null }
    })
    if (!profile || profile.status !== "VERIFIED") {
        if (profile?.status === "SUSPENDED") {
            return res.status(403).json({ message: "Your seller account is suspended. Please contact support." })
        }
        return res.status(403).json({ message: "can't access this resource. Your seller account is not active." })
    }
    next()
}

export default isSeller