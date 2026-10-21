export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calculate straight-line (Haversine) distance in kilometers between two coordinates.
 */
export function haversineKm(pointA: LatLng, pointB: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((pointB.lat - pointA.lat) * Math.PI) / 180;
  const dLng = ((pointB.lng - pointA.lng) * Math.PI) / 180;

  const lat1 = (pointA.lat * Math.PI) / 180;
  const lat2 = (pointB.lat * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimate roundtrip fuel cost given distance, vehicle mileage, and fuel price.
 * Formula: (distKm / mileageKmPerL) * petrolPricePerL
 */
export function estimateFuelCost(
  distKm: number,
  mileageKmPerL: number,
  petrolPricePerL: number
): number {
  if (mileageKmPerL <= 0) return 0;
  const litres = distKm / mileageKmPerL;
  return litres * petrolPricePerL;
}
