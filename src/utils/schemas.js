import { z } from "zod";

export const CampingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  price: z.coerce // Use coerce for number inputs from forms
    .number({ invalid_type_error: "Price must be a number" })
    .positive("Price must be positive"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.string().min(1, "Category is required"),
  lat: z.coerce.number(),
  lng: z.coerce.number(),
  images: z
    .array(z.any()) // Expect an array of valid URLs
    .min(1, "Please upload at least one image") // Minimum 1 image
    .max(8, "You can upload a maximum of 8 images"), // Maximum 8 images // Default to an empty array
  amenities: z
    .array(z.string()) // Expect an array of strings
    .optional() // Make it optional or add .min(1, "Select at least one amenity") if required
    .default([]), // Default to an empty array
  totalRooms: z.coerce
    .number({ invalid_type_error: "Total sites must be a number" })
    .int("Total sites must be a whole number")
    .positive("Total sites must be positive")
    .min(1, "At least one site/unit is required"),
  maxGuests: z.coerce
    .number({ invalid_type_error: "Max guests must be a number" })
    .int("Max guests must be a whole number")
    .positive("Must allow at least 1 guest"),
  bedrooms: z.coerce.number().int().nonnegative("Bedrooms cannot be negative"), // Allow 0 for studios etc.
  beds: z.coerce.number().int().positive("Must have at least 1 bed"),
  baths: z.coerce.number().int().nonnegative("Baths cannot be negative"), // Allow 0 if applicable
});

export const ProfileSchema = z.object({
  firstname: z
    .string()
    .min(2, "Firstname must be more than 2 charactor")
    .max(30, "Firstname must be less than 30 charactor"),
  lastname: z
    .string()
    .min(2, "Lastname must be more than 2 charactor")
    .max(30, "Lastname must be less than 30 charactor"),
  username: z.string()
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_.-]+$/, "Username can only contain letters, numbers, dots, underscores, or hyphens")
    .optional() // Make it optional if users don't have to set it immediately
    .or(z.literal('')), // Allows an empty string if it's optional and the user clears it
});
