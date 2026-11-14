"use client";
import { RiDeleteBin6Line, RiImageAddLine, RiImageLine, RiUploadCloud2Line } from "@remixicon/react";
import { useEffect, useRef, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { cx } from "@/utils/cx";

const MAX_MB = 5;   // same as the server's MAX_FILE_UPLOAD_SIZE
const urls = new Map<string, Promise<string | null>>();
/** Image address of a media-library item (cached: the same cover is shown in many places). */
export function mediaUrl(id: string) {
  if (!urls.has(id)) urls.set(id, adminApi.get("media-assets", id).then((a) => (a.file as string) || null).catch(() => null));
  return urls.get(id)!;
}

/** Small preview of a media-library image by id. */
export function MediaThumb({ id, className }: { id: string | null | undefined; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => { setSrc(null); if (id) mediaUrl(String(id)).then(setSrc); }, [id]);
  return (
    <span className={cx("grid shrink-0 place-items-center overflow-hidden rounded-lg border border-border-button-default bg-background-secondary-default", className ?? "size-14")}>
      {src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt="" className="size-full object-cover" /> : <RiImageLine className="size-5 text-foreground-icon-tertiary" aria-hidden />}
    </span>
  );
}

/**
 * Image field: upload (click or drop), preview, replace, remove. No dropdowns.
 * The file goes to the media library (S3 on the server) and the field stores the new item's id.
 */
export function ImageUpload({ label, value, onChange, hint, error, altText }: {
  label: string; value: string | null | undefined; onChange: (id: string) => void; hint?: string; error?: string; altText?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [over, setOver] = useState(false);

  useEffect(() => { setSrc(null); if (value) mediaUrl(String(value)).then(setSrc); }, [value]);

  async function upload(file: File | undefined) {
    if (!file) return;
    setProblem("");
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) { setProblem("Choose a JPG, PNG, WebP or GIF image."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setProblem(`That image is over ${MAX_MB} MB. Please use a smaller one.`); return; }
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "image");
    form.append("alt_text", altText || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
    setBusy(true);
    try {
      const saved = await adminApi.create("media-assets", form) as { id: string; file: string };
      urls.set(String(saved.id), Promise.resolve(saved.file));
      setSrc(saved.file);
      onChange(String(saved.id));
    } catch (e: any) {
      setProblem(e.message || "Upload failed. Try again.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const shown = error || problem;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-medium text-text-secondary">{label}</span>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border-button-default p-2">
          <a href={src ?? undefined} target="_blank" rel="noopener noreferrer" className="block h-24 w-36 shrink-0 overflow-hidden rounded-lg bg-background-secondary-default">
            {src ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={src} alt={label} className="size-full object-cover" /> : <span className="grid size-full place-items-center"><RiImageLine className="size-6 text-foreground-icon-tertiary" aria-hidden /></span>}
          </a>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy} onClick={() => input.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-button-default px-3 text-body-medium hover:bg-background-secondary-default disabled:opacity-50">
              <RiUploadCloud2Line className="size-4" aria-hidden />{busy ? "Uploading…" : "Replace"}
            </button>
            <button type="button" disabled={busy} onClick={() => onChange("")}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border-button-default px-3 text-body-medium text-text-secondary hover:bg-background-secondary-default hover:text-rose-600 disabled:opacity-50">
              <RiDeleteBin6Line className="size-4" aria-hidden />Remove
            </button>
          </div>
        </div>
      ) : (
        <button type="button" disabled={busy} onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); upload(e.dataTransfer.files?.[0]); }}
          className={cx("flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
            over ? "border-text-secondary bg-background-secondary-default" : "border-border-button-default hover:bg-background-secondary-default/60")}>
          {busy ? <span className="size-6 animate-spin rounded-full border-2 border-text-tertiary border-t-transparent" aria-hidden /> : <RiImageAddLine className="size-7 text-foreground-icon-tertiary" aria-hidden />}
          <span className="text-body-medium text-text-primary">{busy ? "Uploading…" : "Upload image"}</span>
          <span className="text-caption-1-medium text-text-tertiary">Click or drop a JPG, PNG or WebP · up to {MAX_MB} MB</span>
        </button>
      )}
      {shown ? <p className="text-body-regular text-text-error-primary">{shown}</p> : hint ? <p className="text-caption-1-medium text-text-tertiary">{hint}</p> : null}
    </div>
  );
}
