import axios from "axios";

export const createBooking = async (token, data) => {
  return await axios.post("https://rentkub2025-api.vercel.app/api/booking", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const listBookings = async (token, data) => {
  return await axios.get("https://rentkub2025-api.vercel.app/api/bookings", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: data, // <-- Add this line to send the filter data as query parameters
  });
};

// New function to get bookings by camping ID
export const listBookingsByCampingId = async (token, campingId) => {
  if (!campingId) throw new Error("Camping ID is required."); // Basic validation
  return await axios.get(
    `https://rentkub2025-api.vercel.app/api/booking/by-camping/${campingId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
export const checkOut = async (token, id) => {
  return await axios.post(
    "https://rentkub2025-api.vercel.app/api/checkout",
    { id },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

export const checkOutStatus = async (token, session) => {
  return await axios.get(
    `https://rentkub2025-api.vercel.app/api/checkout-status/${session}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// New function to retry payment for an existing booking
export const retryPayment = async (token, bookingId) => {
  return await axios.post(
    "https://rentkub2025-api.vercel.app/api/retry-payment", // New backend endpoint
    { id: bookingId }, // Send bookingId, using 'id' key for consistency with checkout
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// New function to update booking status by host
export const updateBookingStatus = async (token, bookingId, statusUpdate) => {
  // statusUpdate should be an object like { confirmStatus: true } or { checkInStatus: true }
  return await axios.patch(
    `https://rentkub2025-api.vercel.app/api/booking/${bookingId}/status`,
    statusUpdate,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};

// New function for user to delete their booking
export const deleteBooking = async (token, bookingId) => {
  return await axios.delete(`https://rentkub2025-api.vercel.app/api/booking/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// New function for user to cancel their booking
export const cancelBooking = async (token, bookingId) => {
  return await axios.patch(
    `https://rentkub2025-api.vercel.app/api/booking/${bookingId}/cancel`,
    {},
    {
      // Empty body for PATCH
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};
