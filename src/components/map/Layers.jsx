import useCampingStore from "@/store/camping-store";
import {
  LayersControl,
  LayerGroup,
  Marker,
  Popup,
  TileLayer,
} from "react-leaflet";
import { formatNumber } from "@/utils/formats";
import L from "leaflet"; // Import Leaflet
import "leaflet/dist/leaflet.css"; // Ensure Leaflet's CSS is imported
import PopupContent from "./PopupContent"; // Import the new PopupContent component

const Layers = () => {
  const campings = useCampingStore((state) => state.campings);

  // Optional: Define a base class for styling in your CSS
  const priceMarkerStyle = `
    bg-white text-gray-800 font-bold text-sm
    px-2 py-1 rounded-full shadow-md border border-gray-300
    whitespace-nowrap
  `;
  return (
    <LayersControl>
      {/* --- Base Layers (OSM, Satellite) remain the same --- */}
      <LayersControl.BaseLayer name="OSM" checked>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </LayersControl.BaseLayer>
      <LayersControl.BaseLayer name="Satellite">
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
      </LayersControl.BaseLayer>

      <LayersControl.Overlay name="Landmark" checked>
        <LayerGroup>
          {campings.map((item) => {
            // Create a custom DivIcon for each marker
            const priceIcon = L.divIcon({
              html: `<span class="${priceMarkerStyle}">฿${formatNumber(
                item.price
              )}</span>`,
              className: "", // Important: Reset Leaflet's default icon styles if needed
              iconSize: L.point(60, 25, true), // Adjust size as needed [width, height]
              iconAnchor: [30, 12], // Adjust anchor point (half width, half height)
            });

            return (
              <Marker
                key={item.id}
                position={[item.lat, item.lng]}
                icon={priceIcon} // Use the custom DivIcon
              >
                {/* Use the new PopupContent component */}
                <Popup minWidth={250}>
                  <PopupContent camping={item} />
                </Popup>
              </Marker>
            );
          })}
        </LayerGroup>
      </LayersControl.Overlay>
    </LayersControl>
  );
};
export default Layers;
