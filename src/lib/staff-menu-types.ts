import type { OptionKind } from "@prisma/client";

export type StaffOption = { id: string; kind: OptionKind; groupName: string | null; name: string; priceDelta: number; isDefault: boolean };
export type StaffItem = {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  artKey: string | null;
  ingredients: string[];
  isAvailable: boolean;
  isPopular: boolean;
  isFeatured: boolean;
  prepMinutes: number;
  position: number;
  options: StaffOption[];
};
export type StaffCategory = { id: string; name: string; description: string | null; isVisible: boolean; position: number; items: StaffItem[] };

type Raw = {
  id: string;
  name: string;
  description: string | null;
  isVisible: boolean;
  position: number;
  items: Array<Omit<StaffItem, "options"> & { options: StaffOption[] }>;
};

export function toStaffCategories(raw: Raw[]): StaffCategory[] {
  return raw.map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    isVisible: c.isVisible,
    position: c.position,
    items: c.items.map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name,
      description: i.description,
      price: i.price,
      imageUrl: i.imageUrl,
      artKey: i.artKey,
      ingredients: i.ingredients,
      isAvailable: i.isAvailable,
      isPopular: i.isPopular,
      isFeatured: i.isFeatured,
      prepMinutes: i.prepMinutes,
      position: i.position,
      options: i.options.map((o) => ({ id: o.id, kind: o.kind, groupName: o.groupName, name: o.name, priceDelta: o.priceDelta, isDefault: o.isDefault })),
    })),
  }));
}
