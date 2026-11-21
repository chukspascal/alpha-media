import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, Trash2 } from "lucide-react";
import {
  deleteInquiry,
  listInquiries,
  updateInquiry,
  type InquiryRecord,
  type InquiryStatus,
} from "@/lib/inquiries.functions";
import { cn } from "@/lib/utils";

const STATUSES: InquiryStatus[] = ["new", "reviewing", "replied", "archived"];

export function InquiriesInbox() {
  const queryClient = useQueryClient();
  const fetchInquiries = useServerFn(listInquiries);
  const patchInquiry = useServerFn(updateInquiry);
  const removeInquiry = useServerFn(deleteInquiry);

  const [filter, setFilter] = useState<"all" | InquiryStatus>("all");
  const [selected, setSelected] = useState<InquiryRecord | null>(null);
  const [notesDraft, setNotesDraft] = useState("");

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["admin-inquiries"],
    queryFn: () => fetchInquiries({}),
  });

  const updateMutation = useMutation({
    mutationFn: (payload: { id: string; status?: InquiryStatus; notes?: string }) =>
      patchInquiry({ data: payload }),
    onSuccess: (_res, vars) => {
      toast.success("Brief updated");
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
      if (selected && selected.id === vars.id) {
        setSelected({
          ...selected,
          ...(vars.status ? { status: vars.status } : {}),
          ...(vars.notes !== undefined ? { notes: vars.notes } : {}),
        });
      }
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to update brief"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => removeInquiry({ data: { id } }),
    onSuccess: (_res, id) => {
      toast.success("Brief deleted");
      if (selected?.id === id) setSelected(null);
      queryClient.invalidateQueries({ queryKey: ["admin-inquiries"] });
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : "Failed to delete brief"),
  });

  const visible =
    filter === "all" ? inquiries : inquiries.filter((item) => item.status === filter);

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {(["all", ...STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "border-2 border-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em]",
                filter === s ? "bg-foreground text-background" : "hover:bg-accent",
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
          {inquiries.filter((i) => i.status === "new").length} unread · {inquiries.length} total
        </p>
      </div>

      {isLoading ? (
        <p className="py-12 text-sm text-muted-foreground">Loading briefs…</p>
      ) : visible.length === 0 ? (
        <div className="border-2 border-foreground/30 p-12 text-center">
          <p className="font-display text-3xl text-muted-foreground">No briefs in this view.</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-muted-foreground">
            Submissions from /contact appear here once the inquiries migration is applied.
          </p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
          <div className="space-y-3">
            {visible.map((item) => {
              const active = selected?.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelected(item);
                    setNotesDraft(item.notes ?? "");
                  }}
                  className={cn(
                    "w-full border-2 p-4 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : "border-foreground/30 hover:border-foreground",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-2xl leading-none">{item.name}</p>
                    <span
                      className={cn(
                        "px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]",
                        item.status === "new"
                          ? "bg-primary text-primary-foreground"
                          : "border border-foreground/30 text-muted-foreground",
                      )}
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {item.company ? `${item.company} · ` : ""}
                    {item.service} · {item.budget}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-foreground/80">{item.message}</p>
                </button>
              );
            })}
          </div>

          <div>
            {selected ? (
              <div className="space-y-6 border-2 border-foreground p-6 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-foreground/20 pb-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                      {selected.service} · {selected.budget}
                      {selected.timeline ? ` · ${selected.timeline}` : ""}
                    </p>
                    <h2 className="mt-2 font-display text-4xl leading-none">{selected.name}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {selected.company ? `${selected.company} — ` : ""}
                      <a
                        href={`mailto:${selected.email}`}
                        className="underline hover:text-primary"
                      >
                        {selected.email}
                      </a>
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`mailto:${selected.email}?subject=${encodeURIComponent(
                        `Re: ${selected.service} brief — Alph@ Media`,
                      )}`}
                      className="inline-flex items-center gap-2 border-2 border-foreground bg-foreground px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-background hover:border-primary hover:bg-primary"
                    >
                      <Mail className="size-3.5" /> Reply
                    </a>
                    <button
                      type="button"
                      onClick={() => deleteMutation.mutate(selected.id)}
                      className="inline-flex items-center gap-2 border-2 border-destructive px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    Brief
                  </p>
                  <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-foreground">
                    {selected.message}
                  </p>
                </div>

                <div className="grid gap-6 border-t border-foreground/20 pt-6 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Status
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => updateMutation.mutate({ id: selected.id, status: s })}
                          className={cn(
                            "border-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em]",
                            selected.status === s
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-foreground/40 hover:border-foreground",
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      Internal Notes
                    </p>
                    <textarea
                      rows={3}
                      value={notesDraft}
                      onChange={(e) => setNotesDraft(e.target.value)}
                      className="mt-3 w-full border-2 border-foreground/40 bg-transparent p-3 text-sm outline-none focus:border-primary"
                      placeholder="Call notes, next steps, proposal link..."
                    />
                    <button
                      type="button"
                      onClick={() =>
                        updateMutation.mutate({ id: selected.id, notes: notesDraft })
                      }
                      className="mt-2 border-2 border-foreground px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] hover:bg-foreground hover:text-background"
                    >
                      Save notes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-2 border-foreground/20 p-12 text-center text-sm text-muted-foreground">
                Select a brief from the left to review details, update status, or reply.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
