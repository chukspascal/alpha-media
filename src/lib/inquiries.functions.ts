import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type InquiryStatus = "new" | "reviewing" | "replied" | "archived";

export type InquiryRecord = {
  id: string;
  name: string;
  email: string;
  company: string;
  service: string;
  budget: string;
  timeline: string;
  message: string;
  status: InquiryStatus;
  notes: string;
  created_at: string;
  updated_at: string;
};

const submitInput = z.object({
  name: z.string().trim().min(2, "Tell us your name.").max(120),
  email: z.string().trim().email("A valid email, please.").max(160),
  company: z.string().trim().max(160).default(""),
  service: z.string().trim().min(1, "Pick a discipline."),
  budget: z.string().trim().min(1, "Pick an investment range."),
  timeline: z.string().trim().max(120).default(""),
  message: z.string().trim().min(20, "Share a few more details — 20 characters minimum.").max(4000),
});

export const submitInquiry = createServerFn({ method: "POST" })
  .validator((data: unknown) => submitInput.parse(data))
  .handler(async ({ data }) => {
    const { createPublicClient } = await import("./projects.server");
    const { error } = await createPublicClient().from("inquiries").insert({
      name: data.name,
      email: data.email,
      company: data.company,
      service: data.service,
      budget: data.budget,
      timeline: data.timeline,
      message: data.message,
    });
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") {
        throw new Error("Inquiries table not migrated yet. Run the latest Supabase migration.");
      }
      throw error;
    }
    return { ok: true };
  });

export const listInquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<InquiryRecord[]> => {
    const { data, error } = await context.supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      if (error.code === "PGRST205" || error.code === "42P01") return [];
      throw error;
    }
    return (data ?? []) as InquiryRecord[];
  });

const updateInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["new", "reviewing", "replied", "archived"]).optional(),
  notes: z.string().max(4000).optional(),
});

export const updateInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => updateInput.parse(data))
  .handler(async ({ context, data }) => {
    const patch: { status?: InquiryStatus; notes?: string } = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.notes !== undefined) patch.notes = data.notes;
    const { error } = await context.supabase.from("inquiries").update(patch).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const deleteInquiry = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("inquiries").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
