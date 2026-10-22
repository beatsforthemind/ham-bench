export const LICENSE_CLASSES = ["technician", "general", "extra"] as const;

export type LicenseClass = (typeof LICENSE_CLASSES)[number];

export type PoolQuestion = {
  id: string;
  subelement: string;
  group: string;
  text: string;
  answers: [string, string, string, string];
  correctIndex: number;
  refs: string;
  figure: string | null;
  correctExplanation: string;
  distractors: [string, string, string, string];
  workedSteps: string[];
  lab: string | null;
};

export type PoolGroup = {
  id: string;
  subelement: string;
  title: string;
  examSlots: 1;
};

export type PoolSubelement = {
  id: string;
  title: string;
  examQuestions: number;
};

export type PoolFile = {
  series: string;
  revision: string;
  licenseClass: LicenseClass;
  element: 2 | 3 | 4;
  title: string;
  effectiveFrom: string;
  effectiveThrough: string;
  errataDate: string;
  examQuestions: number;
  passingCount: number;
  source: {
    docx: string;
    docxSha256: string;
    mirror: string;
    mirrorCommit: string;
  };
  subelements: PoolSubelement[];
  groups: PoolGroup[];
  questions: PoolQuestion[];
};

export type PoolRegistryEntry = {
  licenseClass: LicenseClass;
  series: string;
  revision: string;
  element: 2 | 3 | 4;
  effectiveFrom: string;
  effectiveThrough: string;
  errataDate: string;
  examQuestions: number;
  passingCount: number;
  questionCount: number;
  file: string;
};

export type PoolRegistry = {
  generatedFrom: "ncvec-docx";
  mirrorCommit: string;
  pools: PoolRegistryEntry[];
};
