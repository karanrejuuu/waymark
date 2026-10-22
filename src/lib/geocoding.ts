export interface GeocodeResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

/**
 * Searches places, roads, landmarks, and addresses using Photon with Nominatim fallback.
 * Biased towards local coordinates if provided.
 */
export async function searchPlaces(
  query: string,
  biasLat?: number | null,
  biasLng?: number | null
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // Try Photon first (fast typeahead autocomplete)
  try {
    let url = `https://photon.komoot.de/api/?q=${encodeURIComponent(trimmed)}&limit=6`;
    if (biasLat && biasLng) {
      url += `&lat=${biasLat}&lon=${biasLng}`;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.features) && data.features.length > 0) {
        return data.features.map((f: any, idx: number) => {
          const p = f.properties || {};
          const [lng, lat] = f.geometry?.coordinates || [0, 0];

          const title = p.name || p.street || trimmed;
          const parts = [p.street, p.district, p.city, p.state, p.country].filter(
            (part, i, arr) => part && part !== title && arr.indexOf(part) === i
          );
          const subtitle = parts.join(", ");

          return {
            id: `photon-${p.osm_id || idx}-${lat}-${lng}`,
            title,
            subtitle: subtitle || "Location",
            lat: Number(lat),
            lng: Number(lng),
          };
        });
      }
    }
  } catch (err) {
    // Silently proceed to Nominatim fallback
  }

  // Fallback to OpenStreetMap Nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&addressdetails=1&limit=6`;

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Waymark-Logistics-App",
      },
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any, idx: number) => {
          const addr = item.address || {};
          const title =
            addr.road ||
            addr.suburb ||
            addr.neighbourhood ||
            addr.amenity ||
            item.name ||
            item.display_name.split(",")[0];

          const parts = [
            addr.road !== title ? addr.road : null,
            addr.suburb,
            addr.city || addr.town || addr.village,
            addr.state,
          ].filter(Boolean);

          return {
            id: `nom-${item.place_id || idx}`,
            title,
            subtitle: parts.join(", ") || item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });
      }
    }
  } catch (err) {
    console.warn("Geocoding search failed:", err);
  }

  return [];
}
