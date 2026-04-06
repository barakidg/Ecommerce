import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"

export const pool = new Pool({
    connectionString: process.env["DATABASE_URL"],
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
})

const adapter = new PrismaPg(pool)

const db = new PrismaClient({ adapter })

export default db