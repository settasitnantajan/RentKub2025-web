import { useState } from "react";
import { Link } from "react-router";
import { formatNumber } from "@/utils/formats";
import { calculateDistance } from "@/utils/distance";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import useCampingStore from "@/store/camping-store";

// --- Star Rating Component (Copied from Layers.jsx for encapsulation) ---
const StarRating = ({ rating = 0, count = 0 }) => {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
      <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
      <span className="font-semibold">
        {rating > 0 ? rating.toFixed(1) : "New"}
      </span>
      {count > 0 && <span className="text-gray-500">({count})</span>}
    </div>
  );
};

const PopupContent = ({ camping }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const userLocation = useCampingStore.getState().userLocation; // Get user location directly

  const images = camping.images || [];
  const currentImageSrc =
    images.length > 0 ? images[currentIndex] : "/placeholder-image.png";

  const distanceKm =
    userLocation && camping.lat != null && camping.lng != null
      ? calculateDistance(
          userLocation.lat,
          userLocation.lng,
          camping.lat,
          camping.lng
        )
      : null;

  const handleNext = (e) => {
    e.stopPropagation(); // Prevent map click/drag
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = (e) => {
    e.stopPropagation(); // Prevent map click/drag
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  return (
    <div className="text-sm w-[250px] z-[1100]">
      {" "}
      {/* Increased z-index to ensure it's above search (z-1000) */}
      <div className="relative rounded-md w-full h-32 object-cover mb-2 overflow-hidden group">
        <img
          className="w-full h-full object-cover"
          src={currentImageSrc}
          alt={`${camping.title} - Image ${currentIndex + 1}`}
          onError={(e) => {
            e.target.src = "/placeholder-image.png";
          }}
        />
        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 left-1 transform -translate-y-1/2 h-6 w-6 rounded-full bg-white/70 hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              onClick={handlePrev}
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-1/2 right-1 transform -translate-y-1/2 h-6 w-6 rounded-full bg-white/70 hover:bg-white text-gray-800 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
              onClick={handleNext}
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
      <div className="flex justify-between items-start">
        <h3 className="text-base font-semibold leading-tight flex-grow mr-2">
          {camping.title}
        </h3>
        <StarRating
          rating={camping.averageRating}
          count={camping.reviewCount}
        />
      </div>
      {distanceKm !== null && (
        <p className="text-xs text-gray-500">{distanceKm.toFixed(1)} km away</p>
      )}
      <div className="flex justify-between items-center">
        <p className="font-semibold text-base">
          ฿{formatNumber(camping.price)}{" "}
          <span className="font-normal text-xs text-gray-600">/ night</span>
        </p>
        <Link
          to={`/user/camping/${camping.id}`}
          className="text-xs text-blue-600 hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default PopupContent;
