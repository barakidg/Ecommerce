import axios from "axios"

const isMockChapa = () =>
    String(process.env.MOCK_CHAPA).toLowerCase() === "true" ||
    String(process.env.CHAPA_MOCK).toLowerCase() === "true"

export const initiateChapaTransfer = async ({
    referenceId,
    amount,
    currency = "ETB",
    accountName,
    accountNumber,
    bankCode,
    narration
}) => {
    if (isMockChapa()) {
        return {
            success: true,
            providerRef: `mock_transfer_${referenceId}`,
            raw: { mode: "mock" }
        }
    }

    try {
        const response = await axios.post(
            "https://api.chapa.co/v1/transfers",
            {
                amount,
                currency,
                reference: referenceId,
                account_name: accountName,
                account_number: accountNumber,
                bank_code: bankCode,
                narration: narration || "Marketplace payout"
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.CHAPA_SECRET}`,
                    "Content-Type": "application/json"
                },
                timeout: Number(process.env.CHAPA_HTTP_TIMEOUT_MS || 10000)
            }
        )

        const providerRef =
            response?.data?.data?.reference ||
            response?.data?.data?.id ||
            referenceId

        return {
            success: true,
            providerRef,
            raw: response.data
        }
    } catch (error) {
        return {
            success: false,
            errorMessage:
                error?.response?.data?.message ||
                error?.message ||
                "Transfer request failed"
        }
    }
}
