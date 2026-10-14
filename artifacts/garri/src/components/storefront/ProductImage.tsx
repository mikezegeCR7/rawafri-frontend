import { useState, type ImgHTMLAttributes } from "react";
import { PRODUCT_IMAGE_FALLBACK } from "@/lib/products/types";

/** Product photo that falls back to the placeholder when the URL is missing or fails to load. */
export function ProductImage({ src, alt, ...rest }: Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> & { src?: string | null }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={!src || failed ? PRODUCT_IMAGE_FALLBACK : src}
      alt={alt}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
