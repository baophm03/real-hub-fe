import { House, Building2, Warehouse, Map, Store } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PropertyCategory {
  icon: LucideIcon;
  labelKey: string;
  descKey: string;
  href: string;
  types: string;
  color: string;
  colorOnDark: string;
}

export const propertyCategories: PropertyCategory[] = [
  {
    icon: House,
    labelKey: "header.catApartment",
    descKey: "header.catApartmentDesc",
    types: "APARTMENT",
    href: "/listings?types=APARTMENT",
    color: "text-blue-600",
    colorOnDark: "text-blue-400",
  },
  {
    icon: Building2,
    labelKey: "header.catVilla",
    descKey: "header.catVillaDesc",
    types: "VILLA",
    href: "/listings?types=VILLA",
    color: "text-violet-600",
    colorOnDark: "text-violet-400",
  },
  {
    icon: Warehouse,
    labelKey: "header.catTownhouse",
    descKey: "header.catTownhouseDesc",
    types: "HOUSE,SHOPHOUSE",
    href: "/listings?types=HOUSE,SHOPHOUSE",
    color: "text-emerald-600",
    colorOnDark: "text-emerald-400",
  },
  {
    icon: Map,
    labelKey: "header.catLand",
    descKey: "header.catLandDesc",
    types: "LAND",
    href: "/listings?types=LAND",
    color: "text-amber-600",
    colorOnDark: "text-amber-400",
  },
  {
    icon: Store,
    labelKey: "header.catCommercial",
    descKey: "header.catCommercialDesc",
    types: "OFFICE,WAREHOUSE,SHOP",
    href: "/listings?types=OFFICE,WAREHOUSE,SHOP",
    color: "text-rose-600",
    colorOnDark: "text-rose-400",
  },
];
