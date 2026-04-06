import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { getSellerRequests, getVerifiedSellers, verifySeller, updateSellerAdminStatus } from "../api/adminApi.js"
import { toast } from "react-hot-toast"

export const useAdminSellers = () => {
    const queryClient = useQueryClient()

    const pendingRequests = useQuery({
        queryKey: ["admin", "sellerRequests"],
        queryFn: getSellerRequests
    })

    const verifiedSellers = useQuery({
        queryKey: ["admin", "verifiedSellers"],
        queryFn: getVerifiedSellers
    })

    const verifyMutation = useMutation({
        mutationFn: verifySeller,
        onSuccess: (data, variables) => {
            const action = variables.status === 'VERIFIED' ? 'approved' : 'rejected'
            toast.success(`Seller application ${action}!`)
            queryClient.invalidateQueries({ queryKey: ["admin", "sellerRequests"] })
            queryClient.invalidateQueries({ queryKey: ["admin", "verifiedSellers"] })
        },
        onError: (error) => {
            const message = error.response?.data?.message || "Failed to process seller application"
            toast.error(message)
        }
    })

    const sellerStatusMutation = useMutation({
        mutationFn: updateSellerAdminStatus,
        onSuccess: (_, variables) => {
            toast.success(
                variables.status === "SUSPENDED" ? "Seller suspended" : "Seller restored to active selling"
            )
            queryClient.invalidateQueries({ queryKey: ["admin", "verifiedSellers"] })
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || "Could not update seller")
        }
    })

    return {
        pendingRequests: pendingRequests.data || [],
        isLoadingPending: pendingRequests.isPending,
        verifiedSellers: verifiedSellers.data || [],
        isLoadingVerified: verifiedSellers.isPending,
        verifySeller: verifyMutation.mutate,
        isVerifying: verifyMutation.isPending,
        updateSellerStatus: sellerStatusMutation.mutate,
        isUpdatingSellerStatus: sellerStatusMutation.isPending
    }
}
