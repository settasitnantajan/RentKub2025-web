// /Users/duke/Documents/GitHub/RentKub/client/src/components/form/FormUploadImage.jsx
import { resizeFile } from "@/utils/resizeimages";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useAuth } from "@clerk/clerk-react";
import { uploadImage } from "@/api/uploadfile"; // Assuming this API function exists and works
import { useState, useCallback } from "react";
import { RotateCw, XCircle } from "lucide-react";
import { Button } from "../ui/button";
import { createAlert } from "@/utils/createAlert";

const FormUploadImage = ({ name, setValue, getValues, errors }) => {
  const [isLoading, setIsLoading] = useState(false);
  const { getToken } = useAuth();

  const currentImages = getValues(name) || [];

  const hdlOnChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const token = await getToken();
    if (!token) {
      createAlert("error", "Authentication token not found.");
      return;
    }

    const currentImageCount = currentImages.length;
    const availableSlots = 8 - currentImageCount;

    if (files.length > availableSlots) {
      createAlert(
        "warning",
        `You can only upload ${availableSlots} more image(s). ${
          files.length - availableSlots
        } files were ignored.`
      );
      files.length = availableSlots; // Limit files to available slots
    }

    if (files.length === 0) return;

    setIsLoading(true);

    const uploadPromises = files.map(async (file) => {
      try {
        console.log(`Resizing file: ${file.name}`);
        const resizedImage = await resizeFile(file); // Returns base64 data
        console.log(`Uploading resized file: ${file.name}`);
        const res = await uploadImage(token, resizedImage);
        console.log(`Upload successful for ${file.name}:`, res.data);

        // --- MODIFICATION START ---
        // Extract the SECURE URL from the Cloudinary response object
        if (res.data && res.data.result && res.data.result.secure_url) { // <-- Check for secure_url
          return res.data.result.secure_url; // <-- Return the secure_url string
        } else {
          // Log a more specific error if secure_url is missing
          console.error("Upload response missing 'secure_url' in result:", res.data);
          return null; // Indicate failure for this file
        }
        // --- MODIFICATION END ---

      } catch (error) {
        console.error("Error uploading file:", file.name, error);
        if (error.response) {
          console.error("Upload error response:", error.response.data);
        }
        createAlert("error", `Failed to upload ${file.name}.`);
        return null; // Indicate failure
      }
    });

    try {
      const results = await Promise.all(uploadPromises);
      const successfulUrls = results.filter(
        (url) => typeof url === "string" && url.length > 0
      );

      if (successfulUrls.length > 0) {
        console.log("Adding successful URLs to form state:", successfulUrls);
        setValue(name, [...currentImages, ...successfulUrls], {
          shouldValidate: true,
        });
      }

      const failedCount = files.length - successfulUrls.length;
      if (failedCount > 0) {
        createAlert(
          "error",
          `Failed to upload ${failedCount} image(s). Please check console for details or try again.`
        );
      }
    } catch (error) {
      console.error("Error during batch upload processing:", error);
      createAlert(
        "error",
        "An unexpected error occurred during upload processing."
      );
    } finally {
      setIsLoading(false);
      e.target.value = null; // Reset file input
    }
  };

  const handleRemoveImage = useCallback(
    (indexToRemove) => {
      const updatedImages = currentImages.filter(
        (_, index) => index !== indexToRemove
      );
      setValue(name, updatedImages, { shouldValidate: true });
    },
    [currentImages, name, setValue]
  );

  return (
    <div className="space-y-3">
      <Label htmlFor="image-upload">
        Upload Images (Min: 1, Max: 8){" "}
        {isLoading && <RotateCw className="inline animate-spin ml-2 h-4 w-4" />}
      </Label>
      {/* Display Images */}
      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 border rounded-md">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={imageUrl}
                alt={`Camping image ${index + 1}`}
                className="object-cover w-full h-full rounded"
                onError={(e) => {
                  e.target.src = "/placeholder-image.png";
                  console.error(`Failed to load image: ${imageUrl}`);
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-70 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemoveImage(index)}
                aria-label={`Remove image ${index + 1}`}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* File Input */}
      {currentImages.length < 8 && (
        <Input
          id="image-upload"
          type="file"
          multiple
          onChange={hdlOnChange}
          accept="image/png, image/jpeg, image/gif, image/webp"
          disabled={isLoading || currentImages.length >= 8}
          className="mt-1"
        />
      )}
      {currentImages.length >= 8 && (
        <p className="text-sm text-muted-foreground">
          Maximum 8 images reached.
        </p>
      )}

      {/* Validation Errors */}
      {errors?.[name] && (
        <p className="text-sm text-red-500 mt-1">
          {errors[name]?.message || errors[name]?.root?.message}
        </p>
      )}
      {Array.isArray(errors?.[name]?.errors) &&
        errors[name].errors.map(
          (err, index) =>
            err?._errors?.[0] && (
              <p key={index} className="text-sm text-red-500 mt-1">
                Image {index + 1}: {err._errors[0]}
              </p>
            )
        )}
    </div>
  );
};
export default FormUploadImage;
