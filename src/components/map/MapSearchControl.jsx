import { useState, useEffect, useRef, useCallback } from "react";
import { useMap } from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Loader2 } from "lucide-react"; // Added X and Loader2
import { MapPin } from "lucide-react";

const MapSearchControl = () => {
  const map = useMap();
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestions, setSuggestions] = useState([]); // State for suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [foundLocationName, setFoundLocationName] = useState(""); // State for the found location name
  const debounceTimeoutRef = useRef(null); // Ref to store the debounce timeout ID
  const searchContainerRef = useRef(null); // Ref for the search container

  // Function to fetch suggestions (will be debounced manually)
  const fetchSuggestions = async (query) => {
    if (!query || query.length < 3) {
      // Only search if query is long enough
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }
    // Don't set isLoading(true) here, it's handled in handleInputChange
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=5` // Get up to 5 suggestions
      );
      if (!response.ok) throw new Error("Network response error");
      const data = await response.json();
      setSuggestions(data || []);
      setShowSuggestions(data && data.length > 0);
    } catch (err) {
      console.error("Suggestion fetch error:", err);
      setError("Failed to fetch suggestions.");
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      // Only set loading to false if this specific fetch completes
      // The loading state is primarily managed by the input change handler now
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFoundLocationName(""); // Clear bottom-left name when typing new search
    // Clear the previous timeout if it exists
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (value.trim()) {
      setIsLoading(true); // Show loader immediately while waiting for debounce
      // Set a new timeout
      debounceTimeoutRef.current = setTimeout(() => {
        fetchSuggestions(value);
      }, 500); // 500ms debounce delay
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false); // Hide loader if input is cleared
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const { lat, lon, display_name } = suggestion;
    map.flyTo([parseFloat(lat), parseFloat(lon)], 13);
    setSearchTerm(display_name); // Update input field
    setFoundLocationName(display_name); // Set the name at the bottom-left
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    setFoundLocationName("");
    // Clear any pending debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
  };

  // Effect to handle clicks outside the search container
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      // Cleanup debounce timeout on unmount
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array, refs don't need to be dependencies

  return (
    <>
      {/* Search bar container - Positioned top-left */}
      <div
        ref={searchContainerRef}
        className="absolute top-2 left-14 z-[1000] flex flex-col items-start gap-1 w-48 sm:w-64"
      >
        {" "}
        {/* Changed left-1/2 -translate-x-1/2 to left-2 and items-center to items-start */}
        <div className="bg-white p-1 rounded shadow-md flex items-center w-full relative">
          {" "}
          {/* Added relative */}
          <Input
            type="text"
            placeholder="Search location..."
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={() => setShowSuggestions(suggestions.length > 0)} // Show suggestions on focus if they exist
            className="h-8 text-sm flex-grow pr-8" // Use flex-grow and add padding for clear button
          />
          {/* Loading/Clear Button */}
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={clearSearch}
                >
                  <X className="h-4 w-4" />
                </Button>
              )
            )}
          </div>
        </div>
        {/* Optional: Display error message near search bar */}
        {/* {error && <p className="text-red-500 text-xs mt-1">{error}</p>} */}
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="bg-white w-full rounded shadow-md mt-1 max-h-60 overflow-y-auto">
            <ul>
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.place_id}
                  className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.display_name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {/* Display found location name */}
      {foundLocationName && !isLoading && (
        /* Positioned bottom-left */
        <div className="absolute bottom-4 left-4 z-[1000] flex items-center bg-black/70 backdrop-blur-sm text-xs text-white px-2 py-1 rounded-md shadow">
          <MapPin className="h-4 w-4 mr-1" />
          {foundLocationName}
        </div>
      )}
    </>
  );
};

export default MapSearchControl;
