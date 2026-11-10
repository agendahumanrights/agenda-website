import { serializeJsonLd } from "@/lib/seo/json-ld";

type Props = {
  data: unknown | unknown[];
};

/** Server-only JSON-LD emitter (escaped for safe script embedding). */
export function JsonLd({ data }: Props) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(payload.length === 1 ? payload[0] : payload),
      }}
    />
  );
}
