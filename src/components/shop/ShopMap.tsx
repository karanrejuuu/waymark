"use client";

import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Search, X, Navigation, MapPin, Loader2 } from "lucide-react";
import { searchPlaces, GeocodeResult } from "@/lib/geocoding";

interface ShopMapProps {
  lat: number | null;
  lng: number | null;
  editable?: boolean;
  onLocationChange?: (lat: number, lng: number) => void;
  height?: string;
  placeholder?: string;
}

export const ShopMap: React.FC<ShopMapProps> = ({
  lat,
  lng,
  editable = false,
  onLocationChange,
  height = "260px",
  placeholder = "Search road, area, or landmark...",
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  // Default coordinate: Central Mumbai or provided coords
  const defaultLat = lat ?? 19.076;
  const defaultLng = lng ?? 72.8777;

  // Custom sleek Uber/Notion style pin icon
  const getCustomPinIcon = (isDraggable: boolean) => {
    return L.divIcon({
      className: "waymark-pin-container",
      html: `
        <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: ${
          isDraggable ? "grab" : "default"
        };">
          <div style="position: absolute; width: 30px; height: 30px; background: rgba(35, 131, 226, 0.2); border-radius: 50%;"></div>
          <div style="position: relative; width: 16px; height: 16px; background: #2383E2; border: 2.5px solid #FFFFFF; border-radius: 50%; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [defaultLat, defaultLng],
        zoom: lat && lng ? 16 : 13,
        zoomControl: false,
      });

      // Single clean map provider: Esri World Street Map (or Mapbox if configured)
      // Zero API key required, crisp road network, no watermarks
      const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      const tileUrl = mapboxToken
        ? `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`
        : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";

      const attribution = mapboxToken
        ? '&copy; <a href="https://www.mapbox.com/">Mapbox</a>'
        : '&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap';

      L.tileLayer(tileUrl, {
        attribution,
        maxZoom: 19,
        tileSize: mapboxToken ? 512 : 256,
        zoomOffset: mapboxToken ? -1 : 0,
      }).addTo(map);

      // Clean bottom-right zoom control
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;

      // Add initial marker if coordinates provided
      if (lat !== null && lng !== null) {
        const marker = L.marker([lat, lng], {
          icon: getCustomPinIcon(editable),
          draggable: editable,
        }).addTo(map);
        markerRef.current = marker;

        if (editable && onLocationChange) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onLocationChange(pos.lat, pos.lng);
          });
        }
      }

      // Handle direct map clicks in editable mode
      if (editable) {
        map.on("click", (e: L.LeafletMouseEvent) => {
          const { lat: clickLat, lng: clickLng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([clickLat, clickLng]);
          } else {
            const marker = L.marker([clickLat, clickLng], {
              icon: getCustomPinIcon(true),
              draggable: true,
            }).addTo(map);
            markerRef.current = marker;
            if (onLocationChange) {
              marker.on("dragend", () => {
                const pos = marker.getLatLng();
                onLocationChange(pos.lat, pos.lng);
              });
            }
          }
          onLocationChange?.(clickLat, clickLng);
          setIsOpen(false);
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

  // Sync external prop changes
  useEffect(() => {
    if (mapInstanceRef.current && lat !== null && lng !== null) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        const marker = L.marker([lat, lng], {
          icon: getCustomPinIcon(editable),
          draggable: editable,
        }).addTo(mapInstanceRef.current);
        markerRef.current = marker;
      }
    }
  }, [lat, lng, editable]);

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeout = setTimeout(async () => {
      try {
        const hits = await searchPlaces(searchQuery, lat, lng);
        setResults(hits);
        setIsOpen(hits.length > 0);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [searchQuery, lat, lng]);

  const handleSelectPlace = (place: GeocodeResult) => {
    setSearchQuery(place.title);
    setIsOpen(false);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([place.lat, place.lng], 16, {
        animate: true,
        duration: 1.2,
      });

      if (markerRef.current) {
        markerRef.current.setLatLng([place.lat, place.lng]);
      } else {
        const marker = L.marker([place.lat, place.lng], {
          icon: getCustomPinIcon(editable),
          draggable: editable,
        }).addTo(mapInstanceRef.current);
        markerRef.current = marker;
        if (editable && onLocationChange) {
          marker.on("dragend", () => {
            const pos = marker.getLatLng();
            onLocationChange(pos.lat, pos.lng);
          });
        }
      }
    }

    onLocationChange?.(place.lat, place.lng);
  };

  const handleLocateMe = () => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([latitude, longitude], 17, {
            animate: true,
            duration: 1,
          });

          if (markerRef.current) {
            markerRef.current.setLatLng([latitude, longitude]);
          } else {
            const marker = L.marker([latitude, longitude], {
              icon: getCustomPinIcon(editable),
              draggable: editable,
            }).addTo(mapInstanceRef.current);
            markerRef.current = marker;
          }
        }

        onLocationChange?.(latitude, longitude);
      },
      (err) => {
        setIsLocating(false);
        console.warn("Geolocation error:", err.message);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-border shadow-sm">
      {/* Clean Floating Search Bar (Active in editable mode) */}
      {editable && (
        <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] max-w-sm">
          <div className="relative flex items-center bg-bg/95 backdrop-blur-md border border-border rounded-lg shadow-sm">
            <div className="pl-2.5 text-text-tertiary">
              {isSearching ? (
                <Loader2 size={14} className="animate-spin text-accent" />
              ) : (
                <Search size={14} />
              )}
            </div>

            <input
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => results.length > 0 && setIsOpen(true)}
              className="w-full text-xs py-2 pl-2 pr-16 bg-transparent text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />

            <div className="absolute right-1 flex items-center gap-0.5">
              {searchQuery && (
                <button
                  type="button"
                  title="Clear search"
                  onClick={() => {
                    setSearchQuery("");
                    setIsOpen(false);
                  }}
                  className="p-1 text-text-tertiary hover:text-text-primary rounded"
                >
                  <X size={13} />
                </button>
              )}

              <button
                type="button"
                title="Locate me (GPS)"
                onClick={handleLocateMe}
                disabled={isLocating}
                className="p-1.5 text-text-secondary hover:text-accent rounded hover:bg-bg-subtle transition-colors"
              >
                <Navigation size={13} className={isLocating ? "animate-spin text-accent" : ""} />
              </button>
            </div>
          </div>

          {/* Autocomplete Dropdown List */}
          {isOpen && results.length > 0 && (
            <div className="mt-1 bg-bg border border-border rounded-lg shadow-md overflow-hidden max-h-52 overflow-y-auto divide-y divide-border text-xs">
              {results.map((res) => (
                <button
                  key={res.id}
                  type="button"
                  onClick={() => handleSelectPlace(res)}
                  className="w-full text-left p-2.5 hover:bg-bg-subtle flex items-start gap-2.5 transition-colors group"
                >
                  <MapPin
                    size={14}
                    className="text-text-tertiary group-hover:text-accent mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-text-primary truncate">
                      {res.title}
                    </div>
                    <div className="text-[11px] text-text-tertiary truncate">
                      {res.subtitle}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Map Canvas */}
      <div ref={mapContainerRef} style={{ height }} className="w-full z-0" />

      {/* Subtle field helper notice at bottom */}
      {editable && (
        <div className="absolute bottom-2 left-2 z-[399] pointer-events-none">
          <span className="bg-bg/90 backdrop-blur-sm border border-border px-2 py-0.5 rounded text-[10px] text-text-tertiary shadow-sm">
            Search road/area above or tap map to pin
          </span>
        </div>
      )}
    </div>
  );
};

export default ShopMap;
