import API from "../../../api/axios.js"

export const getDeliveryProfile = async () => {
    const { data } = await API.get("v1/delivery/profile")
    return data
}

export const patchDeliveryAvailability = async (isAvailable) => {
    const { data } = await API.patch("v1/delivery/availability", { isAvailable })
    return data
}

export const getDeliveryQueue = async () => {
    const { data } = await API.get("v1/delivery/orders/queue")
    return data.orders ?? []
}

export const getDeliveryActive = async () => {
    const { data } = await API.get("v1/delivery/orders/active")
    return data.orders ?? []
}

export const acceptDeliveryOrder = async (orderId) => {
    const { data } = await API.post(`v1/delivery/orders/${orderId}/accept`)
    return data
}

export const confirmDeliveryHandoff = async (orderId, code) => {
    const { data } = await API.post(`v1/delivery/orders/${orderId}/confirm-handoff`, { code })
    return data
}

export const getDeliveryFinances = async () => {
    const { data } = await API.get("v1/delivery/finances")
    return data
}

export const postDeliveryPayoutRequest = async ({ amount, provider }) => {
    const { data } = await API.post("v1/delivery/payouts", { amount, provider })
    return data
}
