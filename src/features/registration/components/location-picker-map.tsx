"use client";

import type { LeafletMouseEvent } from "leaflet";
import { useEffect, useRef, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

type LocationPickerMapProps = {
  latitude:  number | null;
  longitude: number | null;
  onPick:    (latitude: number, longitude: number) => void;
};

// Default center: Addis Ababa
const defaultCenter: [number, number] = [9.03, 38.74];

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
  const [isMounted, setIsMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      setIsMounted(true);
    }
  }, []);

  const selectedPosition =
    latitude !== null && longitude !== null
      ? ([latitude, longitude] as [number, number])
      : null;

  if (!isMounted) {
    return (
      <div
        className="flex h-[240px] w-full items-center justify-center overflow-hidden rounded-lg sm:h-[300px]"
        style={{ background: "var(--shell)", border: "1px solid var(--panel-border)" }}
      >
        <p className="tx-sub-label">Loading map…</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ border: "1px solid var(--panel-border)" }}
    >
      <MapContainer
        center={selectedPosition ?? defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="h-[240px] w-full sm:h-[300px]"
      >
        {/* Dark tile layer via CartoDB Dark Matter */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
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
      <div
        className="px-3 py-2 tx-sub-label"
        style={{ borderTop: "1px solid var(--panel-border)", background: "var(--panel)" }}
      >
        Click on the map to pin your business location
      </div>
    </div>
  );
}
