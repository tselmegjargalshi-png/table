import type { OptionKind } from "@prisma/client";
import type { PublicMenu } from "@/server/services/menu";
import { openState, parseHours } from "@/server/services/restaurants";

export type MenuOptionDTO = { id: string; kind: OptionKind; groupName: string | null; name: string; priceDelta: number; isDefault: boolean };
export type MenuItemDTO = {
  id: string;
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
  options: MenuOptionDTO[];
};
export type MenuCategoryDTO = { id: string; name: string; description: string | null; items: MenuItemDTO[] };
export type RestaurantDTO = {
  slug: string;
  name: string;
  tagline: string | null;
  address: string | null;
  district: string | null;
  phone: string | null;
  brandColor: string;
  logoText: string | null;
  serviceFeePercent: number;
  deliveryFee: number;
  allowDineIn: boolean;
  allowTakeaway: boolean;
  allowDelivery: boolean;
  acceptingOrders: boolean;
  isDemo: boolean;
  hoursToday: string | null;
  openNow: boolean;
};
export type PublicMenuDTO = { restaurant: RestaurantDTO; categories: MenuCategoryDTO[]; featured: MenuItemDTO[] };

export function toPublicMenuDTO(menu: PublicMenu): PublicMenuDTO {
  const hours = parseHours(menu.openingHours);
  const { open, today } = openState(hours);
  const categories: MenuCategoryDTO[] = menu.categories
    .map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      items: c.items.map((i) => ({
        id: i.id,
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
        options: i.options.map((o) => ({ id: o.id, kind: o.kind, groupName: o.groupName, name: o.name, priceDelta: o.priceDelta, isDefault: o.isDefault })),
      })),
    }))
    .filter((c) => c.items.length > 0);
  const all = categories.flatMap((c) => c.items);
  const featured = all.filter((i) => i.isFeatured || i.isPopular).slice(0, 8);
  return {
    restaurant: {
      slug: menu.slug,
      name: menu.name,
      tagline: menu.tagline,
      address: menu.address,
      district: menu.district,
      phone: menu.phone,
      brandColor: menu.brandColor,
      logoText: menu.logoText,
      serviceFeePercent: menu.serviceFeePercent,
      deliveryFee: menu.deliveryFee,
      allowDineIn: menu.allowDineIn,
      allowTakeaway: menu.allowTakeaway,
      allowDelivery: menu.allowDelivery,
      acceptingOrders: menu.acceptingOrders,
      isDemo: menu.isDemo,
      hoursToday: today && !today.closed ? `${today.open} - ${today.close}` : null,
      openNow: open,
    },
    categories,
    featured,
  };
}
