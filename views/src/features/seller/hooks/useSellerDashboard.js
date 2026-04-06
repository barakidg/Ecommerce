import { useQuery } from "@tanstack/react-query";
import { getDashboardSummary } from "../api/sellerApi.js";

export const useSellerDashboard = (options = {}) => {
    const { enabled = true } = options;
    return useQuery({
        queryKey: ["sellerDashboardSummary"],
        queryFn: getDashboardSummary,
        staleTime: 30_000,
        enabled
    });
};
