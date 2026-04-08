import API from "../../../api/axios.js"

export const getSellerRequests = async () => {
    const { data } = await API.get("v1/admin/requests")
    return data.sellerRequests
}

export const getVerifiedSellers = async () => {
    const { data } = await API.get("v1/admin/sellers")
    return data.sellers
}

export const verifySeller = async ({ sellerId, status, rejectionNote }) => {
    const { data } = await API.put(`v1/admin/verify/${sellerId}`, { status, rejectionNote })
    return data
}

export const updateSellerAdminStatus = async ({ sellerProfileId, status }) => {
    const { data } = await API.put(`v1/admin/seller/${sellerProfileId}`, { status })
    return data
}

export const getFeaturedRequests = async () => {
    const { data } = await API.get("v1/admin/featured/requests")
    return data.requests ?? []
}

export const getAdminFeaturedProducts = async () => {
    const { data } = await API.get("v1/admin/featured/products")
    return data.products ?? []
}

export const reviewFeaturedRequestApi = async ({ requestId, decision, rejectionNote }) => {
    const { data } = await API.patch(`v1/admin/featured/requests/${requestId}`, {
        decision,
        rejectionNote
    })
    return data
}

export const removeAdminFeaturedProduct = async (productId) => {
    const { data } = await API.delete(`v1/admin/featured/products/${productId}`)
    return data
}

export const getAdminDashboardStats = async () => {
    const { data } = await API.get("v1/admin/dashboard/stats")
    return data.stats
}

export const getAdminCompanyOverview = async () => {
    const { data } = await API.get("v1/admin/company/overview")
    return data
}

export const getAdminProducts = async () => {
    const { data } = await API.get("v1/admin/products")
    return { products: data.products ?? [], nextCursor: data.nextCursor }
}

export const getAdminDisputes = async () => {
    const { data } = await API.get("v1/admin/disputes")
    return data.disputes ?? []
}

export const resolveAdminDispute = async ({ disputeId, status, adminResolutionNote }) => {
    const { data } = await API.patch(`v1/admin/disputes/${disputeId}/resolve`, {
        status,
        ...(adminResolutionNote ? { adminResolutionNote } : {})
    })
    return data
}

export const getAdminDeliveryPayouts = async () => {
    const { data } = await API.get("v1/admin/delivery-payouts")
    return data.deliveryPayouts ?? []
}

export const processAdminDeliveryPayout = async ({ payoutId, status }) => {
    const { data } = await API.patch(`v1/admin/delivery-payouts/${payoutId}`, { status })
    return data
}
