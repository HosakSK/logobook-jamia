"use client";

import React, { useEffect, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import DOMPurify from "isomorphic-dompurify";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Unlink,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import { M02RichTextConfig } from "@/lib/validations/modules/m02";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { updateModuleConfigAction } from "@/actions/pages";

export default function M02RichTextModule({
  id,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const typedConfig = config as unknown as Partial<M02RichTextConfig> | undefined;

  const currentSize = typedConfig?.size || "body";
  const currentMaxWidth = typedConfig?.maxWidth || "prose";
  const customFontSize = typedConfig?.customFontSize;
  const fontFamily = typedConfig?.fontFamily || "var(--font-body)";

  const [isFocused, setIsFocused] = useState(false);

  // Multilingual content resolution (active locale first, with strict English fallback)
  const defaultPlaceholder =
    locale === "sk"
      ? "<p>Sem kliknite a začnite písať formátovaný text pravidiel značky...</p>"
      : "<p>Click here and start writing brand guidelines rich text...</p>";

  const resolvedHtml =
    resolveI18nText(typedConfig?.content, locale, "en") || defaultPlaceholder;

  // Sizing CSS classes
  const sizeClass =
    currentSize === "small"
      ? "text-sm leading-relaxed"
      : currentSize === "lead"
      ? "text-lg sm:text-xl font-normal leading-relaxed text-muted-foreground"
      : "text-base leading-relaxed text-foreground"; // body default

  const maxWidthClass =
    currentMaxWidth === "prose" ? "max-w-prose" : "max-w-full";

  // Commit configuration updates
  const handleUpdateConfig = async (patch: Partial<M02RichTextConfig>) => {
    const updated: M02RichTextConfig = {
      fontFamily,
      size: currentSize,
      customFontSize: customFontSize || null,
      maxWidth: currentMaxWidth,
      editorMode: "rich_text",
      content: typedConfig?.content || {
        en: "<p>Brand text content...</p>",
        sk: "<p>Textový obsah manuálu...</p>",
      },
      styleOverrides: typedConfig?.styleOverrides,
      ...patch,
    };

    if (onConfigChange) {
      onConfigChange(updated as unknown as BaseModuleConfig);
    } else if (id) {
      await updateModuleConfigAction(id, updated as unknown as Record<string, unknown>);
    }
  };

  // Commit HTML content update on blur
  const handleSaveHtml = async (newHtml: string) => {
    const updatedContentRecord = setI18nText(typedConfig?.content, locale, newHtml);
    await handleUpdateConfig({ content: updatedContentRecord });
  };

  // Initialize Tiptap editor for in-place inline editing
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Headings belong to M01
      }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline font-medium hover:text-primary/80",
        },
      }),
    ],
    content: resolvedHtml,
    immediatelyRender: false, // Prevents SSR hydration errors in Next.js
    editorProps: {
      attributes: {
        class: `prose prose-neutral dark:prose-invert max-w-none focus:outline-hidden min-h-[40px] ${sizeClass} prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5`,
      },
    },
    onFocus: () => setIsFocused(true),
    onBlur: ({ editor }) => {
      setIsFocused(false);
      const html = editor.getHTML();
      handleSaveHtml(html);
    },
  });

  // Synchronize editor content when active locale or external data changes
  useEffect(() => {
    if (editor && !editor.isFocused) {
      const targetHtml = resolveI18nText(typedConfig?.content, locale, "en") || defaultPlaceholder;
      if (editor.getHTML() !== targetHtml) {
        editor.commands.setContent(targetHtml, { emitUpdate: false });
      }
    }
  }, [locale, typedConfig?.content, editor, defaultPlaceholder]);

  // Set link handler
  const handleSetLink = () => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL adresa odkazu:", previousUrl || "https://");

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div
      className={`group/m02 relative w-full ${maxWidthClass}`}
      style={{
        fontFamily,
        ...(currentSize === "custom" && customFontSize ? { fontSize: `${customFontSize}px` } : {}),
      }}
    >
      {/* Editor Hover & Active Formatting Toolbar (Prevents Pencil Hell) */}
      {isEditor && (
        <div
          className={`absolute -top-9 left-0 z-30 transition-opacity bg-[#070b0f] border border-white/20 rounded-[var(--brand-radius,6px)] p-1 flex items-center gap-1 shadow-xl ${
            isFocused ? "opacity-100 pointer-events-auto" : "opacity-0 group-hover/m02:opacity-100"
          }`}
        >
          {/* Size Switcher */}
          <div className="flex items-center gap-0.5 bg-white/10 rounded-[2px] p-0.5 border border-white/10">
            {[
              { key: "small", label: "Small" },
              { key: "body", label: "Body" },
              { key: "lead", label: "Lead" },
            ].map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => handleUpdateConfig({ size: s.key as "small" | "body" | "lead" })}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[1px] transition-colors ${
                  currentSize === s.key
                    ? "bg-primary text-[#070b0f] font-bold"
                    : "text-white/75 hover:text-white hover:bg-white/10"
                }`}
                title={`Veľkosť textu: ${s.label}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

          {/* Width Constraint Switcher */}
          <button
            type="button"
            onClick={() =>
              handleUpdateConfig({ maxWidth: currentMaxWidth === "prose" ? "full" : "prose" })
            }
            className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[2px] border transition-colors flex items-center gap-1 ${
              currentMaxWidth === "prose"
                ? "bg-primary text-[#070b0f] border-primary font-bold"
                : "border-white/20 text-white/75 hover:text-white hover:bg-white/10"
            }`}
            title={
              currentMaxWidth === "prose"
                ? "Šírka: Prose (65-75 znakov). Kliknite pre 100% šírku."
                : "Šírka: 100% (Full). Kliknite pre čitateľnú šírku (Prose)."
            }
          >
            {currentMaxWidth === "prose" ? (
              <>
                <Minimize2 className="h-2.5 w-2.5" />
                <span>Prose</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-2.5 w-2.5" />
                <span>Full</span>
              </>
            )}
          </button>

          {/* Tiptap RichText Formatting Actions */}
          {editor && (
            <>
              <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

              <div className="flex items-center gap-0.5 bg-white/10 rounded-[2px] p-0.5 border border-white/10">
                {/* Bold */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={`p-1 rounded-[1px] transition-colors ${
                    editor.isActive("bold")
                      ? "bg-primary text-[#070b0f] font-bold"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                  title="Tučné písmo (Ctrl+B)"
                >
                  <Bold className="h-3 w-3" />
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={`p-1 rounded-[1px] transition-colors ${
                    editor.isActive("italic")
                      ? "bg-primary text-[#070b0f] font-bold"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                  title="Kurzíva (Ctrl+I)"
                >
                  <Italic className="h-3 w-3" />
                </button>

                {/* Link */}
                <button
                  type="button"
                  onClick={handleSetLink}
                  className={`p-1 rounded-[1px] transition-colors ${
                    editor.isActive("link")
                      ? "bg-primary text-[#070b0f] font-bold"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                  title="Vložiť odkaz (Link)"
                >
                  <LinkIcon className="h-3 w-3" />
                </button>

                {/* Bullet List */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  className={`p-1 rounded-[1px] transition-colors ${
                    editor.isActive("bulletList")
                      ? "bg-primary text-[#070b0f] font-bold"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                  title="Odrážkový zoznam"
                >
                  <List className="h-3 w-3" />
                </button>

                {/* Ordered List */}
                <button
                  type="button"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  className={`p-1 rounded-[1px] transition-colors ${
                    editor.isActive("orderedList")
                      ? "bg-primary text-[#070b0f] font-bold"
                      : "text-white/75 hover:text-white hover:bg-white/10"
                  }`}
                  title="Číslovaný zoznam"
                >
                  <ListOrdered className="h-3 w-3" />
                </button>
              </div>
            </>
          )}

          {/* Active Locale indicator */}
          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded-[1px] bg-white/10 border border-white/20 text-white/70 ml-0.5">
            {locale}
          </span>
        </div>
      )}

      {/* Editor Content or Public Safe Sanitized HTML */}
      {isEditor ? (
        <div className="w-full">
          <EditorContent editor={editor} />
        </div>
      ) : (
        <div
          className={`prose prose-neutral dark:prose-invert max-w-none ${sizeClass} prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5 prose-a:text-primary prose-a:underline hover:prose-a:text-primary/80`}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(resolvedHtml),
          }}
        />
      )}
    </div>
  );
}
