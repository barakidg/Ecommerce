import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchCategoryProducts } from "../api/productApi.js";

export const useCategoryProducts = (categoryName, options = {}) => {
    const { sort, pageSize = 4 } = options;
    return useInfiniteQuery({
        queryKey: ['categoryProducts', categoryName, sort, pageSize],
        queryFn: ({ pageParam }) =>
            fetchCategoryProducts({ pageParam, category: categoryName, sort, limit: pageSize }),
        getNextPageParam: (lastPage) => {
            if (!lastPage || lastPage.nextCursor === null || lastPage.nextCursor === undefined) return undefined
            return lastPage.nextCursor
        },
        initialPageParam: null,
        retry: 1,
        enabled: Boolean(categoryName),
    });
};
