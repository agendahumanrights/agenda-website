/**
 * Admin is request-time (session cookie, redirects). Opt the segment out of
 * instant-navigation validation; public routes keep default Cache Components checks.
 * @see https://nextjs.org/docs/app/guides/authentication-with-cache-components
 */
export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
