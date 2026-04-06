import { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { getWishlist, addToWishlist, removeFromWishlist } from "../api/wishlistApi.js";

const wishlistToastGuest = () => {
    toast.error("Sign in to save items to your wishlist");
};

export const useWishlist = () => {
    const queryClient = useQueryClient();

    const { data: wishlistItems = [], isLoading, error } = useQuery({
        queryKey: ["wishlist"],
        queryFn: getWishlist,
        retry: false,
        enabled: !!localStorage.getItem("token"),
        initialData: []
    });

    const wishlistIds = useMemo(() => {
        const list = Array.isArray(wishlistItems) ? wishlistItems : [];
        return new Set(list.map((row) => row.productId));
    }, [wishlistItems]);

    const addMutation = useMutation({
        mutationFn: addToWishlist,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            if (data?.alreadySaved) {
                toast.success("Already in your wishlist");
            } else {
                toast.success("Added to wishlist");
            }
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Could not add to wishlist";
            toast.error(message);
        }
    });

    const removeMutation = useMutation({
        mutationFn: removeFromWishlist,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["wishlist"] });
            toast.success("Removed from wishlist");
        },
        onError: (err) => {
            const message = err.response?.data?.message || "Could not remove from wishlist";
            toast.error(message);
        }
    });

    const toggleWishlist = (productId) => {
        if (!localStorage.getItem("token")) {
            wishlistToastGuest();
            return;
        }
        if (!productId) return;
        if (wishlistIds.has(productId)) {
            removeMutation.mutate(productId);
        } else {
            addMutation.mutate(productId);
        }
    };

    const isInWishlist = (productId) => wishlistIds.has(productId);

    return {
        wishlistItems: Array.isArray(wishlistItems) ? wishlistItems : [],
        wishlistIds,
        isLoading,
        error,
        toggleWishlist,
        isInWishlist,
        addToWishlist: addMutation.mutate,
        removeFromWishlist: removeMutation.mutate,
        isWishlistBusy: addMutation.isPending || removeMutation.isPending
    };
};
