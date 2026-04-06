import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getSellerProducts,
    deleteSellerProduct,
    updateSellerProduct
} from "../api/sellerApi.js";
import { toast } from "react-hot-toast";

export const useSellerInventoryProducts = (options = {}) => {
    const { enabled = true } = options;
    return useQuery({
        queryKey: ["sellerProducts"],
        queryFn: getSellerProducts,
        staleTime: 15_000,
        enabled
    });
};

export const useDeleteSellerProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteSellerProduct,
        onSuccess: () => {
            toast.success("Product removed from catalog");
            qc.invalidateQueries({ queryKey: ["sellerProducts"] });
            qc.invalidateQueries({ queryKey: ["sellerDashboardSummary"] });
        },
        onError: (e) => {
            toast.error(e?.response?.data?.message || "Delete failed");
        }
    });
};

export const useUpdateSellerProduct = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ id, body }) => updateSellerProduct(id, body),
        onSuccess: () => {
            toast.success("Product updated");
            qc.invalidateQueries({ queryKey: ["sellerProducts"] });
            qc.invalidateQueries({ queryKey: ["sellerDashboardSummary"] });
        },
        onError: (e) => {
            const msg =
                e?.response?.data?.errors?.[0]?.message ||
                e?.response?.data?.message ||
                "Update failed";
            toast.error(msg);
        }
    });
};
