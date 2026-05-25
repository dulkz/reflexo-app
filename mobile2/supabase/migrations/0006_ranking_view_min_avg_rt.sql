-- Corrige view ranking: avg_rt_global agora usa MIN em vez de AVG.
-- Regra de negócio: ranking mostra o MELHOR tempo médio entre todas as sessões,
-- não a média de todas as sessões.
-- Aplicado manualmente no dashboard em 2026-05-25.
create or replace view public.ranking as
SELECT s.user_id,
    p.username,
    p.archetype,
    p.pinned_achievements,
    s.mode,
    round(min(s.avg_rt))::integer AS avg_rt_global,
    count(*)::integer AS session_count,
    rank() OVER (PARTITION BY s.mode ORDER BY (min(s.avg_rt)))::integer AS rank_position
   FROM sessions s
     JOIN profiles p ON p.id = s.user_id
  GROUP BY s.user_id, p.username, p.archetype, p.pinned_achievements, s.mode
 HAVING count(*) >= 3;
