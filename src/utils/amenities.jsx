// src/utils/amenities.js
import {
    Wifi,
    UtensilsCrossed,
    Car,
    Waves,
    ThermometerSnowflake,
    Dog,
    Beef,
    Flame,
    ShowerHead,
    Bath, // Using Bath for Toilet representation
    Zap,
    Droplets,
  } from "lucide-react";
  
  export const amenityList = [
    { id: "wifi", label: "Wifi", icon: Wifi },
    { id: "kitchen", label: "Kitchen", icon: UtensilsCrossed },
    { id: "parking", label: "Parking", icon: Car },
    { id: "pool", label: "Pool", icon: Waves },
    { id: "hot_tub", label: "Hot Tub", icon: ThermometerSnowflake },
    { id: "pets_allowed", label: "Pets Allowed", icon: Dog },
    { id: "bbq_grill", label: "BBQ Grill", icon: Beef },
    { id: "fire_pit", label: "Fire Pit", icon: Flame },
    { id: "showers", label: "Showers", icon: ShowerHead },
    { id: "toilets", label: "Toilets", icon: Bath },
    { id: "electricity", label: "Electricity", icon: Zap },
    { id: "water", label: "Water", icon: Droplets },
  ];
  
  // Helper to get icon component by id
  export const getAmenityIcon = (id) => {
    const amenity = amenityList.find((a) => a.id === id);
    return amenity ? amenity.icon : null;
  };
  