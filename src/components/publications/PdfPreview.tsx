type Props = {
  url: string | null;
  label: string;
};

export function PdfPreview({ url, label }: Props) {
  if (!url) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
      <iframe title={label} src={url} className="h-[28rem] w-full sm:h-[32rem]" />
    </div>
  );
}
