import { useState, useEffect, useRef } from 'react';
import { Car, Radio, MapPin, Activity } from 'lucide-react';

const FLEET_CITIES = [
  'San Francisco, CA',
  'Phoenix, AZ',
  'Los Angeles, CA',
  'Austin, TX',
  'Madrid, ES',
  'Toronto, CA',
  'Munich, DE',
  'Tokyo, JP',
];

const VEHICLE_STATUSES = [
  'Cruising autonomously',
  'Passenger pickup',
  'Highway merge',
  'Navigating intersection',
  'Charging at depot',
  'Returning to hub',
  'Drop-off complete',
  'Idle — awaiting ride',
] as const;

interface TickerEntry {
  id: number;
  vehicleId: string;
  city: string;
  status: string;
  speed: number;
}

function randomEntry(id: number): TickerEntry {
  const city = FLEET_CITIES[Math.floor(Math.random() * FLEET_CITIES.length)];
  const status = VEHICLE_STATUSES[Math.floor(Math.random() * VEHICLE_STATUSES.length)];
  const vehicleId = `WM-${String(1000 + Math.floor(Math.random() * 8999))}`;
  const speed = Math.floor(Math.random() * 55) + 5;
  return { id, vehicleId, city, status, speed };
}

export default function FleetTicker({ accentColor }: { accentColor: string }) {
  const [entries, setEntries] = useState<TickerEntry[]>(() =>
    Array.from({ length: 4 }, (_, i) => randomEntry(i))
  );
  const [activeVehicles, setActiveVehicles] = useState(847);
  const [totalMiles, setTotalMiles] = useState(71234650);
  const idRef = useRef(4);

  // Rotate ticker entries every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const next = randomEntry(idRef.current++);
      setEntries((prev) => [...prev.slice(1), next]);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Slowly increment active vehicles count
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveVehicles((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(780, Math.min(920, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Continuously tick up total miles
  useEffect(() => {
    const interval = setInterval(() => {
      setTotalMiles((prev) => prev + Math.floor(Math.random() * 12) + 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const formattedMiles = totalMiles.toLocaleString('en-US');

  return (
    <div className="rounded-2xl bg-white/8 backdrop-blur-md border border-white/15 overflow-hidden">
      {/* Live stats bar */}
      <div className="grid grid-cols-2 border-b border-white/10">
        <div className="p-4 flex items-center gap-3 border-r border-white/10">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}25` }}>
            <Car className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <p className="text-white text-xl font-bold tabular-nums">{activeVehicles}</p>
            </div>
            <p className="text-blue-100/80 text-[10px] uppercase tracking-wider">Active Vehicles</p>
          </div>
        </div>
        <div className="p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${accentColor}25` }}>
            <Activity className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <div>
            <p className="text-white text-xl font-bold tabular-nums">{formattedMiles}</p>
            <p className="text-blue-100/80 text-[10px] uppercase tracking-wider">Total Miles Driven</p>
          </div>
        </div>
      </div>

      {/* Scrolling ticker entries */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center gap-1.5 mb-2">
          <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span className="text-emerald-300 text-[10px] font-semibold uppercase tracking-wider">Live Fleet Feed</span>
        </div>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-3 text-xs animate-fade-in"
          >
            <span
              className="px-2 py-0.5 rounded-md font-mono font-bold text-[10px] flex-shrink-0"
              style={{ background: `${accentColor}20`, color: accentColor }}
            >
              {entry.vehicleId}
            </span>
            <MapPin className="w-3 h-3 text-blue-200 flex-shrink-0" />
            <span className="text-blue-100/90 truncate flex-1">{entry.city}</span>
            <span className="text-white/70 truncate hidden sm:block">{entry.status}</span>
            <span className="text-cyan-200 font-medium tabular-nums flex-shrink-0">{entry.speed} mph</span>
          </div>
        ))}
      </div>
    </div>
  );
}
