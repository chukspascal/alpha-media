import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef } from "react";
import { ArrowUpRight } from "lucide-react";
import { EASE, ScrollTrigger, SplitText, gsap, prefersReducedMotion, useIsomorphicLayoutEffect } from "@/lib/gsap";
import { whenIntroDone } from "@/lib/smooth";
import { listPublishedProjects } from "@/lib/projects.functions";
import type { ProjectRecord } from "@/lib/project-types";
import { HorizontalWork } from "@/components/site/horizontal-work";
import { Marquee } from "@/components/site/marquee";
import { Reveal } from "@/components/site/reveal";
import { Magnetic } from "@/components/site/magnetic";

export const Route = createFileRoute("/")({
  loader: () => listPublishedProjects(),
  errorComponent: () => (
    <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
      <h1 className="font-display text-5xl">Something broke loading the work.</h1>
      <p className="mt-4 text-muted-foreground">Please refresh the page.</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
      <h1 className="font-display text-5xl">Page not found</h1>
    </div>
  ),
  head: () => ({
    meta: [
      { title: "Alph@ Media — Principal-Led Creative & Digital Agency" },
      {
        name: "description",
        content:
          "Principal-led creative and digital agency crafting brand architecture, digital flagships, and motion systems for ambitious companies worldwide.",
      },
      { property: "og:title", content: "Alph@ Media — Principal-Led Creative & Digital Agency" },
      {
        property: "og:description",
        content:
          "Principal-led creative and digital agency crafting brand architecture, digital flagships, and motion systems for ambitious companies worldwide.",
      },
    ],
  }),
  component: Home,
});

const stats = [
  { value: "4+ yrs", label: "Studio track record" },
  { value: "$50k+", label: "Flagship engagements" },
  { value: "Global", label: "Lagos · London · Remote" },
  { value: "100%", label: "Principal-led craft" },
];

function Hero({ featured }: { featured?: ProjectRecord | undefined }) {
  const section = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const headline = useRef<HTMLHeadingElement>(null);
  const eyebrow = useRef<HTMLParagraphElement>(null);
  const sub = useRef<HTMLDivElement>(null);
  const featuredCard = useRef<HTMLDivElement>(null);
  const tilt = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  useIsomorphicLayoutEffect(() => {
    const root = section.current;
    if (!root || prefersReducedMotion()) return;

    let split: SplitText | undefined;
    let ctx: ReturnType<typeof gsap.context> | undefined;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;
    const h1 = headline.current;

    const onOver = (e: MouseEvent) => {
      const ch = (e.target as HTMLElement).closest?.(".hero-char");
      if (!ch) return;
      gsap.fromTo(
        ch,
        { y: 0 },
        { y: -18, duration: 0.16, yoyo: true, repeat: 1, ease: "power2.out", overwrite: "auto" },
      );
    };

    const revealAll = () => {
      gsap.set([eyebrow.current, sub.current, featuredCard.current].filter(Boolean), {
        autoAlpha: 1,
        y: 0,
        yPercent: 0,
        scale: 1,
        clearProps: "transform",
      });
      if (split) {
        gsap.set(split.chars, { autoAlpha: 1, yPercent: 0, rotate: 0, clearProps: "transform" });
      }
    };

    const off = whenIntroDone(() => {
      try {
        ctx = gsap.context(() => {
          const tl = gsap.timeline({ defaults: { ease: EASE } });
          tl.fromTo(
            eyebrow.current,
            { y: 16, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.7 },
          );
          if (headline.current) {
            split = new SplitText(headline.current, { type: "chars", charsClass: "hero-char" });
            tl.fromTo(
              split.chars,
              { yPercent: 60, autoAlpha: 0 },
              { yPercent: 0, autoAlpha: 1, duration: 0.9, stagger: 0.012 },
              "-=0.45",
            );
          }
          tl.fromTo(
            sub.current,
            { y: 24, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.8 },
            "-=0.6",
          );
          if (featuredCard.current) {
            tl.fromTo(
              featuredCard.current,
              { y: 28, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: 0.9 },
              "-=0.7",
            );
          }

          gsap.to(content.current, {
            y: 24,
            ease: "none",
            scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
          });

          ScrollTrigger.refresh();
        }, root);
      } catch {
        revealAll();
      }

      if (headline.current) {
        tilt.current = {
          x: gsap.quickTo(headline.current, "x", { duration: 0.7, ease: "power3" }),
          y: gsap.quickTo(headline.current, "y", { duration: 0.7, ease: "power3" }),
        };
      }
      h1?.addEventListener("mouseover", onOver);

      safetyTimer = setTimeout(revealAll, 3000);
      ScrollTrigger.refresh();
    });

    return () => {
      off();
      h1?.removeEventListener("mouseover", onOver);
      tilt.current = null;
      clearTimeout(safetyTimer);
      ctx?.revert();
      split?.revert();
    };
  }, []);

  return (
    <section
      ref={section}
      onMouseMove={(e) => {
        const fn = tilt.current;
        const rect = e.currentTarget.getBoundingClientRect();
        if (!fn) return;
        fn.x(((e.clientX - (rect.left + rect.width / 2)) / rect.width) * 14);
        fn.y(((e.clientY - (rect.top + rect.height / 2)) / rect.height) * 8);
      }}
      onMouseLeave={() => {
        tilt.current?.x(0);
        tilt.current?.y(0);
      }}
      className="relative overflow-hidden border-b border-white/10"
    >
      <div
        ref={content}
        className="relative z-10 mx-auto max-w-[1600px] px-5 pt-10 pb-14 md:px-10 md:pt-16 md:pb-20"
      >
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-12">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2.5 border border-white/15 bg-white/[0.03] px-3.5 py-1.5">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              <p
                ref={eyebrow}
                className="text-[11px] font-semibold uppercase tracking-[0.26em] text-primary"
              >
                Principal-led creative agency — Lagos / Global
              </p>
            </div>

            <h1
              ref={headline}
              className="mt-6 font-display text-5xl leading-[0.92] tracking-tight sm:text-6xl md:text-7xl lg:text-[5.25rem] xl:text-[6.25rem]"
            >
              Brand architecture
              <br />
              &amp; digital <span className="italic text-primary">flagships.</span>
            </h1>

            <div ref={sub} className="mt-8 space-y-8 border-t border-white/10 pt-7">
              <p className="max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg md:text-xl">
                Founded by <span className="font-medium text-foreground">Alexx</span>. We partner
                with ambitious companies to build unmistakable brand systems, high-converting web
                flagships, and motion direction that command category authority.
              </p>

              <div className="flex flex-wrap items-center gap-4">
                <Magnetic to="/contact">Book a discovery call</Magnetic>
                <Magnetic to="/work" variant="outline">
                  Selected work
                </Magnetic>
              </div>
            </div>
          </div>

          <div ref={featuredCard} className="lg:col-span-5">
            {featured ? (
              <Link
                to="/work/$slug"
                params={{ slug: featured.slug }}
                data-cursor="View"
                className="glass-card-interactive group block overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                  <span className="text-primary">01 / Featured Case Study</span>
                  <span>{featured.year}</span>
                </div>
                <div className="relative aspect-[4/3] overflow-hidden bg-black/40">
                  <img
                    src={featured.cover}
                    alt={`${featured.title} — ${featured.category}`}
                    width={featured.width}
                    height={featured.height}
                    className="size-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                </div>
                <div className="flex items-center justify-between gap-4 border-t border-white/10 px-5 py-4">
                  <div>
                    <p className="font-display text-2xl leading-none text-foreground transition-colors group-hover:text-primary">
                      {featured.title}
                    </p>
                    <p className="mt-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                      {featured.client || featured.category}
                    </p>
                  </div>
                  <span className="flex size-9 shrink-0 items-center justify-center border border-white/15 bg-white/[0.04] text-foreground transition-colors group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
                    <ArrowUpRight className="size-4" />
                  </span>
                </div>
              </Link>
            ) : (
              <div className="glass-card p-6 sm:p-8">
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                  01 / Studio Capabilities
                </p>
                <p className="mt-4 font-display text-3xl leading-tight text-foreground">
                  Identity systems, digital flagships, and motion built in one room.
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                  From positioning and custom typography to production React engineering.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-6 border-t border-white/10 pt-6 text-[11px] uppercase tracking-[0.2em] md:grid-cols-4">
          <div>
            <p className="text-muted-foreground">Availability</p>
            <p className="mt-1 font-semibold text-foreground">Booking Q1 / Q2</p>
          </div>
          <div>
            <p className="text-muted-foreground">Core Focus</p>
            <p className="mt-1 font-semibold text-foreground">Brand · Web · Motion</p>
          </div>
          <div>
            <p className="text-muted-foreground">Regions</p>
            <p className="mt-1 font-semibold text-foreground">Africa · Europe · US</p>
          </div>
          <div>
            <p className="text-muted-foreground">Engagement</p>
            <p className="mt-1 font-semibold text-primary">Principal-Led</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Home() {
  const projects = Route.useLoaderData();

  return (
    <div>
      <Hero featured={projects[0]} />

      <Marquee
        items={["Brand identity", "Packaging", "Posters", "Motion", "Editorial", "Illustration"]}
        className="border-t-0"
      />

      <HorizontalWork items={projects} />

      {/* Architectural Stats Grid */}
      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 divide-y divide-white/10 md:grid-cols-4 md:divide-x md:divide-y-0">
          {stats.map((s, i) => (
            <Reveal key={s.label} delay={i * 0.06} className="px-5 py-10 md:px-10 md:py-14">
              <p className="font-display text-5xl leading-none text-foreground md:text-6xl">
                {s.value}
              </p>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                {s.label}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Studio Thesis */}
      <section className="mx-auto max-w-[1600px] px-5 py-20 md:px-10">
        <div className="glass-card p-8 md:p-16">
          <div className="grid gap-10 md:grid-cols-[1fr_1fr]">
            <Reveal>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                The studio model
              </p>
              <h2 className="font-display text-5xl leading-[0.95] md:text-7xl">
                Strategy, craft, and <span className="italic text-primary">code</span> under one roof.
              </h2>
            </Reveal>
            <Reveal delay={0.1} className="space-y-5 text-lg leading-relaxed">
              <p className="text-foreground/90">
                Most agencies split brand strategy, visual identity, and web engineering across
                disconnected teams. We keep them in one room—so the conviction in the deck ships
                intact to the browser, the packaging line, and the launch film.
              </p>
              <p className="text-muted-foreground">
                Every engagement is principal-led from discovery to final handover, built for
                founders and teams who treat design as a competitive moat.
              </p>
              <div className="pt-2">
                <Link
                  to="/services"
                  className="glass-pill inline-flex items-center gap-2 px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-foreground transition-all hover:border-primary/50 hover:text-primary"
                >
                  Scope &amp; investment <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA Glass Banner */}
      <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-10">
        <div className="glass-panel relative overflow-hidden rounded-3xl border border-primary/30 p-10 shadow-[0_0_40px_rgba(168,85,247,0.15)] md:p-16">
          <div className="pointer-events-none absolute -right-20 -top-20 size-80 rounded-full bg-primary/20 blur-[100px]" />
          <div className="relative z-10 flex flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
            <h2 className="font-display text-5xl leading-[0.9] md:text-8xl">
              Got something
              <br />
              <span className="italic text-primary">worth building?</span>
            </h2>
            <Magnetic to="/contact">Let's talk</Magnetic>
          </div>
        </div>
      </section>
    </div>
  );
}
