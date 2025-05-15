// /Users/duke/Documents/GitHub/RentKub/client/src/components/card/CampingCard.jsx
import { useState, useMemo, useEffect } from "react"; // Import useState, useMemo, and useEffect
import { motion } from "motion/react";
import { Link } from "react-router";
import FavoriteToggleButton from "./FavoriteToggleButton";
import { formatNumber } from "@/utils/formats";
import useCampingStore from "@/store/camping-store"; // Import Zustand store
import StarRatingDisplay from "@/components/review/StarRatingDisplay"; // Import StarRatingDisplay
import { ChevronLeft, ChevronRight, Star } from "lucide-react"; // Import icons (Added Star)
import { Button } from "../ui/button"; // Assuming you have a Button component
import { calculateDistance } from "@/utils/distance";

const CampingCard = ({ camping }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPriceHovered, setIsPriceHovered] = useState(false); // State for price hover
  const userLocation = useCampingStore((state) => state.userLocation); // Get user location from store

  // Determine initial max characters based on screen size
  const getInitialMaxChars = () => {
    if (typeof window === 'undefined') return 12; // Default for SSR
    if (window.matchMedia("(min-width: 1280px)").matches) { // xl breakpoint
      return 18;
    } else if (window.matchMedia("(min-width: 1024px)").matches) { // lg breakpoint
      return 13;
    }
    return 12; // Default for smaller screens
  };

  const [maxTitleChars, setMaxTitleChars] = useState(getInitialMaxChars());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lgMediaQuery = window.matchMedia("(min-width: 1024px)");
    const xlMediaQuery = window.matchMedia("(min-width: 1280px)");

    const handler = () => {
      if (xlMediaQuery.matches) {
        setMaxTitleChars(22);
      } else if (lgMediaQuery.matches) {
        setMaxTitleChars(12);
      } else {
        setMaxTitleChars(12);
      }
    };

    lgMediaQuery.addEventListener("change", handler);
    xlMediaQuery.addEventListener("change", handler);

    return () => {
      lgMediaQuery.removeEventListener("change", handler);
      xlMediaQuery.removeEventListener("change", handler);
    };
  }, []);


  const images = camping.images || []; // Ensure images is an array

  // --- Handlers for Image Navigation ---
  const handleNext = (e) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = (e) => {
    e.preventDefault(); // Prevent link navigation
    e.stopPropagation(); // Stop event bubbling
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  // --- Helper to prevent rendering issues if no images ---
  const currentImageSrc =
    images.length > 0 ? images[currentIndex] : "/placeholder-image.png"; // Fallback image

  // --- Calculate distance ---
  const distanceKm = useMemo(() => {
    if (userLocation && camping.lat != null && camping.lng != null) {
      return calculateDistance(
        userLocation.lat,
        userLocation.lng,
        camping.lat,
        camping.lng
      );
    }
    return null;
  }, [userLocation, camping.lat, camping.lng]); // Recalculate only if these change

  // --- Truncate title based on screen size if more than 18 characters ---
  const displayTitle = useMemo(() => {
    const title = camping.title;
    if (title.length > 18) { // Condition for truncation remains
      return title.substring(0, maxTitleChars) + "...";
    }
    return title; // No truncation needed
  }, [camping.title, maxTitleChars]); // Dependency updated to maxTitleChars


  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="shadow-lg rounded-xl overflow-hidden group" // Updated styling: more shadow, rounded-xl
    >
      <Link to={`/user/camping/${camping.id}`} className="block">
        <div className="relative">
          {/* --- Image Container --- */}
          <div className="aspect-square overflow-hidden"> {/* Enforces square aspect ratio */}
            <img
              src={currentImageSrc}
              alt={`${camping.title} - Image ${currentIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
              onError={(e) => {
                e.target.src = "/placeholder-image.png";
                console.error(`Failed to load image: ${currentImageSrc}`);
              }}
            />
          </div>

          {/* --- Guest Favorite Badge (Overlay) --- */}
          {typeof camping.averageRating === 'number' && camping.averageRating > 4.7 && (
            <div className="absolute top-3 left-3 z-10 bg-white text-gray-900 text-xs font-semibold px-2.5 py-1 rounded-full shadow-md">
              Guest Favorite
            </div>
          )}

          {/* --- Favorite Button (Overlay) --- */}
          <div className="absolute top-3 right-3 z-20">
            <FavoriteToggleButton
              campingId={camping.id}
              isFavorite={camping.isFavorite}
            />
          </div>

          {/* --- Image Navigation Buttons (Overlay, show on hover if multiple images) --- */}
          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 left-2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-md"
                onClick={handlePrev}
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-2 transform -translate-y-1/2 h-8 w-8 rounded-full bg-white/90 hover:bg-white text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 shadow-md"
                onClick={handleNext}
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}

          {/* --- Image Index Indicator (Overlay, show on hover if multiple images) --- */}
          {images.length > 1 && (
            <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              {images.map((_, index) => (
                <span
                  key={index}
                  className={`block h-1.5 w-1.5 rounded-full shadow ${
                    index === currentIndex ? "bg-white" : "bg-white/60"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* --- Text Content --- */}
        <div className="p-3 space-y-0.5"> {/* Adjusted padding and spacing */}
          {/* Flex container for Title and Rating */}
          <div className="flex justify-between items-start">
            <h3 className="text-md font-semibold leading-tight text-gray-900 pr-2">
              {displayTitle} {/* Use truncated title */}
            </h3>
            <div className="flex-shrink-0 flex items-center gap-1 text-sm text-gray-800">
              <Star className="h-3.5 w-3.5 text-black fill-current" /> {/* Black star icon */}
              {typeof camping.averageRating === 'number' && camping.averageRating > 0 ? (
                <>
                  <span className="font-medium">{camping.averageRating.toFixed(1)}</span>
                  {camping.reviewCount > 0 && (
                    <span className="text-gray-500">{`(${camping.reviewCount})`}</span>
                  )}
                </>
              ) : (
                <span className="font-medium">New</span>
              )}
            </div>
          </div>

          {/* Distance */}
          <p className="text-sm text-gray-500">
            {distanceKm !== null ? `${distanceKm.toFixed(1)} km away` : "\u00A0"}
          </p>

          {/* Price */}
          <div
            className="relative text-md text-gray-900 pt-0.5 transition-transform duration-200 ease-in-out hover:scale-105 origin-left" // Added hover scale and transition
            onMouseEnter={() => setIsPriceHovered(true)}
            onMouseLeave={() => setIsPriceHovered(false)} // Keep mouse leave for modal
          >
            {/* Original price display (always visible) */}
            <span className="font-semibold underline">฿{formatNumber(camping.price * 5)}</span>
            <span className="font-normal text-gray-600"> for 5 nights</span>

            {/* Floating modal for 1-night price */}
            {isPriceHovered && (
              <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white py-1.5 px-2.5 rounded-md shadow-xl text-xs whitespace-nowrap z-30 border border-gray-200">
                <span className="font-semibold text-gray-800">฿{formatNumber(camping.price)}</span>
                <span className="text-gray-600"> per night</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};
export default CampingCard;
