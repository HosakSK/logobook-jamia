"use client";

import React, { useState, useEffect, useRef } from "react";

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  initialCount?: number;
  batchSize?: number;
  className?: string;
  emptyState?: React.ReactNode;
}

/**
 * Lightweight viewport-aware virtualizer using IntersectionObserver.
 * Prevents DOM flooding when rendering large item sets (e.g. 100+ icons in M25).
 */
export function VirtualGrid<T>({
  items,
  renderItem,
  initialCount = 32,
  batchSize = 24,
  className = "grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3",
  emptyState,
}: VirtualGridProps<T>) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Reset visible count when item collection changes
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [items, initialCount]);

  useEffect(() => {
    if (visibleCount >= items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + batchSize, items.length));
        }
      },
      {
        rootMargin: "300px",
      }
    );

    const target = sentinelRef.current;
    if (target) observer.observe(target);

    return () => {
      if (target) observer.unobserve(target);
      observer.disconnect();
    };
  }, [items.length, visibleCount, batchSize]);

  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const visibleItems = items.slice(0, visibleCount);

  return (
    <div className="space-y-4">
      <div className={className}>
        {visibleItems.map((item, idx) => (
          <React.Fragment key={idx}>{renderItem(item, idx)}</React.Fragment>
        ))}
      </div>

      {/* Intersection Sentinel for dynamic chunk loading */}
      {visibleCount < items.length && (
        <div ref={sentinelRef} className="h-8 flex items-center justify-center">
          <span className="text-[11px] text-muted-foreground animate-pulse">
            Načítavam ďalšie položky ({visibleCount} z {items.length})...
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * Viewport-deferred individual item wrapper.
 * Defers rendering until the element enters the viewport.
 */
export function IntersectionLazyItem({
  children,
  placeholderHeight = "80px",
  className = "",
}: {
  children: React.ReactNode;
  placeholderHeight?: string;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={className} style={!isVisible ? { minHeight: placeholderHeight } : undefined}>
      {isVisible ? children : null}
    </div>
  );
}
