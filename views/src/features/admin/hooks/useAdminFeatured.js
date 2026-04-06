import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import {
    getFeaturedRequests,
    getAdminFeaturedProducts,
    reviewFeaturedRequestApi,
    removeAdminFeaturedProduct
} from '../api/adminApi.js';

export function useAdminFeaturedData() {
    const queryClient = useQueryClient();

    const requestsQuery = useQuery({
        queryKey: ['adminFeaturedRequests'],
        queryFn: getFeaturedRequests
    });

    const activeQuery = useQuery({
        queryKey: ['adminFeaturedProducts'],
        queryFn: getAdminFeaturedProducts
    });

    const reviewMutation = useMutation({
        mutationFn: reviewFeaturedRequestApi,
        onSuccess: (_, vars) => {
            toast.success(vars.decision === 'approve' ? 'Featured request approved' : 'Request rejected');
            queryClient.invalidateQueries({ queryKey: ['adminFeaturedRequests'] });
            queryClient.invalidateQueries({ queryKey: ['adminFeaturedProducts'] });
        },
        onError: (e) => {
            toast.error(e?.response?.data?.message || 'Action failed');
        }
    });

    const removeMutation = useMutation({
        mutationFn: removeAdminFeaturedProduct,
        onSuccess: () => {
            toast.success('Removed from featured');
            queryClient.invalidateQueries({ queryKey: ['adminFeaturedProducts'] });
        },
        onError: (e) => {
            toast.error(e?.response?.data?.message || 'Remove failed');
        }
    });

    return {
        requests: requestsQuery.data ?? [],
        activeFeatured: activeQuery.data ?? [],
        isLoadingRequests: requestsQuery.isPending,
        isLoadingActive: activeQuery.isPending,
        reviewRequest: reviewMutation.mutate,
        removeFeatured: removeMutation.mutate,
        isReviewing: reviewMutation.isPending,
        isRemoving: removeMutation.isPending
    };
}
