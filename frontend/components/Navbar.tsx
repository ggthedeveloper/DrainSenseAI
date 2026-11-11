"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const CITIES = [
  {
    id: "VJA",
    name: "Vijayawada / Amaravati",
    state: "AP",
  },
] as const;

interface NavbarProps {
  selectedCity: string;
  onSelectCity: (cityId: string) => void;
  healthStatus: { status: string; model_version: string } | null;
  onToggleMobileMenu?: () => void;
}

export function Navbar({ selectedCity, onSelectCity, healthStatus, onToggleMobileMenu }: NavbarProps) {
  const current = CITIES.find((c) => c.id === selectedCity) || CITIES[0];
  const online = healthStatus?.status === "HEALTHY";

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-[#D5E2E0] bg-[#FBFDFC]/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2">
        {onToggleMobileMenu && (
          <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={onToggleMobileMenu} aria-label="Open menu">
            <Menu />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" className="max-w-[240px]">
              <span className="truncate">{current.name}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="z-[60]">
            {CITIES.map((city) => (
              <DropdownMenuItem key={city.id} onClick={() => onSelectCity(city.id)}>
                {city.name}
                <span className="ml-2 text-[#4C5E62]">{city.state}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="flex items-center gap-2 text-xs text-[#4C5E62]">
        <span className={online ? "text-[#067647]" : "text-[#B42318]"}>{online ? "API up" : "API down"}</span>
        {healthStatus?.model_version && <span className="hidden font-mono sm:inline">{healthStatus.model_version}</span>}
      </div>
    </header>
  );
}
