import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postProduct } from "../api/sellerApi.js";
import { toast } from "react-hot-toast";

export const useAddProduct = () => {
    const queryClient = useQueryClient();

    const addProductMutation = useMutation({
        mutationFn: postProduct,
        onSuccess: () => {
            toast.success("Product published successfully!");
            queryClient.invalidateQueries({ queryKey: ["sellerDashboardSummary"] });
            queryClient.invalidateQueries({ queryKey: ["sellerProducts"] });
        },
        onError: (error) => {
            const message = error.response?.data?.message || "Failed to publish product";
            toast.error(message);
        }
    });

    return {
        addProduct: addProductMutation.mutate,
        isAdding: addProductMutation.isPending
    };
};
