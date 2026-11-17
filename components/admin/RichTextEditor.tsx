"use client";
/**
 * A small rich-text editor for blog posts: paragraphs, two heading sizes, bold / italic / underline, lists, quotes and
 * links. It is the browser's own editing (contentEditable), so there is no editor library to load.
 *
 * The output is HTML. The server keeps only the same tags the toolbar can make (content/html.py) and cleans it again
 * before the website shows it, so pasted or hand-made markup can't do any harm. Pasting always inserts plain text,
 * which keeps formatting from Word or other websites out of the post.
 */
import {
  type RemixiconComponentType, RiArrowGoBackLine, RiArrowGoForwardLine, RiBold, RiDoubleQuotesL, RiFormatClear, RiH2, RiH3, RiItalic, RiLinkM,
  RiLinkUnlinkM, RiListOrdered, RiListUnordered, RiParagraph, RiUnderline,
} from "@remixicon/react";
import { useCallback, useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/base/buttons/button";
import { cx } from "@/utils/cx";

type Tool = { label: string; icon: RemixiconComponentType; run: () => void; active?: () => boolean; shortcut?: string };

// document.execCommand is marked deprecated but every browser supports it, and nothing has replaced it for simple
// formatting of a contentEditable region. It is used only here.
const exec = (command: string, value?: string) => document.execCommand(command, false, value);
const block = (tag: string) => () => exec("formatBlock", `<${tag}>`);
const inBlock = (tag: string) => () => String(document.queryCommandValue("formatBlock")).toLowerCase() === tag;
const state = (command: string) => () => document.queryCommandState(command);

const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** What staff type in the link box, as an address: "goadventure.in" -> https://goadventure.in. */
const safeUrl = (raw: string) => {
  const url = raw.trim();
  if (!url) return "";
  if (/^(https?:|mailto:|tel:)/i.test(url)) return url;
  if (/^[\w.-]+@[\w-]+\.[\w.]+$/.test(url)) return `mailto:${url}`;
  if (url.startsWith("/")) return url;
  return `https://${url.replace(/^\/+/, "")}`;
};

export function RichTextEditor({ label, value, onChange, hint, readOnly, minHeight = 320 }: {
  label: string;
  /** Initial HTML. The editor owns the text after mounting; give it a new `key` to load different text. */
  value: string;
  onChange: (html: string) => void;
  hint?: string;
  readOnly?: boolean;
  minHeight?: number;
}) {
  const editor = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const labelId = useId();
  const hintId = useId();
  const [, rerender] = useState(0);
  const [linking, setLinking] = useState<string | null>(null);   // URL being typed, or null when the link bar is closed

  // Load the starting text once. Re-rendering from `value` on every keystroke would move the caret.
  useEffect(() => {
    if (editor.current) editor.current.innerHTML = value || "";
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = useCallback(() => {
    const html = editor.current?.innerHTML ?? "";
    onChange(editor.current?.textContent?.trim() ? html : "");
  }, [onChange]);

  // Keep the toolbar's "pressed" state in step with where the caret is.
  useEffect(() => {
    const onSelection = () => {
      if (editor.current?.contains(document.getSelection()?.anchorNode ?? null)) rerender((n) => n + 1);
    };
    document.addEventListener("selectionchange", onSelection);
    return () => document.removeEventListener("selectionchange", onSelection);
  }, []);

  const apply = (fn: () => void) => {
    editor.current?.focus();
    exec("defaultParagraphSeparator", "p");
    fn();
    emit();
  };

  const openLink = () => {
    const selection = document.getSelection();
    if (!selection?.rangeCount || !editor.current?.contains(selection.anchorNode)) {
      editor.current?.focus();
      return;
    }
    savedRange.current = selection.getRangeAt(0).cloneRange();
    const current = (selection.anchorNode?.parentElement?.closest("a") as HTMLAnchorElement | null)?.getAttribute("href");
    setLinking(current ?? "");
  };

  const applyLink = () => {
    const url = safeUrl(linking ?? "");
    const selection = document.getSelection();
    editor.current?.focus();
    if (savedRange.current && selection) {
      selection.removeAllRanges();
      selection.addRange(savedRange.current);
    }
    if (!url) exec("unlink");
    else if (selection && !selection.isCollapsed) exec("createLink", url);
    else exec("insertHTML", `<a href="${escapeHtml(url)}">${escapeHtml(url)}</a>`);   // nothing selected: the address is the link text
    savedRange.current = null;
    setLinking(null);
    emit();
  };

  const tools: (Tool | "|")[] = [
    { label: "Paragraph", icon: RiParagraph, run: block("p"), active: inBlock("p") },
    { label: "Heading", icon: RiH2, run: block("h2"), active: inBlock("h2") },
    { label: "Small heading", icon: RiH3, run: block("h3"), active: inBlock("h3") },
    "|",
    { label: "Bold", icon: RiBold, run: () => exec("bold"), active: state("bold"), shortcut: "Ctrl+B" },
    { label: "Italic", icon: RiItalic, run: () => exec("italic"), active: state("italic"), shortcut: "Ctrl+I" },
    { label: "Underline", icon: RiUnderline, run: () => exec("underline"), active: state("underline"), shortcut: "Ctrl+U" },
    "|",
    { label: "Bulleted list", icon: RiListUnordered, run: () => exec("insertUnorderedList"), active: state("insertUnorderedList") },
    { label: "Numbered list", icon: RiListOrdered, run: () => exec("insertOrderedList"), active: state("insertOrderedList") },
    { label: "Quote", icon: RiDoubleQuotesL, run: block("blockquote"), active: inBlock("blockquote") },
    "|",
    { label: "Link", icon: RiLinkM, run: openLink, shortcut: "Ctrl+K" },
    { label: "Remove link", icon: RiLinkUnlinkM, run: () => exec("unlink") },
    { label: "Clear formatting", icon: RiFormatClear, run: () => { exec("removeFormat"); exec("formatBlock", "<p>"); } },
    "|",
    { label: "Undo", icon: RiArrowGoBackLine, run: () => exec("undo"), shortcut: "Ctrl+Z" },
    { label: "Redo", icon: RiArrowGoForwardLine, run: () => exec("redo"), shortcut: "Ctrl+Shift+Z" },
  ];

  const onPaste = (e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    exec("insertText", e.clipboardData.getData("text/plain"));
    emit();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      openLink();
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-body-medium text-text-secondary">{label}</span>
      <div className={cx("overflow-hidden rounded-xl border border-border-button-default bg-background-primary-default focus-within:ring-2 focus-within:ring-border-button-default", readOnly && "opacity-80")}>
        {!readOnly && (
          <div role="toolbar" aria-label={`${label} formatting`} className="flex flex-wrap items-center gap-0.5 border-b border-separator-border bg-background-secondary-default/60 p-1.5">
            {tools.map((t, i) => t === "|"
              ? <span key={i} aria-hidden className="mx-1 h-5 w-px bg-separator-border" />
              : (
                <button key={t.label} type="button" title={t.shortcut ? `${t.label} (${t.shortcut})` : t.label} aria-label={t.label}
                  aria-pressed={t.active ? t.active() : undefined}
                  // mousedown would move focus out of the text and lose the selection the command applies to
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => (t.label === "Link" ? t.run() : apply(t.run))}
                  className={cx("grid size-8 place-items-center rounded-md text-text-secondary transition-colors hover:bg-background-primary-default hover:text-text-primary",
                    t.active?.() && "bg-background-primary-default text-text-primary shadow-xs")}>
                  <t.icon className="size-4" aria-hidden />
                </button>
              ))}
          </div>
        )}
        {linking !== null && (
          <form className="flex flex-wrap items-center gap-2 border-b border-separator-border px-3 py-2" onSubmit={(e) => { e.preventDefault(); applyLink(); }}>
            <label className="flex min-w-0 flex-1 items-center gap-2 text-body-regular text-text-secondary">
              Link to
              <input autoFocus value={linking} onChange={(e) => setLinking(e.target.value)} placeholder="https://… or /trips/…"
                className="min-w-0 flex-1 rounded-lg border border-border-button-default bg-background-primary-default px-2 py-1 text-body-medium text-text-primary outline-none" />
            </label>
            <Button size="small" variant="primary" type="submit">{linking.trim() ? "Apply" : "Remove link"}</Button>
            <Button size="small" variant="secondary" type="button" onClick={() => { setLinking(null); savedRange.current = null; }}>Cancel</Button>
          </form>
        )}
        <div
          ref={editor}
          role="textbox"
          aria-multiline="true"
          aria-labelledby={labelId}
          aria-describedby={hint ? hintId : undefined}
          contentEditable={!readOnly}
          suppressContentEditableWarning
          onInput={emit}
          onBlur={emit}
          onPaste={onPaste}
          onKeyDown={onKeyDown}
          style={{ minHeight }}
          className="rich-text max-h-[70vh] overflow-y-auto px-4 py-3 text-body-medium text-text-primary outline-none"
        />
      </div>
      {hint && <p id={hintId} className="text-caption-1-medium text-text-tertiary">{hint}</p>}
    </div>
  );
}
