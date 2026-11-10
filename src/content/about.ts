/**
 * Static About Us organizational content (vision / mission / intro).
 * Founders are managed via Admin (`/admin/founders`). Vision/mission remain
 * outside the admin dashboard.
 */

import type { Locale } from "@/i18n/config";

export type OrganizationCopy = {
  /** Concise page introduction derived from the mission. */
  intro: string;
  vision: string;
  mission: string;
  /** Short mission blurb for the homepage About teaser. */
  missionSummary: string;
};

const copyByLocale: Record<Locale, OrganizationCopy> = {
  en: {
    vision:
      "An engaged Yemeni society that enjoys human rights and promotes the values of peace, justice, and redress.",
    mission:
      "We defend, advocate for, and document human rights issues in Yemen, contribute to the promotion of human rights, and build capacities in human rights. We support vulnerable groups and encourage their inclusion in key human rights conversations.",
    intro:
      "We defend, advocate for, and document human rights issues in Yemen, promote human rights and build capacities, and support the inclusion of vulnerable groups in key human rights conversations.",
    missionSummary:
      "We defend, advocate for, and document human rights in Yemen, build capacities, and support the inclusion of vulnerable groups.",
  },
  ar: {
    vision:
      "مجتمع يمني فاعل يتمتع بحقوق الإنسان ويعزز قيم السلام والعدالة والإنصاف.",
    mission:
      "ندافع عن قضايا حقوق الإنسان في اليمن، ونناصرها ونوثقها، ونسهم في تعزيز حقوق الإنسان وبناء القدرات في هذا المجال. وندعم الفئات المستضعفة ونشجع إشراكها في النقاشات الرئيسية المتعلقة بحقوق الإنسان.",
    intro:
      "ندافع عن قضايا حقوق الإنسان في اليمن ونناصرها ونوثقها، ونعزز حقوق الإنسان ونبني القدرات، وندعم إشراك الفئات المستضعفة في النقاشات الرئيسية المتعلقة بحقوق الإنسان.",
    missionSummary:
      "ندافع عن حقوق الإنسان في اليمن ونناصرها ونوثقها، ونبني القدرات، وندعم إشراك الفئات المستضعفة.",
  },
};

export function getOrganizationCopy(locale: Locale): OrganizationCopy {
  return copyByLocale[locale];
}
