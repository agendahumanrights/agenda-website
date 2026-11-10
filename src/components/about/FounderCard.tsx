import { FounderBiography } from "@/components/about/FounderBiography";
import type { FounderDetail, FounderSummary } from "@/types/founder";

type Props = {
  founder: FounderSummary | FounderDetail;
  emailLabel?: string;
};

/**
 * @deprecated Prefer `FounderBiography` on About Us. Kept as a thin alias so
 * older imports keep working.
 */
export function FounderCard({ founder, emailLabel = "Email" }: Props) {
  const detail: FounderDetail = {
    ...founder,
    biography: "biography" in founder ? founder.biography : "",
  };
  return <FounderBiography founder={detail} emailLabel={emailLabel} />;
}
