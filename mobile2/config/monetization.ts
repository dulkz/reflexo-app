// ── Monetização — Reflexo App ────────────────────────────────────────────────
//
// false → energia rastreada mas nunca bloqueia; compras simuladas sem cobrança
// true  → sistema completo ativo (requer Google Play Billing configurado)
//
export const MONETIZATION_ENABLED = false;

// ── Regras de energia ────────────────────────────────────────────────────────

export const GRACE_PERIOD_DAYS = 3;     // dias de energia ilimitada pós-instalação
export const MAX_ENERGY_PER_MODE = 5;   // energias diárias por modo

// ── Pacotes de energia (microtransação) ──────────────────────────────────────

export const ENERGY_PACKAGES = [
  { id: 'energy_10', energies: 10, price: 'R$ 2,99', label: 'Pacote Pequeno' },
  { id: 'energy_30', energies: 30, price: 'R$ 6,99', label: 'Pacote Médio' },
] as const;

export type EnergyPackageId = typeof ENERGY_PACKAGES[number]['id'];

// ── Assinaturas Premium ──────────────────────────────────────────────────────

export const SUBSCRIPTIONS = [
  {
    id: 'premium_monthly',
    label: 'Premium Mensal',
    price: 'R$ 4,99/mês',
    perMonth: null,
  },
  {
    id: 'premium_yearly',
    label: 'Premium Anual',
    price: 'R$ 34,99/ano',
    perMonth: 'R$ 2,92/mês',
  },
] as const;

export type SubscriptionId = typeof SUBSCRIPTIONS[number]['id'];

// ── Remover anúncios ─────────────────────────────────────────────────────────

export const REMOVE_ADS = {
  id: 'remove_ads',
  label: 'Remover Anúncios',
  price: 'R$ 1,99',
  description: 'Compra única e permanente',
} as const;
