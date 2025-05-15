import {
  filterCamping,
  listCamping,
  listFavorites,
  readCamping,
} from "@/api/camping";
import { addOrRemoveFavorite } from "@/api/camping";
import { create } from "zustand";

const campingStore = (set, get) => ({
  campings: [],
  favorites: [],
  center: null,
  currentCampingDetail: null, // <-- Add state for the detail page
  userLocation: null, // <-- Add state for user's location
  isLoadingDetail: false, // <-- Optional: Add loading state for detail

  actionListCamping: async (profileId, token) => { // Added token parameter, renamed id for clarity
    // ... (keep existing logic)
    try {
      const res = await listCamping(profileId, token); // Pass profileId and token to the API call
      console.log("Host landmarks fetched for profileId", profileId, ":", res.data.result);
      set({ campings: res.data.result, center: res.data.center });
    } catch (error) {
      console.log(error);
    }
  },
  actionReadCamping: async (id, token) => { // Add token parameter
    set({ isLoadingDetail: true, currentCampingDetail: null }); // Set loading state
    try {
      const res = await readCamping(id, token); // Pass token to API call
      console.log("Read Camping Result:", res.data.result);
      console.log("[STORE] actionReadCamping - Raw data from API for camping ID", id, ":", res.data.result); // Log raw data

      // Ensure the result is an object, not an array if readCamping returns a single item
      let detailData = Array.isArray(res.data.result)
        ? res.data.result[0]
        : res.data.result;

      // --- MODIFICATION START: Parse amenities ---
      if (detailData && typeof detailData.amenities === "string") {
        try {
          const parsedAmenities = JSON.parse(detailData.amenities);
          // Ensure the parsed result is actually an array of strings (or at least an array)
          if (Array.isArray(parsedAmenities)) {
            // Create a new object with the parsed amenities to avoid mutating the original response object directly
            detailData = { ...detailData, amenities: parsedAmenities };
          } else {
            console.warn(
              `Parsed amenities for camping ID ${id} was not an array:`,
              parsedAmenities
            );
            // Default to empty array if parsing results in non-array
            detailData = { ...detailData, amenities: [] };
          }
        } catch (parseError) {
          console.error(
            `Failed to parse amenities JSON string for camping ID ${id}:`,
            detailData.amenities,
            parseError
          );
          // Default to empty array on parsing error
          detailData = { ...detailData, amenities: [] };
        }
      } else if (detailData && !Array.isArray(detailData.amenities)) {
        // If amenities exist but are not a string or array, default to empty array
        console.warn(
          `Amenities field for camping ID ${id} is not a string or array:`,
          detailData.amenities
        );
        detailData = { ...detailData, amenities: [] };
      } else if (detailData && !detailData.amenities) {
        // If detailData exists but amenities is missing/null/undefined, ensure it's an empty array
        detailData = { ...detailData, amenities: [] };
      }
      // --- MODIFICATION END ---
      console.log("[STORE] actionReadCamping - Processed detailData (check isFavorite here):", detailData);

      set({ currentCampingDetail: detailData, isLoadingDetail: false }); // Update currentCampingDetail with potentially modified data
    } catch (error) {
      console.log("Error fetching camping details:", error);
      set({ isLoadingDetail: false }); // Reset loading on error
    }
  },
  actionAddorRemoveFavorite: async (token, data) => {
    try {
      const res = await addOrRemoveFavorite(token, data);
      const { campingId, isFavorite } = data;

      // Update the main campings list (if needed for other views)
      const campingsList = get().campings;
      const updatedCampingsList = campingsList.map((item) => {
        return item.id === campingId
          ? { ...item, isFavorite: !isFavorite }
          : item;
      });
      set({ campings: updatedCampingsList });

      // Update the favorites list (if needed for other views)
      const favoritesList = get().favorites;
      let updatedFavoritesList;
      if (!isFavorite) {
        // If adding, find the full camping item (assuming it might be in campingsList or currentCampingDetail)
        const itemToAdd =
          get().currentCampingDetail?.id === campingId
            ? get().currentCampingDetail
            : campingsList.find((c) => c.id === campingId);
        // Note: This assumes the favorite list structure includes the landmark object
        if (itemToAdd) {
          updatedFavoritesList = [
            ...favoritesList,
            { landmark: { ...itemToAdd, isFavorite: true } },
          ];
        } else {
          updatedFavoritesList = favoritesList; // Or fetch if necessary
          console.warn("Could not find item to add to favorites list");
        }
      } else {
        // If removing
        updatedFavoritesList = favoritesList.filter((item) => {
          return item.landmark.id !== campingId;
        });
      }
      set({ favorites: updatedFavoritesList });

      // *** Crucially, update the currentCampingDetail state if it matches ***
      const currentDetail = get().currentCampingDetail;
      if (currentDetail && currentDetail.id === campingId) {
        set({
          currentCampingDetail: { ...currentDetail, isFavorite: !isFavorite },
        });
      }

      return { success: true, message: res.data.message };
    } catch (error) {
      const err = error?.response?.data?.message || "An error occurred";
      return { success: false, message: err };
    }
  },
  actionListFavorites: async (token) => {
    // ... (keep existing logic)
    try {
      const res = await listFavorites(token);
      set({ favorites: res.data.result });
    } catch (error) {
      console.log(error);
    }
  },
  // /Users/duke/Documents/GitHub/RentKub/client/src/store/camping-store.jsx (Modified actionFilter)
  actionFilter: async (filters, token) => { // Added token parameter
    // Destructure ALL relevant filters received from CampingContainer
    const {
      category = "",
      search = "",
      priceMin = null,
      priceMax = null,
      amenities = "", // <-- Make sure this is included
      checkIn = null, // Add checkIn
      checkOut = null, // Add checkOut
    } = filters;

    console.log("Filtering with:", filters); // Log the filters being used

    try {
      // Pass the entire filters object (or individual params) to the API function
      // Passing an object is generally cleaner if the API function accepts it
      const res = await filterCamping({
        // Pass as an object
        category,
        search,
        priceMin,
        priceMax,
        amenities,
        checkIn, // Pass to API
        checkOut, // Pass to API
      });
      console.log("action filter result:", res.data);
      // Ensure the backend returns 'result' and 'center' keys
      set({
        campings: res.data.result || [], // Default to empty array if result is missing
        center: res.data.center || null, // Default to null if center is missing
      });
    } catch (error) {
      console.error("action filter error:", error); // Use console.error for errors
      // Handle error state, e.g., clear campings
      set({ campings: [], center: null });
    }
  },

  // Optional: Add action to clear detail when navigating away
  clearCurrentCampingDetail: () => {
    set({ currentCampingDetail: null, isLoadingDetail: false });
  },

  // Action to set the user's location
  setUserLocation: (location) => {
    set({ userLocation: location });
  },
});

const useCampingStore = create(campingStore);

export default useCampingStore;
