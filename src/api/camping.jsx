import axios from "axios";
import { listBookings } from "@/api/booking"; // Assuming listBookings is here

export const createCamping = async (token, data) => {
  return await axios.post("https://rentkub2025-api.vercel.app/api/camping", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const listCamping = async (profileId, token) => { // Add token
  const headers = {};
  if (token) { // Add Authorization header if token is provided
    headers.Authorization = `Bearer ${token}`;
  }
  return await axios.get(`https://rentkub2025-api.vercel.app/api/campings/${profileId}`, { headers });
}

export const readCamping = async (id, token) => { // Add token parameter
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return await axios.get(`https://rentkub2025-api.vercel.app/api/camping/${id}`, { headers });
};

// --- Add Update Camping Function ---
export const updateCamping = async (token, id, data) => {
  return await axios.put(`https://rentkub2025-api.vercel.app/api/camping/${id}`, data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// --- End Update Camping Function ---

// --- Add Delete Camping Function ---
export const deleteCamping = async (token, id) => {
  return await axios.delete(`https://rentkub2025-api.vercel.app/api/camping/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};
// --- End Delete Camping Function ---

export const addOrRemoveFavorite = async (token, data) => {
  return await axios.post("https://rentkub2025-api.vercel.app/api/favorite", data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const listFavorites = (token) => {
  return axios.get("https://rentkub2025-api.vercel.app/api/favorites", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

// Filter
export const filterCamping = async (filters, token) => { // Made async, added token
  let { // Use let to allow modification of parameters if needed
    category = "",
    search = "",
    priceMin = null,
    priceMax = null,
    amenities = "", // Expecting comma-separated string
    checkIn = null, // Add checkIn
    checkOut = null, // Add checkOut
  } = filters;

  // --- Step 1: Find all bookings (if token is provided) ---
  let allBookings = [];
  if (token) {
    try {
      console.log("[filterCamping] Attempting to fetch all bookings...");
      const bookingRes = await listBookings(token);
      console.log(bookingRes.data.result, 'bookingRes.data.result')
      allBookings = bookingRes.data.result || [];
      console.log(`[filterCamping] Fetched ${allBookings.length} bookings.`);
    } catch (error) {
      console.error("[filterCamping] Error fetching bookings:", error.response?.data || error.message);
      // Decide how to handle: proceed without booking data, or rethrow.
      // For now, we'll proceed, and the booking-specific search will be skipped.
    }
  } else {
    console.warn("[filterCamping] No token provided, skipping booking fetch and search.");
  }

  // --- Step 2: "Search" within bookings using the 'search' term from filters ---
  // This section is where you'd implement your specific logic for processing bookings.
  if (allBookings.length > 0 && search) {
    console.log(`[filterCamping] Processing ${allBookings.length} bookings with search term: "${search}"`);
    // --- Placeholder for your booking search/processing logic ---
    // Example: You might filter bookings based on the 'search' term,
    // then extract landmark IDs or other relevant info.
    // const relevantBookings = allBookings.filter(booking =>
    //   booking.someProperty?.toLowerCase().includes(search.toLowerCase())
    // );
    //
    // Based on `relevantBookings`, you could:
    // 1. Modify the `search` term itself:
    //    search = modifiedSearchTermBasedOnBookings;
    // 2. Add new parameters to the `params` object below, e.g.,
    //    params.append("excludeLandmarkIds", "id1,id2"); // Requires backend support
    //
    console.log("[filterCamping] Placeholder: Implement booking search logic and how it affects camping filters here.");
    // For demonstration, let's assume the search term might be refined or new params added.
  }
  // --- End of booking search/processing logic ---

  // Use URLSearchParams for robust query string building
  const params = new URLSearchParams();
  // Append parameters only if they have a meaningful value
  if (category) params.append("category", category);
  if (search) params.append("search", search);
  // Check for null AND empty string for price, as input might be cleared
  if (priceMin !== null && priceMin !== "") params.append("priceMin", priceMin);
  if (priceMax !== null && priceMax !== "") params.append("priceMax", priceMax);
  if (amenities) params.append("amenities", amenities); // Add amenities if present
  if (checkIn) params.append("checkIn", checkIn); // Add checkIn if present
  if (checkOut) params.append("checkOut", checkOut); // Add checkOut if present

  // If your booking search logic prepared new parameters, append them here.
  // e.g., if (newBookingFilterParam) params.append(newBookingFilterParam.key, newBookingFilterParam.value);
  // Handle boolean - backend might expect 'true'/'false' string

  const queryString = params.toString();
  // Construct the final URL, adding '?' only if there are parameters
  const url = `https://rentkub2025-api.vercel.app/api/filter-camping${
    queryString ? `?${queryString}` : ""
  }`;

  console.log("API Filter Request URL:", url); // Log the URL for debugging

  return axios.get(url);
};

// --- New Function to Fetch Paginated Reviews ---
export const fetchPaginatedReviews = async (landmarkId, page, limit) => {
  const params = new URLSearchParams({ page, limit });
  return await axios.get(`https://rentkub2025-api.vercel.app/api/camping/${landmarkId}/reviews?${params.toString()}`);
};
// --- End New Function ---
