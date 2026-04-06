import API from "../../../api/axios.js"

export const requestSellerAccount = async (sellerData) => {
    const { data } = await API.post("v1/seller/request-seller-account", sellerData)
    return data
}
