// /Users/duke/Documents/GitHub/RentKub/client/src/pages/user/CampingDetail.jsx
import { useEffect, useState, useMemo, Suspense, lazy, useCallback } from "react"; // Added Suspense, lazy, and useCallback
import { useParams } from "react-router"; // Corrected import for useParams
import { useUser, useAuth } from "@clerk/clerk-react"; // Import useAuth
import useCampingStore from "@/store/camping-store";

// --- UI Components ---
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Import Dropdown components
import Breadcrums from "@/components/campings/Breadcrums"; // Assuming this is now memoized
import ImageContainer from "@/components/campings/ImageContainer"; // Consider memoizing if props are stable
import Description from "@/components/campings/Description"; // Assuming this is now memoized
import Mainmap from "@/components/map/Mainmap";
import FavoriteToggleButton from "@/components/card/FavoriteToggleButton";
import BookingContainer from "@/components/booking/BookingContainer"; // Keep BookingContainer as eager load for now
import {
  // Dialog components are already imported
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter, // Optional: if you need a footer
} from "@/components/ui/dialog";

// --- Lazy Loaded Components ---
const PhotoGalleryModal = lazy(() => import("@/components/campings/PhotoGalleryModal"));
const ReviewList = lazy(() => import("@/components/review/ReviewList"));
const RatingBreakdownCard = lazy(() => import("@/components/review/RatingBreakdownCard"));
const HostProfileModal = lazy(() => import("./HostProfileModal"));

// --- Fallback for Suspense ---
const SuspenseFallback = <div className="flex justify-center items-center h-32"><Loader2 className="h-8 w-8 animate-spin text-gray-500" /></div>;

// --- Icons ---
import {
  Wifi,
  UtensilsCrossed,
  Car,
  Waves,
  ThermometerSnowflake,
  Dog,
  Beef,
  Flame,
  ShowerHead,
  Toilet,
  Zap,
  Droplets,
  Info,
  Loader2,
  Share2, // Keep for generic share / dropdown trigger
  MapPin,
  Star,
  CircleUser,
  ChevronUp,
  ChevronDown,
  Copy, // Icon for copy link
  Facebook, // Placeholder - Lucide doesn't have brand icons by default
  Instagram, // Placeholder
  // You might need to install a library like `react-icons` for brand icons
} from "lucide-react";

// --- Constants ---
const MAX_SECONDARY_IMAGES = 4;
const DEFAULT_RATING = 0.0;
const DEFAULT_REVIEW_COUNT = 0;
const DEFAULT_LOCATION_NAME = "Location details unavailable";
const AMENITIES_PREVIEW_COUNT = 6;

// --- Helper Function for Amenity Icons ---
const amenityIconMap = {
  wifi: <Wifi size={20} className="mr-2 text-gray-700" />,
  kitchen: <UtensilsCrossed size={20} className="mr-2 text-gray-700" />,
  parking: <Car size={20} className="mr-2 text-gray-700" />,
  pool: <Waves size={20} className="mr-2 text-gray-700" />,
  hot_tub: <ThermometerSnowflake size={20} className="mr-2 text-gray-700" />,
  pets_allowed: <Dog size={20} className="mr-2 text-gray-700" />,
  bbq_grill: <Beef size={20} className="mr-2 text-gray-700" />,
  fire_pit: <Flame size={20} className="mr-2 text-gray-700" />,
  showers: <ShowerHead size={20} className="mr-2 text-gray-700" />,
  toilets: <Toilet size={20} className="mr-2 text-gray-700" />,
  electricity: <Zap size={20} className="mr-2 text-gray-700" />,
  water: <Droplets size={20} className="mr-2 text-gray-700" />,
};
const defaultAmenityIcon = <Info size={20} className="mr-2 text-gray-500" />;

const getAmenityIcon = (amenityName) => {
  // ... (keep existing logic)
  if (typeof amenityName !== "string") {
    return defaultAmenityIcon;
  }
  const lowerCaseName = amenityName.toLowerCase();
  const matchingKey = Object.keys(amenityIconMap).find((key) =>
    lowerCaseName.includes(key)
  );
  return matchingKey ? amenityIconMap[matchingKey] : defaultAmenityIcon;
};

// --- Helper Function for Formatting Amenity Labels ---
const formatAmenityLabel = (amenityId) => {
  if (typeof amenityId !== "string" || !amenityId) {
    return amenityId || ""; // Return original or empty string if invalid
  }
  // Handle specific cases if needed (e.g., Wi-Fi)
  if (amenityId.toLowerCase() === "wifi") {
    return "Wi-Fi";
  }
  // General case: replace underscores, capitalize words
  return amenityId
    .replace(/_/g, " ") // Replace all underscores with spaces
    .split(" ") // Split into words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize first letter, lowercase rest
    .join(" "); // Join back with spaces
};
// --- ---

function CampingDetail() {
  const { id } = useParams();
  const { user: loggedInUser } = useUser();
  const { getToken, isSignedIn } = useAuth(); // Get getToken and isSignedIn from Clerk

  // --- State ---
  const [galleryStartIndex, setGalleryStartIndex] = useState(null);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [derivedLocationName, setDerivedLocationName] = useState(null); // State for fetched location name
  const [minLoadTimePassed, setMinLoadTimePassed] = useState(false); // State for 1-second minimum load time
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isHostModalOpen, setIsHostModalOpen] = useState(false); // State for host profile modal

  // State for reviews pagination (example)
  // const [reviewsPage, setReviewsPage] = useState(1);
  // --- Zustand Store ---
  const camping = useCampingStore((state) => state.currentCampingDetail);
  const storeIsLoading = useCampingStore((state) => state.isLoadingDetail); // Renamed for clarity
  const actionReadCamping = useCampingStore((state) => state.actionReadCamping);
  const clearCurrentCampingDetail = useCampingStore(
    (state) => state.clearCurrentCampingDetail
  );

  // --- Data Fetching ---
  useEffect(() => {
    let timerId = null; // To store the timeout ID, initialize to null
    let isMounted = true; // Flag to track if component is mounted

    const fetchDetails = async () => {
      if (id) {
        // Reset minLoadTimePassed for the new fetch
        setMinLoadTimePassed(false);

        let token = null;
        if (isSignedIn) { // Check if user is signed in
          token = await getToken(); // Get the authentication token
        }
        actionReadCamping(id, token); // Pass the token to the action
      }
    };

    // Start fetching
    fetchDetails();

    // Start timer for minimum load time *after* initiating fetch
    // This ensures the skeleton shows for at least this duration even if fetch is very fast
    timerId = setTimeout(() => {
      if (isMounted) {
        setMinLoadTimePassed(true);
      }
    }, 500);

    return () => {
      isMounted = false; // Set to false when component unmounts
      if (timerId) {
        clearTimeout(timerId); // Clear the timer on unmount or before re-run
      }
      clearCurrentCampingDetail();
      setDerivedLocationName(null); // Reset derived location name on unmount
      setShowAllAmenities(false);
    };
    // Dependencies: Only 'id' and 'isSignedIn' are strictly necessary for re-fetching.
    // actionReadCamping and clearCurrentCampingDetail from Zustand are stable.
    // getToken is called inside the effect, so it doesn't need to be a dependency.
  }, [id, isSignedIn, actionReadCamping, clearCurrentCampingDetail]);

  // --- Effect for Reverse Geocoding ---
  useEffect(() => {
    // Extract specific dependencies to avoid re-running the effect unnecessarily
    const lat = camping?.lat;
    const lng = camping?.lng;
    const existingLocationName = camping?.locationName;

    const controller = new AbortController(); // Create AbortController
    const signal = controller.signal; // Get the signal

    const fetchLocationName = async (fetchLat, fetchLng) => {
      if (fetchLat == null || fetchLng == null) return;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${fetchLat}&lon=${fetchLng}&zoom=10&addressdetails=1`, { signal }); // Pass the signal
        if (!response.ok) {
          throw new Error(`Nominatim API request failed: ${response.status}`);
        }
        const data = await response.json();
        const address = data.address;
        const name = address?.city || address?.town || address?.village || address?.county || address?.state || address?.country || `Area near (${fetchLat.toFixed(2)}, ${fetchLng.toFixed(2)})`;
        setDerivedLocationName(name);
      } catch (error) {
        // Ignore abort errors which happen on cleanup
        if (error.name !== 'AbortError') {
          console.error("Error fetching location name:", error);
          setDerivedLocationName(`Area near (${fetchLat.toFixed(2)}, ${fetchLng.toFixed(2)})`); // Fallback
        }
      }
    };

    // Determine if we need to fetch
    if (
      lat != null &&
      lng != null &&
      (!existingLocationName || existingLocationName === DEFAULT_LOCATION_NAME)
    ) {
      // If lat/lng are present and locationName is missing or default, fetch it.
      fetchLocationName(lat, lng);
    } else if (existingLocationName && existingLocationName !== DEFAULT_LOCATION_NAME) {
      // If a valid locationName already exists, use it.
      setDerivedLocationName(existingLocationName);
    } else {
      // Otherwise (e.g., no lat/lng, or locationName is already default and no lat/lng to fetch)
      // set derivedLocationName to null or the default, to avoid stale data.
      setDerivedLocationName(existingLocationName || null); // Or DEFAULT_LOCATION_NAME if preferred
    }

    return () => controller.abort(); // Cleanup: abort fetch on unmount or re-run
  }, [camping?.lat, camping?.lng, camping?.locationName]); // Rerun only when these specific fields change

  // --- Memoized Host Details ---
  const hostDetails = useMemo(() => {
    if (!camping?.profile) return {
      id: null,
      clerkId: null,
      username: null,
      firstname: "Host",
      lastname: "",
      imageUrl: null,
      otherLandmarks: [],
      joinedDate: "Date unavailable",
    };

    const hostData = camping.profile;
    const hostUsername = hostData.username ?? null;
    const hostFirstName = hostData.firstname ?? "Host";
    const hostLastName = hostData.lastname ?? "";
    const hostImageUrl = hostData.imageUrl ?? null;
    const hostOtherLandmarks = Array.isArray(hostData.otherLandmarks) ? hostData.otherLandmarks : [];

    let hostJoinedDate = "Date unavailable";
    if (hostData.createAt) {
      try {
        const date = new Date(hostData.createAt);
        if (!isNaN(date.getTime())) {
          hostJoinedDate = date.toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
          });
        }
      } catch (e) {
        console.warn("Could not parse host joined date:", hostData.createAt);
      }
    }
    return {
      id: hostData.id,
      clerkId: hostData.clerkId,
      username: hostUsername,
      firstname: hostFirstName,
      lastname: hostLastName,
      imageUrl: hostImageUrl,
      otherLandmarks: hostOtherLandmarks,
      joinedDate: hostJoinedDate,
    };
  }, [camping?.profile]); // Depends only on camping.profile

  // --- Memoized Average Ratings ---
  const averageRatings = useMemo(() => {
    // Now expect backend to provide averageRatingsByCategory or individual averages
    // and a main averageRating
    if (camping?.averageRatingsByCategory) {
      return {
        overall: camping.averageRating ?? DEFAULT_RATING,
        customerSupport: camping.reviews[0].customerSupportRating ?? DEFAULT_RATING,
        convenience: camping.reviews[0].convenienceRating ?? DEFAULT_RATING,
        signalQuality: camping.reviews[0].signalQualityRating ?? DEFAULT_RATING,
        ...camping.averageRatingsByCategory, // e.g., { customerSupport: 4.5, convenience: 4.2, ... }
      };
    }
    // Fallback if backend doesn't send detailed breakdown but sends overall
    return {
      overall: camping?.averageRating ?? (camping?.rating ?? DEFAULT_RATING),
      customerSupport: camping?.reviews[0]?.customerSupportRating ?? DEFAULT_RATING, // Default or derive if possible
      convenience: camping?.reviews[0]?.convenienceRating ?? DEFAULT_RATING,
      signalQuality: camping?.reviews[0]?.signalQualityRating ?? DEFAULT_RATING,
    };
  }, [camping?.averageRating, camping?.rating, camping?.averageRatingsByCategory]);

  // --- Main Memoized Data Preparation ---
  const preparedData = useMemo(() => {

    if (!camping) return null;

    const validImages = (
      Array.isArray(camping.images) ? camping.images : []
    ).filter((img) => typeof img === "string" && img.trim() !== "");
    const mainImage = validImages[0] ?? null;
    const secondaryImages = validImages.slice(1, MAX_SECONDARY_IMAGES + 1);

    const amenities = Array.isArray(camping.amenities) ? camping.amenities : [];

    const title = camping.title ?? "Camping Spot";
    const description = camping.description ?? "No description available.";
    const price = camping.price ?? 0;
    // const bookings = Array.isArray(camping.bookings) ? camping.bookings : []; // No longer need full bookings array here
    const totalRooms = camping.totalRooms ?? 1;
    const lat = camping.lat ?? null;
    const lng = camping.lng ?? null;
    const isFavorite = camping.isFavorite ?? false;
    const currentReviewsPage = Array.isArray(camping.reviews) ? camping.reviews : []; // This is now the first page of reviews

    // Use the pre-calculated averageRatings.overall for the main rating display
    const rating = camping.averageRating ?? averageRatings.overall; // Prefer direct averageRating from backend
    const reviewCount = camping.reviewCount ?? camping.totalReviews ?? DEFAULT_REVIEW_COUNT; // Prefer direct reviewCount or totalReviews
    const locationName = derivedLocationName || camping.locationName || DEFAULT_LOCATION_NAME;
    const address = camping.address ?? null;
    
    // Expect `unavailableDates` or `publiclyUnavailableDates` directly from backend
    const unavailableDatesForBooking = camping.publiclyUnavailableDates || camping.unavailableDates || [];


    const finalPreparedData = {
      id: camping.id,
      title,
      description,
      price,
      // bookings, // No longer passing full bookings array
      lat,
      totalRooms, // <-- Include totalRooms in preparedData
      lng,
      isFavorite,
      images: validImages,
      mainImage,
      secondaryImages,
      amenities,
      reviews: currentReviewsPage, // Pass the current page of reviews
      totalReviews: camping.totalReviews ?? currentReviewsPage.length, // Pass total reviews for "Load More" logic
      rating,
      reviewCount,
      locationName,
      address, // <-- Include address
      host: hostDetails, // Use memoized hostDetails
      averageRatings, // Use memoized averageRatings
      publiclyUnavailableDates: unavailableDatesForBooking, // Pass the correct unavailable dates
    };
    return finalPreparedData;
  }, [camping, derivedLocationName, loggedInUser, hostDetails, averageRatings]); // Add hostDetails and averageRatings as dependencies

  // --- Handlers ---

  // Helper function to copy text and show feedback
  const copyToClipboard = async (
    text,
    feedbackMessage = "Link copied to clipboard!"
  ) => {
    if (!navigator.clipboard) {
      alert("Clipboard access not available or denied.");
      return false;
    }
    try {
      await navigator.clipboard.writeText(text);
      alert(feedbackMessage); // Replace with a toast notification for better UX
      return true;
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Could not copy link.");
      return false;
    }
  };

  // Generic Share using Web Share API (if available)
  const handleNativeShare = async () => {
    if (!preparedData) return;
    const shareData = {
      title: preparedData.title,
      text: `Check out this camping spot: ${preparedData.title}`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // Don't alert if the user simply cancelled the share dialog ('AbortError')
        if (error.name !== "AbortError") {
          alert("Could not share.");
        }
      }
    } else {
      // Fallback if native share is not supported (though the dropdown offers copy)
      copyToClipboard(window.location.href);
    }
  };

  // Share to Facebook using Sharer URL
  const handleShareFacebook = () => {
    if (!preparedData) return;
    const url = window.location.href;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      url
    )}`;
    window.open(facebookShareUrl, "_blank", "noopener,noreferrer");
  };

  // "Share" to Instagram (Copy Link + Instruct)
  const handleShareInstagram = () => {
    if (!preparedData) return;
    copyToClipboard(
      window.location.href,
      "Link copied! Paste it in your Instagram post or story."
    );
    // Optionally, you could try window.open('instagram://', '_blank'); but it's unreliable
  };

  // "Share" to TikTok (Copy Link + Instruct)
  const handleShareTikTok = () => {
    if (!preparedData) return;
    copyToClipboard(
      window.location.href,
      "Link copied! Paste it in your TikTok video description."
    );
    // TikTok has no reliable web intent for sharing external links easily
  };

  const openPhotoGallery = (startIndex = 0) => {
    setGalleryStartIndex(startIndex);
  };

  const closePhotoGallery = () => {
    setGalleryStartIndex(null);
  };

  const toggleShowAllAmenities = () => {
    setShowAllAmenities((prev) => !prev);
  };

  const openDescriptionModal = useCallback(() => {
    setIsDescriptionModalOpen(true);
  }, []); // Empty dependency array as it doesn't depend on any props/state from this scope

  const closeDescriptionModal = () => {
    setIsDescriptionModalOpen(false);
  };

  const openHostModal = () => {
    setIsHostModalOpen(true);
  };
  const closeHostModal = () => {
    setIsHostModalOpen(false);
  };

  // --- Render Logic ---

  // Render breadcrumbs early, using a placeholder name if data isn't ready
  const breadcrumbItems = [{ label: preparedData?.title || "Loading Details..." }];

  // Show Skeleton if data is loading OR minimum load time hasn't passed
  if (storeIsLoading || !minLoadTimePassed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Breadcrumbs for loading state */}
        <div className="mb-2 text-sm">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div> {/* Breadcrumb placeholder */}
        </div>

        {/* Header Section Skeleton */}
        <header className="mb-4">
          <div className="h-10 bg-gray-300 rounded w-3/4 mb-2"></div> {/* Title placeholder */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <div className="h-4 bg-gray-300 rounded w-1/4"></div> {/* Rating/Reviews placeholder */}
            <div className="h-4 bg-gray-300 rounded w-1/3"></div> {/* Location placeholder */}
          </div>
        </header>

        {/* Image Gallery Skeleton */}
        <div className="relative grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 mb-8 rounded-lg overflow-hidden h-[40vh] md:h-[60vh] max-h-[550px] bg-gray-200">
          <div className="md:col-span-2 md:row-span-2 bg-gray-300"></div>
          <div className="hidden md:block bg-gray-300"></div>
          <div className="hidden md:block bg-gray-300"></div>
          <div className="hidden md:block bg-gray-300"></div>
          <div className="hidden md:block bg-gray-300"></div>
        </div>

        {/* Main Content Section Skeleton */}
        <section className="lg:grid lg:grid-cols-12 lg:gap-x-12">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-8 mb-8 lg:mb-0">
            {/* Host Info Skeleton */}
            <div className="pt-8 first:pt-0">
              <div className="flex items-center mb-4">
                <div className="mr-4 flex-shrink-0 w-12 h-12 rounded-full bg-gray-300"></div>
                <div>
                  <div className="h-6 bg-gray-300 rounded w-48 mb-1"></div>
                  <div className="h-4 bg-gray-300 rounded w-32"></div>
                </div>
              </div>
            </div>

            {/* Description Skeleton */}
            <div>
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </div>

            {/* Amenities Skeleton */}
            <div>
              <div className="h-6 bg-gray-300 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-4">
                <div className="h-5 bg-gray-300 rounded w-full"></div>
                <div className="h-5 bg-gray-300 rounded w-full"></div>
                <div className="h-5 bg-gray-300 rounded w-full"></div>
                <div className="h-5 bg-gray-300 rounded w-full"></div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton (Booking Box) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="p-4 sm:p-6 border border-gray-200 rounded-lg shadow-lg bg-gray-200 h-96"></div> {/* Booking box placeholder */}
          </div>
        </section>
      </div>
    );
  }

  if (!preparedData) {
    // ... (keep existing not found state)
    return (
      <div className="text-center mt-10 p-6 text-gray-600 max-w-4xl mx-auto border rounded-md bg-gray-50">
        <h1 className="text-2xl font-semibold mb-4">
          Oops! Camping Spot Not Found
        </h1>
        <p>We couldn't load the details for this camping spot.</p>
        <p>It might have been removed, or the link might be incorrect.</p>
      </div>
    );
  }

  const {
    id: campingId,
    title,
    description: campingDescription,
    price,    
    // bookings, // No longer destructuring full bookings
    lat,
    totalRooms, // <-- Destructure totalRooms from preparedData
    lng,
    isFavorite,
    images,
    mainImage,
    secondaryImages,
    amenities,
    rating,    
    reviews, // This is now the current page of reviews
    totalReviews, // Destructure totalReviews
    reviewCount,
    locationName,
    host,
    address, // <-- Destructure address
    // averageRatings, // This is already available from the useMemo above
    publiclyUnavailableDates, // Destructure for passing to BookingContainer
  } = preparedData;

  const amenitiesToShow = showAllAmenities
    ? amenities
    : amenities.slice(0, AMENITIES_PREVIEW_COUNT);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Breadcrumbs for loaded state */}
      <div className="mb-2 text-sm">
        <Breadcrums items={breadcrumbItems} />
      </div>

      {/* --- Header Section --- */}
      <header className="mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
          {title}
        </h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-700">
          {/* ... (rating, reviews, location links) */}
          <div className="flex items-center">
            <Star size={16} className="text-yellow-500 mr-1 fill-current" /> {/* This is the main overall rating display */}
            <span>{averageRatings.overall.toFixed(1)}</span>
            <span className="mx-1">·</span>
            <a href="#reviews" className="underline hover:text-gray-900"> {/* reviews.length is now current page's length */}
              {reviews.length} review{reviews.length !== 1 ? "s" : ""}
            </a>
          </div>
          <span className="hidden sm:inline">·</span>
          <div className="flex items-center">
            <MapPin size={16} className="mr-1" />
            <a href="#location-map" className="underline hover:text-gray-900">
              {locationName}
            </a>
          </div>

          {/* --- Action Buttons (Share Dropdown & Favorite) --- */}
          <div className="ml-auto flex items-center gap-2 sm:gap-4 pt-2 sm:pt-0">
            {/* Share Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md px-2 py-1 cursor-pointer"
                  aria-label="Share this camping spot"
                >
                  <Share2 size={18} />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {/* Native Share (if available) */}
                {typeof navigator !== "undefined" && navigator.share && (
                  <DropdownMenuItem
                    onClick={handleNativeShare}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Share2 size={16} /> Share via...
                  </DropdownMenuItem>
                )}
                {/* Copy Link */}
                <DropdownMenuItem
                  onClick={() => copyToClipboard(window.location.href)}
                  className="cursor-pointer flex items-center gap-2"
                >
                  <Copy size={16} /> Copy Link
                </DropdownMenuItem>
                {/* Facebook */}
                <DropdownMenuItem
                  onClick={handleShareFacebook}
                  className="cursor-pointer flex items-center gap-2"
                >
                  {/* Replace with actual FB icon if using react-icons */}
                  <Facebook size={16} /> Facebook
                </DropdownMenuItem>
                {/* Instagram */}
                <DropdownMenuItem
                  onClick={handleShareInstagram}
                  className="cursor-pointer flex items-center gap-2"
                >
                  {/* Replace with actual IG icon if using react-icons */}
                  <Instagram size={16} /> Instagram
                </DropdownMenuItem>
                {/* TikTok */}
                <DropdownMenuItem
                  onClick={handleShareTikTok}
                  className="cursor-pointer flex items-center gap-2"
                >
                  {/* Replace with actual TikTok icon if using react-icons */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-music"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>{" "}
                  {/* Placeholder TikTok-like icon */}
                  TikTok
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Favorite Button */}
            <FavoriteToggleButton
              campingId={campingId}
              isFavorite={isFavorite}
            />
          </div>
        </div>
      </header>

      {/* --- Image Gallery --- */}
      {images.length === 0 ? (
        <div className="mb-8 p-6 text-center bg-gray-100 rounded-lg text-gray-500">
          No images available for this listing.
        </div>
      ) : images.length < 5 ? ( // Covers 1, 2, 3, or 4 images
        // --- Single Image Display (for 1 to 4 images) ---
        <div className="relative mb-8 rounded-lg overflow-hidden h-[40vh] md:h-[60vh] max-h-[550px] bg-gray-100">
          <div
            className="h-full w-full cursor-pointer group"
            onClick={() => openPhotoGallery(0)}
            role="button"
            tabIndex={0}
            aria-label={`View image for ${title}`}
          >
            {/* mainImage is images[0] here, guaranteed as images.length >= 1 */}
            <ImageContainer image={mainImage} name={`${title} - View`} />
          </div>
          {/* Show button if there are 2, 3, or 4 images total (i.e., more than the one displayed) */}
          {images.length > 1 && (
            <Button
              onClick={() => openPhotoGallery(0)}
              variant="secondary"
              className="absolute bottom-4 right-4 bg-white text-black text-sm font-semibold px-3 py-1.5 rounded-md border border-gray-400 shadow-md hover:bg-gray-100 transition duration-150 z-10 cursor-pointer"
            >
              Show all {images.length} photos
            </Button>
          )}
        </div>
      ) : (
        // --- Multi-Image Grid Display (images.length >= 5) ---
        // This block now handles cases with 5 or more images.
        // MAX_SECONDARY_IMAGES is 4.
        // Grid shows 1 main image + up to 4 secondary images.
        // "Show all photos" button appears if images.length > 1 (main) + MAX_SECONDARY_IMAGES (4) = 5.
        <div className="relative grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-2 mb-8 rounded-lg overflow-hidden h-[40vh] md:h-[60vh] max-h-[550px] bg-gray-100">
          {/* Main image for the grid */}
          <div
            className="md:col-span-2 md:row-span-2 h-full w-full cursor-pointer group"
            onClick={() => openPhotoGallery(0)}
            role="button"
            tabIndex={0}
            aria-label={`View main image for ${title}`}
          >
            {mainImage ? (
              <ImageContainer image={mainImage} name={`${title} - Main View`} /> // mainImage is images[0]
            ) : (
              // Fallback, though unlikely if images.length > 1
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                Image not available
              </div>
            )}
          </div>
          {/* Secondary images for the grid */}
          {secondaryImages.map((imgUrl, index) => ( // secondaryImages are images.slice(1, MAX_SECONDARY_IMAGES + 1)
            <div
              key={`secondary-${index}-${campingId}`}
              className="hidden md:block h-full w-full overflow-hidden cursor-pointer group"
              onClick={() => openPhotoGallery(index + 1)}
              role="button"
              tabIndex={0}
              aria-label={`View image ${index + 2} for ${title}`}
            >
              <ImageContainer
                image={imgUrl}
                name={`${title} - View ${index + 2}`}
              />
            </div>
          ))}
          {/* Placeholder divs for empty slots in the grid (only for multi-image display) */}
          {/* This logic ensures the grid structure is maintained if there are few secondary images */}
          {Array.from({
            length: Math.max(0, MAX_SECONDARY_IMAGES - secondaryImages.length),
          }).map((_, index) => (
            <div
              key={`placeholder-${index}`}
              className="hidden md:block h-full bg-gray-200" // Placeholder style
              aria-hidden="true"
            ></div>
          ))}
          {/* "Show all photos" button (only for multi-image display if there are more images than shown) */}
          {images.length > 1 + MAX_SECONDARY_IMAGES && ( // e.g., 1 main + 4 secondary = 5. If images.length > 5
            <Button
              onClick={() => openPhotoGallery(0)}
              variant="secondary"
              className="absolute bottom-4 right-4 bg-white text-black text-sm font-semibold px-3 py-1.5 rounded-md border border-gray-400 shadow-md hover:bg-gray-100 transition duration-150 z-10 cursor-pointer"
            >
              Show all {images.length} photos
            </Button>
          )}
        </div>
      )}

      {/* --- Main Content Section: Details & Booking --- */}
      <section className="lg:grid lg:grid-cols-12 lg:gap-x-12">
        {/* Left Column: Details */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8 divide-y divide-gray-200 mb-8 lg:mb-0">
          {/* --- Host Info --- */}
          {/* ... (keep existing host info logic) */}
          <div className="pt-8 first:pt-0">
            <div className="flex items-center mb-4">
              <button
                type="button"
                onClick={openHostModal}
                className="mr-4 flex-shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-indigo-500 group cursor-pointer"
                aria-label={`View profile for host ${host.username || host.firstname}`}
              >
                {host.imageUrl ? (
                  <img
                    src={host.imageUrl}
                    alt={`Avatar of ${host.firstname}`}
                    className="w-12 h-12 rounded-full object-cover bg-gray-200 group-hover:opacity-80 transition-opacity"
                  />
                ) : (
                  <CircleUser className="w-12 h-12 text-gray-400 group-hover:text-gray-500 transition-colors" />
                )}
              </button>
              <div>
                <button
                  type="button"
                  onClick={openHostModal}
                  className="text-left focus:outline-none cursor-pointer"
                  aria-label={`View profile for host ${host.username || host.firstname}`}
                >
                  <h2 className="text-xl font-semibold text-gray-800 mb-0 hover:underline">Hosted by {host.username ? host.username : `${host.firstname}${host.lastname ? ` ${host.lastname}` : ''}`}</h2>
                  <p className="text-sm text-gray-600">Joined in {host.joinedDate}</p>
                </button>
              </div>
            </div>
          </div>

          {/* --- Description --- */}
          {/* ... (keep existing description logic) */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              About this place
            </h2>
            {/* Pass the full description and the desired max length */}
            <Description
              text={campingDescription}
              maxLength={300} // Keep truncation length short for the preview
              onShowMore={openDescriptionModal} // Pass the function to open the modal
            />
          </div>

          {/* --- Amenities --- */}
          {/* --- MODIFICATION START: Use formatAmenityLabel --- */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              What this place offers
            </h2>
            {amenities.length > 0 ? (
              <>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 mb-4">
                  {amenitiesToShow.map((amenity, index) => (
                    <li
                      key={`${amenity}-${index}`}
                      className="flex items-center text-gray-800"
                    >
                      {getAmenityIcon(amenity)}
                      {/* Use the helper function to format the label */}
                      <span>{formatAmenityLabel(amenity)}</span>
                    </li>
                  ))}
                </ul>
                {amenities.length > AMENITIES_PREVIEW_COUNT && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleShowAllAmenities}
                    className="flex items-center gap-1 cursor-pointer"
                  >
                    {showAllAmenities ? (
                      <>
                        Show less <ChevronUp size={16} />
                      </>
                    ) : (
                      <>
                        Show all {amenities.length} amenities{" "}
                        <ChevronDown size={16} />
                      </>
                    )}
                  </Button>
                )}
              </>
            ) : (
              <p className="text-gray-600">No specific amenities listed.</p>
            )}
          </div>
          {/* --- MODIFICATION END --- */}

          {/* --- Location & Map --- */}
          {/* ... (keep existing map logic) */}
          {lat != null && lng != null && (
            <div id="location-map" className="scroll-mt-20">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Where you'll be
              </h2>
              {/* Display Address if available */}
              {address && (
                <p className="text-gray-700 mb-1">{address}</p>
              )}
              {/* General location name with icon */}
              <div className="flex items-center text-gray-600 text-sm mb-4">
                <MapPin size={14} className="mr-1.5 flex-shrink-0" />
                <span>{locationName}</span>
              </div>
              <div className="aspect-video rounded-lg overflow-hidden border border-gray-200">
                <Mainmap Location={{ lat, lng }} />
              </div>
            </div>
          )}

          {/* --- Reviews Section (Placeholder) --- */}
          {/* ... (keep existing reviews logic) */}
          <div id="reviews" className="pt-8 scroll-mt-20"> {/* scroll-mt-20 for anchor links */}
            <h2 className="text-xl font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Star size={20} className="text-yellow-500 fill-current" />
              {/* Display the calculated average overall rating from reviews if available, else the default */}
              {(averageRatings.overall > 0 ? averageRatings.overall : rating).toFixed(1)}
              <span className="font-normal">·</span>
              {totalReviews} review{totalReviews !== 1 ? "s" : ""} {/* Use totalReviews here */}
            </h2>
            <Suspense fallback={SuspenseFallback}>
              {/* Rating Breakdown Section */}
              {reviews.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-0 mb-6 mt-4">
                  <RatingBreakdownCard label="Overall experience" rating={averageRatings.overall} />
                  <RatingBreakdownCard label="Customer support" rating={averageRatings.customerSupport} />
                  <RatingBreakdownCard label="Convenience" rating={averageRatings.convenience} />
                  <RatingBreakdownCard label="Signal quality" rating={averageRatings.signalQuality} />
                </div>
              )}
              <ReviewList
                reviews={reviews}
                landmarkHostProfile={host}
                loggedInUserId={loggedInUser?.id}
                // Add props for pagination if implementing "Load More"
                // totalReviews={totalReviews}
                // currentPage={reviewsPage}
                // onLoadMore={() => setReviewsPage(prev => prev + 1)}
              />
            </Suspense>
          </div>
        </div>{" "}
        {/* End Left Column */}
        {/* Right Column: Booking */}
        <div className="lg:col-span-5 xl:col-span-4">
          <div className="lg:sticky lg:top-24">
            <div className="p-4 sm:p-6 border border-gray-200 rounded-lg shadow-lg bg-white">
              <BookingContainer
                campingId={campingId}
                price={price}
                totalRooms={totalRooms} // <-- Pass totalRooms prop here
                initialUnavailableDates={publiclyUnavailableDates}
              />
            </div>
          </div>
        </div>{" "}
        {/* End Right Column */}
      </section>

      {/* --- Photo Gallery Modal --- */}
      {/* ... (keep existing modal logic) */}
      <Suspense fallback={null}> {/* Fallback can be null for modals if they are not immediately visible */}
        {galleryStartIndex !== null && (
          <PhotoGalleryModal
            images={images}
            startIndex={galleryStartIndex}
            onClose={closePhotoGallery}
            campingTitle={title}
          />
        )}
      </Suspense>

      {/* --- Host Profile Modal --- */}
      <Suspense fallback={null}>
        {isHostModalOpen && host && (
          <HostProfileModal
            isOpen={isHostModalOpen}
            onClose={closeHostModal}
            host={host}
          />
        )}
      </Suspense>

      {/* --- Description Modal --- */}
      <Dialog
        open={isDescriptionModalOpen}
        onOpenChange={setIsDescriptionModalOpen}
      >
        <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              About this space
            </DialogTitle>
          </DialogHeader>
          {/* Make the description area scrollable */}
          <div className="flex-grow overflow-y-auto pr-2 -mr-2">
            <DialogDescription className="text-base text-gray-700 whitespace-pre-wrap">
              {campingDescription}
            </DialogDescription>
          </div>
          {/* Optional Footer if needed */}
          {/* <DialogFooter>
            <Button onClick={closeDescriptionModal}>Close</Button>
          </DialogFooter> */}
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default CampingDetail;
