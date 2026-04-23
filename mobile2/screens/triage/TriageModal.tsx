import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { UserProfile, AgeRange } from '../../types/user';
import { saveUserProfile } from '../../utils/userProfile';
import TriageIntro from './TriageIntro';
import TriageAmbition from './TriageAmbition';
import TriageAmbitionConfirm from './TriageAmbitionConfirm';
import TriageAge from './TriageAge';
import TriageBaseline from './TriageBaseline';
import TriageJourneyMap from './TriageJourneyMap';

export type TriageStep = 'intro' | 'ambition' | 'confirm' | 'age' | 'baseline' | 'map';

function getInitialStep(profile: UserProfile, editMode: boolean): TriageStep {
  if (editMode) return 'ambition';
  const s = profile.triageStep as TriageStep | null;
  if (s && s !== 'intro') return s;
  return 'intro';
}

interface Props {
  userProfile: UserProfile;
  onComplete: (updated: UserProfile) => void;
  onDismiss: () => void;
  // When true: opens at ambition selection, skips age + baseline, uses existing profile values.
  editMode?: boolean;
}

export default function TriageModal({ userProfile, onComplete, onDismiss, editMode = false }: Props) {
  const [step, setStep] = useState<TriageStep>(getInitialStep(userProfile, editMode));
  const [ambitionId, setAmbitionId] = useState<string | null>(
    editMode
      ? (userProfile.ambitionId ?? userProfile.triageTempAmbitionId ?? null)
      : (userProfile.triageTempAmbitionId ?? null),
  );
  const [ageRange, setAgeRange] = useState<AgeRange | null>(userProfile.triageTempAgeRange ?? null);
  // In editMode, pre-fill baseline from existing profile so we can go straight to map.
  const [baselineMs, setBaselineMs] = useState<number | null>(
    editMode ? (userProfile.baselineMs ?? null) : null,
  );

  // Save partial progress after each step (no-op in editMode to avoid overwriting profile state)
  async function advanceTo(nextStep: TriageStep, patch?: Partial<UserProfile>) {
    if (!editMode) {
      const updated: UserProfile = {
        ...userProfile,
        triageStep: nextStep,
        ...patch,
      };
      await saveUserProfile(updated);
    }
    setStep(nextStep);
  }

  // ── Intro ────────────────────────────────────────────────────────────────────
  if (step === 'intro') {
    return (
      <View style={styles.root}>
        <TriageIntro
          onNext={() => advanceTo('ambition')}
          onDismiss={onDismiss}
        />
      </View>
    );
  }

  // ── Ambition ─────────────────────────────────────────────────────────────────
  if (step === 'ambition') {
    return (
      <View style={styles.root}>
        <TriageAmbition
          initialAmbitionId={ambitionId}
          onNext={(id) => {
            setAmbitionId(id);
            advanceTo('confirm', { triageTempAmbitionId: id });
          }}
          onBack={editMode ? onDismiss : () => setStep('intro')}
        />
      </View>
    );
  }

  // ── Confirm ──────────────────────────────────────────────────────────────────
  if (step === 'confirm' && ambitionId) {
    return (
      <View style={styles.root}>
        <TriageAmbitionConfirm
          ambitionId={ambitionId}
          onNext={() => {
            if (editMode) {
              // Skip age + baseline; go directly to map with existing baseline.
              setStep('map');
            } else {
              advanceTo('age');
            }
          }}
          onBack={() => setStep('ambition')}
        />
      </View>
    );
  }

  // ── Age ──────────────────────────────────────────────────────────────────────
  if (step === 'age') {
    return (
      <View style={styles.root}>
        <TriageAge
          initialAgeRange={ageRange}
          onNext={(range) => {
            setAgeRange(range);
            advanceTo('baseline', { triageTempAgeRange: range });
          }}
          onBack={() => setStep('confirm')}
        />
      </View>
    );
  }

  // ── Baseline ─────────────────────────────────────────────────────────────────
  if (step === 'baseline') {
    return (
      <View style={styles.root}>
        <TriageBaseline
          onNext={(bms) => {
            setBaselineMs(bms);
            advanceTo('map');
          }}
          onBack={() => setStep('age')}
        />
      </View>
    );
  }

  // ── Journey Map ──────────────────────────────────────────────────────────────
  if (step === 'map' && ambitionId && baselineMs !== null) {
    return (
      <View style={styles.root}>
        <TriageJourneyMap
          ambitionId={ambitionId}
          baselineMs={baselineMs}
          onFinish={async () => {
            const completed: UserProfile = editMode
              ? {
                  // Editing: only update ambitionId; keep all other profile fields.
                  ...userProfile,
                  ambitionId,
                  triageCompleted: true,
                  triageStep: null,
                  triageTempAmbitionId: null,
                  triageTempAgeRange: null,
                }
              : {
                  // First-time triage: persist everything.
                  ...userProfile,
                  ambitionId,
                  ageRange,
                  baselineMs,
                  baselineTakenAt: Date.now(),
                  triageCompleted: true,
                  triageStep: null,
                  triageTempAmbitionId: null,
                  triageTempAgeRange: null,
                };
            await saveUserProfile(completed);
            onComplete(completed);
          }}
        />
      </View>
    );
  }

  // Fallback: shouldn't reach here
  return (
    <View style={styles.root}>
      <TriageIntro onNext={() => setStep('ambition')} onDismiss={onDismiss} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
});
