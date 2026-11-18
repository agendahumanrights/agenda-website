import type { ReactNode } from "react";

import { FieldLabel } from "@/components/ui/FieldLabel";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  optional?: boolean;
  /** Localized “(Optional)” text when `optional` is set. */
  optionalLabel?: string;
  /** Screen-reader text for required fields. */
  requiredLabel?: string;
  className?: string;
};

export function FormField({
  id,
  label,
  children,
  hint,
  error,
  required = false,
  optional = false,
  optionalLabel,
  requiredLabel,
  className,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label htmlFor={id} className="text-sm font-medium text-zinc-800">
        <FieldLabel
          label={label}
          required={required}
          optional={optional}
          optionalLabel={optionalLabel}
          requiredLabel={requiredLabel}
        />
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-zinc-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
