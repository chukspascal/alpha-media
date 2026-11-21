-- Alph@ Media — Consolidated Initial Schema for Fresh Supabase Projects
-- Includes: app_role, user_roles, projects + storage bucket, site_profile, and inquiries.

-- ============================================================================
-- 1. Roles & Helpers
-- ============================================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'editor');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- ============================================================================
-- 2. Projects & Storage
-- ============================================================================
CREATE TABLE public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  client text NOT NULL DEFAULT '',
  year text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Branding',
  blurb text NOT NULL DEFAULT '',
  brief text NOT NULL DEFAULT '',
  role text[] NOT NULL DEFAULT '{}',
  deliverables text[] NOT NULL DEFAULT '{}',
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover text NOT NULL DEFAULT '',
  width integer NOT NULL DEFAULT 1000,
  height integer NOT NULL DEFAULT 1000,
  gallery text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.projects TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT ALL ON public.projects TO service_role;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published projects are viewable by everyone"
ON public.projects FOR SELECT TO anon, authenticated
USING (published = true);

CREATE POLICY "Admins can view all projects"
ON public.projects FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert projects"
ON public.projects FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update projects"
ON public.projects FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete projects"
ON public.projects FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER projects_set_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-images', 'project-images', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Admins can read project images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upload project images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update project images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete project images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'project-images' AND public.has_role(auth.uid(), 'admin'));

INSERT INTO public.projects (slug, title, client, year, category, blurb, brief, role, deliverables, results, cover, width, height, gallery, sort_order) VALUES
('cede-coffee', 'Cede Coffee', 'Cede Roasters, Lagos', '2026', 'Branding', 'A loud, letterform-first identity for a slow-roast coffee house.', 'Cede wanted to sell specialty coffee without the beige minimalism everyone else was using. We built the identity on a single oversized wordmark that gets cropped, stacked and repeated until it becomes pattern.', ARRAY['Brand strategy','Identity design','Packaging','Art direction'], ARRAY['Wordmark & marks','Packaging system','Poster series','Store signage'], '[{"label":"Retail lift","value":"+38%"},{"label":"SKUs shipped","value":"12"},{"label":"Weeks","value":"9"}]'::jsonb, 'seed/work-1.jpg', 900, 1200, ARRAY['seed/work-1.jpg','seed/work-4.jpg','seed/work-3.jpg'], 1),
('octa-marks', 'Octa Mark System', 'Octa Logistics', '2025', 'Logos', 'Eight interlocking marks built from one geometric grid.', 'A logistics group with eight sub-brands needed marks that read as family without repeating a single shape. We drew every mark on the same 8-unit grid so they lock together in motion.', ARRAY['Mark design','Grid system','Brand guidelines'], ARRAY['8 sub-brand marks','Construction grid','Usage manual'], '[{"label":"Sub-brands","value":"8"},{"label":"Grid units","value":"8x8"},{"label":"Pages of guide","value":"64"}]'::jsonb, 'seed/work-2.jpg', 1200, 900, ARRAY['seed/work-2.jpg','seed/work-7.jpg','seed/work-5.jpg'], 2),
('musica-festival', 'Musica Festival', 'Musica Live', '2025', 'Posters', 'A halftone poster campaign wheatpasted across three cities.', 'Three-day festival, forty acts, one poster language. Type does all the work: black slab headlines, halftone bleed, and a yellow that survives being pasted on a wet wall.', ARRAY['Campaign art direction','Poster design','Print production'], ARRAY['24 posters','Billboard adaptations','Ticket & pass design'], '[{"label":"Posters printed","value":"4.2k"},{"label":"Cities","value":"3"},{"label":"Sold out in","value":"6 days"}]'::jsonb, 'seed/work-3.jpg', 900, 1200, ARRAY['seed/work-3.jpg','seed/work-1.jpg','seed/work-6.jpg'], 3),
('polis-skincare', 'Polis Skincare', 'Polis Labs', '2026', 'Packaging', 'Matte black boxes, one accent sticker, zero decoration.', 'The whole system is a black box and a printed label. Cost per unit dropped, shelf presence went up, and the range can grow forever by changing one sticker.', ARRAY['Packaging design','Label system','Photography direction'], ARRAY['Primary & secondary packaging','Label templates','Launch imagery'], '[{"label":"Unit cost","value":"-22%"},{"label":"Launch SKUs","value":"9"},{"label":"Sell-through","value":"94%"}]'::jsonb, 'seed/work-4.jpg', 1000, 1000, ARRAY['seed/work-4.jpg','seed/work-2.jpg','seed/work-8.jpg'], 4),
('bours-zine', 'Bours Zine', 'Bours Editorial', '2024', 'Editorial', 'A quarterly print zine with a hard grid and softer serif voice.', 'Twelve-column grid, two typefaces, no stock photography. Each issue reorganises the same components so the zine feels new without losing its spine.', ARRAY['Editorial design','Typesetting','Cover art direction'], ARRAY['Master grid','4 issues','Cover series'], '[{"label":"Issues","value":"4"},{"label":"Pages set","value":"412"},{"label":"Subscribers","value":"7.8k"}]'::jsonb, 'seed/work-5.jpg', 1200, 800, ARRAY['seed/work-5.jpg','seed/work-8.jpg','seed/work-1.jpg'], 5),
('lumen-social', 'Lumen Social Kit', 'Lumen App', '2026', 'Social', 'A 60-template social system a two-person team can run alone.', 'Lumen posts daily and has no designer on staff. We shipped a template kit with locked type scales and three colourways so anyone can post on-brand in five minutes.', ARRAY['Design system','Template design','Team training'], ARRAY['60 templates','Motion presets','Playbook'], '[{"label":"Templates","value":"60"},{"label":"Engagement","value":"+61%"},{"label":"Time per post","value":"5 min"}]'::jsonb, 'seed/work-6.jpg', 900, 1100, ARRAY['seed/work-6.jpg','seed/work-7.jpg','seed/work-2.jpg'], 6),
('chrome-motion', 'Chrome Motion', 'Axis Studio', '2025', 'Motion', 'A 3D title sequence built from chrome and obsidian.', 'Fifteen seconds of hard-edged geometry for a studio reel opener. Everything is one material system: polished chrome, luminous accent, black void.', ARRAY['Concept','3D design','Animation'], ARRAY['Title sequence','Stinger set','Reel stills'], '[{"label":"Runtime","value":"15s"},{"label":"Frames","value":"900"},{"label":"Awards","value":"2"}]'::jsonb, 'seed/work-7.jpg', 1000, 1000, ARRAY['seed/work-7.jpg','seed/work-2.jpg','seed/work-4.jpg'], 7),
('figures-illustration', 'Figures', 'Self-initiated', '2024', 'Illustration', 'A printed illustration study of bodies in flat colour.', 'A personal series exploring how few marks a figure needs to still read as a person. Printed as a riso-style zine and sold out twice.', ARRAY['Illustration','Print design','Self-publishing'], ARRAY['32 illustrations','Zine','Print set'], '[{"label":"Illustrations","value":"32"},{"label":"Print runs","value":"2"},{"label":"Copies","value":"600"}]'::jsonb, 'seed/work-8.jpg', 1100, 850, ARRAY['seed/work-8.jpg','seed/work-5.jpg','seed/work-3.jpg'], 8);

-- ============================================================================
-- 3. Site Profile (Singleton id = 1)
-- ============================================================================
CREATE TABLE public.site_profile (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name text NOT NULL DEFAULT 'Alexx',
  role_title text NOT NULL DEFAULT 'Principal Creative Director & Founder',
  location text NOT NULL DEFAULT 'Lagos / Global',
  intro text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  portrait text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT 'studio@alphamedia.design',
  availability text NOT NULL DEFAULT '',
  toolkit jsonb NOT NULL DEFAULT '[]'::jsonb,
  timeline jsonb NOT NULL DEFAULT '[]'::jsonb,
  services jsonb NOT NULL DEFAULT '[]'::jsonb,
  principles jsonb NOT NULL DEFAULT '[]'::jsonb,
  socials jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_profile TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_profile TO authenticated;
GRANT ALL ON public.site_profile TO service_role;
ALTER TABLE public.site_profile ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile is viewable by everyone"
ON public.site_profile FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert profile"
ON public.site_profile FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update profile"
ON public.site_profile FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER site_profile_set_updated_at
BEFORE UPDATE ON public.site_profile
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.site_profile (name, role_title, location, intro, bio, email, availability, toolkit, timeline, services, principles, socials) VALUES
('Alexx', 'Principal Creative Director & Founder', 'Lagos / Global',
'Alph@ Media is a principal-led creative and digital agency founded by Alexx. Over the past four years, we have partnered with ambitious founders, cultural institutions, and growth-stage teams to build unmistakable brand systems and high-converting digital flagships.',
'We pair senior-level brand architecture with production-grade web engineering, editorial direction, and motion systems—so the strategy in the deck is the exact craft that ships to the world.',
'studio@alphamedia.design',
'Booking Q1/Q2 brand & digital engagements.',
'[{"group":"Brand Systems","items":["Figma","Adobe Illustrator","InDesign","Custom Typography"]},{"group":"Digital Flagships","items":["React & TypeScript","GSAP & Motion","Design Systems","WebGL"]},{"group":"Motion & 3D","items":["After Effects","Cinema 4D","3D Art Direction","Title Sequences"]},{"group":"Art Direction","items":["Adobe Lightroom","Editorial Photography","Campaigns","Print Production"]}]'::jsonb,
'[{"year":"2022","title":"Studio Foundations","body":"Launched independent practice delivering high-contrast visual identities and campaign graphics."},{"year":"2023","title":"Digital Product & UI","body":"Expanded into design systems, conversion-focused web interfaces, and interactive brand experiences."},{"year":"2024","title":"Full-Stack Flagships","body":"Brought production engineering in-house so every motion study and layout ships without compromise."},{"year":"2025","title":"Campaigns & Media","body":"Added end-to-end event media direction, editorial shoots, and multi-channel launch systems."},{"year":"2026","title":"Alph@ Media Today","body":"Operating as a principal-led creative agency serving clients across Africa, Europe, and North America."}]'::jsonb,
'["Brand Architecture","Digital Flagships","Design Systems","Web Engineering","Motion & 3D","Campaign Direction","Packaging Systems","Editorial & Print"]'::jsonb,
'[{"title":"Architectural Clarity","body":"Grid, scale, and negative space decided with intent—never decorative noise."},{"title":"Narrative Craft","body":"Every brand system communicates authority before a visitor reads a single headline."},{"title":"Production Truth","body":"We design and engineer in the same room so the shipped product matches the vision."}]'::jsonb,
'[{"label":"Instagram","href":"https://instagram.com/alphamedia.design"},{"label":"Behance","href":"https://behance.net/alphamedia"},{"label":"Dribbble","href":"https://dribbble.com/alphamedia"},{"label":"LinkedIn","href":"https://linkedin.com/company/alphamedia"}]'::jsonb
);

-- ============================================================================
-- 4. Client Briefs / Inquiries
-- ============================================================================
CREATE TABLE public.inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text NOT NULL DEFAULT '',
  service text NOT NULL,
  budget text NOT NULL,
  timeline text NOT NULL DEFAULT '',
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'replied', 'archived')),
  notes text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.inquiries TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inquiries TO authenticated;
GRANT ALL ON public.inquiries TO service_role;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit an inquiry"
ON public.inquiries FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view inquiries"
ON public.inquiries FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update inquiries"
ON public.inquiries FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete inquiries"
ON public.inquiries FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER inquiries_set_updated_at
BEFORE UPDATE ON public.inquiries
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
