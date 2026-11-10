import {
  MissionIllustration,
  VisionIllustration,
} from "@/components/about/AboutIllustrations";
import { AboutContentBlock } from "@/components/about/AboutContentBlock";
import type { OrganizationCopy } from "@/content/about";
import type { Dictionary } from "@/i18n/dictionaries";

type Props = {
  copy: OrganizationCopy;
  labels: Dictionary["about"];
};

/** Vision and mission blocks for the About Us page. */
export function OrganizationIntro({ copy, labels }: Props) {
  return (
    <div className="flex flex-col gap-16 sm:gap-20">
      <AboutContentBlock
        id="about-vision"
        title={labels.vision}
        body={copy.vision}
        illustration={<VisionIllustration />}
      />
      <AboutContentBlock
        id="about-mission"
        title={labels.mission}
        body={copy.mission}
        illustration={<MissionIllustration />}
        reverse
      />
    </div>
  );
}
