import db from "../config/db.js"
import bcrypt from "bcryptjs"
import "dotenv/config"

async function main() {
    const adminEmail = process.env.ADMIN_EMAIL
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)

    const admin = await db.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            name: "Admin",
            email: adminEmail,
            password: hashedPassword,
            role: "ADMIN"
        }
    })
    console.log("Admin seeded: ", admin)

    const deliveryEmail = process.env.DELIVERY_EMAIL || "delivery@bmart.local"
    const deliveryPasswordPlain = process.env.DELIVERY_PASSWORD || "Delivery123!"
    const deliveryHash = await bcrypt.hash(deliveryPasswordPlain, 10)

    const courier = await db.user.upsert({
        where: { email: deliveryEmail },
        update: { role: "DELIVERY" },
        create: {
            name: "Demo Courier",
            email: deliveryEmail,
            password: deliveryHash,
            role: "DELIVERY"
        }
    })

    await db.deliveryProfile.upsert({
        where: { userId: courier.id },
        update: {},
        create: {
            userId: courier.id,
            phoneNumber: "+251900000001",
            vehicleLabel: "Van — AA-12345",
            isAvailable: true
        }
    })
    console.log("Delivery courier seeded:", courier.email, "(password:", deliveryPasswordPlain + ")")
}

main()
    .catch((e) => {
        console.log("seed: ", e)
        process.exit(1)
    })
    .finally(async () => {
        await db.$disconnect()
        process.exit(0)
    })