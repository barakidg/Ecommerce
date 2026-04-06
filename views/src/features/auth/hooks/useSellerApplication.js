import { useMutation } from "@tanstack/react-query"
import { requestSellerAccount } from "../api/sellerApi.js"
import { toast } from "react-hot-toast"
import { useNavigate } from "react-router-dom"

export const useSellerApplication = () => {
    const navigate = useNavigate()

    const applyMutation = useMutation({
        mutationFn: requestSellerAccount,
        onSuccess: () => {
            toast.success("Application submitted successfully! We will review it shortly.")
            navigate("/")
        },
        onError: (error) => {
            const message = error.response?.data?.message || "Failed to submit application"
            toast.error(message)
        }
    })

    return {
        apply: applyMutation.mutate,
        isApplying: applyMutation.isPending
    }
}
