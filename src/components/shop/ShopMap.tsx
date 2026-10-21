"use client";

import React, { useEffect, useRef } from "react";
import L from "leaflet";

interface ShopMapProps {
  lat: number | null;
  lng: number | null;
  editable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
}

export const ShopMap: React.FC<ShopMapProps> = ({
  lat,
  lng,
  editable = false,
  onLocationChange,
  height = "220px",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Default coordinate: Central Mumbai or provided coords
  const defaultLat = lat ?? 19.076;
  const defaultLng = lng ?? 72.8777;

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Fix leaflet marker icon path in bundled Next.js apps
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: lat && lng ? 15 : 12,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add custom small zoom control
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;

      // Add initial marker if coordinates provided
      if (lat !== null && lng !== null) {
        const marker = L.marker([lat, lng], { draggable: editable }).addTo(map);
        markerRef.current = marker;

        if (editable && onLocationChange) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onLocationChange(pos.lat, pos.lng);
          });
        }
      }

      // Handle map clicks in editable mode
      if (editable) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            const marker = L.marker([clickLat, clickLng], { draggable: true }).addTo(map);
            markerRef.current = marker;
            if (onLocationChange) {
              marker.on("dragend", () => {
                const pos = marker.getLatLng();
                onLocationChange(pos.lat, pos.lng);
              });
            }
          }
          onLocationChange?.(clickLat, clickLng);
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [editable]);

  // Update marker position if lat/lng props change
  useEffect(() => {
    if (mapInstanceRef.current && lat !== null && lng !== null) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], { draggable: editable }).addTo(mapInstanceRef.current);
        markerRef.current = marker;
      }
    }
  }, [lat, lng, editable]);

  return (
    <div className="relative w-full rounded-md overflow-hidden border border-border">
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />
      {editable && (
        <div className="absolute top-2 left-2 z-[400] bg-bg/95 backdrop-blur-sm border border-border px-2.5 py-1 rounded text-[11px] text-text-secondary shadow-sm">
          Tap on map to place shop location
        </div>
      )}
    </div>
  );
};
