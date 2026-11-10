type Props = {
  url: string | null;
  label: string;
};

export function PdfDownloadLink({ url, label }: Props) {
  if (!url) return null;

  return (
    <a
      href={url}
      download
      className="inline-flex text-sm font-medium text-zinc-900 underline-offset-2 hover:underline"
    >
      {label}
    </a>
  );
}
