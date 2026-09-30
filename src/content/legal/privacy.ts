export type LegalDocument = {
  version: string | null;
  approved: boolean;
  approvedAt: string | null;
  sections: Array<{ title: string; paragraphs: string[] }>;
};

export const privacyPolicy: LegalDocument = {
  version: null,
  approved: false,
  approvedAt: null,
  sections: [],
};

export function isPrivacyPolicyReady(expectedVersion = process.env.PRIVACY_POLICY_VERSION) {
  return Boolean(privacyPolicy.approved && privacyPolicy.version && expectedVersion === privacyPolicy.version);
}
