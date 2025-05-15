// /Users/duke/Documents/GitHub/RentKub/client/src/components/navbar/Searchbar.jsx
import { useState, useEffect, useRef } from "react"; // Import useRef
import { useSearchParams } from "react-router"; // Standard import for react-router v6+ web
// If your project specifically uses 'react-router' directly, keep that import:
// import { useSearchParams } from 'react-router';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
// No need to import debounce from 'lodash.debounce'

const SearchBar = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const debounceTimeoutRef = useRef(null); // Ref to hold the timeout ID

  // Handle input changes
  const handleChange = (event) => {
    const newValue = event.target.value;
    setSearchTerm(newValue); // Update the input field immediately for responsiveness

    // Clear the previous timeout if it exists
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set a new timeout to update the URL search params after a delay
    debounceTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams); // Get current params
      if (newValue) {
        params.set("search", newValue);
      } else {
        params.delete("search"); // Remove search param if input is empty
      }
      // Use replace: true to avoid adding every intermediate state to browser history
      setSearchParams(params, { replace: true });
    }, 500); // Debounce time in ms (e.g., 500ms)
  };

  // Sync local state if URL changes externally (e.g., browser back/forward)
  useEffect(() => {
    // Update the local search term if the 'search' param changes in the URL
    // This handles cases like browser navigation or clearing filters externally
    const currentUrlSearch = searchParams.get("search") || "";
    if (currentUrlSearch !== searchTerm) {
      setSearchTerm(currentUrlSearch);
    }
    // We only want this effect to run when searchParams changes.
    // Adding searchTerm here would cause potential loops if not careful.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Cleanup: Clear the timeout if the component unmounts
  useEffect(() => {
    // Return a cleanup function
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array ensures this runs only once on mount and unmount

  return (
    <div className="relative w-full max-w-md">
      {" "}
      {/* Adjust width as needed */}
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search destinations..."
        value={searchTerm}
        onChange={handleChange}
        className="pl-10" // Add padding for the icon
      />
    </div>
  );
};

export default SearchBar;
