import Image from "next/image";

import { cn } from "@/lib/utils";

type IllustrationProps = {
  className?: string;
};

const VISION_SRC = "/images/about/vision-agenda.jpg";
const MISSION_SRC = "/images/about/mission-agenda.jpg";

/** Vision illustration — light-bulb artwork for the About Us page. */
export function VisionIllustration({ className }: IllustrationProps) {
  return (
    <Image
      src={VISION_SRC}
      alt=""
      width={640}
      height={640}
      sizes="(max-width: 1024px) 60vw, 280px"
      className={cn("h-auto w-full max-w-[14rem] object-contain", className)}
      aria-hidden
    />
  );
}

/** Mission illustration — target-and-arrow artwork for the About Us page. */
export function MissionIllustration({ className }: IllustrationProps) {
  return (
    <Image
      src={MISSION_SRC}
      alt=""
      width={640}
      height={640}
      sizes="(max-width: 1024px) 60vw, 280px"
      className={cn("h-auto w-full max-w-[14rem] object-contain", className)}
      aria-hidden
    />
  );
}
