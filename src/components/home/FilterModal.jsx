// src/components/filter/FilterModal.jsx
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router"; // Use react-router-dom
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose, // Import DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
// import { Switch } from "@/components/ui/switch"; // Optional: Use Switch for boolean
import { Slider } from "@/components/ui/slider"; // Optional: Use Slider for price
import { amenityList } from "@/utils/amenities";
import { Filter, Calendar as CalendarIcon } from "lucide-react"; // Icon for the trigger button
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from "date-fns"; // For date formatting and parsing

const FilterModal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  // --- Local state for filters within the modal ---
  // Initialize from URL params when modal opens
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [instantBookable, setInstantBookable] = useState(false);
  const [activeFilterCount, setActiveFilterCount] = useState(0); // State for the badge count
  // Optional: State for slider
  const [priceRange, setPriceRange] = useState([0, 1000]); // Example range

  // Date filter states
  const [checkInDate, setCheckInDate] = useState(undefined);
  const [checkOutDate, setCheckOutDate] = useState(undefined);

  // State for showing calendars directly
  const [showCheckInCalendar, setShowCheckInCalendar] = useState(false);
  const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false);

  // --- Sync local state with URL params when modal opens ---
  useEffect(() => {
    if (isOpen) {
      const urlMinPrice = searchParams.get("priceMin") || "";
      const urlMaxPrice = searchParams.get("priceMax") || "";
      const urlAmenities = searchParams.get("amenities")?.split(",") || [];
      const urlInstant = searchParams.get("instantBookable") === "true";
      
      const urlCheckIn = searchParams.get("checkIn");
      const urlCheckOut = searchParams.get("checkOut");
      // Optional: Sync slider
      const sliderMin = parseInt(urlMinPrice, 10);
      const sliderMax = parseInt(urlMaxPrice, 10);
      const initialRange = [
        !isNaN(sliderMin) && sliderMin >= 0 ? sliderMin : 0,
        !isNaN(sliderMax) && sliderMax > 0 ? sliderMax : 1000, // Default max if not set or invalid
      ];

      setMinPrice(urlMinPrice);
      setMaxPrice(urlMaxPrice);
      setSelectedAmenities(urlAmenities);
      setInstantBookable(urlInstant);
      setPriceRange(initialRange); // Sync slider state

      setCheckInDate(urlCheckIn && isValid(parseISO(urlCheckIn)) ? parseISO(urlCheckIn) : undefined);
      setCheckOutDate(urlCheckOut && isValid(parseISO(urlCheckOut)) ? parseISO(urlCheckOut) : undefined);
    }
  }, [isOpen, searchParams]);

  // --- Calculate active filter count for the badge ---
  useEffect(() => {
    const urlMinPrice = searchParams.get("priceMin");
    const urlMaxPrice = searchParams.get("priceMax");
    const urlAmenities = searchParams.get("amenities");
    const urlCheckIn = searchParams.get("checkIn");
    const urlCheckOut = searchParams.get("checkOut");

    let count = 0;
    if (urlMinPrice) count++;
    if (urlMaxPrice) count++;
    if (urlAmenities && urlAmenities.split(",").length > 0) count++;
    // Add other filters here if you want them to contribute to the count
    if (urlCheckIn) count++;
    if (urlCheckOut) count++;

    setActiveFilterCount(count);
  }, [searchParams]); // Recalculate whenever search params change

  // --- Handlers ---
  const handleAmenityChange = (amenityId) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenityId)
        ? prev.filter((id) => id !== amenityId)
        : [...prev, amenityId]
    );
  };

  const handleApplyFilters = () => {
    const params = new URLSearchParams(searchParams);

    // Update Price (using input fields)
    if (minPrice) params.set("priceMin", minPrice);
    else params.delete("priceMin");
    if (maxPrice) params.set("priceMax", maxPrice);
    else params.delete("priceMax");

    // Update Price (using slider - uncomment if using slider)
    // if (priceRange[0] > 0) params.set("priceMin", priceRange[0].toString());
    // else params.delete("priceMin");
    // if (priceRange[1] < 1000) params.set("priceMax", priceRange[1].toString()); // Adjust max check if needed
    // else params.delete("priceMax");

    // Update Amenities
    if (selectedAmenities.length > 0) {
      params.set("amenities", selectedAmenities.join(","));
    } else {
      params.delete("amenities");
    }

    // Update Instant Bookable
    if (instantBookable) {
      params.set("instantBookable", "true");
    } else {
      params.delete("instantBookable");
    }

    // Update Dates
    if (checkInDate && isValid(checkInDate)) {
      params.set("checkIn", format(checkInDate, "yyyy-MM-dd"));
    } else {
      params.delete("checkIn");
    }
    if (checkOutDate && isValid(checkOutDate)) {
      params.set("checkOut", format(checkOutDate, "yyyy-MM-dd"));
    } else {
      params.delete("checkOut");
    }
    setSearchParams(params);
    setIsOpen(false); // Close modal after applying
  };

  const handleClearFilters = () => {
    // Reset local state
    setMinPrice("");
    setMaxPrice("");
    setSelectedAmenities([]);
    setInstantBookable(false);
    setPriceRange([0, 1000]); // Reset slider
    setCheckInDate(undefined);
    setCheckOutDate(undefined);
    setShowCheckInCalendar(false);
    setShowCheckOutCalendar(false);

    // Remove only these specific filters from URL
    const params = new URLSearchParams(searchParams);
    params.delete("priceMin");
    params.delete("priceMax");
    params.delete("amenities");
    params.delete("instantBookable");
    params.delete("checkIn");
    params.delete("checkOut");
    setSearchParams(params);
    // Keep modal open to see changes or close if preferred
    // setIsOpen(false);
  };

  // Optional: Handler for slider change
  const handleSliderChange = (value) => {
    setPriceRange(value);
    // Optionally update input fields as slider moves
    // setMinPrice(value[0].toString());
    // setMaxPrice(value[1].toString());
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {/* Add relative positioning for the badge */}
        <Button variant="outline" className="relative flex items-center gap-2 cursor-pointer">
          <Filter size={18} />
          <span>Filters</span>
          {/* Badge */}
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
              {/* Use min to avoid excessively large badges if count gets high */}
              {Math.min(activeFilterCount, 9)}
              {/* Optional: Show '+' if count is > 9: {activeFilterCount > 9 ? '9+' : activeFilterCount} */}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[600px] max-h-[80vh] overflow-y-auto">
        {" "}
        {/* Adjust width and add scroll */}
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Refine your search based on your preferences.
          </DialogDescription>
        </DialogHeader>
        {/* --- Filter Sections --- */}
        <div className="grid gap-6 py-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check-in-date">Check-in Date</Label>
              <Button
                id="check-in-date"
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${
                  !checkInDate && "text-muted-foreground"
                }`}
                onClick={() => {
                  setShowCheckInCalendar(!showCheckInCalendar);
                  setShowCheckOutCalendar(false); // Close other calendar
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkInDate && isValid(checkInDate) ? format(checkInDate, "PPP") : <span>Pick a date</span>}
              </Button>
              {showCheckInCalendar && (
                <Calendar
                  mode="single"
                  selected={checkInDate}
                  onSelect={(date) => {
                    setCheckInDate(date);
                    setShowCheckInCalendar(false);
                  }}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || (checkOutDate && date >= checkOutDate)}
                  initialFocus
                  className="rounded-md border mt-1" // Add some styling
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="check-out-date">Check-out Date</Label>
              <Button
                id="check-out-date"
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${
                  !checkOutDate && "text-muted-foreground"
                }`}
                onClick={() => {
                  setShowCheckOutCalendar(!showCheckOutCalendar);
                  setShowCheckInCalendar(false); // Close other calendar
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOutDate && isValid(checkOutDate) ? format(checkOutDate, "PPP") : <span>Pick a date</span>}
              </Button>
              {showCheckOutCalendar && (
                <Calendar
                  mode="single"
                  selected={checkOutDate}
                  onSelect={(date) => {
                    setCheckOutDate(date);
                    setShowCheckOutCalendar(false);
                  }}
                  disabled={(date) => (checkInDate && date <= checkInDate) || date < new Date(new Date().setHours(0,0,0,0))}
                  initialFocus
                  className="rounded-md border mt-1" // Add some styling
                />
              )}
            </div>
          </div>
          {/* Price Range (Using Inputs) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-price">Min Price (฿)</Label>
              <Input
                id="min-price"
                type="number"
                placeholder="Any"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-price">Max Price (฿)</Label>
              <Input
                id="max-price"
                type="number"
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                min="0"
              />
            </div>
          </div>

          {/* Price Range (Using Slider - Optional Alternative) */}
          {/* <div className="space-y-4">
            <Label>Price Range (฿)</Label>
            <div className="flex justify-between text-sm text-muted-foreground">
                <span>฿{priceRange[0]}</span>
                <span>฿{priceRange[1]}{priceRange[1] === 1000 ? '+' : ''}</span>
            </div>
            <Slider
              defaultValue={[0, 1000]}
              min={0}
              max={1000} // Adjust max as needed
              step={10}
              value={priceRange}
              onValueChange={handleSliderChange}
              minStepsBetweenThumbs={1} // Optional: prevent thumbs from overlapping
            />
          </div> */}

          {/* Amenities */}
          <div className="space-y-2">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
              {amenityList.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity.id}
                    checked={selectedAmenities.includes(amenity.id)}
                    onCheckedChange={() => handleAmenityChange(amenity.id)}
                  />
                  <Label
                    htmlFor={amenity.id}
                    className="flex items-center gap-2 font-normal cursor-pointer"
                  >
                    <amenity.icon className="h-4 w-4 text-muted-foreground" />
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Booking Options */}
          <div className="space-y-2">
            <Label>Booking Options</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                  id="instant-bookable"
                  checked={instantBookable}
                  onCheckedChange={setInstantBookable}
                />
                <Label htmlFor="instant-bookable" className="font-normal cursor-pointer"

              >
                Instant Bookable
              </Label>
            </div>
            {/* Add more booking options here if needed */}
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 sm:justify-between">
          {" "}
          {/* Adjust footer layout */}
          <Button type="button" variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="button" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default FilterModal;
