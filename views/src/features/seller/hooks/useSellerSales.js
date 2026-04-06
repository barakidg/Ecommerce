import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSellerSales, updateSaleItemStatus } from "../api/sellerApi.js";
import { toast } from "react-hot-toast";

export const useSellerSales = (params = {}) => {
    return useQuery({
        queryKey: ["sellerSales", params],
        queryFn: () => getSellerSales({ limit: 100, ...params }),
        staleTime: 15_000
    });
};

export const useUpdateSaleStatus = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({ itemId, status }) => updateSaleItemStatus(itemId, status),
        onSuccess: () => {
            toast.success("Order line updated");
            qc.invalidateQueries({ queryKey: ["sellerSales"] });
            qc.invalidateQueries({ queryKey: ["sellerDashboardSummary"] });
        },
        onError: (e) => {
            toast.error(e?.response?.data?.message || "Could not update status");
        }
    });
};
