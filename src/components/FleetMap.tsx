import { useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Investment, formatCurrency } from '@/lib/types';
import {
  Coord,
  FleetCar,
  FleetRoute,
  RouteLeg,
  buildFleetCar,
  carStateAt,
  liveEarnings,
  loadActiveRoutes,
  loadRouteLeg,
  routeFor,
  CarStatus,
} from '@/lib/fleetRoutes';

const CALIFORNIA_CENTER: Coord = [36.8, -119.5];
const INITIAL_ZOOM = 6;
const CARTO_MAP_KEY = 'cb1_4zye_1_7fa1bb0a4a670fc993bb5fea';
const TILE_URL = `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${CARTO_MAP_KEY}`;
const TILE_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>';

const HTML_ESCAPES: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char]);
}

const STATUS_LABELS: Record<CarStatus, string> = {
  cruising: 'Cruising',
  approaching_stop: 'Approaching stop',
  picking_up: 'Picking up passenger',
  dropping_off: 'Dropping off passenger',
  departing: 'Departing',
};

const STATUS_COLORS: Record<CarStatus, string> = {
  cruising: '#34d399',
  approaching_stop: '#fbbf24',
  picking_up: '#60a5fa',
  dropping_off: '#a78bfa',
  departing: '#34d399',
};

function markerHtml(car: FleetCar, earnings: number, status: CarStatus, speed: number): string {
  const color = STATUS_COLORS[status];
  const statusLabel = STATUS_LABELS[status];
  const isStopped = status === 'picking_up' || status === 'dropping_off';
  return `<div class="relative">
    <div class="absolute left-0 top-0 -translate-x-1/2 -translate-y-1/2">
      <div data-role="car" class="flex h-5 w-5 items-center justify-center drop-shadow-[0_0_4px_rgba(52,211,153,0.9)] ${isStopped ? 'fleet-car-bob' : ''}">
        <svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true">
          <rect x="5" y="2" width="10" height="16" rx="3.5" fill="${color}" stroke="#0a0e1a" stroke-width="1" />
          <rect x="6.5" y="5" width="7" height="4" rx="1" fill="#0a0e1a" opacity="0.75" />
          <rect x="6.5" y="12" width="7" height="2.5" rx="1" fill="#0a0e1a" opacity="0.5" />
        </svg>
      </div>
      ${isStopped ? '<div data-role="pulse" class="fleet-stop-pulse"></div>' : ''}
    </div>
    <div class="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-emerald-500/40 bg-[#0a0e1a]/90 px-2 py-1 text-center shadow-lg">
      <div class="text-[10px] font-semibold text-gray-200">${escapeHtml(car.name)}</div>
      <div data-role="earn" class="text-[11px] font-bold text-emerald-400">${escapeHtml(formatCurrency(earnings))}</div>
      <div data-role="status" class="text-[9px] font-medium" style="color:${color}">${statusLabel}</div>
      <div data-role="speed" class="text-[10px] text-gray-400">${Math.round(speed)} mph</div>
    </div>
  </div>`;
}

function stopMarkerHtml(stopName: string): string {
  return `<div class="fleet-stop-marker">
    <div class="fleet-stop-dot"></div>
    <div class="fleet-stop-ring"></div>
    <div class="fleet-stop-label">${escapeHtml(stopName)}</div>
  </div>`;
}

function applyHeading(marker: L.Marker, heading: number) {
  const carEl = marker.getElement()?.querySelector<HTMLElement>('[data-role="car"]');
  if (carEl) carEl.style.transform = `rotate(${heading}deg)`;
}

export default function FleetMap({ investments }: { investments: Investment[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const stopLayerRef = useRef<L.LayerGroup | null>(null);
  const markersRef = useRef(new Map<string, L.Marker>());
  const fittedRef = useRef(false);
  const [routes, setRoutes] = useState<FleetRoute[] | null>(null);
  const [routesFailed, setRoutesFailed] = useState(false);
  const [legs, setLegs] = useState<Record<string, RouteLeg>>({});
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    loadActiveRoutes()
      .then((list) => {
        if (!cancelled) setRoutes(list);
      })
      .catch(() => {
        if (!cancelled) setRoutesFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const routeByInvestment = useMemo(() => {
    const map = new Map<string, FleetRoute>();
    if (!routes) return map;
    for (const inv of investments) {
      const route = routeFor(inv.id, routes);
      if (route) map.set(inv.id, route);
    }
    return map;
  }, [investments, routes]);

  const neededRouteIds = useMemo(
    () => [...new Set([...routeByInvestment.values()].map((route) => route.id))].sort().join(','),
    [routeByInvestment]
  );

  useEffect(() => {
    if (!routes || !neededRouteIds) return;
    const wanted = routes.filter((route) => neededRouteIds.split(',').includes(route.id));
    let cancelled = false;
    wanted.forEach(async (route) => {
      const leg = await loadRouteLeg(route);
      if (!cancelled) setLegs((prev) => ({ ...prev, [route.id]: leg }));
    });
    return () => {
      cancelled = true;
    };
  }, [neededRouteIds, routes]);

  const cars = useMemo<FleetCar[]>(
    () =>
      investments.flatMap((inv) => {
        const route = routeByInvestment.get(inv.id);
        const leg = route ? legs[route.id] : undefined;
        return leg ? [buildFleetCar(inv, leg)] : [];
      }),
    [investments, routeByInvestment, legs]
  );

  const usingApproximateRoutes = [...routeByInvestment.values()].some((route) => legs[route.id]?.approximate);

  const statusText = routesFailed
    ? 'Routes could not be loaded right now.'
    : routes && routes.length === 0
      ? 'No routes are active yet.'
      : cars.length < investments.length
        ? 'Loading road routes...'
        : null;

  useEffect(() => {
    if (!containerRef.current) return;
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(CALIFORNIA_CENTER, INITIAL_ZOOM);
    L.tileLayer(TILE_URL, { attribution: TILE_ATTRIBUTION, maxZoom: 19 }).addTo(map);
    stopLayerRef.current = L.layerGroup().addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const markers = markersRef.current;
    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
      stopLayerRef.current = null;
      markers.clear();
      fittedRef.current = false;
    };
  }, []);

  // Draw route polylines and stop markers when cars change.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    const stopLayer = stopLayerRef.current;
    if (!map || !layer || !stopLayer) return;

    layer.clearLayers();
    stopLayer.clearLayers();
    markersRef.current.clear();

    const current = Date.now();

    cars.forEach((car) => {
      // Route polyline
      L.polyline(car.points, { color: '#34d399', weight: 3, opacity: 0.35, dashArray: '6 8' }).addTo(layer);

      // Stop markers (pickup/drop-off points)
      car.stops.forEach((stop) => {
        L.marker(stop.position, {
          icon: L.divIcon({
            className: 'fleet-stop-icon',
            html: stopMarkerHtml(stop.name),
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          }),
          interactive: false,
          keyboard: false,
        }).addTo(stopLayer);
      });

      // Car marker
      const state = carStateAt(car, current);
      const marker = L.marker(state.position, {
        icon: L.divIcon({
          className: 'fleet-marker',
          html: markerHtml(car, liveEarnings(car, current), state.status, state.speedMph),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        }),
        interactive: false,
        keyboard: false,
      }).addTo(layer);
      markersRef.current.set(car.id, marker);
      applyHeading(marker, state.heading);
    });

    if (!fittedRef.current && cars.length > 0) {
      map.fitBounds(L.latLngBounds(cars.flatMap((car) => car.points)), { padding: [32, 32] });
      fittedRef.current = true;
    }
  }, [cars]);

  // Animation loop: update car positions every frame.
  useEffect(() => {
    if (cars.length === 0) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;

    const tick = () => {
      const current = Date.now();
      for (const car of cars) {
        const marker = markersRef.current.get(car.id);
        if (!marker) continue;
        const state = carStateAt(car, current);
        marker.setLatLng(state.position);
        applyHeading(marker, state.heading);

        // Update status text and speed dynamically.
        const el = marker.getElement();
        if (el) {
          const statusEl = el.querySelector<HTMLElement>('[data-role="status"]');
          const speedEl = el.querySelector<HTMLElement>('[data-role="speed"]');
          const color = STATUS_COLORS[state.status];
          if (statusEl) {
            statusEl.textContent = STATUS_LABELS[state.status];
            statusEl.style.color = color;
          }
          if (speedEl) speedEl.textContent = `${Math.round(state.speedMph)} mph`;

          // Toggle stop pulse + bob animation.
          const carEl = el.querySelector<HTMLElement>('[data-role="car"]');
          const existingPulse = el.querySelector('[data-role="pulse"]');
          const isStopped = state.status === 'picking_up' || state.status === 'dropping_off';
          if (carEl) {
            carEl.classList.toggle('fleet-car-bob', isStopped);
            const svgRect = carEl.querySelector('rect');
            if (svgRect) svgRect.setAttribute('fill', color);
          }
          if (isStopped && !existingPulse) {
            carEl?.insertAdjacentHTML('afterend', '<div data-role="pulse" class="fleet-stop-pulse"></div>');
          } else if (!isStopped && existingPulse) {
            existingPulse.remove();
          }
        }
      }
      if (!reduceMotion) frame = requestAnimationFrame(tick);
    };

    tick();
    return () => cancelAnimationFrame(frame);
  }, [cars]);

  // Update earnings labels every second.
  useEffect(() => {
    if (cars.length === 0) return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [cars.length]);

  useEffect(() => {
    for (const car of cars) {
      const label = markersRef.current.get(car.id)?.getElement()?.querySelector('[data-role="earn"]');
      if (label) label.textContent = formatCurrency(liveEarnings(car, now));
    }
  }, [cars, now]);

  return (
    <div className="bg-[#131825] rounded-2xl border border-[#232a3f] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#232a3f]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          <span className="text-white text-sm font-semibold">Live Fleet</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 text-gray-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Pickup
          </span>
          <span className="flex items-center gap-1 text-gray-400 text-xs">
            <span className="w-2 h-2 rounded-full bg-violet-400" /> Drop-off
          </span>
          <span className="text-gray-400 text-xs">{investments.length} on the road</span>
        </div>
      </div>

      <div className="relative">
        <div
          ref={containerRef}
          className="h-[320px] sm:h-[400px] w-full bg-[#0a0e1a]"
          role="region"
          aria-label="Map of California showing rented cars driving on roads with pickup and drop-off stops"
        />
        {statusText && (
          <div className="absolute inset-0 z-[400] flex items-center justify-center bg-[#0a0e1a]/70 text-gray-300 text-sm pointer-events-none">
            {statusText}
          </div>
        )}
      </div>

      <div className="px-4 py-2.5 border-t border-[#232a3f] text-[11px] text-gray-500">
        {usingApproximateRoutes
          ? 'Road data is temporarily unavailable, so some cars follow approximate paths. Cars make pickup and drop-off stops along their routes. Speeds are shown in mph.'
          : 'Cars drive real city routes at everyday speeds, making passenger pickup and drop-off stops along the way. Speeds are shown in mph.'}
      </div>
    </div>
  );
}
