import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedProducts } from '../api/productApi.js';

export function useFeaturedHomeProducts() {
    const query = useQuery({
        queryKey: ['featuredHomeProducts'],
        queryFn: async () => {
            const body = await fetchFeaturedProducts();
            return body?.products ?? [];
        },
        staleTime: 60_000
    });

    const products = query.data ?? [];
    const hasUsableData = query.data !== undefined;

    return {
        products,
        isLoading: query.isPending,
        isError: query.isError && !hasUsableData
    };
}
