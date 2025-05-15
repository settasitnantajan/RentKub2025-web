// /Users/duke/Documents/GitHub/RentKub/client/src/components/campings/PhotoGalleryModal.jsx
import { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button"; // Assuming you have this

const PhotoGalleryModal = ({ images = [], startIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowLeft") {
        handlePrev();
      } else if (event.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    // Cleanup listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]); // Add handlePrev/handleNext if they aren't stable references

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const handlePrev = () => {
    setCurrentIndex(
      (prevIndex) => (prevIndex - 1 + images.length) % images.length
    );
  };

  // Prevent background scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!images || images.length === 0) {
    return null; // Don't render if no images
  }

  const currentImageSrc = images[currentIndex];

  return (
    // Modal Overlay
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose} // Close when clicking overlay
    >
      {/* Modal Content (Stop propagation to prevent closing when clicking content) */}
      <div
        className="relative bg-white p-4 rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 text-gray-600 hover:text-black z-10"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X size={24} />
        </Button>

        {/* Image Display Area */}
        <div className="flex-grow flex items-center justify-center overflow-hidden mb-2">
          <img
            src={currentImageSrc}
            alt={`Camping image ${currentIndex + 1}`}
            className="max-w-full max-h-[75vh] object-contain" // Use contain to see the whole image
            onError={(e) => {
              e.target.src = "/placeholder-image.png";
              console.error(
                `Failed to load image in modal: ${currentImageSrc}`
              );
            }}
          />
        </div>

        {/* Navigation Controls & Counter */}
        <div className="flex items-center justify-between mt-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrev}
            aria-label="Previous image"
            disabled={images.length <= 1}
            className="h-10 w-10"
          >
            <ChevronLeft size={20} />
          </Button>

          {/* Counter */}
          <span className="text-sm text-gray-700">
            {currentIndex + 1} / {images.length}
          </span>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            aria-label="Next image"
            disabled={images.length <= 1}
            className="h-10 w-10"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;
