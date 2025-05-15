import { useState } from 'react';
import { Star } from 'lucide-react';

const starRatingInput = ({ count = 5, rating, onRatingChange, size = 24, color = "text-yellow-400", inactiveColor = "text-gray-300", label = "" }) => {
  const [hoverRating, setHoverRating] = useState(0);

  const handleClick = (index) => {
    onRatingChange(index);
  };

  const handleMouseEnter = (index) => {
    setHoverRating(index);
  };

  const handleMouseLeave = () => {
    setHoverRating(0);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center mb-2">
      {label && <span className="text-sm font-medium text-gray-700 mr-3 mb-1 sm:mb-0 min-w-[150px]">{label}:</span>}
      <div className="flex items-center">
        {[...Array(count)].map((_, i) => {
          const starValue = i + 1;
          return (
            <Star
              key={starValue}
              size={size}
              className={`cursor-pointer transition-colors ${(hoverRating || rating) >= starValue ? color : inactiveColor} ${(hoverRating >= starValue && rating < starValue ? 'transform scale-110' : '')}`}
              fill={(hoverRating || rating) >= starValue ? 'currentColor' : 'none'}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => handleMouseEnter(starValue)}
              onMouseLeave={handleMouseLeave}
            />
          );
        })}
      </div>
    </div>
  );
};

export default starRatingInput;