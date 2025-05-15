import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { Marker, Popup } from 'react-leaflet';
import {
    Utensils,
    Coffee,
    ShoppingCart,
    HelpCircle,
    TrainFront,
    Landmark, // Often used for banks/govt buildings
    Church,   // Generic place of worship icon in Lucide
    Star      // For attractions/historic
} from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

// --- Helper to create custom icons using Lucide ---
const createIcon = (iconComponent, color = '#3388ff') => {
    // Render the Lucide icon component to an HTML string
    const iconHtml = ReactDOMServer.renderToString(iconComponent);
    return L.divIcon({
        // Wrap the SVG in a div for styling
        html: `<div style="background:white; border-radius:50%; padding:4px; border: 1px solid ${color}; display:flex; justify-content:center; align-items:center; box-shadow: 0 1px 3px rgba(0,0,0,0.2);">
                 ${iconHtml}
               </div>`,
        className: '', // Important to clear Leaflet's default icon styles
        iconSize: [26, 26], // Adjust size as needed
        iconAnchor: [13, 13], // Center the icon over the coordinate
        popupAnchor: [0, -13] // Position popup slightly above the icon center
    });
};

// --- Define icons for different POI types ---
const poiIcons = {
    restaurant: createIcon(<Utensils size={14} />, '#d9534f'), // Reddish
    cafe: createIcon(<Coffee size={14} />, '#a0522d'),       // Brown
    market: createIcon(<ShoppingCart size={14} />, '#5cb85c'), // Green
    train: createIcon(<TrainFront size={14} />, '#5bc0de'),    // Blueish
    bank: createIcon(<Landmark size={14} />, '#f0ad4e'),       // Orange/Yellow
    worship: createIcon(<Church size={14} />, '#6f42c1'),      // Purple
    attraction: createIcon(<Star size={14} />, '#ffc107'),     // Gold/Yellow
    default: createIcon(<HelpCircle size={14} />, '#777')      // Grey fallback
};

// --- Function to determine which icon to use ---
const getPoiIcon = (tags) => {
    // Check specific types first
    if (tags?.amenity === 'restaurant') return poiIcons.restaurant;
    if (tags?.amenity === 'cafe') return poiIcons.cafe;
    if (tags?.shop === 'supermarket' || tags?.shop === 'convenience' || tags?.shop === 'greengrocer') return poiIcons.market;
    if (tags?.railway === 'station' || tags?.public_transport === 'station') return poiIcons.train;
    if (tags?.amenity === 'bank') return poiIcons.bank;
    if (tags?.amenity === 'place_of_worship') return poiIcons.worship; // Covers temples, churches, mosques etc.
    if (tags?.tourism === 'attraction' || tags?.historic) return poiIcons.attraction; // Basic check for attractions/historic sites
    return poiIcons.default;
};

const NearbyPOILayer = () => {
    const map = useMap();
    const [pois, setPois] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Keep track of the last fetched bounds to avoid redundant calls
    const lastFetchedBounds = useRef(null);

    // --- Fetch Function ---
    const fetchPOIs = async () => {
        if (!map) return;

        const currentBounds = map.getBounds();
        const currentZoom = map.getZoom();

        // Optional: Only fetch at higher zoom levels to avoid overly broad queries
        if (currentZoom < 13) {
             console.log("Zoom level too low, skipping POI fetch.");
             setPois([]); // Clear POIs when zoomed out
             return;
        }

        // Avoid fetching if bounds haven't changed significantly (optional)
        if (lastFetchedBounds.current && lastFetchedBounds.current.equals(currentBounds, 0.001)) {
            console.log("Bounds haven't changed significantly, skipping fetch.");
            return;
        }

        setLoading(true);
        setError(null);
        const bbox = `${currentBounds.getSouth()},${currentBounds.getWest()},${currentBounds.getNorth()},${currentBounds.getEast()}`;
        lastFetchedBounds.current = currentBounds; // Store the bounds we are fetching for

        const overpassUrl = 'https://overpass-api.de/api/interpreter';
        // Query for restaurants, cafes, supermarkets, convenience stores
        // Explicitly add the bounding box to the query
        // Combine query onto fewer lines to minimize potential whitespace issues
        // Added: railway=station, public_transport=station, amenity=bank, amenity=place_of_worship, tourism=attraction, historic=*
        const query = `[out:json][timeout:25][bbox:${bbox}];(` +
                      `node[amenity~"restaurant|cafe"];way[amenity~"restaurant|cafe"];` +
                      `node[shop~"supermarket|convenience|greengrocer"];way[shop~"supermarket|convenience|greengrocer"];` +
                      `node[railway=station];way[railway=station];node[public_transport=station];way[public_transport=station];` + // Train/Transport Stations
                      `node[amenity=bank];way[amenity=bank];` + // Banks
                      `node[amenity=place_of_worship];way[amenity=place_of_worship];` + // Temples, Churches, etc.
                      `node[tourism=attraction];way[tourism=attraction];node[historic];way[historic];` + // Attractions & Historic sites
                      `);out center;`;

        try {
            console.log(`Fetching POIs for bbox: ${bbox} at zoom ${currentZoom}`);
            const response = await axios.post(overpassUrl, `data=${encodeURIComponent(query)}`, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const fetchedPois = response.data.elements.map(element => {
                let lat, lon;
                if (element.type === 'node') {
                    lat = element.lat; lon = element.lon;
                } else if (element.type === 'way' && element.center) {
                    lat = element.center.lat; lon = element.center.lon;
                } else { return null; }
                return { id: element.id, type: element.type, lat, lon, tags: element.tags || {} };
            }).filter(poi => poi !== null);

            setPois(fetchedPois);
            console.log(`Fetched ${fetchedPois.length} POIs`);
        } catch (err) {
            console.error("Error fetching POIs from Overpass API:", err);
            setError("Could not load nearby places.");
            setPois([]);
        } finally {
            setLoading(false);
        }
    };

    // --- Effect to add map event listeners ---
    useEffect(() => {
        if (!map) return;
        // Initial fetch
        fetchPOIs();
        // Fetch when map movement stops
        map.on('moveend', fetchPOIs);
        map.on('zoomend', fetchPOIs); // Also fetch on zoom end

        return () => { // Cleanup listeners
            map.off('moveend', fetchPOIs);
            map.off('zoomend', fetchPOIs);
        };
    }, [map]); // Re-run if map instance changes

    // --- Render Markers ---
    return (
        <>
            {/* Optionally show loading/error indicator */}
            {loading && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,255,255,0.8)', padding: '2px 5px', zIndex: 1000, borderRadius: '3px', fontSize: '0.8em' }}>Loading POIs...</div>}
            {error && <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(255,0,0,0.7)', color: 'white', padding: '2px 5px', zIndex: 1000, borderRadius: '3px', fontSize: '0.8em' }}>{error}</div>}

            {pois.map(poi => (
                <Marker key={`${poi.type}-${poi.id}`} position={[poi.lat, poi.lon]} icon={getPoiIcon(poi.tags)}>
                    <Popup minWidth={150}>
                        <b>{poi.tags?.name || poi.tags?.amenity || poi.tags?.shop || 'Point of Interest'}</b>
                        <br />
                        {poi.tags?.cuisine && `Cuisine: ${poi.tags.cuisine}`}
                        {/* Add more details if needed */}
                        <br />
                        <a href={`https://www.openstreetmap.org/${poi.type}/${poi.id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8em', color: '#0078a8', textDecoration: 'underline' }}>
                            View on OSM
                        </a>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default NearbyPOILayer;