import { z } from "zod"

const caseInsensitiveEnum = (values) =>
    z.preprocess((val) => typeof val === "string" ? val.toUpperCase() : val, z.enum(values));

export const verifySellerSchema = z.object({
    params: z.object({
        sellerProfileId: z.string().uuid("Invalid seller profile ID format")
    }),
    body: z.object({
        status: caseInsensitiveEnum(["VERIFIED", "REJECTED"])
    })
})

export const updateSellerStatusSchema = z.object({
    params: z.object({
        sellerProfileId: z.string().uuid("Invalid seller profile ID format")
    }),
    body: z.object({
        status: caseInsensitiveEnum(["PENDING", "VERIFIED", "REJECTED", "SUSPENDED"])
    })
})

export const getUserByIdSchema = z.object({
    params: z.object({
        userId: z.string().uuid("Invalid user ID format")
    })
})

const paginationSchema = (resourceName) => z.object({
    cursor: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string()
        .regex(/^\d+$/)
        .optional()
        .default("20")
        .transform(Number)
        .pipe(z.number().max(100, `Cannot request more than 100 ${resourceName} at once`))
});

export const getAllUsersSchema = z.object({ query: paginationSchema("users") });

export const getAllSellersSchema = z.object({ query: paginationSchema("sellers") });

export const getAllSellerRequestsSchema = z.object({ query: paginationSchema("seller requests") });

export const resolveDisputeSchema = z.object({
    params: z.object({ disputeId: z.string().uuid() }),
    body: z.object({
        status: caseInsensitiveEnum(["RESOLVED_IN_FAVOR_OF_BUYER", "RESOLVED_IN_FAVOR_OF_SELLER", "CLOSED_BY_ADMIN"]),
        adminResolutionNote: z.string().max(1000).optional()
    })
});

export const processDeliveryPayoutSchema = z.object({
    params: z.object({ payoutId: z.string().uuid() }),
    body: z.object({ status: caseInsensitiveEnum(["SUCCESS", "FAILED"]) })
});

export const processPayoutSchema = z.object({
    params: z.object({ payoutId: z.string().uuid() }),
    body: z.object({ status: caseInsensitiveEnum(["SUCCESS", "FAILED"]) })
});

export const getOrderByIdAdminSchema = z.object({
    params: z.object({ orderId: z.string().uuid() })
});

export const archiveProductSchema = z.object({
    params: z.object({ productId: z.string().uuid() })
});

export const reviewFeaturedRequestSchema = z.object({
    params: z.object({ requestId: z.string().uuid() }),
    body: z.object({
        decision: z.enum(["approve", "reject"]),
        rejectionNote: z.string().max(500).optional()
    })
});

export const removeFeaturedProductSchema = z.object({
    params: z.object({ productId: z.string().uuid() })
});
