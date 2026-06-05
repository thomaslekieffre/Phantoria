# QA — bugs fonctionnels

| ID | Statut | Note |
|----|--------|------|
| QA-001 | **Corrigé** | Copy hub → `storyCampaignLabel()` |
| QA-002 | **Corrigé** | Guard `StoryBattleScreen` + RPC `record_story_victory` |
| QA-003 | **Corrigé** | Hint Studio event `banner` |
| QA-004 | En cours | Event `gacha_banner` — voir `BETA-POLISH.md` |
| QA-005 | OK | Starter Brise |
| QA-010 | **Corrigé** | Même que QA-002 |
| QA-011 | **Corrigé** | Pack général ×10 / coûts 0 — `game-content.ts` priorise pool `standard` |
| QA-012 | **Corrigé** | Clic onglet « Premiers esprits » terminé — plus de bounce vers pack général |

**Migration** `20260603130000_security_hardening.sql` — appliquée (prod/dev).

**Smoke compte neuf** — validé manuellement.

## Polish bêta (phase B)

Voir [BETA-POLISH.md](BETA-POLISH.md).
