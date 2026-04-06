import express from "express"
import { register, login, changePassword, googleSignIn } from "../controllers/auth.controller.js"
import validate from "../middlewares/validator.middleware.js"
import authorize from "../middlewares/jwt.middleware.js"
import { registerSchema, loginSchema, changePasswordSchema } from "../config/auth.validator.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = express.Router()

router.post("/register", upload.single('profilePicture'), validate(registerSchema), register)
router.post("/login", validate(loginSchema), login)
router.post("/change-password", authorize, validate(changePasswordSchema), changePassword)
router.post("/google", googleSignIn);

export default router