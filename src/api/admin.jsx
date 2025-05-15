// /Users/duke/Documents/GitHub/RentKub/client/src/api/admin.jsx
import axios from "axios";

const API_BASE_URL = "https://rentkub2025-api.vercel.app/api"; // Define base URL

export const listStats = async (token) => {
  return await axios.get(`${API_BASE_URL}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const listUsers = async (token) => {
  return await axios.get(`${API_BASE_URL}/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const listCampings = async (token) => {
  return await axios.get(`${API_BASE_URL}/admin/campings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const deleteCamping = async (token, campingId) => {
  if (!campingId) {
    throw new Error("Camping ID is required for deletion.");
  }
  return await axios.delete(`${API_BASE_URL}/admin/campings/${campingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// --- Add this new listBookings function ---
export const listBookings = async (token) => {
  return await axios.get(`${API_BASE_URL}/admin/bookings`, {
    // The new endpoint
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// --- End of new listBookings function ---

// Add other admin API functions here as needed (e.g., deleteUser)
