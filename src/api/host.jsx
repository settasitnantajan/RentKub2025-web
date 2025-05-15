import axios from "axios";

// Fetch landmarks created by the logged-in host
export const getHostLandmarks = async (token) => {
  return await axios.get("https://rentkub2025-api.vercel.app/api/host/landmarks", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Fetch bookings for the landmarks owned by the logged-in host
export const getHostBookings = async (token) => {
  return await axios.get("https://rentkub2025-api.vercel.app/api/host/bookings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};