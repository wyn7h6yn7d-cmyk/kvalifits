"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Link } from "@/i18n/routing";
import type { HomepageShowcaseCompany } from "@/lib/companies/homepageShowcase";
import { cn } from "@/lib/utils";

type Props = {
  companies: HomepageShowcaseCompany[];
  logoAlt: (name: string) => string;
};

/** Uniform logo height — transparent mark or quiet neutral plate. */
const LOGO_SLOT_CLASS = "h-10 sm:h-11";
const LOGO_IMAGE_CLASS =
  "max-h-full w-auto max-w-[min(100%,8.75rem)] object-contain object-center opacity-[0.72] transition-opacity duration-200 group-hover:opacity-[0.96] group-focus-visible:opacity-[0.96]";

function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
  return reduce;
}

function visibleLogoCount(viewportWidth: number) {
  if (viewportWidth >= 1280) return 7;
  if (viewportWidth >= 1024) return 6;
  if (viewportWidth >= 640) return 4;
  return 2.75;
}

function HomepageCarouselLogo({
  company,
  logoAlt,
}: {
  company: HomepageShowcaseCompany;
  logoAlt: (name: string) => string;
}) {
  if (company.displayMode === "plate") {
    return (
      <div className={cn("flex w-full items-center justify-center", LOGO_SLOT_CLASS)}>
        <div
          className={cn(
            "inline-flex max-w-[min(100%,9.5rem)] items-center justify-center rounded-md",
            "bg-[#e8e8ec] px-3 py-1.5",
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={company.logoUrl}
            alt={logoAlt(company.name)}
            className="max-h-[1.125rem] w-auto max-w-[7.5rem] object-contain object-center sm:max-h-[1.25rem]"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full items-center justify-center", LOGO_SLOT_CLASS)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={company.logoUrl}
        alt={logoAlt(company.name)}
        className={LOGO_IMAGE_CLASS}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}

function LogoLink({
  company,
  logoAlt,
  slotWidth,
  onDragIntent,
}: {
  company: HomepageShowcaseCompany;
  logoAlt: (name: string) => string;
  slotWidth: number;
  onDragIntent: () => boolean;
}) {
  return (
    <Link
      href={`/ettevotted/${company.slug}`}
      className={cn(
        "group flex shrink-0 items-center justify-center px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07070c]",
        LOGO_SLOT_CLASS,
      )}
      style={{ width: slotWidth > 0 ? slotWidth : undefined }}
      aria-label={company.name}
      draggable={false}
      onClick={(event) => {
        if (onDragIntent()) {
          event.preventDefault();
        }
      }}
    >
      <HomepageCarouselLogo company={company} logoAlt={logoAlt} />
    </Link>
  );
}

export function HomepageCompanyCarousel({ companies, logoAlt }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const setWidthRef = useRef(0);
  const dragRef = useRef({ active: false, moved: false, startX: 0, startScroll: 0, pointerId: -1 });
  const pauseRef = useRef(false);

  const [viewportWidth, setViewportWidth] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dragging, setDragging] = useState(false);

  const loopItems = useMemo(() => {
    if (companies.length < 2) return companies;
    return [...companies, ...companies, ...companies];
  }, [companies]);

  const gapPx = viewportWidth >= 1024 ? 48 : viewportWidth >= 640 ? 36 : 28;
  const visible = visibleLogoCount(viewportWidth);
  const slotWidth =
    viewportWidth > 0 ? Math.max(96, (viewportWidth - gapPx * (Math.ceil(visible) - 1)) / visible) : 0;

  const syncViewportWidth = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    setViewportWidth(el.clientWidth);
  }, []);

  const normalizeScroll = useCallback(() => {
    const viewport = viewportRef.current;
    const setWidth = setWidthRef.current;
    if (!viewport || setWidth <= 0) return;

    if (viewport.scrollLeft >= setWidth * 2) {
      viewport.scrollLeft -= setWidth;
    } else if (viewport.scrollLeft <= 0) {
      viewport.scrollLeft += setWidth;
    }
  }, []);

  const seedScroll = useCallback(() => {
    const viewport = viewportRef.current;
    const setWidth = setWidthRef.current;
    if (!viewport || setWidth <= 0 || companies.length < 2) return;
    viewport.scrollLeft = setWidth;
  }, [companies.length]);

  useEffect(() => {
    syncViewportWidth();
    const viewport = viewportRef.current;
    if (!viewport) return;

    const ro = new ResizeObserver(() => {
      syncViewportWidth();
    });
    ro.observe(viewport);
    return () => ro.disconnect();
  }, [syncViewportWidth]);

  useEffect(() => {
    if (companies.length < 2) return;
    const viewport = viewportRef.current;
    if (!viewport || slotWidth <= 0) return;

    setWidthRef.current = companies.length * slotWidth + Math.max(companies.length - 1, 0) * gapPx;
    seedScroll();
  }, [companies.length, gapPx, seedScroll, slotWidth]);

  useEffect(() => {
    pauseRef.current = paused || dragging || prefersReducedMotion;
  }, [paused, dragging, prefersReducedMotion]);

  useEffect(() => {
    if (companies.length < 2 || prefersReducedMotion) return;

    let frame = 0;
    const tick = () => {
      const viewport = viewportRef.current;
      if (viewport && !pauseRef.current) {
        // Slow, seamless drift — trust strip, not ad ticker.
        viewport.scrollLeft += 0.28;
        normalizeScroll();
      }
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [companies.length, normalizeScroll, prefersReducedMotion]);

  const noteDragIntent = useCallback(() => dragRef.current.moved, []);

  const endDrag = useCallback(() => {
    const viewport = viewportRef.current;
    const pointerId = dragRef.current.pointerId;
    dragRef.current.active = false;
    dragRef.current.pointerId = -1;
    setDragging(false);
    if (viewport) {
      viewport.classList.remove("is-dragging");
      if (pointerId >= 0) {
        try {
          viewport.releasePointerCapture(pointerId);
        } catch {
          /* pointer already released */
        }
      }
    }
    window.setTimeout(() => {
      dragRef.current.moved = false;
    }, 0);
    normalizeScroll();
  }, [normalizeScroll]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (companies.length < 2) return;
    const viewport = viewportRef.current;
    if (!viewport || (event.pointerType === "mouse" && event.button !== 0)) return;

    dragRef.current.active = true;
    dragRef.current.moved = false;
    dragRef.current.startX = event.clientX;
    dragRef.current.startScroll = viewport.scrollLeft;
    dragRef.current.pointerId = event.pointerId;
    setDragging(true);
    viewport.setPointerCapture(event.pointerId);
    viewport.classList.add("is-dragging");
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport || !dragRef.current.active) return;

    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 4) dragRef.current.moved = true;
    viewport.scrollLeft = dragRef.current.startScroll - delta;
    normalizeScroll();
  };

  if (!companies.length) return null;

  if (companies.length === 1) {
    return (
      <div className="flex justify-center py-1">
        <LogoLink
          company={companies[0]!}
          logoAlt={logoAlt}
          slotWidth={slotWidth || 160}
          onDragIntent={noteDragIntent}
        />
      </div>
    );
  }

  return (
    <div
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setPaused(false);
        }
      }}
    >
      <div
        ref={viewportRef}
        className={cn(
          "homepage-company-carousel-viewport overflow-x-auto overscroll-x-contain py-1",
          "[mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]",
          dragging ? "cursor-grabbing" : "cursor-grab",
        )}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onScroll={normalizeScroll}
        aria-labelledby="home-companies-title"
        tabIndex={0}
      >
        <div className="flex w-max items-center" style={{ columnGap: gapPx }}>
          {loopItems.map((company, index) => (
            <LogoLink
              key={`${company.id}-${index}`}
              company={company}
              logoAlt={logoAlt}
              slotWidth={slotWidth}
              onDragIntent={noteDragIntent}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
