import { Star } from 'lucide-react';

const StarRatingDisplay = ({ rating, maxRating = 5, size = 16, color = "text-yellow-500", inactiveColor = "text-gray-300" }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 >= 0.5; // Simple half-star logic, can be more complex
  const emptyStars = maxRating - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} size={size} className={`${color} fill-current`} />
      ))}
      {/* For simplicity, not implementing half-star rendering here, but it's possible */}
      {[...Array(emptyStars + (halfStar ? 1 : 0))].map((_, i) => ( // Adjust for half star placeholder
        <Star key={`empty-${i}`} size={size} className={inactiveColor} />
      ))}
    </div>
  );
};

export default StarRatingDisplay;