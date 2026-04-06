import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addReview } from "../api/productApi.js";

export const useAddReview = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addReview,
        onSuccess: (_, { productId }) => {
            queryClient.invalidateQueries(['product', productId]);
        }
    });
};
