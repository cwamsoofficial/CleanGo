import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, CircleMarker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const statusColors: Record<string, string> = {
  pending: "#eab308",
  in_progress: "#3b82f6",
  resolved: "#22c55e",
};

export interface WasteMapPoint {
  id: string;
  latitude: number;
  longitude: number;
  status: string;
  category: string | null;
  location: string | null;
  created_at: string;
}

function FitBounds({ points }: { points: WasteMapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((p) => [p.latitude, p.longitude] as [number, number]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
  }, [points, map]);
  return null;
}

export function WasteMap({ points }: { points: WasteMapPoint[] }) {
  const valid = points.filter(
    (p) => p.latitude != null && p.longitude != null && !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  if (valid.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] border rounded-lg bg-muted/30">
        <MapPin className="h-12 w-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground font-medium">No mapped reports yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Reports submitted with location will show here as hotspots
        </p>
      </div>
    );
  }

  // Default center: Kano, Nigeria
  const center: [number, number] = [
    valid.reduce((s, p) => s + p.latitude, 0) / valid.length,
    valid.reduce((s, p) => s + p.longitude, 0) / valid.length,
  ];

  return (
    <div className="rounded-lg overflow-hidden border shadow-sm">
      <MapContainer center={center} zoom={12} style={{ height: "450px", width: "100%" }} className="z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={valid} />
        {valid.map((p) => {
          const color = statusColors[p.status] || "#6b7280";
          return (
            <CircleMarker
              key={p.id}
              center={[p.latitude, p.longitude]}
              radius={10}
              pathOptions={{ color, fillColor: color, fillOpacity: 0.6, weight: 2 }}
            >
              <Popup>
                <div className="space-y-1 min-w-[180px]">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Waste Report</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: color }}
                    >
                      {p.status.replace("_", " ")}
                    </span>
                  </div>
                  {p.category && (
                    <p className="text-xs text-gray-700 capitalize">
                      🗂 {p.category.replace(/_/g, " ")}
                    </p>
                  )}
                  {p.location && <p className="text-xs text-gray-600">📍 {p.location}</p>}
                  <p className="text-[11px] text-gray-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-muted/30 text-xs">
        {Object.entries(statusColors).map(([status, color]) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: color }} />
            {status.replace("_", " ")}
          </span>
        ))}
      </div>
    </div>
  );
}
