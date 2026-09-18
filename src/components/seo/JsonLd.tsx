/**
 * Renders a JSON-LD <script> tag from an already-built structured-data object
 * (see lib/seo/structured-data.ts). Never construct JSON-LD strings by hand elsewhere.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    // JSON-LD requires raw script content; `data` is always machine-built from typed
    // inputs in structured-data.ts, never user-supplied freeform HTML.
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
