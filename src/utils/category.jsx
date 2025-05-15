import {
  Tent,
  House,
  Mountain,
  Store,
  Utensils,
  Hotel,
  Bed,
  Home,        // For Cabins (using Home as an alternative to LogCabin)
  Trees,       // For Treehouses
  Waves,       // For Beach / Lakefront (can be distinguished by label)
  Sprout,      // For Farms
  Sailboat,    // For Boats
  Castle,      // For Castles
  Droplet,     // For Lakefront (alternative to Waves if Beach uses Waves)
  Snowflake,   // For Skiing
  Sun,         // For Tropical (using Sun as an alternative to PalmTree)
  Caravan,     // For Campers/RVs
  Globe2,      // For Islands (using Globe2 as an alternative)
  AppWindow,   // For Domes (representing a dome-like structure)
  Wind,        // For Windmills
} from "lucide-react";

export const categories = [
  {
    label: "camping",
    icon: Tent,
  },
  {
    label: "house",
    icon: House,
  },
  {
    label: "hotel",
    icon: Hotel,
  },
  {
    label: "hostel",
    icon: Bed,
  },
  {
    label: "mountain", // Corrected typo
    icon: Mountain,
  },
  {
    label: "store",
    icon: Store,
  },
  {
    label: "food",
    icon: Utensils,
  },
  {
    label: "cabins",
    icon: Home, // Changed from LogCabin
  },
  {
    label: "treehouses",
    icon: Trees,
  },
  {
    label: "beach",
    icon: Waves,
  },
  {
    label: "farms",
    icon: Sprout,
  },
  {
    label: "boats",
    icon: Sailboat,
  },
  {
    label: "castles",
    icon: Castle,
  },
  {
    label: "lakefront",
    icon: Droplet,
  },
  {
    label: "skiing",
    icon: Snowflake,
  },
  {
    label: "tropical",
    icon: Sun, // Changed from PalmTree
  },
  {
    label: "campers",
    icon: Caravan,
  },
  {
    label: "islands",
    icon: Globe2,
  },
  {
    label: "domes",
    icon: AppWindow, // Using AppWindow as a visual for dome-like structures
  },
  {
    label: "windmills",
    icon: Wind,
  },
];
