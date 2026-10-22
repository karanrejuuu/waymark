import { describe, it, expect, vi, beforeEach } from "vitest";
import { searchPlaces } from "../geocoding";

describe("Geocoding service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns empty array for queries with length < 2", async () => {
    const res = await searchPlaces("a");
    expect(res).toEqual([]);
  });

  it("parses Photon results correctly with road and subtitle", async () => {
    const mockPhotonResponse = {
      features: [
        {
          geometry: { coordinates: [72.883, 19.082] },
          properties: {
            name: "Mahatma Gandhi Road",
            street: "MG Road",
            district: "Fort",
            city: "Mumbai",
            state: "Maharashtra",
            country: "India",
            osm_id: 12345,
          },
        },
      ],
    };

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotonResponse,
    } as any);

    const res = await searchPlaces("MG Road");
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("Mahatma Gandhi Road");
    expect(res[0].lat).toBe(19.082);
    expect(res[0].lng).toBe(72.883);
    expect(res[0].subtitle).toContain("Fort, Mumbai");
  });

  it("falls back to Nominatim when Photon fails", async () => {
    // 1. Photon fails
    vi.spyOn(global, "fetch")
      .mockRejectedValueOnce(new Error("Network error"))
      // 2. Nominatim succeeds
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [
          {
            place_id: 999,
            lat: "18.5204",
            lon: "73.8567",
            display_name: "FC Road, Shivajinagar, Pune, Maharashtra",
            address: {
              road: "FC Road",
              suburb: "Shivajinagar",
              city: "Pune",
              state: "Maharashtra",
            },
          },
        ],
      } as any);

    const res = await searchPlaces("FC Road");
    expect(res).toHaveLength(1);
    expect(res[0].title).toBe("FC Road");
    expect(res[0].lat).toBe(18.5204);
    expect(res[0].lng).toBe(73.8567);
  });
});
