import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { useAuth } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Import Select components
import { Checkbox } from "@/components/ui/checkbox"; // Import Checkbox
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { AlertCircle, Loader2, Trash2 } from "lucide-react"; // <-- Removed X, UploadCloud
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CampingSchema } from "@/utils/schemas";
import FormUploadImage from "@/components/form/FormUploadImage"; // <-- Import FormUploadImage

// --- Leaflet Imports ---
// --- Leaflet imports are now handled within FormMapInput ---
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
// Import API functions
// TODO: Rename camping API functions to landmark if applicable, or keep as is if backend uses 'camping' term generically
import { readCamping, updateCamping, deleteCamping } from "@/api/camping"; // <-- Import deleteCamping
// Import categories
import { categories as availableCategories } from "@/utils/category";
// Import amenities
import { amenityList as availableAmenities } from "@/utils/amenities"; // <-- Import the amenity list
import { createNotify } from "@/utils/createAlert"; // <-- Import createNotify
import FormMapInput from "@/components/map/FormMapInput";
const DEFAULT_LAT = 13.7563;
const DEFAULT_LNG = 100.5018;

// Helper function to safely parse amenities from potentially corrupted string data
const parseAmenities = (amenitiesData) => {
  if (Array.isArray(amenitiesData)) {
    // Already an array, return as is (ensure elements are strings)
    return amenitiesData.filter((item) => typeof item === "string");
  }
  if (typeof amenitiesData === "string") {
    try {
      // Attempt to parse the string as JSON
      const parsed = JSON.parse(amenitiesData);
      if (Array.isArray(parsed)) {
        // Ensure all elements are strings - Added check for null/undefined items
        return parsed.filter((item) => typeof item === "string");
      }
    } catch (e) {
      // Log an error if parsing fails, but don't crash
      console.warn(
        "Failed to parse amenities string, defaulting to empty array:",
        amenitiesData,
        e
      );
    }
  }
  // Default to empty array if not an array or unparseable string
  return [];
};

const UpdateLandmark = () => {
  const { id: landmarkId } = useParams(); // Get landmark ID from URL
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit: rhfHandleSubmit,
    formState: { errors: formErrors, isSubmitting },
    setValue,
    getValues,
    watch,
    reset,
    control, // Keep if you plan to use Controller for some inputs
  } = useForm({
    resolver: zodResolver(CampingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "", // Zod coerces to number
      category: "",
      lat: null, // Zod coerces to number or null
      lng: null, // Zod coerces to number or null
      images: [],
      amenities: [],
      totalRooms: "", // Zod coerces to number
      maxGuests: "", // Zod coerces to number
      bedrooms: "", // Zod coerces to number
      beds: "", // Zod coerces to number
      baths: "", // Zod coerces to number
    },
  });

  const [landmarkData, setLandmarkData] = useState(null); // To store fetched landmark data
  const [isLoading, setIsLoading] = useState(true); // Start loading initially
  const [isDeleting, setIsDeleting] = useState(false); // <-- State for delete operation
  const [submitError, setSubmitError] = useState(null); // Specific error state for submission
  const [mapPosition, setMapPosition] = useState([DEFAULT_LAT, DEFAULT_LNG]); // For map center

  useEffect(() => {
    const fetchLandmark = async () => {
      setIsLoading(true);
      setSubmitError(null);
      try {
        console.log(`Fetching landmark with ID: ${landmarkId}...`);
        const response = await readCamping(landmarkId);

        // --- Add check for response.data and response.data.result ---
        if (!response.data || !response.data.result) {
          console.error("API response missing data or result:", response);
          throw new Error("Landmark data not found in API response.");
        }

        const fetchedData = response.data.result;
        // Store the original data if needed

        // --- Safely parse amenities ---
        const parsedAmenities = parseAmenities(fetchedData.amenities);

        // --- Populate form with ALL fetched data using reset ---
        const initialFormData = {
          title: fetchedData.title || "",
          description: fetchedData.description || "",
          price: fetchedData.price?.toString() || "", // Ensure price is a string for input
          category:
            fetchedData.category ||
            (availableCategories.length > 0
              ? availableCategories[0].label // Default to the *label*
              : ""), // Default to the *label* (which is used as value here)
          lat: fetchedData.lat, // Keep as number or null
          lng: fetchedData.lng, // Keep as number or null
          images: Array.isArray(fetchedData.images) ? fetchedData.images : [], // Ensure images is an array
          amenities: parsedAmenities, // Use the safely parsed array
          totalRooms: fetchedData.totalRooms?.toString() || "0",
          maxGuests: fetchedData.maxGuests?.toString() || "0",
          bedrooms: fetchedData.bedrooms?.toString() || "0",
          beds: fetchedData.beds?.toString() || "0",
          baths: fetchedData.baths?.toString() || "0",
        };
        reset(initialFormData);
        setLandmarkData(fetchedData); // Still useful for displaying title, etc.
        // Set map position based on fetched data or default
        const lat = parseFloat(fetchedData.lat) || DEFAULT_LAT;
        const lng = parseFloat(fetchedData.lng) || DEFAULT_LNG;
        setMapPosition([lat, lng]);
      } catch (err) {
        console.error("Failed to fetch landmark:", err);
        setSubmitError(err.message || "Could not load landmark data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLandmark();
  }, [landmarkId, getToken]);

  // --- Specific handler for Select component ---
  const handleCategoryChange = (value) => {
    setValue("category", value, { shouldValidate: true });
  };

  // --- Specific handler for Checkbox group (Amenities) ---
  const handleAmenityChange = (amenityId, checked) => {
    const currentAmenities = getValues("amenities") || [];
    const newAmenities = checked
      ? [...currentAmenities, amenityId]
      : currentAmenities.filter((item) => item !== amenityId);
    setValue("amenities", newAmenities, { shouldValidate: true });
  };

  // --- Handler for updating Lat/Lng from FormMapInput ---
  const handleLocationChange = useCallback(
    (newLat, newLng) => {
      setValue("lat", parseFloat(newLat) || null, { shouldValidate: true });
      setValue("lng", parseFloat(newLng) || null, { shouldValidate: true });
    },
    [setValue]
  );

  const onFormSubmit = async (data) => {
    // 'data' is validated by Zod schema
    setSubmitError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");

      // Data from react-hook-form is already processed by Zod schema,
      // so types for price, lat, lng, totalRooms etc. should be correct.
      const dataToSubmit = {
        ...data, // Spread validated data
        // Ensure images are correctly handled if FormUploadImage modifies them
        // images: getValues("images"), // Or directly from 'data.images'
      };

      console.log("Submitting update for landmark:", landmarkId, dataToSubmit);
      await updateCamping(token, landmarkId, dataToSubmit);

      createNotify("success", "Landmark updated successfully!"); // Use createNotify
      // Optionally navigate back or show success message
      navigate("/user/host-dashboard"); // Navigate back after successful update
    } catch (err) {
      console.error("Failed to update landmark:", err);
      setSubmitError(err.message || "Could not update landmark.");
    }
  };

  // --- Handler for Deleting Landmark ---
  const handleDelete = async () => {
    // Confirmation dialog
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this landmark? This action cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    setSubmitError(null);
    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required.");

      console.log(`Deleting landmark with ID: ${landmarkId}...`);
      await deleteCamping(token, landmarkId); // Call the delete API function

      createNotify("success", "Landmark deleted successfully!"); // Use createNotify
      navigate("/user/host-dashboard"); // Navigate back after successful deletion
    } catch (err) {
      console.error("Failed to delete landmark:", err);
      setSubmitError(
        err.message || "Could not delete landmark. Please try again."
      );
      // Ensure error is displayed near the buttons or at the top
    } finally {
      setIsDeleting(false);
    }
  };

  const watchedLat = watch("lat");
  const watchedLng = watch("lng");

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading Landmark Details...</span>
      </div>
    );
  }

  if (submitError && !landmarkData && !isSubmitting) {
    // Show general load error if submitError exists and not from a submit action
    // Show error only if loading failed completely
    return (
      <div className="container mx-auto p-4 text-center text-destructive">
        <AlertCircle className="h-10 w-10 mx-auto mb-2" />
        <p>Error: {submitError}</p>
        <Button
          variant="outline"
          onClick={() => navigate("/user/host-dashboard")}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (!landmarkData) {
    // Should ideally be covered by loading/error states, but as a fallback
    return <div className="container mx-auto p-4">Landmark not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Update Landmark Details</CardTitle>
          <CardDescription>
            Edit the details for your landmark: {landmarkData?.title}
          </CardDescription>
        </CardHeader>
        <form onSubmit={rhfHandleSubmit(onFormSubmit)}>
          <CardContent className="space-y-4">
            {submitError &&
              !isSubmitting && ( // Display submission errors here
                <p className="text-sm text-destructive text-center bg-destructive/10 p-2 rounded-md">
                  {submitError}
                </p>
              )}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="e.g., Cozy Lakeside Cabin"
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">
                  {formErrors.title.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Describe your landmark..."
                rows={4}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">
                  {formErrors.description.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per night (THB)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                {...register("price")}
                placeholder="e.g., 1500"
              />
              {formErrors.price && (
                <p className="text-sm text-destructive">
                  {formErrors.price.message}
                </p>
              )}
            </div>
            {/* --- New Fields for Rooms, Guests, Bedrooms, Beds, Baths --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalRooms">Total Rooms/Units</Label>
                <Input
                  id="totalRooms"
                  name="totalRooms"
                  type="number"
                  {...register("totalRooms")}
                  placeholder="e.g., 1"
                />
                {formErrors.totalRooms && (
                  <p className="text-sm text-destructive">
                    {formErrors.totalRooms.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxGuests">Max Guests</Label>
                <Input
                  id="maxGuests"
                  type="number"
                  {...register("maxGuests")}
                  placeholder="e.g., 4"
                />
                {formErrors.maxGuests && (
                  <p className="text-sm text-destructive">
                    {formErrors.maxGuests.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  {...register("bedrooms")}
                  placeholder="e.g., 2"
                />
                {formErrors.bedrooms && (
                  <p className="text-sm text-destructive">
                    {formErrors.bedrooms.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="beds">Beds</Label>
                <Input
                  id="beds"
                  type="number"
                  {...register("beds")}
                  placeholder="e.g., 3"
                />
                {formErrors.beds && (
                  <p className="text-sm text-destructive">
                    {formErrors.beds.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                {" "}
                {/* Baths can span full width if it's the last in a row or alone */}
                <Label htmlFor="baths">Bathrooms</Label>
                <Input
                  id="baths"
                  type="number"
                  {...register("baths")}
                  placeholder="e.g., 1"
                />
                {formErrors.baths && (
                  <p className="text-sm text-destructive">
                    {formErrors.baths.message}
                  </p>
                )}
              </div>
            </div>
            {/* --- Category Select --- */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                name="category"
                value={watch("category")}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select a category" />{" "}
                  {/* Let SelectValue handle display */}
                  {/* Display the found label */}
                </SelectTrigger>
                <SelectContent className="z-1000">
                  {" "}
                  {/* Add z-index */}
                  {availableCategories.map(
                    (
                      cat // Use label as key and value
                    ) => (
                      <SelectItem key={cat.label} value={cat.label}>
                        <div className="flex items-center">
                          {cat.icon && (
                            <cat.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                          )}{" "}
                          {/* Render icon */}
                          <span>{cat.label}</span> {/* Display label */}
                        </div>
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {formErrors.category && (
                <p className="text-sm text-destructive">
                  {formErrors.category.message}
                </p>
              )}
            </div>
            {/* --- Map Section --- */}
            {/* --- Use the new FormMapInput component --- */}
            <FormMapInput
              // Pass watched lat/lng or default if null/undefined
              lat={watchedLat?.toString() ?? ""}
              lng={watchedLng?.toString() ?? ""}
              onLocationChange={handleLocationChange}
            />
            {/* --- Old map code removed ---
                  <MapContainer
                    center={mapPosition} // Use state for initial center
                    key={mapPosition.join(",")} // Force re-render when position changes drastically
                    zoom={13}
                    scrollWheelZoom={true} // Allow scroll wheel zoom
                    style={{ height: "100%", width: "100%" }}
                    whenReady={() => {
                      // Optional: Recenter map if fetched data comes after initial render
                      // This might cause a jump, consider if needed.
                      // const lat = parseFloat(formData.lat) || DEFAULT_LAT;
                      // const lng = parseFloat(formData.lng) || DEFAULT_LNG;
                      // setMapPosition([lat, lng]);
                    }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <LocationMarker />{" "}
                  </MapContainer>
            {(formErrors.lat || formErrors.lng) && (
              <p className="text-sm text-destructive mt-1">{formErrors.lat?.message || formErrors.lng?.message || "Please select a valid location on the map."}</p>
            )}
            --- End of old map code --- */}
            {/* --- Amenities Checkboxes --- */}
            <div className="space-y-2">
              <Label>Amenities</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableAmenities.map(
                  (
                    amenity // Iterate over imported list
                  ) => (
                    <div
                      key={amenity.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`amenity-${amenity.id}`}
                        checked={watch("amenities")?.includes(amenity.id)} // Check based on amenity ID
                        onCheckedChange={(checked) =>
                          handleAmenityChange(amenity.id, checked)
                        } // Pass amenity ID
                      />
                      {/* Optionally include the icon */}
                      {amenity.icon && (
                        <amenity.icon className="h-4 w-4 text-muted-foreground" />
                      )}
                      <Label
                        htmlFor={`amenity-${amenity.id}`}
                        className="font-normal"
                      >
                        {amenity.label}
                      </Label>{" "}
                      {/* Use amenity label */}
                    </div>
                  )
                )}
              </div>
              {formErrors.amenities && (
                <p className="text-sm text-destructive">
                  {formErrors.amenities.message}
                </p>
              )}
            </div>

            {/* --- Image Management Section --- */}
            <div className="space-y-2">
              {/* Replace manual image handling with FormUploadImage */}
              <FormUploadImage
                name="images"
                setValue={setValue}
                getValues={getValues}
                errors={formErrors} // Pass react-hook-form errors
              />
              {formErrors.images && (
                <p className="text-sm text-destructive">
                  {formErrors.images.message}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter className="mt-4">
            <Button type="submit" disabled={isSubmitting || isDeleting}>
              {" "}
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/user/host-dashboard")}
              className="ml-2"
              disabled={isSubmitting || isDeleting} // Disable during delete too
            >
              Cancel
            </Button>
            {/* --- Delete Button --- */}
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="ml-auto" // Push to the right
              disabled={isSubmitting || isDeleting} // Disable during update or delete
            >
              {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> // Show spinner when deleting
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}{" "}
              {/* Show icon */}
              {isDeleting ? "Deleting..." : "Delete Landmark"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default UpdateLandmark;
