import db from "../config/db.js"

export async function ensureCompanyAccount(tx) {
    const existing = await tx.companyAccount.findFirst({
        orderBy: { createdAt: "asc" }
    })
    if (existing) return existing

    return tx.companyAccount.create({
        data: { name: "B-Mart Platform" }
    })
}

export async function ensureCompanyAccountOutsideTransaction() {
    return db.$transaction(async (tx) => ensureCompanyAccount(tx))
}
