import db from "../config/db.js"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { OAuth2Client } from 'google-auth-library';
import "dotenv/config"
import { v2 as cloudinary } from "cloudinary"
import { uploadToCloudinary } from "../config/cloudinary.js"


const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, role: user.role },
        process.env["JWT_SECRET"],
        { expiresIn: '1hr' }
    )
}


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleSignIn = async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, name, picture, sub: googleId } = ticket.getPayload();

        let user = await db.user.findUnique({ where: { email } });

        if (!user) {
            user = await db.user.create({
                data: {
                    name,
                    email,
                    password: "GOOGLE_AUTH_USER",
                    profilePic: picture,
                    status: "ACTIVE"
                }
            });
        }

        const appToken = generateToken(user);

        res.status(200).json({
            message: "Google login successful",
            token: appToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        console.error("Google Auth Error:", error);
        res.status(401).json({ message: "Google authentication failed." });
    }
};

export const register = async (req, res) => {
    let imageData = null
    try {
        const { name, email, password } = req.body

        const existingUser = await db.user.findUnique({
            where: { email }
        })
        if (existingUser) {
            return res.status(409).json({ message: "This email is already registered." })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        if (req.file) {
            imageData = await uploadToCloudinary(req.file.buffer, "profile_pictures")
        }

        const user = await db.$transaction(async (tx) => {
            return await tx.user.create({
                data: {
                    name,
                    email,
                    password: hashedPassword,
                    profilePic: imageData?.url,
                    picPublicId: imageData?.public_id
                }
            })
        })

        const token = generateToken(user)

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status || "ACTIVE",
                createdAt: user.createdAt,
                profilePic: user.profilePic,
                sellerProfile: user.sellerProfile ?? null
            }
        })

    } catch (error) {
        console.log("Registration Error: ", error)


        if (imageData?.public_id) {
            try {
                await cloudinary.uploader.destroy(imageData.public_id)
            } catch (err) {
                console.log("Cloudinary cleanup failed:", err)
            }
        }

        res.status(500).json({ message: "Registration failed. Please try again!" })
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body

        const user = await db.user.findUnique({ where: { email }, include: { sellerProfile: true } })
        if (!user) {
            return res.status(404).json({ message: "user doesn't exist." })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials." })
        }

        if (user.status !== "ACTIVE") {
            return res.status(403).json({ message: "User is not active." })
        }

        const token = generateToken(user)

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                profilePic: user.profilePic,
                sellerProfile: user.sellerProfile ?? null
            }
        })
    } catch (error) {
        res.status(500).json({ message: "Login failed. please try again." })
        console.log("controller: ", error)
    }
}

export const changePassword = async (req, res) => {
    try {
        const { old_password, new_password } = req.body;
        const user = await db.user.findUnique({ where: { id: req.user.id } });

        if (!user) return res.status(404).json({ message: "User not found." });

        const isMatch = await bcrypt.compare(old_password, user.password);
        if (!isMatch) return res.status(401).json({ message: "Incorrect old password." });

        const hashedPassword = await bcrypt.hash(new_password, 10);
        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword }
        });

        res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
        res.status(500).json({ message: "Failed to update password." });
        console.error("Change Password Error:", error);
    }
};
