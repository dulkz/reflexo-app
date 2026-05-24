import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import TriageAmbition from '../triage/TriageAmbition';

interface Props {
  onNext: (ambitionId: string) => void;
  onBack: () => void;
}

// Final onboarding step — reuses the canonical ambition picker so the chosen
// goal feeds the real milestone/missions system. Custom CTA + no triage step
// dots, since this lives inside the 4-step OB flow rather than the triage flow.
export default function OB4Goal({ onNext, onBack }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <TriageAmbition
        initialAmbitionId={null}
        onNext={onNext}
        onBack={onBack}
        ctaLabel={t('onboarding.ob.ob4.cta')}
        stepDots={null}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0b1220' },
});
