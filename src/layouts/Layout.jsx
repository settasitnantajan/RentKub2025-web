// /Users/duke/Documents/GitHub/RentKub/client/src/layouts/Layout.jsx
import { useEffect, useState } from "react"; // Import useEffect and useState
import SetupProfileModal from "@/components/auth/SetupProfileModal";
import Navbar from "@/components/navbar/Navbar";
import { useUser, useAuth } from "@clerk/clerk-react"; // Import useAuth
import { Outlet } from "react-router";
import useCampingStore from "@/store/camping-store"; // Import Zustand store
import { getProfile } from "@/api/profile"; // Import getProfile API

const Layout = () => {
  const { user, isLoaded, isSignedIn } = useUser(); // Ensure isLoaded is checked, add isSignedIn
  const { getToken } = useAuth(); // Get getToken for API calls
  const setUserLocation = useCampingStore((state) => state.setUserLocation); // Get action from store
  const [backendProfile, setBackendProfile] = useState(null);
  const [isProfileLoading, setIsProfileLoading] = useState(true); // Initialize to true

  // --- Fetch User Location on Layout Mount ---
  useEffect(() => {
    // Check if Geolocation is supported
    if (!navigator.geolocation) {
      console.log("Geolocation is not supported by your browser.");
      setUserLocation(null); // Ensure location is null if not supported
      return;
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      console.log("Location fetched in Layout:", { lat: latitude, lng: longitude });
      setUserLocation({ lat: latitude, lng: longitude });
    };

    const handleError = (error) => {
      console.error("Error getting user location:", error.message);
      setUserLocation(null); // Clear location on error
    };

    // Request location
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, { enableHighAccuracy: true });

  }, [setUserLocation]); // Run only once on mount

  // --- Fetch Backend Profile on User Load ---
  useEffect(() => {
    const fetchBackendProfile = async () => {
      // Only proceed if Clerk is loaded and user is signed in
      if (isLoaded && isSignedIn && user) { 
        setIsProfileLoading(true);
        try {
          const token = await getToken();
          if (token) {
            const response = await getProfile(token);
            console.log("Raw response from getProfile:", response); // Log raw response
            setBackendProfile(response.data); // Assuming API returns { profile: { ... } }
            console.log("Backend profile fetched in Layout:", response.data);
          } else {
            setBackendProfile(null); // No token, no profile
          }
        } catch (error) {
          console.error("Error fetching backend profile:", error.response?.data || error.message);
          // If profile doesn't exist (e.g., 404), backendProfile will remain null.
          // This is expected for new users who haven't completed the modal yet.
          if (error.response?.status !== 404) {
            // Handle other errors if necessary, e.g. show a toast
          }
          setBackendProfile(null); // Ensure it's null on error or not found
        } finally {
          setIsProfileLoading(false);
        }
      } else if (isLoaded && !isSignedIn) {
        // If user is loaded but not signed in, no profile to fetch
        setIsProfileLoading(false);
        setBackendProfile(null);
      }
    };

    fetchBackendProfile();
  }, [isLoaded, isSignedIn, user, getToken]); // Simplified dependencies

  // Determine if the modal should be shown
  // Show modal if:
  // 1. Clerk is loaded
  // 2. User is signed in
  // 3. Backend profile loading is complete
  // 4. AND backendProfile is null (error/not found) OR firstname is missing OR lastname is missing
  const shouldShowModal =
    isLoaded &&
    isSignedIn &&
    !isProfileLoading &&
    (!backendProfile || !backendProfile.firstname || !backendProfile.lastname);

  return (
    <main className="container">
      <Navbar/>
      {shouldShowModal && <SetupProfileModal />}
      <Outlet />
    </main>
  );
};
export default Layout;
