export type ToolkitGroup = { group: string; items: string[] };
export type TimelineEntry = { year: string; title: string; body: string };
export type Principle = { title: string; body: string };
export type SocialLink = { label: string; href: string };

export type SiteProfile = {
  name: string;
  role_title: string;
  location: string;
  intro: string;
  bio: string;
  portrait: string;
  email: string;
  availability: string;
  toolkit: ToolkitGroup[];
  timeline: TimelineEntry[];
  services: string[];
  principles: Principle[];
  socials: SocialLink[];
};

/** What the site shows before the migration has run or the row is empty. */
export const DEFAULT_PROFILE: SiteProfile = {
  name: "Alexx",
  role_title: "Principal Creative Director & Founder",
  location: "Lagos / Global",
  intro:
    "Alph@ Media is a principal-led creative and digital agency founded by Alexx. Over the past four years, we have partnered with ambitious founders, cultural institutions, and growth-stage teams to build unmistakable brand systems and high-converting digital flagships.",
  bio: "We pair senior-level brand architecture with production-grade web engineering, editorial direction, and motion systems—so the strategy in the deck is the exact craft that ships to the world.",
  portrait: "",
  email: "studio@alphamedia.design",
  availability: "Booking Q1/Q2 brand & digital engagements.",
  toolkit: [
    { group: "Brand Systems", items: ["Figma", "Adobe Illustrator", "InDesign", "Custom Typography"] },
    { group: "Digital Flagships", items: ["React & TypeScript", "GSAP & Motion", "Design Systems", "WebGL"] },
    { group: "Motion & 3D", items: ["After Effects", "Cinema 4D", "3D Art Direction", "Title Sequences"] },
    { group: "Art Direction", items: ["Adobe Lightroom", "Editorial Photography", "Campaigns", "Print Production"] },
  ],
  timeline: [
    { year: "2022", title: "Studio Foundations", body: "Launched independent practice delivering high-contrast visual identities and campaign graphics." },
    { year: "2023", title: "Digital Product & UI", body: "Expanded into design systems, conversion-focused web interfaces, and interactive brand experiences." },
    { year: "2024", title: "Full-Stack Flagships", body: "Brought production engineering in-house so every motion study and layout ships without compromise." },
    { year: "2025", title: "Campaigns & Media", body: "Added end-to-end event media direction, editorial shoots, and multi-channel launch systems." },
    { year: "2026", title: "Alph@ Media Today", body: "Operating as a principal-led creative agency serving clients across Africa, Europe, and North America." },
  ],
  services: [
    "Brand Architecture",
    "Digital Flagships",
    "Design Systems",
    "Web Engineering",
    "Motion & 3D",
    "Campaign Direction",
    "Packaging Systems",
    "Editorial & Print",
  ],
  principles: [
    { title: "Architectural Clarity", body: "Grid, scale, and negative space decided with intent—never decorative noise." },
    { title: "Narrative Craft", body: "Every brand system communicates authority before a visitor reads a single headline." },
    { title: "Production Truth", body: "We design and engineer in the same room so the shipped product matches the vision." },
  ],
  socials: [
    { label: "Instagram", href: "https://instagram.com/alphamedia.design" },
    { label: "Behance", href: "https://behance.net/alphamedia" },
    { label: "Dribbble", href: "https://dribbble.com/alphamedia" },
    { label: "LinkedIn", href: "https://linkedin.com/company/alphamedia" },
  ],
};

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : [];
}

function asToolkit(value: unknown): ToolkitGroup[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((g): g is Record<string, unknown> => typeof g === "object" && g !== null)
    .map((g) => ({
      group: typeof g["group"] === "string" ? g["group"] : "",
      items: asStringArray(g["items"]),
    }))
    .filter((g) => g.group || g.items.length > 0);
}

function asLabeled(
  value: unknown,
  fields: string[],
): { [k: string]: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((e): e is Record<string, unknown> => typeof e === "object" && e !== null)
    .map((e) => {
      const out: { [k: string]: string } = {};
      for (const f of fields) out[f] = typeof e[f] === "string" ? (e[f] as string) : "";
      return out;
    })
    .filter((e) => Object.values(e).some(Boolean));
}

const str = (value: unknown, fallback: string) =>
  typeof value === "string" && value ? value : fallback;

/** Coerce a DB row (or partial data) into a full profile — never returns holes. */
export function mapProfileRow(row: Record<string, unknown>): SiteProfile {
  const d = DEFAULT_PROFILE;
  return {
    name: str(row["name"], d.name),
    role_title: str(row["role_title"], d.role_title),
    location: str(row["location"], d.location),
    intro: typeof row["intro"] === "string" ? row["intro"] : d.intro,
    bio: typeof row["bio"] === "string" ? row["bio"] : d.bio,
    portrait: typeof row["portrait"] === "string" ? row["portrait"] : d.portrait,
    email: str(row["email"], d.email),
    availability: typeof row["availability"] === "string" ? row["availability"] : d.availability,
    toolkit: asToolkit(row["toolkit"]).length > 0 ? asToolkit(row["toolkit"]) : d.toolkit,
    timeline: (asLabeled(row["timeline"], ["year", "title", "body"]) as TimelineEntry[]).length > 0
      ? (asLabeled(row["timeline"], ["year", "title", "body"]) as TimelineEntry[])
      : d.timeline,
    services: asStringArray(row["services"]).length > 0 ? asStringArray(row["services"]) : d.services,
    principles: (asLabeled(row["principles"], ["title", "body"]) as Principle[]).length > 0
      ? (asLabeled(row["principles"], ["title", "body"]) as Principle[])
      : d.principles,
    socials: (asLabeled(row["socials"], ["label", "href"]) as SocialLink[]).length > 0
      ? (asLabeled(row["socials"], ["label", "href"]) as SocialLink[])
      : d.socials,
  };
}
