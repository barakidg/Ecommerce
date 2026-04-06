
import crypto from "crypto"

const num = (v, fallback) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : fallback
}

export const getDeliveryFeeAmount = () =>
    num(process.env.PLATFORM_DELIVERY_FEE_ETB, 50)

export const getDisputeWindowHours = () =>
    num(process.env.DISPUTE_WINDOW_HOURS, 24)

export const getDefaultDeliveryFeeAmount = () =>
    num(process.env.PLATFORM_DELIVERY_FEE_ETB, 50)

export function disputeWindowEndFrom(date = new Date()) {
    const d = new Date(date)
    d.setHours(d.getHours() + getDisputeWindowHours())
    return d
}

export function generateHandoffCode() {
    return String(crypto.randomInt(100000, 1000000))
}
