import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusColors: Record<string, string> = {
  pending: "#eab308",
  in_progress: "#3b82f6",
  collected: "#22c55e",
  failed: "#ef4444",
  delayed: "#f97316",
};

function createColoredIcon(status: string) {
  const color = statusColors[status] || "#6b7280";
  return L.divIcon({
    className: "custom-marker",
    html: `<div style="
      background: ${color};
      width: 28px;
      height: 28px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -28],
  });
}

interface PickupMarker {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  location: string | null;
  scheduled_date: string | null;
  user_name?: string;
  notes?: string | null;
}

interface PickupMapProps {
  pickups: PickupMarker[];
  onAccept?: (id: string) => void;
  onComplete?: (id: string) => void;
  acceptingId?: string | null;
}

function FitBounds({ pickups }: { pickups: PickupMarker[] }) {
  const map = useMap();

  useEffect(() => {
    if (pickups.length === 0) return;
    const bounds = L.latLngBounds(
      pickups.map((p) => [p.latitude, p.longitude] as [number, number])
    );
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
  }, [pickups, map]);

  return null;
}

export function PickupMap({ pickups, onAccept, onComplete, acceptingId }: PickupMapProps) {
  const validPickups = pickups.filter(
    (p) => p.latitude != null && p.longitude != null && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  if (validPickups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/30">
        <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">No pickup locations to display</p>
        <p className="text-sm text-muted-foreground mt-1">
          Pickups with coordinates will appear here
        </p>
      </div>
    );
  }

  const center: [number, number] = [
    validPickups.reduce((s, p) => s + p.latitude, 0) / validPickups.length,
    validPickups.reduce((s, p) => s + p.longitude, 0) / validPickups.length,
  ];

  return (
    <div className="rounded-lg overflow-hidden border shadow-sm">
      <MapContainer
        center={center}
        zoom={12}
        style={{ height: "450px", width: "100%" }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds pickups={validPickups} />
        {validPickups.map((pickup) => (
          <Marker
            key={pickup.id}
            position={[pickup.latitude, pickup.longitude]}
            icon={createColoredIcon(pickup.status)}
          >
            <Popup>
              <div className="space-y-2 min-w-[200px]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">Pickup</span>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: statusColors[pickup.status] || "#6b7280" }}
                  >
                    {pickup.status.replace("_", " ")}
                  </span>
                </div>
                {pickup.user_name && (
                  <p className="text-xs text-gray-600">Requested by: {pickup.user_name}</p>
                )}
                {pickup.location && (
                  <p className="text-xs text-gray-600">📍 {pickup.location}</p>
                )}
                {pickup.scheduled_date && (
                  <p className="text-xs text-gray-600">📅 {pickup.scheduled_date}</p>
                )}
                {pickup.notes && (
                  <p className="text-xs text-gray-500 italic">{pickup.notes}</p>
                )}
                <div className="flex gap-1 pt-1">
                  {pickup.status === "pending" && onAccept && (
                    <button
                      onClick={() => onAccept(pickup.id)}
                      disabled={acceptingId === pickup.id}
                      className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {acceptingId === pickup.id ? "Accepting..." : "Accept"}
                    </button>
                  )}
                  {pickup.status === "in_progress" && onComplete && (
                    <button
                      onClick={() => onComplete(pickup.id)}
                      className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 text-xs">
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span
              className="w-3 h-3 rounded-full inline-block"
              style={{ backgroundColor: color }}
            />
            {status.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
