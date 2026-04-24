export type AgeRange = '<25' | '25-40' | '40-55' | '55-70' | '70+';

export interface UserProfile {
  name: string;
  ambitionId: string | null;
  ageRange: AgeRange | null;
  baselineMs: number | null;
  baselineTakenAt: number | null; // stored as Date.now() timestamp
  triageCompleted: boolean;
  // partial triage state (for resume on app restart)
  triageStep: string | null;
  triageTempAmbitionId: string | null;
  triageTempAgeRange: AgeRange | null;
  // skip tracking: stop auto-offering after 3 dismissals
  triageSkipCount: number;
  selectedAvatar?: string;
}

export function defaultUserProfile(): UserProfile {
  return {
    name: '',
    ambitionId: null,
    ageRange: null,
    baselineMs: null,
    baselineTakenAt: null,
    triageCompleted: false,
    triageStep: null,
    triageTempAmbitionId: null,
    triageTempAgeRange: null,
    triageSkipCount: 0,
  };
}
