import { cn } from "@/lib/cn";
import { DishArt } from "./dish-art";

export function MenuImage({ imageUrl, artKey, name, className, priority }: { imageUrl?: string | null; artKey?: string | null; name: string; className?: string; priority?: boolean }) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- зураг серверт аль хэдийн WebP болгон багасгагдсан
      <img
        src={imageUrl}
        alt={name}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("h-full w-full object-cover", className)}
      />
    );
  }
  return <DishArt artKey={artKey} title={name} className={cn("h-full w-full", className)} />;
}
