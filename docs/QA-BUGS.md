# QA — bugs fonctionnels

| ID | Statut | Note |
|----|--------|------|
| QA-001 | **Corrigé** | Copy hub → `storyCampaignLabel()` |
| QA-002 | **Corrigé** | Guard `StoryBattleScreen` + RPC `record_story_victory` |
| QA-003 | **Corrigé** | Hint Studio event `banner` |
| QA-004 | À tester | Event `gacha_banner` + pull |
| QA-005 | OK | Starter Brise |
| QA-010 | **Corrigé** | Même que QA-002 |

Migration à appliquer : `20260603130000_security_hardening.sql`

## Non testé automatiquement

Compte neuf, gacha event, mobile, fin run meta-reward après migration.
