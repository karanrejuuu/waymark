import { describe, it, expect } from "vitest";
import { haversineKm, estimateFuelCost } from "../geo";

describe("Geo and Fuel Estimator", () => {
  it("haversineKm Mumbai to Pune ~120-150km", () => {
    const mumbai = { lat: 19.076, lng: 72.877 };
    const pune = { lat: 18.52, lng: 73.856 };
    const distance = haversineKm(mumbai, pune);
    expect(distance).toBeGreaterThan(110);
    expect(distance).toBeLessThan(140);
  });

  it("estimateFuelCost: 10km / 20kmpl * ₹100/L = ₹50", () => {
    const cost = estimateFuelCost(10, 20, 100);
    expect(cost).toBeCloseTo(50, 1);
  });
});
