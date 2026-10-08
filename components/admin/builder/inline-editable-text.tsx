"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, Edit2 } from "lucide-react";

interface InlineEditableTextProps {
  value: string;
  onSave: (newValue: string) => Promise<void> | void;
  placeholder?: string;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
  disabled?: boolean;
}

/**
 * Direct Inline Editing component powered by HTML contentEditable (Notion-style).
 * Enables seamless in-place editing on the canvas with auto-saving on blur.
 */
export function InlineEditableText({
  value,
  onSave,
  placeholder = "Kliknite pre zadanie textu...",
  as: Component = "span",
  className = "",
  style,
  multiline = false,
  disabled = false,
}: InlineEditableTextProps) {
  const [currentText, setCurrentText] = useState(value);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setCurrentText(value);
    if (ref.current && !isEditing) {
      ref.current.innerText = value;
    }
  }, [value, isEditing]);

  const handleBlur = async () => {
    setIsEditing(false);
    const newText = ref.current?.innerText.trim() || "";
    if (newText !== value) {
      try {
        setIsSaving(true);
        await onSave(newText || value);
        setCurrentText(newText || value);
      } catch (err) {
        console.error("Failed to save inline text:", err);
        // revert
        if (ref.current) ref.current.innerText = value;
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      ref.current?.blur();
    } else if (e.key === "Escape") {
      e.preventDefault();
      if (ref.current) ref.current.innerText = value;
      ref.current?.blur();
    }
  };

  if (disabled) {
    return (
      <Component className={className} style={style}>
        {value || placeholder}
      </Component>
    );
  }

  return (
    <div className="relative group inline-block max-w-full">
      <div
        ref={ref}
        contentEditable={!disabled && !isSaving}
        suppressContentEditableWarning
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        style={style}
        className={`outline-hidden transition-all duration-150 cursor-text select-text ${className} ${
          isEditing
            ? "ring-1 ring-primary/60 bg-neutral-900/60 px-1 rounded-[2px]"
            : "hover:bg-neutral-800/30 px-1 rounded-[2px]"
        }`}
        data-placeholder={placeholder}
      >
        {value}
      </div>

      {/* Subtle indicator icon on hover */}
      {!isEditing && (
        <span className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none text-muted-foreground">
          <Edit2 className="h-3 w-3" />
        </span>
      )}

      {isSaving && (
        <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-primary animate-pulse text-[10px] font-mono">
          ...
        </span>
      )}
    </div>
  );
}
