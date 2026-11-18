import { cn } from "@/lib/utils";

type Props = {
  label: string;
  required?: boolean;
  optional?: boolean;
  /** Localized “(Optional)” text when `optional` is set. */
  optionalLabel?: string;
  /** Screen-reader text for required fields (e.g. “required”). */
  requiredLabel?: string;
  className?: string;
};

/**
 * Shared label adornments for admin forms: red asterisk for required,
 * muted “(Optional)” for optional. Asterisk sits after the name in DOM
 * order so RTL reading order stays correct.
 */
export function FieldLabel({
  label,
  required = false,
  optional = false,
  optionalLabel,
  requiredLabel = "required",
  className,
}: Props) {
  return (
    <span className={cn("inline", className)}>
      {label}
      {required ? (
        <>
          <span className="ms-0.5 text-red-600" aria-hidden="true">
            *
          </span>
          <span className="sr-only">{` (${requiredLabel})`}</span>
        </>
      ) : null}
      {optional && optionalLabel ? (
        <span className="ms-1 font-normal text-zinc-500">
          ({optionalLabel})
        </span>
      ) : null}
    </span>
  );
}
