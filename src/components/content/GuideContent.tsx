import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Renders Guide.content, a deliberately tiny markdown subset (no dependency):
 *   - blocks separated by a blank line
 *   - "## Heading" -> <h2>
 *   - lines starting "- " -> <ul>
 *   - anything else -> <p>
 *   - inline [text](/path) -> <Link>, INTERNAL paths only (must start with "/");
 *     anything else is rendered as its plain text, so content can never inject an
 *     external or javascript: link.
 * Plain prose with none of the markers renders as paragraphs, same as before.
 */
export function GuideContent({ content }: { content: string }) {
  const blocks = content
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed text-[var(--color-ink)]">
      {blocks.map((block, index) => {
        if (block.startsWith("## ")) {
          return (
            <h2 key={index} className="mt-4 font-serif text-xl text-[var(--color-ink)]">
              {renderInline(block.slice(3))}
            </h2>
          );
        }
        const lines = block.split("\n");
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={index} className="list-disc space-y-1 pl-6">
              {lines.map((line, lineIndex) => (
                <li key={lineIndex}>{renderInline(line.slice(2))}</li>
              ))}
            </ul>
          );
        }
        return <p key={index}>{renderInline(lines.join(" "))}</p>;
      })}
    </div>
  );
}

const LINK_PATTERN = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function renderInline(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(LINK_PATTERN)) {
    const [whole, label, href] = match;
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push(text.slice(lastIndex, start));
    if (href.startsWith("/") && !href.startsWith("//")) {
      parts.push(
        <Link
          key={start}
          href={href}
          className="underline hover:text-[var(--color-accent)]"
        >
          {label}
        </Link>
      );
    } else {
      parts.push(label);
    }
    lastIndex = start + whole.length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
