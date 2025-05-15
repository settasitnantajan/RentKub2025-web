import { MapContainer, useMap } from "react-leaflet";
import Layers from "./Layers";
import useCampingStore from "@/store/camping-store";
import UserLocationMarker from "./UserLocationMarker";
import MapSearchControl from "./MapSearchControl"; // Import the search control

const MyCenter = () => {
  const center = useCampingStore((state) => state.center);
  console.log(center);
  const map = useMap();

  if (!center) {
    return null;
  }

  map.flyTo(center, 10);

  return null;
};

const MapHome = () => {
  return (
    <div className="relative">
      {" "}
      {/* Add relative positioning for the absolute button */}
      <MapContainer
        className="h-[50vh] rounded-md z-0"
        center={[13, 100]}
        zoom={7}
        scrollWheelZoom={true}
      >
        <Layers />
        <MyCenter />
        <MapSearchControl /> {/* Add the search control here */}
        <UserLocationMarker /> {/* Add the user location component here */}
      </MapContainer>
    </div>
  );
};
export default MapHome;
