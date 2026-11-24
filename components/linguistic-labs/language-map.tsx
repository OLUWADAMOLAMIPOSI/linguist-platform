"use client";

import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { CircleMarker, MapContainer, Popup, TileLayer } from "react-leaflet";
import { VITALITY } from "@/lib/linguistics";

export interface MapLanguage {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  vitality: string;
  family: string | null;
  region: string | null;
}

export default function LanguageMap({ languages }: { languages: MapLanguage[] }) {
  const lat = languages.reduce((s, l) => s + l.latitude, 0) / languages.length;
  const lng = languages.reduce((s, l) => s + l.longitude, 0) / languages.length;

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={languages.length === 1 ? 6 : 4}
      scrollWheelZoom={false}
      className="h-[28rem] w-full rounded border border-line"
      aria-label="Map of documented languages"
    >
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {languages.map((l) => {
        const color = VITALITY[l.vitality]?.color ?? "#2f4a3c";
        return (
          <CircleMarker
            key={l.id}
            center={[l.latitude, l.longitude]}
            radius={9}
            pathOptions={{ color, fillColor: color, fillOpacity: 0.7, weight: 2 }}
          >
            <Popup>
              <div className="text-sm">
                <p className="font-serif text-base font-semibold">{l.name}</p>
                {l.family && <p>Family: {l.family}</p>}
                {l.region && <p>Region: {l.region}</p>}
                <p>Vitality: {VITALITY[l.vitality]?.label}</p>
                <Link href={`/languages/${l.slug}`} className="link">
                  Open language profile
                </Link>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
