import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import {
  EASE,
  gsap,
  prefersReducedMotion,
  useIsomorphicLayoutEffect,
} from "@/lib/gsap";
import { startSmooth, stopSmooth } from "@/lib/smooth";
import { RollingText } from "./rolling-text";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Home" },
  { to: "/work", label: "Work" },
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const progress = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);

  // Scroll progress bar — scrubbed, no re-renders.
  useIsomorphicLayoutEffect(() => {
    const bar = progress.current;
    if (!bar || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        bar,
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.3 },
        },
      );
    });
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close (instantly) on navigation.
  useEffect(() => {
    setOpen(false);
    setMounted(false);
    document.body.style.overflow = "";
    startSmooth();
  }, [pathname]);

  // Entrance when the overlay mounts.
  useIsomorphicLayoutEffect(() => {
    const ov = overlay.current;
    if (!ov || !mounted) return;
    if (prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(ov, { yPercent: -100 }, { yPercent: 0, duration: 0.45, ease: EASE });
      gsap.fromTo(
        ov.querySelectorAll("[data-menu-link]"),
        { x: -24, autoAlpha: 0 },
        { x: 0, autoAlpha: 1, duration: 0.45, stagger: 0.05, delay: 0.1, ease: EASE },
      );
    }, ov);
    return () => ctx.revert();
  }, [mounted]);

  const openMenu = () => {
    setMounted(true);
    setOpen(true);
    document.body.style.overflow = "hidden";
    stopSmooth();
  };

  const closeMenu = useCallback(() => {
    const ov = overlay.current;
    document.body.style.overflow = "";
    startSmooth();
    if (!ov || prefersReducedMotion()) {
      setOpen(false);
      setMounted(false);
      return;
    }
    gsap.to(ov, {
      yPercent: -100,
      duration: 0.3,
      ease: "power3.in",
      overwrite: "auto",
      onComplete: () => {
        setOpen(false);
        setMounted(false);
      },
    });
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mounted, closeMenu]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={cn(
          "relative z-50 border-b border-white/[0.08] bg-background/85 backdrop-blur-md transition-all duration-300",
          scrolled ? "py-3 px-5 md:px-10" : "py-4 px-5 md:px-10",
        )}
      >
        <div className="mx-auto flex max-w-[1600px] items-center justify-between">
          <Link to="/" className="group flex items-baseline gap-2">
            <span
              className={cn(
                "font-display leading-none tracking-tight transition-all duration-300",
                scrolled ? "text-2xl" : "text-3xl md:text-4xl",
              )}
            >
              Alph<span className="text-primary drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]">@</span> Media
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.slice(1).map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "group/roll relative rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition-all",
                    active
                      ? "text-primary bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5",
                  )}
                >
                  <RollingText text={item.label} />
                </Link>
              );
            })}
            <Link
              to="/contact"
              className="ml-3 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(168,85,247,0.7)]"
            >
              Start a project
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => (mounted ? closeMenu() : openMenu())}
            aria-label={mounted ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="inline-flex size-10 items-center justify-center border border-white/15 bg-white/[0.04] text-foreground transition-colors hover:border-primary/50 hover:bg-white/10 md:hidden"
          >
            {mounted ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
        <div
          ref={progress}
          className="mt-2 h-[2px] w-full origin-left rounded-full bg-gradient-to-r from-primary via-fuchsia-400 to-primary"
          style={{ transform: prefersReducedMotion() ? undefined : "scaleX(0)" }}
          aria-hidden
        />
      </div>

      {mounted && (
        <div
          ref={overlay}
          className="fixed inset-0 z-40 flex h-dvh flex-col justify-between overflow-y-auto bg-background px-5 pt-24 pb-8 md:hidden"
        >
          <nav aria-label="Mobile navigation" className="divide-y divide-white/10 border-y border-white/10">
            {nav.map((item, idx) => {
              const active =
                item.to === "/"
                  ? pathname === "/"
                  : pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <div key={item.to} data-menu-link>
                  <Link
                    to={item.to}
                    onClick={closeMenu}
                    className={cn(
                      "flex items-center justify-between py-4 transition-colors",
                      active ? "text-primary" : "text-foreground hover:text-primary",
                    )}
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground">
                        0{idx + 1}
                      </span>
                      <span className="font-display text-4xl leading-none">{item.label}</span>
                    </span>
                    <ArrowUpRight className={cn("size-5", active ? "text-primary" : "text-muted-foreground")} />
                  </Link>
                </div>
              );
            })}
          </nav>

          <div data-menu-link className="mt-8 space-y-6">
            <Link
              to="/contact"
              onClick={closeMenu}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground shadow-[0_0_24px_rgba(168,85,247,0.35)]"
            >
              Book a discovery call <ArrowUpRight className="size-4" />
            </Link>
            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              <span>Lagos / Global</span>
              <span>studio@alphamedia.design</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
