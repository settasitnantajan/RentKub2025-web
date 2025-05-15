// /Users/duke/Documents/GitHub/RentKub/client/src/components/campings/ImageContainer.jsx
const ImageContainer = ({ image, name }) => {
  // Fallback image if the provided one is invalid or fails to load
  const handleError = (e) => {
    e.target.onerror = null; // Prevent infinite loop if fallback also fails
    e.target.src = "/placeholder-image.png"; // Ensure you have a placeholder image in your public folder
    console.error(`Failed to load image: ${image}`);
  };

  return (
    <img
      src={image || "/placeholder-image.png"} // Handle null/undefined image prop, provide a fallback
      alt={name || "Camping image"} // Provide a default alt text
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" // Key classes: w-full, h-full, object-cover
      onError={handleError}
    />
  );
};

export default ImageContainer;