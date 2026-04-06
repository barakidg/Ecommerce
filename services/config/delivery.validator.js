import { z } from "zod"

const uuidParam = (name) =>
    z.object({
        params: z.object({
            [name]: z.string().uuid()
        })
    })

export const confirmHandoffSchema = z.object({
    params: z.object({
        orderId: z.string().uuid()
    }),
    body: z.object({
        code: z.string().trim().min(4).max(8)
    })
})

export const setAvailabilitySchema = z.object({
    body: z.object({
        isAvailable: z.boolean()
    })
})

export const updateDeliveryPayoutProfileSchema = z.object({
    body: z.object({
        payoutMethod: z.string().trim().optional(),
        payoutAccountNumber: z.string().trim().optional(),
        payoutAccountHolder: z.string().trim().optional(),
        payoutBankName: z.string().trim().optional(),
        baseDeliveryFeeAmount: z.number().nonnegative().optional()
    })
})

export const acceptOrderSchema = uuidParam("orderId")

export const requestDeliveryPayoutSchema = z.object({
    body: z.object({
        amount: z.number().positive(),
        provider: z.enum(["CHAPA", "TELEBIRR", "STRIPE"])
    })
})
