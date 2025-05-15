// /Users/duke/Documents/GitHub/RentKub/client/src/components/campings/Description.jsx
import React from "react";
import { Button } from "@/components/ui/button"; // Using shadcn/ui Button

const Description = ({ text, maxLength = 300, onShowMore }) => {
  if (!text) {
    return <p className="text-gray-600">No description available.</p>;
  }

  const needsTruncation = text.length > maxLength;
  // Display truncated text if needed and not expanded, otherwise full text
  const displayText = needsTruncation
    ? `${text.substring(0, maxLength)}...`
    : text;

  return (
    <div className="text-gray-700 space-y-2">
      {/* Use white-space: pre-wrap to preserve line breaks from the original text */}
      <p className="whitespace-pre-wrap">{displayText}</p>
      {needsTruncation && onShowMore && (
        <Button
          variant="secondary" // Changed variant
          onClick={onShowMore} // Call the function passed via props
          // Applied styles similar to the "Show all photos" button
          className="bg-white text-black text-sm px-2 py-1.5 rounded-md border border-gray-300 hover:bg-gray-100 transition duration-150"
        >
          Show more
        </Button>
      )}
    </div>
  );
};

export default Description;
