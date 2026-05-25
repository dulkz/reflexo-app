const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Força o Metro a resolver @supabase/supabase-js para o build CJS (index.cjs)
// em vez do ESM (index.mjs). O Hermes não suporta import() dinâmico presente
// no ESM do supabase-js 2.x (usado para lazy-load OpenTelemetry).
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
