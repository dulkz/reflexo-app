import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingModal from '../OnboardingModal';
import OB1FirstGame from './OB1_FirstGame';
import OB2Result from './OB2_Result';
import OB3Archetype from './OB3_Archetype';
import OB4Goal from './OB4_Goal';
import { UserProfile } from '../../types/user';
import { patchUserProfile } from '../../utils/userProfile';
import { saveOnboardingDone } from '../../utils/storage';

type Step = 'intro' | 'ob1' | 'ob2' | 'ob3' | 'ob4';

interface Props {
  // Called once the full flow finishes, with the persisted profile.
  onComplete: (profile: UserProfile) => void;
}

// Orchestrates the first-open experience:
//   intro (5 passive slides) → OB1 (play) → OB2 (result) → OB3 (archetype)
//   → OB4 (goal) → persist baseline + goal + triageCompleted → Home.
// Both "COMEÇAR" and "pular introdução" on the intro advance into OB1.
export default function OnboardingFlow({ onComplete }: Props) {
  const [step, setStep] = useState<Step>('intro');
  const [rt, setRt] = useState<number>(0);

  const finish = async (ambitionId: string) => {
    const updated = await patchUserProfile({
      baselineMs: rt,
      baselineTakenAt: Date.now(),
      ambitionId,
      triageCompleted: true,
      triageStep: null,
      triageTempAmbitionId: null,
      triageTempAgeRange: null,
    });
    await saveOnboardingDone();
    onComplete(updated);
  };

  return (
    <View style={styles.root}>
      {step === 'intro' && (
        <OnboardingModal onComplete={() => setStep('ob1')} />
      )}
      {step === 'ob1' && (
        <OB1FirstGame onNext={(r) => { setRt(r); setStep('ob2'); }} />
      )}
      {step === 'ob2' && (
        <OB2Result rt={rt} onNext={() => setStep('ob3')} />
      )}
      {step === 'ob3' && (
        <OB3Archetype rt={rt} onNext={() => setStep('ob4')} />
      )}
      {step === 'ob4' && (
        <OB4Goal onNext={finish} onBack={() => setStep('ob3')} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
});
