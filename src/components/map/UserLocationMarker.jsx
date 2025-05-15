import { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import { Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import { Button } from "@/components/ui/button"; // Assuming you have a Button component
import { LocateFixed, AlertCircle } from "lucide-react"; // Icons for button and error
import useCampingStore from "@/store/camping-store"; // Import Zustand store

// Optional: Custom icon for user location
const userLocationIcon = new L.Icon({
  iconUrl: "/user-location-marker.png", // Provide a path to your custom marker image
  iconSize: [25, 41], // size of the icon
  iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
  popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png", // Optional shadow
  shadowSize: [41, 41],
});

const UserLocationMarker = () => {
  const map = useMap();
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const setUserLocation = useCampingStore((state) => state.setUserLocation); // Get action from store
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLocateClick = () => {
    setIsLoading(true);
    setError(null);
    setPosition(null); // Clear previous location
    setAccuracy(null);
    // Request location, fly to it, and set max zoom
    map.locate({ setView: true, maxZoom: 16, enableHighAccuracy: true });
  };

  useEffect(() => {
    const onLocationFound = (e) => {
      setPosition(e.latlng);
      setAccuracy(e.accuracy);
      setUserLocation(e.latlng); // <-- Save location to store
      setIsLoading(false);
      setError(null);
      // Optional: Fly to the location again if setView didn't work as expected initially
      // map.flyTo(e.latlng, map.getZoom());
    };

    const onLocationError = (e) => {
      setError(e.message || "Could not find your location.");
      setIsLoading(false);
      setUserLocation(null); // Clear location on error
    };

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    // Cleanup listeners on component unmount
    return () => {
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
    };
  }, [map, setUserLocation]); // Dependency array includes map instance and setUserLocation

  return (
    <>
      {/* Button to trigger location */}
      <Button
        variant="outline"
        size="icon"
        className="absolute bottom-4 right-4 z-[1000] bg-white hover:bg-gray-100 shadow-md" // Position the button
        onClick={handleLocateClick}
        disabled={isLoading}
        title="Find my location"
      >
        <LocateFixed
          className={`h-5 w-5 ${isLoading ? "animate-pulse" : ""}`}
        />
      </Button>

      {/* Display Marker and Accuracy Circle */}
      {position && !error && (
        <>
          <Circle
            center={position}
            radius={accuracy}
            pathOptions={{ color: "red", fillColor: "black", fillOpacity: 0.1 }}
          />
          <Marker
            position={
              position
            } /* icon={userLocationIcon} // Optional custom icon */
          >
            <Popup>
              You are within {accuracy?.toFixed(0)} meters from this point.
            </Popup>
          </Marker>
        </>
      )}

      {/* Display Error Message */}
      {error && (
        <div className="absolute bottom-16 right-4 z-[1000] bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded shadow-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </>
  );
};

export default UserLocationMarker;
