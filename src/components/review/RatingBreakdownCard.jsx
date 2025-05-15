import { Star, Headset, ThumbsUp, Wifi } from 'lucide-react'; // Import necessary icons

// Helper to get the appropriate icon based on the label
const getIconForLabel = (label) => {
  const lowerLabel = label.toLowerCase();
  if (lowerLabel.includes("overall experience")) {
    return <Star size={14} className="mr-1.5 text-yellow-500 fill-current" />;
  }
  if (lowerLabel.includes("customer support")) {
    return <Headset size={14} className="mr-1.5 text-blue-500" />;
  }
  if (lowerLabel.includes("convenience")) {
    return <ThumbsUp size={14} className="mr-1.5 text-green-500" />;
  }
  if (lowerLabel.includes("signal quality")) {
    return <Wifi size={14} className="mr-1.5 text-purple-500" />;
  }
  return null; // No icon if label doesn't match
};

const RatingBreakdownCard = ({ label, rating, maxRating = 5 }) => {
    const ratingValue = parseFloat(rating);
    const percentage = maxRating > 0 ? (ratingValue / maxRating) * 100 : 0;
    const IconComponent = getIconForLabel(label);

    return (
      <div className="py-2">
        <div className="flex justify-between items-center mb-1 text-sm">
          <div className="flex items-center text-gray-700">
            {IconComponent}
            <span>{label}</span>
          </div>
          <span className="font-semibold text-gray-800">{ratingValue.toFixed(1)}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-gray-700 h-1.5 rounded-full"
            style={{ width: `${percentage}%` }}
            aria-valuenow={ratingValue}
            aria-valuemin="0"
            aria-valuemax={maxRating}
          ></div>
        </div>
      </div>
    );
  };
  
  export default RatingBreakdownCard;