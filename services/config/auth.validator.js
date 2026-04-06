import { z } from "zod"

const emailSchema = z.string({
    required_error: "email is required.",
    invalid_type_error: "email must be a string."
})
    .trim()
    .toLowerCase()
    .min(1, { message: "email should be at least 1 character long." })
    .max(255, { message: "email must be at most 255 characters long." })
    .email({ message: "invalid email address." });

export const registerSchema = z.object({
    body: z.object({
        name: z.string()
            .trim()
            .min(1, { message: "name should be at least 1 character long." })
            .max(255, { message: "name must be at most 255 characters long." })
            .optional(),
        email: emailSchema,
        password: z.string({
            required_error: "password is required.",
            invalid_type_error: "password must be a string."
        })
            .trim()
            .min(4, { message: "password should be at least 4 characters long." })
            .max(255, { message: "password must be at most 255 characters long." }),
        confirm_password: z.string({
            required_error: "confirm_password is required.",
            invalid_type_error: "confirm_password must be a string."
        })
            .trim()
            .min(1, { message: "confirm_password should be at least 1 character long." })
    })
        .refine((data) => data.password === data.confirm_password, {
            message: "Passwords do not match.",
            path: ["confirm_password"]
        })
});

export const loginSchema = z.object({
    body: z.object({
        email: emailSchema,
        password: z.string({
            required_error: "password is required.",
            invalid_type_error: "password must be a string."
        })
            .trim()
            .min(1, { message: "password should be at least 1 character long." })
            .max(255, { message: "password must be at most 255 characters long." })
    })
});

export const changePasswordSchema = z.object({
    body: z.object({
        old_password: z.string({ required_error: "old_password is required" }).trim().min(1),
        new_password: z.string({ required_error: "new_password is required" })
            .trim()
            .min(4, { message: "password should be at least 4 characters long." })
            .max(255),
        confirm_new_password: z.string({ required_error: "confirm_new_password is required" }).trim().min(1)
    }).refine((data) => data.new_password === data.confirm_new_password, {
        message: "New passwords do not match.",
        path: ["confirm_new_password"]
    })
});