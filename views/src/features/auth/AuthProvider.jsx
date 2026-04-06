import { createContext, useContext } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { loginUser, logoutUser, getProfile, registerUser, googleLogin } from "./api/authApi.js"
import { toast } from "react-hot-toast"

const AuthContext = createContext(null)

const extractError = (error) => {
    const data = error?.response?.data
    if (data?.errors?.length) {
        return data.errors.map((e) => e.message).filter(Boolean).join(" ")
    }
    return data?.message || null
}

export function AuthProvider({ children }) {
    const queryClient = useQueryClient()

    const { data: user, isLoading } = useQuery({
        queryKey: ["authUser"],
        queryFn: getProfile,
        retry: false,
        enabled: !!localStorage.getItem("token"),
        staleTime: Infinity
    })

    const handleAuthSuccess = (data) => {
        queryClient.setQueryData(["authUser"], data.user)
        queryClient.invalidateQueries({ queryKey: ["wishlist"] })
    }

    const loginMutation = useMutation({
        mutationFn: loginUser,
        onSuccess: (data) => {
            handleAuthSuccess(data)
            toast.success(`Welcome back, ${data.user.name}!`)
        }
    })

    const registerMutation = useMutation({
        mutationFn: registerUser,
        onSuccess: (data) => {
            handleAuthSuccess(data)
            toast.success(`Welcome, ${data.user.name}!`)
        }
    })

    const googleMutation = useMutation({
        mutationFn: googleLogin,
        onSuccess: (data) => {
            handleAuthSuccess(data)
            toast.success(`Welcome, ${data.user.name}!`)
        },
        onError: (error) => {
            toast.error(extractError(error) || "Google sign-in failed. Please try again.")
        }
    })

    const logoutMutation = useMutation({
        mutationFn: logoutUser,
        onSuccess: () => {
            queryClient.clear()
            window.location.href = "/"
        }
    })

    const value = {
        user,
        isLoading,
        isAuthenticated: !!user,
        isSeller: user?.role === "SELLER",
        isAdmin: user?.role === "ADMIN",
        isDelivery: user?.role === "DELIVERY",
        login: loginMutation.mutate,
        register: registerMutation.mutate,
        logout: logoutMutation.mutate,
        googleLogin: googleMutation.mutate,
        isProcessing:
            loginMutation.isPending ||
            registerMutation.isPending ||
            googleMutation.isPending,
        loginError: loginMutation.isError
            ? extractError(loginMutation.error) || "Login failed. Please try again."
            : null,
        registerError: registerMutation.isError
            ? extractError(registerMutation.error) ||
              "Registration failed. Please try again."
            : null,
        googleError: googleMutation.isError
            ? extractError(googleMutation.error) ||
              "Google sign-in failed. Please try again."
            : null
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return ctx
}
