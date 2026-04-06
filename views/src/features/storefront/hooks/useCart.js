import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from "../api/cartApi";
import { toast } from "react-hot-toast";

export const useCart = () => {
    const queryClient = useQueryClient();

    const { data: cartItems = [], isLoading, error } = useQuery({
        queryKey: ["cart"],
        queryFn: getCart,
        retry: false,
        enabled: !!localStorage.getItem("token"),
        initialData: [],
    });

    const addMutation = useMutation({
        mutationFn: addToCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            toast.success("Added to cart");
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Failed to add to cart";
            toast.error(message);
        }
    });

    const updateMutation = useMutation({
        mutationFn: updateCartItem,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Failed to update cart";
            toast.error(message);
        }
    });

    const removeMutation = useMutation({
        mutationFn: removeFromCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
            toast.success("Item removed");
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Failed to remove item";
            toast.error(message);
        }
    });

    const clearMutation = useMutation({
        mutationFn: clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["cart"] });
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Failed to clear cart";
            toast.error(message);
        }
    });

    return {
        cartItems: Array.isArray(cartItems) ? cartItems : [],
        isLoading,
        error,
        addToCart: addMutation.mutate,
        isAdding: addMutation.isPending,
        updateCartItem: updateMutation.mutate,
        isUpdating: updateMutation.isPending,
        removeFromCart: removeMutation.mutate,
        isRemoving: removeMutation.isPending,
        clearCart: clearMutation.mutate,
        isClearing: clearMutation.isPending
    };
};
