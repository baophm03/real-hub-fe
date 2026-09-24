"use client";

import { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Link } from "@/i18n/navigation";
import type { Property } from "@/lib/api/types/properties";

// Fix default marker icon (webpack/asset path issue của leaflet)
const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

interface ListingsMapViewProps {
  properties: Property[];
}

export default function ListingsMapView({ properties }: ListingsMapViewProps) {
  const withCoords = useMemo(
    () =>
      properties.filter(
        (p) => typeof p.latitude === "number" && typeof p.longitude === "number" &&
          !Number.isNaN(p.latitude) && !Number.isNaN(p.longitude),
      ),
    [properties],
  );

  const center: [number, number] = withCoords.length
    ? [withCoords[0].latitude!, withCoords[0].longitude!]
    : [16.047, 108.206]; // fallback: Đà Nẵng

  if (withCoords.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-border bg-surface py-20 text-center">
        <p className="text-sm text-foreground-muted">
          Không có BĐS nào có tọa độ để hiển thị trên bản đồ.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <MapContainer
        center={center}
        zoom={11}
        scrollWheelZoom
        className="h-[600px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((p) => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]} icon={markerIcon}>
            <Popup>
              <div className="flex flex-col gap-1 text-sm">
                <Link
                  href={`/listings/${p.propertyCode}`}
                  className="font-medium text-[#072707] hover:underline"
                >
                  {p.title}
                </Link>
                <span className="text-xs text-gray-500">{p.propertyCode}</span>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
