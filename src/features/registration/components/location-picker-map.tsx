"use client";

import type { LeafletMouseEvent } from "leaflet";
import { useEffect, useState } from "react";
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from "react-leaflet";

type LocationPickerMapProps = {
  latitude: number | null;
  longitude: number | null;
  onPick: (latitude: number, longitude: number) => void;
};

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

export function LocationPickerMap({ latitude, longitude, onPick }: LocationPickerMapProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const selectedPosition =
    latitude !== null && longitude !== null ? ([latitude, longitude] as [number, number]) : null;

  if (!isMounted) {
    return (
      <div className="flex h-[240px] w-full items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-[300px]">
        <p className="text-sm text-slate-500">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
      <MapContainer
        center={selectedPosition ?? defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        className="h-[240px] w-full sm:h-[300px]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onPick={onPick} />
        {selectedPosition ? (
          <CircleMarker center={selectedPosition} radius={8} color="#4f46e5" fillColor="#4f46e5" />
        ) : null}
      </MapContainer>
      <div className="border-t border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-800 sm:text-sm">
        Click on the map to pin your business location
      </div>
    </div>
  );
}
