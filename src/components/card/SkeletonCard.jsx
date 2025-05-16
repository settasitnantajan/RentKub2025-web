// /Users/duke/Documents/GitHub/RentKub-api/client/src/components/card/SkeletonCard.jsx
const SkeletonCard = () => {
    return (
      <div className="shadow-lg rounded-xl overflow-hidden group animate-pulse">
        {/* Image Placeholder */}
        <div className="aspect-square bg-gray-300"></div>
  
        {/* Text Content Placeholder */}
        <div className="p-3 space-y-1"> {/* Adjusted spacing slightly */}
          {/* Flex container for Title and Rating */}
          <div className="flex justify-between items-start">
            {/* Title Placeholder (approximating two lines if long) */}
            <div className="space-y-1.5 w-3/4 pr-2">
              <div className="h-4 bg-gray-300 rounded w-full"></div>
              <div className="h-4 bg-gray-300 rounded w-5/6"></div>
            </div>
            {/* Rating Placeholder */}
            <div className="flex-shrink-0 flex items-center gap-1">
              <div className="h-3.5 w-3.5 bg-gray-300 rounded-sm"></div> {/* Star icon placeholder */}
              <div className="h-4 bg-gray-300 rounded w-8"></div> {/* Rating text placeholder */}
            </div>
          </div>
  
          {/* Distance Placeholder */}
          <div className="h-3.5 bg-gray-300 rounded w-1/3 mt-1"></div>
  
          {/* Price Placeholder */}
          <div className="h-4 bg-gray-300 rounded w-1/2 mt-1.5"></div>
        </div>
      </div>
    );
  };
  
  export default SkeletonCard;