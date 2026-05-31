"use client";

import type { LeafletMouseEvent } from "leaflet";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

type LocationPickerMapProps = {
  latitude:  number | null;
  longitude: number | null;
  onPick:    (latitude: number, longitude: number) => void;
};

// Default center: Addis Ababa
const defaultCenter: [number, number] = [9.03, 38.74];

let leafletIconsConfigured = false;

function configureLeafletIcons() {
  if (leafletIconsConfigured) return;
  leafletIconsConfigured = true;

  // Fix Leaflet's broken default icon paths in bundled environments
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require("leaflet");
  delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  });
}

function MapClickHandler({
  onPick,
}: {
  onPick: (latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event: LeafletMouseEvent) {
      onPick(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function LocationPickerMap({
  latitude,
  longitude,
  onPick,
}: LocationPickerMapProps) {
  configureLeafletIcons();

  const selectedPosition =
    latitude !== null && longitude !== null
      ? ([latitude, longitude] as [number, number])
      : null;

  return (
    <div style={{ border: "1px solid var(--border)", overflow: "hidden" }}>
      {/* Explicit inline height — Leaflet requires a concrete pixel height before mount */}
      <div style={{ height: "400px", width: "100%" }}>
        <MapContainer
          center={selectedPosition ?? defaultCenter}
          zoom={15}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onPick={onPick} />
          {selectedPosition && (
            <CircleMarker
              center={selectedPosition}
              radius={8}
              color="#2DD4A0"
              fillColor="#2DD4A0"
              fillOpacity={0.9}
            />
          )}
        </MapContainer>
      </div>
      <div
        style={{
          borderTop:  "1px solid var(--border)",
          background: "var(--bg2)",
          padding:    "8px 12px",
          fontFamily: "var(--font-sans)",
          fontSize:   "10px",
          color:      "var(--text3)",
        }}
      >
        Click on the map to pin your business location
      </div>
    </div>
  );
}
