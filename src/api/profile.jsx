// /Users/duke/Documents/GitHub/RentKub/client/src/api/profile.jsx
import axios from "axios";

const API_URL = "https://rentkub2025-api.vercel.app/api/profile"; // Base URL

export const createProfile = async (token, data) => {
    console.log(token, data, 'create profile client');
    // Changed endpoint to match router if needed, or keep as is if base is /api
    return await axios.post(`${API_URL}`, data, { // Assuming POST /api/profile
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};

// Fetches the profile data for the currently authenticated user
export const getProfile = async (token) => {
    console.log("Fetching profile for user with token");
    return await axios.get(`${API_URL}/me`, { // GET /api/profile/me
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
};

// --- New Function to Update Profile ---
export const updateProfile = async (token, data) => {
    console.log("Updating profile for user with token", data);
    // Send PUT request to the update endpoint
    return await axios.put(`${API_URL}/me`, data, { // PUT /api/profile/me
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
};
// --- End New Function ---
