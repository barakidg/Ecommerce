import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createOrder, getMyOrders } from "../api/orderApi";
import { toast } from "react-hot-toast";

export const useOrder = () => {
    const queryClient = useQueryClient();

    const { data, isLoading, error } = useQuery({
        queryKey: ["orders"],
        queryFn: getMyOrders,
        retry: false,
        enabled: !!localStorage.getItem("token")
    });

    const createOrderMutation = useMutation({
        mutationFn: createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            toast.success("Order placed successfully!");
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Failed to place order";
            toast.error(message);
        }
    });

    return {
        orders: data?.orders || [],
        isLoading,
        error,
        createOrder: createOrderMutation.mutateAsync,
        isCreating: createOrderMutation.isPending
    };
};
