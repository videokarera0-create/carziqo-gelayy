import { supabase } from '@/lib/supabase';
import { Investment } from '@/lib/types';

export type Coord = [number, number];

export interface RouteLeg {
  points: Coord[];
  approximate: boolean;
}

export interface FleetRoute {
  id: string;
  name: string;
  origin: { name: string; lat: number; lng: number };
  destination: { name: string; lat: number; lng: number };
}

export interface FleetStop {
  position: Coord;
  name: string;
  dwellMs: number;
}

export type CarStatus =
  | 'cruising'
  | 'approaching_stop'
  | 'picking_up'
  | 'dropping_off'
  | 'departing';

export interface FleetCar {
  id: string;
  name: string;
  points: Coord[];
  cumulative: number[];
  stops: FleetStop[];
  loopLengthM: number;
  loopDurationMs: number;
  speedMph: number;
  startMs: number;
  dailyPayout: number;
  totalEarned: number;
  ceiling: number;
  accrualStartMs: number;
}

const EARTH_RADIUS_M = 6371000;
const METERS_PER_SECOND_PER_MPH = 0.44704;
const MIN_CRUISE_MPH = 10;
const CRUISE_MPH_RANGE = 6;
const MOTION_TIME_SCALE = 10; // on-screen drive speed relative to real time, so cars crawl instead of racing

// Stop simulation parameters
const STOP_SLOW_RADIUS_M = 120; // begin decelerating this far before a stop
const STOP_DWELL_MIN_MS = 1500; // minimum time parked at a stop
const STOP_DWELL_MAX_MS = 4000; // maximum time parked at a stop
const MIN_STOPS = 2; // minimum simulated stops per loop
const MAX_STOPS = 4; // maximum simulated stops per loop
const STOP_MIN_SPACING_M = 400; // stops must be at least this far apart

function hashString(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function createRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function distanceM(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

function isRoutePayload(value: unknown): value is { points: Coord[] } {
  if (!value || typeof value !== 'object') return false;
  const points = (value as { points?: unknown }).points;
  return (
    Array.isArray(points) &&
    points.length >= 2 &&
    points.every((p) => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number')
  );
}

export async function loadActiveRoutes(): Promise<FleetRoute[]> {
  const { data, error } = await supabase
    .from('fleet_routes')
    .select('id, name, origin_name, origin_lat, origin_lng, destination_name, destination_lat, destination_lng')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    origin: { name: row.origin_name, lat: row.origin_lat, lng: row.origin_lng },
    destination: { name: row.destination_name, lat: row.destination_lat, lng: row.destination_lng },
  }));
}

export function routeFor(investmentId: string, routes: FleetRoute[]): FleetRoute | undefined {
  if (routes.length === 0) return undefined;
  return routes[hashString(investmentId) % routes.length];
}

export async function loadRouteLeg(route: FleetRoute): Promise<RouteLeg> {
  const from: Coord = [route.origin.lat, route.origin.lng];
  const to: Coord = [route.destination.lat, route.destination.lng];
  const fallback: RouteLeg = { points: [from, to], approximate: true };

  try {
    const { data, error } = await supabase.functions.invoke('route-geometry', {
      body: { from: { lat: from[0], lng: from[1] }, to: { lat: to[0], lng: to[1] } },
    });
    if (error || !isRoutePayload(data)) return fallback;
    return { points: data.points, approximate: false };
  } catch {
    return fallback;
  }
}

// Generate simulated pickup/drop-off stops along the loop route.
function generateStops(points: Coord[], cumulative: number[], loopLengthM: number, rng: () => number): FleetStop[] {
  const stopNames = [
    'Pickup', 'Drop-off', 'Rider pickup', 'Destination', 'Rideshare stop',
    'Passenger wait', 'Transfer point', 'Hotel pickup', 'Office drop-off',
  ];

  const numStops = MIN_STOPS + Math.floor(rng() * (MAX_STOPS - MIN_STOPS + 1));
  const stops: FleetStop[] = [];
  const usedDistances: number[] = [];
  let attempts = 0;

  while (stops.length < numStops && attempts < 30) {
    attempts++;
    // Pick a random distance along the route, but not too close to the endpoints or other stops.
    const minDist = STOP_MIN_SPACING_M;
    const target = minDist + rng() * (loopLengthM - 2 * minDist);
    if (usedDistances.some((d) => Math.abs(d - target) < STOP_MIN_SPACING_M)) continue;
    usedDistances.push(target);

    // Find the position at that distance.
    let i = 1;
    while (i < cumulative.length - 1 && cumulative[i] < target) i++;
    const segLen = cumulative[i] - cumulative[i - 1];
    const ratio = segLen === 0 ? 0 : (target - cumulative[i - 1]) / segLen;
    const a = points[i - 1];
    const b = points[i];
    const pos: Coord = [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio];

    stops.push({
      position: pos,
      name: stopNames[Math.floor(rng() * stopNames.length)],
      dwellMs: STOP_DWELL_MIN_MS + rng() * (STOP_DWELL_MAX_MS - STOP_DWELL_MIN_MS),
    });
  }

  return stops.sort((s1, s2) => {
    const d1 = cumulativeDistForPoint(s1.position, points, cumulative);
    const d2 = cumulativeDistForPoint(s2.position, points, cumulative);
    return d1 - d2;
  });
}

function cumulativeDistForPoint(pt: Coord, points: Coord[], cumulative: number[]): number {
  let bestDist = Infinity;
  let bestCum = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    // Project pt onto segment a-b
    const segLen = distanceM(a, b);
    if (segLen === 0) continue;
    const segDx = b[0] - a[0];
    const segDy = b[1] - a[1];
    const ptDx = pt[0] - a[0];
    const ptDy = pt[1] - a[1];
    const t = Math.max(0, Math.min(1, (ptDx * segDx + ptDy * segDy) / (segDx * segDx + segDy * segDy)));
    const projPt: Coord = [a[0] + segDx * t, a[1] + segDy * t];
    const dist = distanceM(pt, projPt);
    if (dist < bestDist) {
      bestDist = dist;
      bestCum = cumulative[i - 1] + segLen * t;
    }
  }
  return bestCum;
}

export function buildFleetCar(investment: Investment, leg: RouteLeg): FleetCar {
  const forward = leg.points;
  // Build a loop: forward then reverse (excluding the last point to avoid duplicate).
  const points: Coord[] = [...forward, ...forward.slice(0, -1).reverse()];

  const cumulative: number[] = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + distanceM(points[i - 1], points[i]));
  }
  const loopLengthM = cumulative[cumulative.length - 1];

  const rng = createRandom(hashString(investment.id));
  const speedMph = MIN_CRUISE_MPH + rng() * CRUISE_MPH_RANGE;
  const loopDurationMs = (loopLengthM / (speedMph * METERS_PER_SECOND_PER_MPH)) * 1000;

  const stops = generateStops(points, cumulative, loopLengthM, rng);

  const dailyPayout = Number(investment.daily_payout);
  const totalEarned = Number(investment.total_earned);
  const remainingDays = Math.max(0, investment.duration_days - investment.days_completed);

  return {
    id: investment.id,
    name: investment.car_name.trim(),
    points,
    cumulative,
    stops,
    loopLengthM,
    loopDurationMs,
    speedMph,
    startMs: new Date(investment.start_date).getTime(),
    dailyPayout,
    totalEarned,
    ceiling: totalEarned + dailyPayout * remainingDays,
    accrualStartMs: new Date(investment.last_payout_date ?? investment.start_date).getTime(),
  };
}

export interface CarState {
  position: Coord;
  heading: number;
  speedMph: number;
  status: CarStatus;
  atStop: FleetStop | null;
}

function bearingDeg(a: Coord, b: Coord): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLng = toRad(b[1] - a[1]);
  const lat1 = toRad(a[0]);
  const lat2 = toRad(b[0]);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180 / Math.PI) + 360) % 360;
}

// Precompute the distance of each stop along the route for fast lookup.
function stopDistances(car: FleetCar): number[] {
  return car.stops.map((s) => cumulativeDistForPoint(s.position, car.points, car.cumulative));
}

// Compute the car's position along the loop at a given time, accounting for
// stops (decelerate → dwell → accelerate) and variable cruise speed.
export function carStateAt(car: FleetCar, now: number): CarState {
  const scaledElapsed = (Math.max(0, now - car.startMs) * MOTION_TIME_SCALE);

  const stopDists = stopDistances(car);
  const totalDwellMs = car.stops.reduce((sum, s) => sum + s.dwellMs, 0);
  const cruiseMs = Math.max(1, car.loopDurationMs);
  const totalLoopMs = cruiseMs + totalDwellMs;
  const loopElapsed = scaledElapsed % totalLoopMs;

  // Walk through the timeline: cruise segments interrupted by stops.
  // Each stop has: cruise to stop, dwell at stop.
  let timeRemaining = loopElapsed;
  let prevDist = 0;

  for (let s = 0; s < car.stops.length; s++) {
    const stopDist = stopDists[s];
    const cruiseToStopMs = ((stopDist - prevDist) / car.loopLengthM) * cruiseMs;

    if (timeRemaining <= cruiseToStopMs) {
      // We're cruising toward this stop.
      const distAlong = prevDist + (timeRemaining / cruiseToStopMs) * (stopDist - prevDist);
      const distToStop = stopDist - distAlong;
      return interpolatePosition(car, distAlong, distToStop, stopDists, s);
    }

    timeRemaining -= cruiseToStopMs;
    prevDist = stopDist;

    // Check if we're dwelling at this stop.
    if (timeRemaining <= car.stops[s].dwellMs) {
      // Parked at the stop.
      const isPickup = s % 2 === 0;
      return {
        position: car.stops[s].position,
        heading: headingNearStop(car, stopDists, s),
        speedMph: 0,
        status: isPickup ? 'picking_up' : 'dropping_off',
        atStop: car.stops[s],
      };
    }

    timeRemaining -= car.stops[s].dwellMs;
  }

  // Final cruise segment: from last stop back to the start of the loop.
  const finalDist = car.loopLengthM - prevDist;
  const finalCruiseMs = (finalDist / car.loopLengthM) * cruiseMs;
  if (timeRemaining <= finalCruiseMs) {
    const distAlong = prevDist + (timeRemaining / finalCruiseMs) * finalDist;
    // Check distance to the next stop (which wraps to the first stop + loopLengthM).
    const nextStopDist = stopDists.length > 0 ? stopDists[0] + car.loopLengthM : Infinity;
    const distToNext = nextStopDist - distAlong;
    return interpolatePosition(car, distAlong, distToNext, stopDists, 0);
  }

  // Shouldn't reach here, but return start position as fallback.
  return {
    position: car.points[0],
    heading: bearingDeg(car.points[0], car.points[1]),
    speedMph: car.speedMph,
    status: 'cruising',
    atStop: null,
  };
}

function interpolatePosition(
  car: FleetCar,
  distAlong: number,
  distToNextStop: number,
  stopDists: number[],
  nextStopIdx: number
): CarState {
  // Find the segment in the polyline.
  let i = 1;
  while (i < car.cumulative.length - 1 && car.cumulative[i] < distAlong) i++;

  const segLen = car.cumulative[i] - car.cumulative[i - 1];
  const ratio = segLen === 0 ? 0 : (distAlong - car.cumulative[i - 1]) / segLen;
  const a = car.points[i - 1];
  const b = car.points[i];
  const position: Coord = [a[0] + (b[0] - a[0]) * ratio, a[1] + (b[1] - a[1]) * ratio];
  const heading = bearingDeg(a, b);

  // Variable speed: slow down near stops.
  let speedMph = car.speedMph;
  let status: CarStatus = 'cruising';

  if (distToNextStop < STOP_SLOW_RADIUS_M) {
    const slowFactor = Math.max(0.15, distToNextStop / STOP_SLOW_RADIUS_M);
    speedMph = car.speedMph * slowFactor;
    status = distToNextStop < 30 ? 'approaching_stop' : 'approaching_stop';
  }

  // Check if we just departed a stop (dist from previous stop is small).
  if (stopDists.length > 0) {
    const prevStopIdx = (nextStopIdx - 1 + stopDists.length) % stopDists.length;
    const prevStopDist = stopDists[prevStopIdx];
    let distFromPrev = distAlong - prevStopDist;
    if (distFromPrev < 0) distFromPrev += car.loopLengthM;
    if (distFromPrev < STOP_SLOW_RADIUS_M && distToNextStop > STOP_SLOW_RADIUS_M) {
      const accelFactor = Math.max(0.15, distFromPrev / STOP_SLOW_RADIUS_M);
      speedMph = car.speedMph * accelFactor;
      status = 'departing';
    }
  }

  return { position, heading, speedMph, status, atStop: null };
}

function headingNearStop(car: FleetCar, stopDists: number[], stopIdx: number): number {
  const stopDist = stopDists[stopIdx];
  // Find segment near the stop and compute heading of the upcoming road.
  let i = 1;
  while (i < car.cumulative.length - 1 && car.cumulative[i] < stopDist) i++;
  const a = car.points[i - 1];
  const b = car.points[Math.min(i, car.points.length - 1)];
  return bearingDeg(a, b);
}

export function liveEarnings(car: FleetCar, now: number): number {
  const elapsedDays = Math.max(0, now - car.accrualStartMs) / 86400000;
  const pending = Math.min(car.dailyPayout * elapsedDays, car.ceiling - car.totalEarned);
  return car.totalEarned + Math.max(0, pending);
}
