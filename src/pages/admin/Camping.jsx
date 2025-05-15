// /Users/duke/Documents/GitHub/RentKub/client/src/pages/admin/Camping.jsx
import FormInputs from "@/components/form/FormInputs";
import TextAreaInput from "@/components/form/TextAreaInput";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Buttons from "@/components/form/Buttons";
import CategoryInput from "@/components/form/CategoryInput";
import FormMapInput from "@/components/map/FormMapInput"; // <-- Import FormMapInput
import { createCamping } from "@/api/camping";
import AmenitiesInput from "@/components/form/AmenitiesInput";
import { useAuth } from "@clerk/clerk-react";
import FormUploadImage from "@/components/form/FormUploadImage"; // Correct component
import { createAlert } from "@/utils/createAlert";
import Breadcrums from "@/components/campings/Breadcrums"; // <-- Import Breadcrums
import { useEffect, useCallback } from "react"; // <-- Add useCallback
import { CampingSchema } from "@/utils/schemas"; // <-- Ensure this path is correct

const Camping = () => {
  const { getToken, userId } = useAuth();

  const {
    register,
    handleSubmit,
    formState,
    setValue,
    reset,
    watch,
    control,
    getValues, // <-- Add getValues
  } = useForm({
    resolver: zodResolver(CampingSchema),
    defaultValues: {
      title: "",
      price: "", // Keep as string initially, Zod coerces
      description: "",
      category: "",
      totalRooms: "", // <-- Add totalRooms
      maxGuests: "", // <-- Add maxGuests
      bedrooms: "", // <-- Add bedrooms
      beds: "", // <-- Add beds
      baths: "", // <-- Add baths
      images: [], // <-- Changed from image: "" to images: []
      amenities: [], // Array of amenity IDs
      lat: null, // Initialize lat directly
      lng: null, // Initialize lng directly
    },
  });
  const { errors, isSubmitting } = formState;

  // --- Debugging: Log validation errors ---
  useEffect(() => {
    if (Object.keys(errors).length > 0) {
      console.error("🔴 Form Validation Errors:", errors);
    }
  }, [errors]);
  // --- End Debugging ---

  // --- Watch lat/lng for FormMapInput ---
  const watchedLat = watch("lat");
  const watchedLng = watch("lng");

  // --- Handler for updating location from FormMapInput ---
  const handleLocationChange = useCallback(
    (newLat, newLng) => {
      // Parse to float and set individual fields
      const parsedLat = parseFloat(newLat) || null; // Default to null if parsing fails
      const parsedLng = parseFloat(newLng) || null; // Default to null if parsing fails
      setValue("lat", parsedLat, { shouldValidate: true });
      setValue("lng", parsedLng, { shouldValidate: true });
      console.log("Location updated:", { lat: parsedLat, lng: parsedLng });
    },
    [setValue]
  );
  // --- End Location Handling ---

  const hdlSubmit = async (data) => {
    console.log("✅ hdlSubmit triggered with validated data:", data); // data.images should be an array now

    let token;
    try {
      console.log("1. Attempting to get auth token...");
      token = await getToken();
      if (!token) {
        console.error("❌ Failed: Authentication token not found.");
        createAlert(
          "error",
          "Authentication token not found. Please log in again."
        );
        return;
      }
      console.log("   Auth token retrieved successfully.");
    } catch (error) {
      console.error("❌ Error getting auth token:", error);
      createAlert("error", "Failed to get authentication token.");
      return;
    }

    if (!userId) {
      console.error("❌ Failed: User ID not found.");
      createAlert("error", "User ID not found. Please log in again.");
      return;
    }
    console.log("2. User ID found:", userId);

    // Prepare data for the API - price is coerced by Zod, images is already an array
    const dataToSend = {
      ...data,
      userId: userId,
      // lat and lng should now be numbers directly from the validated 'data' object
      // Zod coerce handles price
    };

    console.log("3. Preparing to send data to backend:", dataToSend);

    try {
      console.log("4. Calling createCamping API...");
      const req = await createCamping(token, dataToSend); // Ensure createCamping API function sends dataToSend correctly
      console.log("✅ API call successful. Response:", req.data);
      reset(); // Reset form on success
      createAlert("success", "Camping spot created successfully!");
    } catch (err) {
      console.error("❌ API call failed. Error:", err);
      let errorMessage =
        "An unknown error occurred while creating the camping spot.";
      if (err.response) {
        console.error("   Backend Error Response Data:", err.response.data);
        console.error("   Backend Error Response Status:", err.response.status);
        errorMessage = `Server error: ${err.response.status}. ${
          err.response.data?.message || "Please check server logs."
        }`;
      } else if (err.request) {
        console.error("   No response received:", err.request);
        errorMessage =
          "No response from server. Check network connection and if the server is running.";
      } else {
        console.error("   Error setting up request:", err.message);
        errorMessage = `Request setup error: ${err.message}`;
      }
      createAlert("error", `Failed to create camping: ${errorMessage}`);
    }
  };

  // --- Breadcrumb Items ---
  const breadcrumbItems = [
    { label: "Become a host" }, // Only show the current page
  ];

  return (
    <section className="p-4 md:p-6 space-y-6"> {/* Added padding and spacing like other admin pages */}
      <div className="mb-4"> {/* Optional: Add some margin below breadcrumbs */}
        <Breadcrums items={breadcrumbItems} />
      </div>
      <h1 className="capitalize text-2xl font-semibold mb-4">Create your listing</h1>
      <div className="border p-8 rounded-md bg-white shadow-sm">
        <form
          onSubmit={handleSubmit(hdlSubmit)}
          className="space-y-6"
          noValidate
        >
          <div className="grid md:grid-cols-2 gap-6">
            {/* Title Input */}
            <FormInputs
              register={register}
              name="title"
              type="text"
              placeholder="e.g., Lakeside Serenity Camp"
              errors={errors}
              label="Camping Title"
            />

            {/* Price Input */}
            <FormInputs
              register={register}
              name="price"
              type="number"
              placeholder="e.g., 50"
              errors={errors}
              label="Price (per night)"
              step="0.01" // Optional: for currency
            />

            {/* Total Rooms/Sites Input */}
            <FormInputs
              register={register}
              name="totalRooms" // <-- Use the new field name
              type="number"
              placeholder="e.g., 10"
              errors={errors}
              label="Total Available Sites/Units"
            />

            {/* Max Guests Input */}
            <FormInputs
              register={register}
              name="maxGuests"
              type="number"
              placeholder="e.g., 4"
              errors={errors}
              label="Maximum Guests"
            />

            {/* Bedrooms Input */}
            <FormInputs
              register={register}
              name="bedrooms"
              type="number"
              placeholder="e.g., 2"
              errors={errors}
              label="Number of Bedrooms"
            />

            {/* Beds Input */}
            <FormInputs
              register={register}
              name="beds"
              type="number"
              placeholder="e.g., 3"
              errors={errors}
              label="Number of Beds"
            />

            {/* Baths Input */}
            <FormInputs
              register={register}
              name="baths"
              type="number"
              placeholder="e.g., 1"
              errors={errors}
              label="Number of Bathrooms"
            />

            {/* Description Input */}
            <div className="md:col-span-2">
              <TextAreaInput
                register={register}
                name="description"
                placeholder="Describe the unique features of your camping spot..."
                errors={errors}
                label="Description"
              />
            </div>

            {/* Category Input */}
            <div className="space-y-2">
              <CategoryInput
                setValue={setValue}
                register={register}
                name="category"
                errors={errors}
                // control={control} // Pass control if needed
              />
            </div>

            {/* Image Upload - Pass necessary props */}
            <div className="space-y-2">
              <FormUploadImage
                setValue={setValue}
                getValues={getValues} // <-- Pass getValues
                name="images" // <-- Changed name to "images"
                errors={errors}
              />
              {/* Error display is now handled inside FormUploadImage */}
            </div>
          </div>

          {/* Amenities Section */}
          <div className="border-t pt-6">
            <AmenitiesInput
              control={control}
              name="amenities"
              errors={errors}
            />
            {/* Display amenities validation error if any */}
            {errors.amenities && !errors.amenities.message && (
              <p className="text-sm text-red-500 mt-1">
                Please select applicable amenities.
              </p>
            )}
            {errors.amenities && errors.amenities.message && (
              <p className="text-sm text-red-500 mt-1">
                {errors.amenities.message}
              </p>
            )}
          </div>

          {/* Map Section */}
          <div className="border-t pt-6">
            <h2 className="text-lg font-medium mb-2">Location</h2>
            <p className="text-sm text-gray-600 mb-4">
              Click on the map to set the camping spot's location.
            </p>
            {/* --- Use FormMapInput --- */}
            <FormMapInput
              // Pass lat/lng from watched form state or default if null
              lat={watchedLat ?? ""} // Pass watched lat or empty string
              lng={watchedLng ?? ""} // Pass watched lng or empty string
              onLocationChange={handleLocationChange}
            />
            {/* Display location validation error if any */}
            {(errors.lat || errors.lng) && (
              <p className="text-sm text-red-500 mt-1">
                {errors.lat?.message || errors.lng?.message || "Please select a valid location on the map."}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4 border-t mt-6">
            <Buttons
              type="submit"
              text="Complete Listing"
              isPending={isSubmitting}
            />
          </div>
        </form>
      </div>
    </section>
  );
};
export default Camping;
