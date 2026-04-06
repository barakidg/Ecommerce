import { z } from "zod"

export const updateSellerProfileSchema = z.object({
    body: z.object({
        businessName: z.string().optional(),
        taxId: z.string().optional(),
        paymentMethod: z.string().optional(),
        accountNumber: z.string().optional(),
        accountHolder: z.string().optional(),
        bankName: z.string().optional()
    })
})

export const postProductImagesCountSchema = z.object({
    count: z
        .number()
        .int()
        .min(1, { message: "At least one product image is required." })
})

export const postProductSchema = z.object({
    body: z.object({
        name: z.string().min(1),
        description: z.string().min(1),
        category: z.string().min(1),

        price: z.preprocess(
            (val) => Number(val),
            z.number().positive()
        ),

        stock: z.preprocess(
            (val) => Number(val),
            z.number().int().nonnegative()
        ),

        attributes: z.preprocess(
            (val) => (val === "" || val == null ? undefined : val),
            z.string().optional()
        ),

        salePrice: z.preprocess(
            (val) => (val === "" || val == null ? undefined : val),
            z.union([z.string(), z.number()]).optional()
        ),
        productDiscountAmount: z.preprocess(
            (val) => (val === "" || val == null ? undefined : val),
            z.union([z.string(), z.number()]).optional()
        ),
        saleEndsAt: z.preprocess(
            (val) => (val === "" || val == null ? undefined : val),
            z.string().optional()
        )
    })
})

const parseAttributesBody = (val) => {
    if (val == null || val === "") return undefined
    if (typeof val === "object" && val !== null && !Array.isArray(val)) return val
    if (typeof val === "string") {
        try {
            const parsed = JSON.parse(val)
            if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
                return parsed
            }
        } catch {
            return undefined
        }
    }
    return undefined
}

export const updateProductSchema = z.object({
    body: z.object({
        name: z.preprocess(
            (v) => (v === "" || v == null ? undefined : v),
            z.string().min(1).optional()
        ),
        description: z.preprocess(
            (v) => (v === "" || v == null ? undefined : v),
            z.string().optional()
        ),
        category: z.preprocess(
            (v) => (v === "" || v == null ? undefined : v),
            z.string().optional()
        ),
        price: z.preprocess(
            (v) =>
                v === "" || v == null ? undefined : Number(v),
            z.number().positive().optional()
        ),
        stock: z.preprocess(
            (v) =>
                v === "" || v == null ? undefined : Number(v),
            z.number().int().nonnegative().optional()
        ),
        attributes: z.preprocess(
            parseAttributesBody,
            z.record(z.string(), z.union([z.string(), z.number()])).nullable().optional()
        ),

        salePrice: z.preprocess(
            (v) => (v === "" || v == null ? undefined : v),
            z.union([z.string(), z.number()]).optional()
        ),
        productDiscountAmount: z.preprocess(
            (v) => (v === "" || v == null ? undefined : v),
            z.union([z.string(), z.number()]).optional()
        ),
        saleEndsAt: z.preprocess(
            (v) => (v === "" || v == null ? undefined : v),
            z.string().optional()
        )
    }),
    params: z.object({
        id: z.string().min(1, "Product ID is required")
    })
})

export const deleteProductSchema = z.object({
    params: z.object({
        id: z.string().min(1, "Product ID is required")
    })
})

export const getSalesSchema = z.object({
    query: z.object({
        cursor: z.string().uuid().optional(),
        limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number),
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]).optional()
    })
});

export const getSaleByIdSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    })
});

export const updateSaleStatusSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"])
    })
});

export const getLedgerSchema = z.object({
    query: z.object({
        cursor: z.string().uuid().optional(),
        limit: z.string().regex(/^\d+$/).optional().default("20").transform(Number)
    })
});

export const requestPayoutSchema = z.object({
    body: z.object({
        amount: z.number().positive(),
        provider: z.enum(["TELEBIRR", "STRIPE", "CHAPA"])
    })
});

export const createDiscountSchema = z.object({
    body: z.object({
        code: z.string().min(3).toUpperCase(),
        type: z.enum(["PERCENTAGE", "FIXED"]),
        value: z.number().positive(),
        maxDiscount: z.number().positive().optional(),
        minOrderAmount: z.number().positive().optional(),
        usageLimit: z.number().int().positive().optional(),
        expiresAt: z.string().datetime().optional()
    })
});

export const requestProductFeatureSchema = z.object({
    params: z.object({
        productId: z.string().uuid("Invalid product id")
    }),
    body: z.object({
        durationDays: z.coerce.number().int().refine((n) => [7, 14, 30].includes(n), {
            message: "durationDays must be 7, 14, or 30"
        })
    })
});

export const toggleDiscountSchema = z.object({
    params: z.object({
        id: z.string().uuid()
    }),
    body: z.object({
        active: z.boolean()
    })
});
