import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { requestProductFeature } from '../api/sellerApi.js';

export function useRequestProductFeature() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ productId, durationDays }) => requestProductFeature(productId, durationDays),
        onSuccess: () => {
            toast.success('Feature request sent to admin for review');
            queryClient.invalidateQueries({ queryKey: ['sellerProducts'] });
        },
        onError: (e) => {
            toast.error(e?.response?.data?.message || 'Could not submit request');
        }
    });
}
