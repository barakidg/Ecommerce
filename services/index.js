import express from 'express';
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import multer from "multer";
import "dotenv/config";
import { pool } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import sellerRoutes from "./routes/seller.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import userRoutes from "./routes/user.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import deliveryRoutes from "./routes/delivery.routes.js";
import { releaseDueEscrowForOrders } from "./lib/escrowRelease.js";

const app = express();

app.use(helmet());

app.use(cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PATCH", "DELETE", "PUT"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests from this IP, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 20,
    message: { message: "Too many login attempts, please try again in an hour." }
});

app.use("/api/v1/auth", authLimiter);

app.use(express.json({
    limit: '10kb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/seller', sellerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/delivery', deliveryRoutes);
app.use("/api", paymentRoutes);

app.use((err, req, res, next) => {
    if (process.env.NODE_ENV === 'development') {
        console.error(err);
    }

    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: `Upload Error: ${err.message}` });
    }

    if (err.message === "Invalid file type") {
        return res.status(400).json({ message: err.message });
    }

    res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

const escrowIntervalMs = Number(process.env.ESCROW_RELEASE_INTERVAL_MS) || 60_000;
setInterval(() => {
    releaseDueEscrowForOrders().catch((err) =>
        console.error("Escrow release job:", err)
    );
}, escrowIntervalMs);

const shutdown = async (signal) => {
    console.log(`Received ${signal}. Starting graceful shutdown...`);

    try {
        await pool.end();
        console.log('Database connection pool closed');

        if (server) {
            server.close(() => {
                console.log('HTTP Server closed');
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));