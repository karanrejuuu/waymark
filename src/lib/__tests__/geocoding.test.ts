import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPlaces } from "../geocoding";

describe("Unified Geocoding Service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for short query < 2 chars", async () => {
    const res = await searchPlaces("x");
    expect(res).toEqual([]);
  });

  it("parses OpenStreetMap Nominatim results with road names and locality", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => [
        {
          place_id: 101,
          lat: "19.0882",
          lon: "72.8342",
          display_name: "Linking Road, Bandra West, Mumbai, Maharashtra, India",
          address: {
            road: "Linking Road",
            suburb: "Bandra West",
            city: "Mumbai",
            state: "Maharashtra",
          },
        },
      ],
    } as any);

    const res = await searchPlaces("Linking Road");
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("Linking Road");
    expect(res[0].lat).toBe(19.0882);
    expect(res[0].lng).toBe(72.8342);
    expect(res[0].subtitle).toContain("Bandra West, Mumbai");
  });
});
