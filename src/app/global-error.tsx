"use client";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

/**
 * Last-resort UI when the root layout fails. Must define its own <html>/<body>.
 */
export default function GlobalError({ error, reset }: Props) {
  const lang =
    typeof document !== "undefined"
      ? document.documentElement.lang || "en"
      : "en";
  const isAr = lang === "ar";

  return (
    <html lang={isAr ? "ar" : "en"} dir={isAr ? "rtl" : "ltr"}>
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          background: "#f7f9fc",
          color: "#171717",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
        }}
      >
        <main
          role="alert"
          style={{ maxWidth: 28 * 16, textAlign: "center" }}
        >
          <h1
            style={{
              color: "#05498c",
              fontSize: "1.75rem",
              margin: "0 0 0.75rem",
            }}
          >
            {isAr ? "حدث خطأ غير متوقع" : "Something went wrong"}
          </h1>
          <p style={{ color: "#878787", lineHeight: 1.6, margin: 0 }}>
            {isAr
              ? "تعذّر تحميل هذه الصفحة. يُرجى المحاولة مرة أخرى."
              : "We couldn't load this page. Please try again."}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.75rem",
              minHeight: 44,
              padding: "0.6rem 1.25rem",
              border: "none",
              borderRadius: 6,
              background: "#05498c",
              color: "#fff",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {isAr ? "إعادة المحاولة" : "Try again"}
          </button>
          {error.digest ? (
            <p
              style={{
                marginTop: "1.5rem",
                fontSize: 12,
                color: "#a1a1aa",
              }}
            >
              {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
