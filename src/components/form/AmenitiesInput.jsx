// /Users/duke/Documents/GitHub/RentKub/client/src/components/form/AmenitiesInput.jsx
import React from "react";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// Import icons from lucide-react
import {
  Wifi,
  UtensilsCrossed, // Represents Kitchen
  Car, // Represents Parking
  Waves, // Represents Pool
  ThermometerSnowflake, // Represents Hot Tub (or similar concept)
  Dog, // Represents Pets Allowed
  Beef, // Represents BBQ Grill
  Flame, // Represents Fire Pit
  ShowerHead, // Represents Showers
  Toilet, // Represents Toilets (or use icons like 'Bath')
  Zap, // Represents Electricity
  Droplets, // Represents Water
} from "lucide-react";

// Update AMENITIES_OPTIONS to include an icon component for each
const AMENITIES_OPTIONS = [
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
  { id: "parking", label: "Free Parking", icon: Car },
  { id: "pool", label: "Pool", icon: Waves },
  { id: "hot_tub", label: "Hot Tub", icon: ThermometerSnowflake },
  { id: "pets_allowed", label: "Pets Allowed", icon: Dog },
  { id: "bbq_grill", label: "BBQ Grill", icon: Beef },
  { id: "fire_pit", label: "Fire Pit", icon: Flame },
  { id: "showers", label: "Showers", icon: ShowerHead },
  { id: "toilets", label: "Toilets", icon: Toilet },
  { id: "electricity", label: "Electricity Hookup", icon: Zap },
  { id: "water", label: "Water Hookup", icon: Droplets },
];

const AmenitiesInput = ({ control, name = "amenities", errors }) => {
  const error = errors?.[name];

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">What this place offers</Label>

      <Controller
        name={name}
        control={control}
        defaultValue={[]}
        render={({ field }) => (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {AMENITIES_OPTIONS.map((amenity) => {
              // Dynamically get the Icon component
              const IconComponent = amenity.icon;
              const checkboxId = `${name}-${amenity.id}`; // Define ID for linking

              return (
                <div key={amenity.id} className="flex items-start space-x-2">
                  {" "}
                  {/* Use items-start for better alignment if text wraps */}
                  <Checkbox
                    id={checkboxId} // Assign the ID here
                    checked={field.value?.includes(amenity.id)}
                    onCheckedChange={(checked) => {
                      const currentValues = field.value || [];
                      if (checked) {
                        field.onChange([...currentValues, amenity.id]);
                      } else {
                        field.onChange(
                          currentValues.filter((value) => value !== amenity.id)
                        );
                      }
                    }}
                    className={cn("mt-1", error && "border-red-500")} // Add margin-top to align with text
                  />
                  {/* Make the Label clickable and associate it with the checkbox */}
                  <Label
                    htmlFor={checkboxId} // Link label to checkbox
                    className="flex items-center gap-2 text-sm font-normal cursor-pointer" // Add gap for spacing
                  >
                    {/* Render the icon */}
                    {IconComponent && (
                      <IconComponent className="h-5 w-5 flex-shrink-0" />
                    )}{" "}
                    {/* Add flex-shrink-0 */}
                    <span>{amenity.label}</span>{" "}
                    {/* Wrap text in span if needed */}
                  </Label>
                </div>
              );
            })}
          </div>
        )}
      />
      {error && <p className="text-sm text-red-500 mt-1">{error.message}</p>}
    </div>
  );
};

export default AmenitiesInput;
