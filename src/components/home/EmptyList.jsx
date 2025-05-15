import { useSearchParams } from "react-router"; // Import useSearchParams
import { Button } from "../ui/button";

const EmptyList = () => {
  // Get the setSearchParams function to modify URL query parameters
  const [, setSearchParams] = useSearchParams();

  // Handler to clear all search parameters
  const handleClearFilters = () => {
    setSearchParams({}); // Set search params to an empty object to clear them
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-center text-gray-600">
        No Result
      </h1>
      <Button
        onClick={handleClearFilters}
        variant="outline"
        className="mx-auto"
      >
        {" "}
        {/* Add onClick handler and optional styling */}
        Clear Filters
      </Button>
    </div>
  );
};
export default EmptyList;
