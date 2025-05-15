// /Users/duke/Documents/GitHub/RentKub/client/src/components/home/CampingContainer.jsx
import useCampingStore from "@/store/camping-store";
import MapHome from "../map/MapHome";
import CampingLists from "./CampingLists";
import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/clerk-react"; // Import useAuth
import CategoryList from "./CategoryList";
import FilterModal from "./FilterModal";
import { useSearchParams } from "react-router"; // Correct import
import SearchBar from "../navbar/Searchbar";
import Footer from "./Footer"; // Keep Footer import
import { Button } from "@/components/ui/button"; // Import Button
import { Map, X } from "lucide-react"; // Import icons for the toggle button
// import SearchBar from "../navbar/Searchbar";

const CampingContainer = () => {
  const actionListCamping = useCampingStore((state) => state.actionListCamping);
  const actionFilter = useCampingStore((state) => state.actionFilter);
  const [searchParams] = useSearchParams();
  // const [isAnyFilterActive, setIsAnyFilterActive] = useState(false); // State to track filter status - Replaced by isMapVisible
  const [isMapVisible, setIsMapVisible] = useState(false); // State to control map visibility

  const { user } = useUser();
  const { getToken } = useAuth(); // Get getToken from useAuth
  const id = user?.id ?? null;

  useEffect(() => {
    const fetchDataAndFilter = async () => { // Make the effect's callback async
      const category = searchParams.get("category") || "";
      const search = searchParams.get("search") || "";
      const priceMin = searchParams.get("priceMin") || null;
      const priceMax = searchParams.get("priceMax") || null;
      const amenities = searchParams.get("amenities") || "";
      const instantBookable =
        searchParams.get("instantBookable") === "true" ? "true" : null;
      const checkIn = searchParams.get("checkIn") || null;
      const checkOut = searchParams.get("checkOut") || null;

      const filtersActive =
        category ||
        search ||
        priceMin !== null ||
        priceMax !== null ||
        amenities ||
        instantBookable !== null ||
        checkIn !== null ||
        checkOut !== null;

      const filters = {
        category,
        search,
        priceMin,
        priceMax,
        amenities,
        instantBookable,
        checkIn,
        checkOut,
      };

      console.log("Applying filters:", filters);

      const token = user ? await getToken() : null; // Get token if user exists

      if (filtersActive) {
        actionFilter(filters, token); // Pass token to actionFilter
      } else {
        actionListCamping(id); // Assuming listCamping doesn't need this new booking logic
      }
    };

    fetchDataAndFilter(); // Call the async function
  }, [searchParams, id, user, getToken, actionFilter, actionListCamping]); // Add user, getToken to dependencies

  return (
    <div className="relative">
      {" "}
      {/* Add relative positioning for potential absolute children if needed */}
      {/* Example Placement: Above Categories/Filters */}
      {/* <div className="mb-4 flex justify-center"> */}
      {/* <SearchBar /> <-- Render the SearchBar */}
      {/* </div> */}
      {/* Sticky Header for Category and Filter */}
      {/* Adjust top value (e.g., top-16) based on your actual Navbar height */}
      {/* Changed md:top-16 lg:top-[70px] to top-0 */}
      <div className="sticky top-0 z-30 bg-white py-3 mb-4 border-b border-gray-200">
        {" "}
        {/* Removed responsive top offsets */}
        <div className="container mx-auto flex flex-col sm:flex-row justify-center items-center gap-x-4 gap-y-2"> {/* Adjusted gap for potentially tighter layout */}
          {/* Wrap CategoryList to control its width - Reduced width */}
          <div className="w-full sm:max-w-sm md:max-w-sm lg:max-w-lg mr-4"> {/* Adjust max-width as needed */}
            <CategoryList />
          </div>
          <SearchBar />
          <FilterModal />
        </div>
      </div>
      {/* Main Content Area - Map and Lists */}
      <div
        className={`
          transition-all duration-500 ease-in-out overflow-hidden
          ${isMapVisible ? "max-h-[60vh] opacity-100" : "max-h-0 opacity-0"}
          mb-4 {/* Add margin when visible */}
        `}
      >
        {/* Render MapHome based on isMapVisible state, not filter status */}
        {isMapVisible && <MapHome />}
      </div>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {" "}
        {/* Add container and padding for list content */}
        {/* Toggle Map Button - Fixed at bottom center */}
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 mb-12 hidden md:flex">
          {" "}
          {/* Changed lg:flex to md:flex */}
          <Button
            onClick={() => setIsMapVisible(!isMapVisible)}
            className="rounded-full shadow-lg px-4 py-2 flex items-center gap-2 cursor-pointer"
            variant="default" // Or choose another variant
          >
            {isMapVisible ? (
              <X className="h-4 w-4" />
            ) : (
              <Map className="h-4 w-4" />
            )}
            {isMapVisible ? "Hide Map" : "Show Map"}
          </Button>
        </div>
        <CampingLists />
      </div>
      <Footer /> {/* Moved Footer outside the list container */}
    </div>
  );
};
export default CampingContainer;
