// /Users/duke/Documents/GitHub/RentKub/client/src/components/form/FormMapInput.jsx
import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, X } from "lucide-react";
import "leaflet/dist/leaflet.css"; // Ensure Leaflet CSS is imported
import L from "leaflet"; // Import Leaflet library itself

// --- Fix for default Leaflet marker icon ---
// Solution found here: https://github.com/PaulLeCam/react-leaflet/issues/808
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});
// --- End fix ---

const DEFAULT_LAT = 13.7563;
const DEFAULT_LNG = 100.5018;

// --- Helper Component to Update Map View ---
const ChangeView = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (
      center &&
      center.length === 2 &&
      !isNaN(center[0]) &&
      !isNaN(center[1])
    ) {
      map.flyTo(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  return null;
};

// --- Helper Component for Map Click/Marker Logic ---
const LocationHandler = ({ position, onMapClick }) => {
  const map = useMapEvents({
    click(e) {
      onMapClick(e.latlng);
      map.flyTo(e.latlng, map.getZoom());
    },
  });

  // Ensure position is valid before rendering marker
  const isValidPosition =
    position && !isNaN(position[0]) && !isNaN(position[1]);

  return isValidPosition ? <Marker position={position} /> : null;
};

const FormMapInput = ({ lat, lng, onLocationChange, label = "Location" }) => {
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [isSearchingMap, setIsSearchingMap] = useState(false);
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [mapSearchError, setMapSearchError] = useState(null);

  // Derive map center from props, default if invalid
  const currentLat = parseFloat(lat) || DEFAULT_LAT;
  const currentLng = parseFloat(lng) || DEFAULT_LNG;
  const [mapCenter, setMapCenter] = useState([currentLat, currentLng]);

  // Update map center if props change externally (e.g., initial load)
  useEffect(() => {
    const newLat = parseFloat(lat) || DEFAULT_LAT;
    const newLng = parseFloat(lng) || DEFAULT_LNG;
    // Only update if significantly different to avoid jitter
    if (
      Math.abs(newLat - mapCenter[0]) > 0.0001 ||
      Math.abs(newLng - mapCenter[1]) > 0.0001
    ) {
      setMapCenter([newLat, newLng]);
    }
  }, [lat, lng]); // Removed mapCenter from dependencies

  // --- Debounced Map Search Effect ---
  useEffect(() => {
    if (!mapSearchQuery.trim()) {
      setMapSearchResults([]);
      setMapSearchError(null);
      return;
    }

    const performSearch = async () => {
      setIsSearchingMap(true);
      setMapSearchError(null);
      try {
        const response = await axios.get(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            mapSearchQuery
          )}&limit=5`
        );
        if (response.data && response.data.length > 0) {
          setMapSearchResults(response.data);
        } else {
          setMapSearchResults([]);
          setMapSearchError("Place not found. Try a different search term.");
        }
      } catch (err) {
        setMapSearchResults([]);
        console.error("Geocoding search failed:", err);
        setMapSearchError("Search failed. Check connection or try again.");
      } finally {
        setIsSearchingMap(false);
      }
    };

    // Use a timeout for debouncing
    const timerId = setTimeout(performSearch, 500); // 500ms delay

    return () => clearTimeout(timerId); // Cleanup timeout on unmount or query change
  }, [mapSearchQuery]);

  // --- Handler for updating Lat/Lng from map click ---
  const handleMapClick = useCallback(
    (latlng) => {
      const newLat = latlng.lat.toFixed(6);
      const newLng = latlng.lng.toFixed(6);
      onLocationChange(newLat, newLng); // Update parent state
      setMapSearchResults([]); // Clear search results
      setMapSearchError(null);
      // Map view update is handled by LocationHandler/ChangeView now
    },
    [onLocationChange]
  );

  // --- Handler for selecting a result from the search list ---
  const handleSelectSearchResult = useCallback(
    (result) => {
      const newLat = parseFloat(result.lat);
      const newLng = parseFloat(result.lon);
      onLocationChange(newLat.toFixed(6), newLng.toFixed(6)); // Update parent state
      setMapCenter([newLat, newLng]); // Update map center state directly
      setMapSearchQuery(result.display_name); // Update search input
      setMapSearchResults([]); // Clear results list
      setMapSearchError(null);
    },
    [onLocationChange]
  );

  return (
    <div className="space-y-2">
      <Label>{label} (Search or click map to set)</Label>
      {/* Search Input for Map */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search for a place..."
          value={mapSearchQuery}
          onChange={(e) => setMapSearchQuery(e.target.value)}
          className="pr-10"
        />
        {isSearchingMap && (
          <Loader2 className="absolute right-8 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!isSearchingMap && mapSearchQuery && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7"
            onClick={() => {
              setMapSearchQuery("");
              setMapSearchResults([]);
              setMapSearchError(null);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Display Search Results */}
      {mapSearchQuery.trim() &&
        mapSearchResults.length > 0 &&
        !isSearchingMap && (
          <div className="relative z-[2000]">
            {" "}
            {/* Ensure results are above map */}
            <div className="absolute w-full max-w-xs overflow-y-auto border rounded-md max-h-40 bg-background shadow-lg">
              <ul className="divide-y divide-border">
                {mapSearchResults.map((result) => (
                  <li key={result.place_id}>
                    <button
                      type="button"
                      className="w-full text-left p-2 text-sm hover:bg-muted cursor-pointer"
                      onClick={() => handleSelectSearchResult(result)}
                    >
                      {result.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

      {/* Display Map Search Error or "No Results" */}
      {mapSearchQuery.trim() &&
        !isSearchingMap &&
        mapSearchResults.length === 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {mapSearchError || "No results found for your search."}
          </p>
        )}
      {mapSearchError && !mapSearchQuery.trim() && (
        <p className="text-sm text-destructive mt-1">{mapSearchError}</p>
      )}

      {/* Display current Lat/Lng */}
      <p className="text-sm text-muted-foreground">
        Lat: {lat || "N/A"}, Lng: {lng || "N/A"}
      </p>

      {/* Map Container */}
      <div className="h-64 w-full rounded border overflow-hidden z-0">
        {" "}
        {/* Ensure map is behind results */}
        <MapContainer
          center={mapCenter}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          key={mapCenter.join(",")} // Force re-render if center changes drastically
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ChangeView center={mapCenter} />
          <LocationHandler position={mapCenter} onMapClick={handleMapClick} />
        </MapContainer>
      </div>
      <p className="text-xs text-muted-foreground">
        Search for a place or click on the map to set the exact latitude and
        longitude.
      </p>
    </div>
  );
};

export default FormMapInput;
