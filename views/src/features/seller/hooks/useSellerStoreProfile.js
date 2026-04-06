import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    getSellerProfileRequest,
    getSellerFinancesRequest,
    updateSellerProfileRequest
} from "../api/sellerApi.js";
import { toast } from "react-hot-toast";

export const useSellerStoreProfile = () => {
    return useQuery({
        queryKey: ["sellerStoreProfile"],
        queryFn: async () => {
            const profileRes = await getSellerProfileRequest();
            let finances = null;
            try {
                finances = await getSellerFinancesRequest();
            } catch {
                finances = null;
            }
            return { profile: profileRes.profile, finances };
        },
        retry: false,
        staleTime: 60_000
    });
};

export const useUpdateSellerStoreProfile = () => {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: updateSellerProfileRequest,
        onSuccess: () => {
            toast.success("Profile saved");
            qc.invalidateQueries({ queryKey: ["sellerStoreProfile"] });
        },
        onError: (e) => {
            toast.error(e?.response?.data?.message || "Could not save");
        }
    });
};
