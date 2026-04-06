import { z } from "zod";

const uuidParam = (name) => z.object({
    params: z.object({
        [name]: z.string().uuid(`${name} must be a valid UUID`),
    })
});

export const updateProfileSchema = z.object({
    body: z.object({
        name: z.string().min(1).max(255).trim().optional(),
        email: z.string().email("Invalid email format").max(255, "Email too long").toLowerCase().trim().optional(),
    })
});

export const addToCartSchema = z.object({
    params: z.object({
        productId: z.string().uuid(),
    }),
    body: z.object({
        quantity: z.number().int().positive("Quantity must be at least 1").default(1),
    })
});

export const updateCartItemSchema = z.object({
    params: z.object({
        productId: z.string().uuid(),
    }),
    body: z.object({
        quantity: z.number().int().positive("Quantity must be at least 1"),
    })
});

export const removeFromCartSchema = uuidParam("productId");

export const wishlistProductParamsSchema = uuidParam("productId");

export const createOrderSchema = z.object({
    body: z.object({
        shippingAddress: z.string().trim(),
        shippingPhone: z.string().trim(),
        shippingCity: z.string().trim(),
        shippingCountry: z.string().trim(),
        promoCode: z.string().optional(),
    })
});

export const cancelOrderSchema = uuidParam("orderId");

export const viewProductsSchema = z.object({
    query: z.object({
        cursor: z.string().uuid().optional(),
        limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
        sort: z.enum(["best-sellers", "new-releases"]).optional(),
        timeFilter: z.string().optional()
    })
});

export const viewOnSaleSchema = z.object({
    query: z.object({
        limit: z.string().regex(/^\d+$/).optional().default("24").transform(Number)
    })
});

export const viewCategoriesSchema = z.object({
    query: z.object({
        category: z.string().min(1, "Category name is required"),
        cursor: z.string().uuid().optional(),
        limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
        sort: z.enum(["default", "newest"]).optional()
    })
});

export const writeReviewSchema = z.object({
    params: z.object({
        productId: z.string().uuid(),
    }),
    body: z.object({
        rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
        comment: z.string().max(1000).trim().optional(),
    })
});

export const deleteReviewSchema = uuidParam("reviewId");

export const applyDiscountSchema = z.object({
    body: z.object({
        code: z.string().min(1).toUpperCase().trim(),
        orderAmount: z.number().positive(),
    })
});

export const openDisputeSchema = z.object({
    params: z.object({
        orderId: z.string().uuid(),
    }),
    body: z.object({
        reason: z.string().min(10, "Reason must be at least 10 characters").max(500),
        orderItemId: z.string().uuid().optional(),
    })
});

export const updateReviewSchema = z.object({
    params: z.object({
        reviewId: z.string().uuid(),
    }),
    body: z.object({
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().max(1000).trim().optional(),
    }).refine(data => data.rating || data.comment, {
        message: "Must provide at least rating or comment to update",
        path: ["rating"]
    })
});

export const closeDisputeSchema = uuidParam("disputeId");

export const getOrderByIdSchema = uuidParam("orderId");

export const getMyOrdersSchema = z.object({
    query: z.object({
        cursor: z.string().uuid().optional(),
        limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional()
    })
});

export const searchProductsSchema = z.object({
    query: z.object({
        q: z.string().optional(),
        categories: z.string().optional(),
        minPrice: z.string().regex(/^\d+(\.\d+)?$/).optional().transform(Number),
        maxPrice: z.string().regex(/^\d+(\.\d+)?$/).optional().transform(Number),
        minRating: z.string().regex(/^\d+(\.\d+)?$/).optional().transform(Number),
        sort: z.enum(["relevance", "price-asc", "price-desc", "newest", "rating"]).optional().default("relevance"),
        cursor: z.string().uuid().optional(),
        limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
    })
});