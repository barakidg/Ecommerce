import API from "../../../api/axios.js"

export const loginUser = async (credentials) => {
    const { data } = await API.post("v1/auth/login", credentials)

    if (data.token) {
        localStorage.setItem("token", data.token)
    }

    return data
}

export const registerUser = async (userData) => {
    const { data } = await API.post("v1/auth/register", userData)

    if (data.token) {
        localStorage.setItem("token", data.token)
    }

    return data
}

export const logoutUser = () => {
    localStorage.removeItem("token")
}

export const getProfile = async () => {
    const { data } = await API.get("/v1/user/profile")
    return data.user
}

export const updateProfile = async (formData) => {
    const { data } = await API.patch("v1/user/profile", formData)
    return data.user
}

export const googleLogin = async (idToken) => {
    const { data } = await API.post("v1/auth/google", { token: idToken });
    if (data.token) {
        localStorage.setItem("token", data.token);
    }
    return data;
};