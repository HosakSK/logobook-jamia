"use client";

import React, { useState } from "react";
import { ImageOff, Loader2 } from "lucide-react";

interface OptimizedAssetImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallbackText?: string;
  aspectRatio?: string;
}

/**
 * Performance-optimized image wrapper with native lazy loading,
 * async decoding, progressive loading state, and resilient fallback on error.
 */
export function OptimizedAssetImage({
  src,
  alt,
  fallbackText = "Obrázok sa nepodarilo načítať",
  aspectRatio,
  className = "",
  style,
  ...props
}: OptimizedAssetImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-6 bg-neutral-900/60 border border-border/40 rounded-[3px] text-muted-foreground text-xs gap-2 ${className}`}
        style={{ aspectRatio, ...style }}
      >
        <ImageOff className="h-5 w-5 text-muted-foreground/60" />
        <span className="text-[11px]">{fallbackText}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-[3px] bg-neutral-900/20 ${className}`}
      style={{ aspectRatio, ...style }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/40" />
        </div>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        {...props}
      />
    </div>
  );
}
