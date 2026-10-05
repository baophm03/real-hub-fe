import {
  Star, ShieldCheck, Ruler, Bed, Bath, MapPin, Compass, Building2, Trees, Car,
  Zap, Droplet, Wind, Sun, Waves, Dumbbell, Utensils, Coffee, ShoppingBag,
  GraduationCap, HeartPulse, Lock, ArrowUpDown, Sofa, Mountain, TreePalm, TreeDeciduous,
  Fish, Flame, Snowflake, Wifi, Tv, WashingMachine, Refrigerator,
  DoorOpen, Fence, Bike, Bus, Cigarette, Scan,
} from "lucide-react";

export type IconColor = "blue" | "purple" | "green" | "yellow" | "red";

export const propertyIconMap: { patterns: string[]; icon: any; color: IconColor }[] = [
  { patterns: ["ban công", "balcony", "ban cong", "ban_cong"], icon: Building2, color: "blue" },
  { patterns: ["sân vườn", "garden", "yard", "san vuon", "san_vuon"], icon: Trees, color: "green" },
  { patterns: ["sân thượng", "rooftop", "san thuong", "san_thuong"], icon: Building2, color: "blue" },
  { patterns: ["chỗ để xe", "garage", "parking", "cho de xe", "cho_de_xe", "bãi đỗ", "bai do"], icon: Car, color: "yellow" },
  { patterns: ["đỗ xe", "do xe", "do_xe", "đậu xe", "dau xe", "dau_xe"], icon: Car, color: "yellow" },
  { patterns: ["xe máy", "bike", "xe may", "xe_may"], icon: Bike, color: "yellow" },
  { patterns: ["thang máy", "elevator", "thang may", "thang_may"], icon: ArrowUpDown, color: "blue" },
  { patterns: ["cửa", "door", "cua"], icon: DoorOpen, color: "purple" },
  { patterns: ["hàng rào", "fence", "hang rao", "hang_rao"], icon: Fence, color: "green" },
  { patterns: ["nội thất", "furniture", "noi that", "noi_that"], icon: Sofa, color: "purple" },
  { patterns: ["sofa", "phòng khách", "living room", "phong khach", "phong_khach"], icon: Sofa, color: "purple" },
  { patterns: ["phòng ngủ", "bedroom", "phong ngu", "phong_ngu", "beds"], icon: Bed, color: "purple" },
  { patterns: ["phòng tắm", "bathroom", "phong tam", "phong_tam", "baths"], icon: Bath, color: "blue" },
  { patterns: ["phòng bếp", "kitchen", "phong bep", "phong_bep"], icon: Utensils, color: "yellow" },
  { patterns: ["nhà hàng", "restaurant", "nha hang", "nha_hang"], icon: Utensils, color: "yellow" },
  { patterns: ["cafe", "cà phê", "ca phe", "ca_phe", "coffee"], icon: Coffee, color: "yellow" },
  { patterns: ["mua sắm", "shopping", "mua sam", "mua_sam", "siêu thị", "supermarket", "sieu thi", "sieu_thi"], icon: ShoppingBag, color: "yellow" },
  { patterns: ["trường học", "school", "truong hoc", "truong_hoc", "giáo dục", "education", "giao duc", "giao_duc"], icon: GraduationCap, color: "blue" },
  { patterns: ["bệnh viện", "hospital", "benh vien", "benh_vien", "y tế", "clinic", "y te", "y_te", "phòng khám", "phong kham"], icon: HeartPulse, color: "red" },
  { patterns: ["hồ bơi", "pool", "ho boi", "ho_boi", "swimming"], icon: Waves, color: "blue" },
  { patterns: ["gym", "thể dục", "fitness", "the duc", "the_duc", "thể hình"], icon: Dumbbell, color: "red" },
  { patterns: ["công viên", "park", "cong vien", "cong_vien", "vườn hoa", "vuon hoa", "vuon_hoa"], icon: TreeDeciduous, color: "green" },
  { patterns: ["biển", "beach", "bien", "ven biển", "ven_bien"], icon: Waves, color: "blue" },
  { patterns: ["cọ", "palm", "co"], icon: TreePalm, color: "green" },
  { patterns: ["núi", "mountain", "view núi", "nhin nui", "nhin_nui"], icon: Mountain, color: "green" },
  { patterns: ["thủy sinh", "aquarium", "thuy sinh", "thuy_sinh"], icon: Fish, color: "blue" },
  { patterns: ["an ninh", "security", "an_ninh", "bảo vệ", "bao ve", "bao_ve", "camera"], icon: Lock, color: "red" },
  { patterns: ["lửa", "fireplace", "lua", "bếp lò", "bep lo", "bep_lo"], icon: Flame, color: "red" },
  { patterns: ["điều hòa", "air conditioner", "dieu hoa", "dieu_hoa", "ac"], icon: Snowflake, color: "blue" },
  { patterns: ["thông gió", "ventilation", "thong gio", "thong_gio"], icon: Wind, color: "blue" },
  { patterns: ["ánh sáng", "light", "anh sang", "anh_sang", "nắng", "window", "cửa sổ", "cua so", "cua_so"], icon: Sun, color: "yellow" },
  { patterns: ["wifi", "wi-fi", "internet", "mạng", "mang"], icon: Wifi, color: "blue" },
  { patterns: ["tv", "truyền hình", "truyen hinh", "truyen_hinh", "truyền hình cáp"], icon: Tv, color: "purple" },
  { patterns: ["máy giặt", "washing machine", "may giat", "may_giat"], icon: WashingMachine, color: "blue" },
  { patterns: ["tủ lạnh", "fridge", "tu lanh", "tu_lanh", "refrigerator"], icon: Refrigerator, color: "blue" },
  { patterns: ["hút thuốc", "smoking", "smoke", "thuoc la", "thuoc_la"], icon: Cigarette, color: "yellow" },
  { patterns: ["di chuyển", "transport", "di chuyen", "di_chuyen", "transportation"], icon: Bus, color: "yellow" },
  { patterns: ["pháp lý", "legal", "phap ly", "phap_ly", "ownership"], icon: ShieldCheck, color: "green" },
  { patterns: ["diện tích", "area", "dien tich", "dien_tich"], icon: Scan, color: "blue" },
  { patterns: ["hướng", "direction", "huong"], icon: Compass, color: "yellow" },
  { patterns: ["mặt tiền", "facade", "mat tien", "mat_tien"], icon: Building2, color: "purple" },
  { patterns: ["vị trí", "location", "vi tri", "vi_tri"], icon: MapPin, color: "red" },
  { patterns: ["đường", "road", "duong"], icon: MapPin, color: "red" },
  { patterns: ["tầng", "floor", "tang"], icon: Building2, color: "purple" },
  { patterns: ["năm xây", "year", "nam xay", "nam_xay"], icon: Ruler, color: "yellow" },
  { patterns: ["điện", "electric", "dien"], icon: Zap, color: "yellow" },
  { patterns: ["nước", "water", "nuoc"], icon: Droplet, color: "blue" },
  { patterns: ["phòng", "room", "phong"], icon: Bed, color: "purple" },
];

export function findPropertyIcon(label: string): { icon: any; color: IconColor } {
  const lower = label.toLowerCase();
  for (const entry of propertyIconMap) {
    if (entry.patterns.some((p) => lower.includes(p))) {
      return { icon: entry.icon, color: entry.color };
    }
  }
  return { icon: Star, color: "yellow" };
}

export function findFieldValue(
  schemas: any[],
  dynamicValues: Record<string, unknown> | undefined,
  patterns: string[],
): string | null {
  for (const schema of schemas) {
    for (const f of (schema.fields || [])) {
      const field = f.field;
      if (!field) continue;
      const key = (field.fieldKey || "").toLowerCase();
      const label = (field.fieldLabel || "").toLowerCase();
      if (patterns.some((p) => key.includes(p) || label.includes(p))) {
        const rawValue = dynamicValues?.[field.fieldKey];
        if (rawValue === undefined || rawValue === null || rawValue === "") return null;
        if (field.options && Array.isArray(field.options)) {
          const opt = field.options.find((o: any) => o.value === String(rawValue));
          if (opt) return opt.label;
        }
        return String(rawValue);
      }
    }
  }
  return null;
}

export function getFieldsByGroupCode(
  schemas: any[],
  dynamicValues: Record<string, unknown> | undefined,
  code: string,
): { key: string; label: string; value: string }[] {
  const result: { key: string; label: string; value: string }[] = [];
  for (const schema of schemas) {
    for (const f of (schema.fields || [])) {
      const field = f.field;
      if (!field) continue;
      if (f.group?.code === code) {
        const rawValue = dynamicValues?.[field.fieldKey];
        if (rawValue === undefined || rawValue === null || rawValue === "") continue;
        let displayValue = String(rawValue);
        if (field.options && Array.isArray(field.options)) {
          const opt = field.options.find((o: any) => o.value === String(rawValue));
          if (opt) displayValue = opt.label;
        }
        result.push({ key: field.fieldKey, label: field.fieldLabel, value: displayValue });
      }
    }
  }
  return result;
}
