/**
 * Static About Us organizational content.
 * Founders are managed via Admin (`/admin/founders`). Org copy remains
 * outside the admin dashboard.
 */

import type { Locale } from "@/i18n/config";

export type AboutTimelineIconId =
  | "civic-space"
  | "community-agency"
  | "capacity"
  | "accountability-justice"
  | "civic-society"
  | "advocacy"
  | "victims"
  | "evidence";

export type AboutValueIconId =
  | "independence"
  | "non-violence"
  | "integrity"
  | "equality"
  | "synergy"
  | "public-interest"
  | "do-no-harm"
  | "accountability";

export type AboutTimelineItem = {
  title: string;
  description: string;
  icon: AboutTimelineIconId;
};

export type AboutValueItem = {
  title: string;
  description: string;
  icon: AboutValueIconId;
};

export type OrganizationCopy = {
  /** Concise page introduction derived from the mission (SEO / metadata). */
  intro: string;
  vision: string;
  mission: string;
  /** Short mission blurb (e.g. public footer). */
  missionSummary: string;
  strategicGoals: AboutTimelineItem[];
  programAreas: AboutTimelineItem[];
  strategicPositioning: [string, string];
  values: AboutValueItem[];
};

const copyByLocale: Record<Locale, OrganizationCopy> = {
  en: {
    vision:
      "A Yemen in which human rights are respected, communities are empowered to claim them, and peace, justice, accountability, and redress are firmly rooted in society.",
    mission:
      "To advance human rights and accountability in Yemen by connecting evidence, civil society, advocacy, and affected communities.",
    intro:
      "To advance human rights and accountability in Yemen by connecting evidence, civil society, advocacy, and affected communities.",
    missionSummary:
      "We advance human rights and accountability in Yemen by connecting evidence, civil society, advocacy, and affected communities.",
    strategicGoals: [
      {
        icon: "civic-space",
        title: "Strengthen the space for human rights in Yemen.",
        description:
          "Strengthen the ability of Yemeni civil society and human rights actors to operate, collaborate, advocate, and contribute effectively to public policy and human rights processes.",
      },
      {
        icon: "community-agency",
        title: "Strengthen the Agency and Participation of Affected Communities.",
        description:
          "Enable victims, rights-holders, and marginalized communities to articulate their priorities, influence relevant processes, and participate meaningfully in decisions concerning their rights and futures.",
      },
      {
        icon: "capacity",
        title: "Strengthen the Capacity and Effectiveness of Human Rights Actors.",
        description:
          "Build the knowledge, skills, systems, and strategic capabilities of local organizations, activists, researchers, and other key actors working to advance human rights in Yemen.",
      },
      {
        icon: "accountability-justice",
        title: "Advance Accountability and Redress and Transitional Justice.",
        description:
          "collect and mobilize credible evidence and strategic advocacy to advance accountability for human rights violations and promote meaningful redress and transitional justice for victims and affected communities.",
      },
    ],
    programAreas: [
      {
        icon: "civic-society",
        title: "Civic Space & Civil Society",
        description:
          "We strengthen collaboration, coordination, organizational capacity, and collective action among Yemeni civil society and human rights actors. We facilitate joint initiatives and support civil society efforts to protect and expand civic space in Yemen.",
      },
      {
        icon: "advocacy",
        title: "Strategic Advocacy, Accountability & Transitional Justice",
        description:
          "We develop and catalyze strategic advocacy initiatives addressing human rights, accountability, transitional justice, peace, and redress. We connect evidence generated through our work with relevant national, regional, and international mechanisms and decision-makers.",
      },
      {
        icon: "victims",
        title: "Victims' Participation & Community Engagement",
        description:
          "We work alongside victims, affected communities, and rights-holder groups to strengthen their agency, articulate their priorities, and facilitate their meaningful participation in human rights, justice, and policy processes.",
      },
      {
        icon: "evidence",
        title: "Evidence, Documentation & Research",
        description:
          "We document human rights violations and conduct research and analysis on conflict-related and emerging human rights issues. We generate credible evidence and knowledge to inform advocacy, accountability, policy, and human rights protection.",
      },
    ],
    strategicPositioning: [
      "HRA seeks to strengthen Yemen's human rights ecosystem rather than operate in isolation. We connect grassroots knowledge, professional documentation, civil society capacity, strategic advocacy, and international human rights mechanisms to create stronger and more sustainable pathways for human rights protection and accountability.",
      "Our approach is grounded in the belief that sustainable human rights progress must be locally informed, evidence-based, collaborative, and centered on the agency and dignity of affected communities.",
    ],
    values: [
      {
        icon: "independence",
        title: "Independence",
        description:
          "We safeguard our independence from political, governmental, partisan, and other interests. We do not allow funding, partnerships, or external pressures to compromise our impartiality, objectivity, or ability to act in the public interest.",
      },
      {
        icon: "non-violence",
        title: "Non-violence",
        description:
          "We reject violence and/or justification for it in any form. We apply the same human rights principles and standards to all actors and do not excuse, legitimize, or minimize violations on the basis of who commits them.",
      },
      {
        icon: "integrity",
        title: "Integrity & Accuracy",
        description:
          "We are committed to rigorous research, accurate documentation, responsible analysis, transparency, and ethical conduct. We seek to ensure that our work is credible, evidence-based, and grounded in the highest professional standards.",
      },
      {
        icon: "equality",
        title: "Equality & Inclusion",
        description:
          "We oppose discrimination and promote equal rights and meaningful participation for all. We are committed to ensuring the meaningful representation of women throughout our organization, with women's representation maintained at no less than 51% across all levels of the organizational hierarchy.",
      },
      {
        icon: "synergy",
        title: "Synergy",
        description:
          "We work in partnership with the local and international civil society. We are keen to involve influencers and stakeholders to enhance the public space of human rights.",
      },
      {
        icon: "public-interest",
        title: "Public Interest",
        description:
          "We place the rights and interests of people and communities above institutional interests. We remain committed to serving the public interest and prioritizing the needs and rights of victims and affected communities.",
      },
      {
        icon: "do-no-harm",
        title: "Do No Harm",
        description:
          "We place the safety, dignity, privacy, and interests of affected individuals and communities at the center of our work. We assess the potential impact of our work on their safety, dignity, privacy, and interests, and take appropriate measures to mitigate risks and protect them, while respecting their right to make informed decisions about their participation.",
      },
      {
        icon: "accountability",
        title: "Accountability",
        description:
          "We hold ourselves to the same standards of transparency, integrity, responsibility, and respect for human rights that we advocate for from others. We seek to learn from our work and remain responsive to the communities and partners with whom we engage.",
      },
    ],
  },
  ar: {
    vision:
      "يمن تُحترم فيه حقوق الإنسان، وتمتلك فيه المجتمعات القدرة على المطالبة بحقوقها، وترتكز فيه أسس السلام والعدالة والمساءلة وجبر الضرر على نحو راسخ في المجتمع.",
    mission:
      "تعزيز حقوق الإنسان والمساءلة في اليمن من خلال الربط بين الأدلة والمجتمع المدني والمناصرة والمجتمعات المتضررة.",
    intro:
      "تعزيز حقوق الإنسان والمساءلة في اليمن من خلال الربط بين الأدلة والمجتمع المدني والمناصرة والمجتمعات المتضررة.",
    missionSummary:
      "نُعزز حقوق الإنسان والمساءلة في اليمن من خلال الربط بين الأدلة والمجتمع المدني والمناصرة والمجتمعات المتضررة.",
    strategicGoals: [
      {
        icon: "civic-space",
        title: "تعزيز الحيز المتاح للعمل في مجال حقوق الإنسان في اليمن.",
        description:
          "تعزيز قدرة منظمات المجتمع المدني والجهات الفاعلة في مجال حقوق الإنسان في اليمن على العمل والتعاون والمناصرة والمساهمة بفاعلية في السياسات العامة والعمليات ذات الصلة بحقوق الإنسان.",
      },
      {
        icon: "community-agency",
        title: "تعزيز قدرة المجتمعات المتضررة على المشاركة.",
        description:
          "تمكين الضحايا وأصحاب الحقوق والمجتمعات المهمشة من تحديد أولوياتهم والتعبير عنها، والتأثير في العمليات ذات الصلة، والمشاركة بصورة فعّالة في القرارات المتعلقة بحقوقهم ومستقبلهم.",
      },
      {
        icon: "capacity",
        title: "تعزيز قدرات وفاعلية الفاعلين في مجال حقوق الإنسان.",
        description:
          "تطوير المعارف والمهارات والأنظمة والقدرات الاستراتيجية لدى المنظمات المحلية والنشطاء والباحثين وغيرهم من الفاعلين الرئيسيين العاملين على تعزيز حقوق الإنسان في اليمن.",
      },
      {
        icon: "accountability-justice",
        title: "تعزيز المساءلة وجبر الضرر والعدالة الانتقالية.",
        description:
          "جمع الأدلة الموثوقة وتوظيفها، إلى جانب تطوير مناصرة استراتيجية، من أجل تعزيز المساءلة عن انتهاكات حقوق الإنسان، ودعم مسارات فعّالة لجبر الضرر والعدالة الانتقالية للضحايا والمجتمعات المتضررة.",
      },
    ],
    programAreas: [
      {
        icon: "civic-society",
        title: "الحيز المدني والمجتمع المدني",
        description:
          "نعمل على تعزيز التعاون والتنسيق والقدرات المؤسسية والعمل الجماعي بين منظمات المجتمع المدني والجهات الفاعلة في مجال حقوق الإنسان في اليمن. كما ندعم المبادرات المشتركة وجهود المجتمع المدني الرامية إلى حماية الحيز المدني وتوسيع نطاقه.",
      },
      {
        icon: "advocacy",
        title: "المناصرة الاستراتيجية والمساءلة والعدالة الانتقالية",
        description:
          "نطوّر وندعم مبادرات مناصرة استراتيجية تتناول قضايا حقوق الإنسان والمساءلة والعدالة الانتقالية والسلام وجبر الضرر. ونربط الأدلة والمعارف التي ننتجها بالآليات وصنّاع القرار على المستويات الوطنية والإقليمية والدولية.",
      },
      {
        icon: "victims",
        title: "مشاركة الضحايا والمشاركة المجتمعية",
        description:
          "نعمل بالشراكة مع الضحايا والمجتمعات المتضررة ومجموعات أصحاب الحقوق لتعزيز قدرتهم على التعبير والتأثير، وتحديد أولوياتهم، وتيسير مشاركتهم الفعّالة في عمليات حقوق الإنسان والعدالة وصنع السياسات.",
      },
      {
        icon: "evidence",
        title: "الأدلة والتوثيق والبحث",
        description:
          "نوثّق انتهاكات حقوق الإنسان ونجري البحوث والتحليلات المتعلقة بالانتهاكات المرتبطة بالنزاع والقضايا الحقوقية الناشئة. وننتج أدلة ومعارف موثوقة تسهم في دعم المناصرة والمساءلة وصنع السياسات وحماية حقوق الإنسان.",
      },
    ],
    strategicPositioning: [
      "تسعى منظمة مفكرة لحقوق الإنسان إلى تعزيز منظومة حقوق الإنسان في اليمن، لا إلى العمل بمعزل عن مكوناتها. ونربط بين المعرفة والخبرات المحلية، والتوثيق المهني، وبناء قدرات المجتمع المدني، والمناصرة الاستراتيجية، والآليات الدولية لحقوق الإنسان، بهدف بناء مسارات أكثر قوة واستدامة لحماية حقوق الإنسان وتعزيز المساءلة.",
      "وينطلق نهجنا من قناعة بأن التقدم المستدام في مجال حقوق الإنسان يجب أن يكون مستندًا إلى المعرفة المحلية، وقائمًا على الأدلة، وتعاونيًا، ومتمحورًا حول قدرة المجتمعات المتضررة وكرامتها وحقوقها.",
    ],
    values: [
      {
        icon: "independence",
        title: "الاستقلالية",
        description:
          "نحافظ على استقلاليتنا عن المصالح السياسية والحكومية والحزبية وغيرها من المصالح. ولا نسمح للتمويل أو الشراكات أو الضغوط الخارجية بالتأثير في حيادنا وموضوعيتنا أو قدرتنا على العمل بما يخدم المصلحة العامة.",
      },
      {
        icon: "non-violence",
        title: "اللاعنف",
        description:
          "نرفض العنف وتبريره بكافة أشكاله. ونطبّق مبادئ ومعايير حقوق الإنسان بصورة متسقة على جميع الأطراف، ولا نبرر أو نضفي الشرعية على الانتهاكات أو نقلل من شأنها استنادًا إلى هوية مرتكبيها.",
      },
      {
        icon: "integrity",
        title: "النزاهة والدقة",
        description:
          "نلتزم بالبحث الدقيق، والتوثيق الموثوق، والتحليل المسؤول، والشفافية، والسلوك المهني والأخلاقي. ونسعى إلى أن يكون عملنا ذا مصداقية، قائمًا على الأدلة، ومتوافقًا مع أعلى المعايير المهنية.",
      },
      {
        icon: "equality",
        title: "المساواة والشمول",
        description:
          "نناهض جميع أشكال التمييز ونعزز المساواة في الحقوق والمشاركة الفعّالة للجميع. كما نلتزم بضمان التمثيل الفعّال للنساء داخل المنظمة، بحيث لا تقل نسبة تمثيلهن عن 51% في مختلف مستويات الهيكل التنظيمي.",
      },
      {
        icon: "synergy",
        title: "التكامل والشراكة",
        description:
          "نعمل بالشراكة مع منظمات المجتمع المدني المحلية والدولية، ونحرص على إشراك المؤثرين وأصحاب المصلحة بما يسهم في توسيع الحيز العام المتاح لحقوق الإنسان وتعزيز العمل الجماعي.",
      },
      {
        icon: "public-interest",
        title: "المصلحة العامة",
        description:
          "نضع حقوق ومصالح الأفراد والمجتمعات فوق المصالح المؤسسية. ونلتزم بخدمة المصلحة العامة وإعطاء الأولوية لاحتياجات وحقوق الضحايا والمجتمعات المتضررة.",
      },
      {
        icon: "do-no-harm",
        title: "لا ضرر",
        description:
          "نضع سلامة الأفراد والمجتمعات المتضررة وكرامتهم وخصوصيتهم ومصالحهم في صميم عملنا. ونقيّم الآثار المحتملة لأنشطتنا على سلامتهم وكرامتهم وخصوصيتهم ومصالحهم، ونتخذ التدابير المناسبة للحد من المخاطر وحمايتهم، مع احترام حقهم في اتخاذ قرارات مستنيرة بشأن مشاركتهم.",
      },
      {
        icon: "accountability",
        title: "المساءلة",
        description:
          "نلتزم تجاه أنفسنا بالمعايير ذاتها من الشفافية والنزاهة والمسؤولية واحترام حقوق الإنسان التي ندعو الآخرين إلى الالتزام بها. ونسعى إلى التعلم المستمر من عملنا والاستجابة لاحتياجات المجتمعات والشركاء الذين نتعاون معهم.",
      },
    ],
  },
};

export function getOrganizationCopy(locale: Locale): OrganizationCopy {
  return copyByLocale[locale];
}
