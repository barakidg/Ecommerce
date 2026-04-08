import jwt from "jsonwebtoken"
import "dotenv/config"
import db from "../config/db.js"

const authorize = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: "Please sign in first." })
        }
        const token = authHeader.split(' ')[1]
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const user = await db.user.findUnique({ where: { id: decoded.id } })
        if (!user) return res.status(401).json({ message: "User not found" })
        if (user.deletedAt || user.status !== "ACTIVE") {
            return res.status(403).json({ message: "Account is inactive." })
        }

        req.user = user
        next()
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Session expired. Please login again." })
        }
        res.status(401).json({ message: "Unauthorized!" })
        console.log("jwt: ", error)
    }
}

export default authorize