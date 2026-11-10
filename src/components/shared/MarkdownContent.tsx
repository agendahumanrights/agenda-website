import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeExternalLinks from "rehype-external-links";

import { cn } from "@/lib/utils";

const schema = {
  ...defaultSchema,
  protocols: {
    ...defaultSchema.protocols,
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    img: [
      ...(defaultSchema.attributes?.img ?? []),
      "src",
      "alt",
      "title",
      "width",
      "height",
    ],
    input: [
      ["type", "checkbox"],
      ["disabled", true],
      ["checked", true],
    ],
    li: [...(defaultSchema.attributes?.li ?? []), ["className"]],
    ul: [...(defaultSchema.attributes?.ul ?? []), ["className"]],
    ol: [...(defaultSchema.attributes?.ol ?? []), ["className"]],
  },
};

const SAFE_HREF = /^(https?:|mailto:)/i;
const SAFE_SRC = /^https?:/i;

type Props = {
  source: string;
  className?: string;
  dir?: "rtl" | "ltr" | "auto";
  /**
   * Shift Markdown heading levels down by one so page H1 stays unique
   * (# → h2, ## → h3, … # ##### → h6).
   */
  shiftHeadings?: boolean;
};

function headingComponents(shift: boolean): Partial<Components> {
  if (!shift) return {};
  return {
    h1: ({ children }) => <h2>{children}</h2>,
    h2: ({ children }) => <h3>{children}</h3>,
    h3: ({ children }) => <h4>{children}</h4>,
    h4: ({ children }) => <h5>{children}</h5>,
    h5: ({ children }) => <h6>{children}</h6>,
    h6: ({ children }) => <p className="article-prose-h6">{children}</p>,
  };
}

/**
 * Safe GFM Markdown renderer for admin preview and public detail bodies.
 * Raw HTML is sanitized away; only http(s)/mailto links and http(s) images.
 */
export function MarkdownContent({
  source,
  className,
  dir,
  shiftHeadings = false,
}: Props) {
  return (
    <div className={cn(className)} dir={dir}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          [rehypeSanitize, schema],
          [
            rehypeExternalLinks,
            { target: "_blank", rel: ["noopener", "noreferrer"] },
          ],
        ]}
        components={{
          ...headingComponents(shiftHeadings),
          a: ({ href, children, ...props }) => {
            const safe = typeof href === "string" && SAFE_HREF.test(href);
            if (!safe) {
              return <span {...props}>{children}</span>;
            }
            return (
              <a href={href} {...props}>
                {children}
              </a>
            );
          },
          img: ({ src, alt, title, ...props }) => {
            const safe = typeof src === "string" && SAFE_SRC.test(src);
            if (!safe) return null;
            return (
              // eslint-disable-next-line @next/next/no-img-element -- Markdown image URLs
              <img src={src} alt={alt ?? ""} title={title} {...props} />
            );
          },
          input: (props) => {
            if (props.type !== "checkbox") return null;
            return (
              <input
                type="checkbox"
                checked={Boolean(props.checked)}
                disabled
                readOnly
                className="article-prose-task-checkbox"
              />
            );
          },
          pre: ({ children, ...props }) => (
            <pre {...props} dir="ltr">
              {children}
            </pre>
          ),
          code: ({ className: codeClass, children, ...props }) => {
            const isBlock = Boolean(codeClass);
            return (
              <code
                className={codeClass}
                dir={isBlock ? "ltr" : undefined}
                {...props}
              >
                {children}
              </code>
            );
          },
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  );
}
