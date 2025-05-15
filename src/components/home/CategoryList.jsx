import { useState, useRef, useEffect } from "react"; // Import hooks
import { categories } from "@/utils/category";
import { useSearchParams } from "react-router"; // Correct import if using react-router v6+
import { ChevronLeft, ChevronRight } from "lucide-react"; // Import arrow icons
import { Button } from "@/components/ui/button"; // Import Button for styling arrows

const CategoryList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentCategory = searchParams.get("category"); // Get the currently selected category
  const containerRef = useRef(null); // Ref for the scrollable container
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const hdlFilter = (category) => {
    console.log(category);
    const params = new URLSearchParams(searchParams);
    const c = searchParams.get("category") || "";

    if (c === category) {
      // If clicking the already selected category, remove the filter
      params.delete("category");
    } else {
      // Otherwise, set the new category filter
      params.set("category", category);
    }
    setSearchParams(params);
  };

  // Function to check scroll state and update arrow visibility
  const checkScroll = () => {
    const container = containerRef.current;
    if (container) {
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      // Add a small tolerance (e.g., 1px) for floating point inaccuracies
      setShowLeftArrow(container.scrollLeft > 1);
      setShowRightArrow(container.scrollLeft < maxScrollLeft - 1);
    } else {
      setShowLeftArrow(false);
      setShowRightArrow(false);
    }
  };

  // Effect to check scroll on mount and resize
  useEffect(() => {
    const container = containerRef.current;
    checkScroll(); // Initial check

    // Check on resize
    window.addEventListener("resize", checkScroll);
    // Check if container exists before adding scroll listener
    if (container) {
      container.addEventListener("scroll", checkScroll);
    }

    // Cleanup listeners
    return () => {
      window.removeEventListener("resize", checkScroll);
      if (container) {
        container.removeEventListener("scroll", checkScroll);
      }
    };
  }, [categories]); // Re-run if categories change (though unlikely)

  // Scroll handlers
  const scroll = (direction) => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = container.clientWidth * 0.8; // Scroll by 80% of visible width
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="relative flex items-center max-w-full sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto">
      {" "}
      {/* Adjusted max-width for better responsiveness */}
      {/* Left Arrow Button */}
      {showLeftArrow && (
        <Button
          variant="outline"
          size="icon"
          className="absolute left-0 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md -translate-x-1/2 transition-opacity hover:bg-white" // Always visible when showLeftArrow is true
          onClick={() => scroll("left")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
      {/* Scrollable Container */}
      <div
        ref={containerRef}
        className="flex items-center gap-4 mb-2 overflow-x-auto pb-2 scrollbar-hide whitespace-nowrap px-6" // Increased horizontal padding slightly
      >
        {categories.map((item, index) => {
          const isSelected = item.label === currentCategory;
          const buttonClasses = `
            flex flex-col items-center flex-shrink-0
            gap-1 p-2 rounded-md
            cursor-pointer
            transition-all duration-200 ease-in-out
            hover:text-neutral-800 hover:opacity-100
            ${
              isSelected
                ? "text-neutral-800 border-b-2 border-neutral-800 opacity-100"
                : "text-neutral-500 opacity-70"
            }
          `;

          return (
            <button
              onClick={() => hdlFilter(item.label)}
              className={buttonClasses.trim()}
              key={index}
            >
              <item.icon size={24} />
              <p className="capitalize font-medium text-xs">{item.label}</p>
            </button>
          );
        })}
      </div>
      {/* Right Arrow Button */}
      {showRightArrow && (
        <Button
          variant="outline"
          size="icon"
          className="absolute right-0 z-10 h-8 w-8 rounded-full bg-white/80 backdrop-blur-sm shadow-md translate-x-1/2 transition-opacity hover:bg-white" // Always visible when showRightArrow is true
          onClick={() => scroll("right")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
export default CategoryList;
