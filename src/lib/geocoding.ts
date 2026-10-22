export interface GeocodeResult {
  id: string;
  title: string;
  subtitle: string;
  lat: number;
  lng: number;
}

/**
 * Single unified geocoding search for roads, addresses, areas, and landmarks.
 * Uses Mapbox Geocoding if NEXT_PUBLIC_MAPBOX_TOKEN is configured,
 * otherwise uses OpenStreetMap Nominatim with full address details.
 */
export async function searchPlaces(
  query: string,
  biasLat?: number | null,
  biasLng?: number | null
): Promise<GeocodeResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

  // 1. If Mapbox token is present, use official Mapbox Places API
  if (mapboxToken) {
    try {
      let url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        trimmed
      )}.json?access_token=${mapboxToken}&limit=5&types=address,poi,neighborhood,locality,place`;

      if (biasLat && biasLng) {
        url += `&proximity=${biasLng},${biasLat}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.features)) {
          return data.features.map((f: any) => {
            const [lng, lat] = f.center || [0, 0];
            return {
              id: f.id,
              title: f.text || f.place_name.split(",")[0],
              subtitle: f.place_name,
              lat,
              lng,
            };
          });
        }
      }
    } catch (err) {
      console.warn("Mapbox geocoding failed, falling back to OpenStreetMap:", err);
    }
  }

  // 2. OpenStreetMap Nominatim (Single unified open service, zero API key required)
  try {
    let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      trimmed
    )}&addressdetails=1&limit=5`;

    if (biasLat && biasLng) {
      // Small bounding box around current position for local relevance
      const delta = 0.5;
      url += `&viewbox=${biasLng - delta},${biasLat + delta},${biasLng + delta},${biasLat - delta}`;
    }

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "Waymark-Logistics-Platform",
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
            addr.road && addr.road !== title ? addr.road : null,
            addr.suburb && addr.suburb !== title ? addr.suburb : null,
            addr.city || addr.town || addr.village,
            addr.state,
            addr.postcode,
          ].filter(Boolean);

          return {
            id: `osm-${item.place_id || idx}`,
            title,
            subtitle: parts.length > 0 ? parts.join(", ") : item.display_name,
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          };
        });
      }
    }
  } catch (err) {
    console.warn("Place search failed:", err);
  }

  return [];
}
