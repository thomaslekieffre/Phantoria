"use client";

import { TRIBE_INFO } from "@phantoria/game-core";
import {
  RARITY_OPTIONS,
  SKILL_SLOT_META,
  TARGETING_OPTIONS,
  TRIBE_OPTIONS,
  type SkillSlotKey,
  type SpiritFormState,
  syncSkillIds,
} from "@/lib/studio/spirit-form";

type Props = {
  form: SpiritFormState;
  editKey: string | null;
  saving: boolean;
  onChange: (next: SpiritFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function SpiritEditorForm({ form, editKey, saving, onChange, onSubmit, onCancel }: Props) {
  function patch(partial: Partial<SpiritFormState>) {
    onChange({ ...form, ...partial });
  }

  function patchSkill(slot: SkillSlotKey, partial: Partial<SpiritFormState["skills"][SkillSlotKey]>) {
    onChange({
      ...form,
      skills: { ...form.skills, [slot]: { ...form.skills[slot], ...partial } },
    });
  }

  return (
    <form
      className="studio-form studio-spirits__form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h3>{editKey ? `Édition · ${editKey}` : "Nouvel esprit"}</h3>

      <fieldset className="studio-fieldset">
        <legend>Identité</legend>
        <div className="studio-form__row">
          <label className="studio-field">
            <span>Clé template</span>
            <input
              value={form.template_key}
              disabled={Boolean(editKey)}
              onChange={(e) => onChange(syncSkillIds(form, e.target.value))}
              required
              placeholder="bram_vaillant"
            />
            <span className="studio-field__hint">snake_case, unique. Ex: kiro_perfide</span>
          </label>
          <label className="studio-field">
            <span>Hub ID</span>
            <input
              value={form.hub_id}
              onChange={(e) => patch({ hub_id: e.target.value })}
              placeholder="kiro"
              disabled={form.kind === "enemy"}
            />
            <span className="studio-field__hint">Sprite hub (catalog uniquement)</span>
          </label>
        </div>
        <div className="studio-form__row--3 studio-form__row">
          <label className="studio-field">
            <span>Type</span>
            <select
              value={form.kind}
              onChange={(e) => patch({ kind: e.target.value as "catalog" | "enemy", hub_id: e.target.value === "enemy" ? "" : form.hub_id })}
            >
              <option value="catalog">Jouable (gacha / run)</option>
              <option value="enemy">Ennemi (histoire / run)</option>
            </select>
          </label>
          <label className="studio-field">
            <span>Rareté</span>
            <select value={form.rarity} onChange={(e) => patch({ rarity: e.target.value as SpiritFormState["rarity"] })}>
              {RARITY_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="studio-field">
            <span>Tribu</span>
            <select value={form.tribe} onChange={(e) => patch({ tribe: e.target.value as SpiritFormState["tribe"] })}>
              {TRIBE_OPTIONS.map((t) => (
                <option key={t} value={t}>
                  {TRIBE_INFO[t].emoji} {TRIBE_INFO[t].label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="studio-field">
          <span>Nom affiché</span>
          <input value={form.name} onChange={(e) => patch({ name: e.target.value })} required placeholder="Kiro" />
        </label>
        {form.kind === "catalog" ? (
          <>
            <label className="studio-field">
              <span>Portrait (URL publique)</span>
              <input
                value={form.portrait_url}
                onChange={(e) => patch({ portrait_url: e.target.value })}
                placeholder="/assets/spirits/portraits/roche.png"
              />
            </label>
            <p className="studio-field__hint studio-field__hint--block">
              PNG transparent recommandé · dossier{" "}
              <code>apps/web/public/assets/spirits/portraits/</code> → chemin{" "}
              <code>/assets/spirits/portraits/hub_id.png</code>
            </p>
            {form.portrait_url.trim() ? (
              <div className="studio-spirit-portrait-preview">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.portrait_url.trim()} alt="Aperçu portrait" />
              </div>
            ) : null}
          </>
        ) : null}
      </fieldset>

      <fieldset className="studio-fieldset">
        <legend>Stats de base</legend>
        <div className="studio-form__row--3 studio-form__row">
          <label className="studio-field">
            <span>HP</span>
            <input type="number" min={0} value={form.hp} onChange={(e) => patch({ hp: e.target.value })} />
          </label>
          <label className="studio-field">
            <span>ATK</span>
            <input type="number" min={0} value={form.atk} onChange={(e) => patch({ atk: e.target.value })} />
          </label>
          <label className="studio-field">
            <span>DEF</span>
            <input type="number" min={0} value={form.def} onChange={(e) => patch({ def: e.target.value })} />
          </label>
          <label className="studio-field">
            <span>VIT</span>
            <input type="number" min={0} value={form.vit} onChange={(e) => patch({ vit: e.target.value })} />
            <span className="studio-field__hint">Vitesse / initiative</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="studio-fieldset">
        <legend>Compétences</legend>
        <div className="studio-skills">
          {SKILL_SLOT_META.map(({ key, label }) => (
            <div key={key} className="studio-skill-card">
              <h4>{label}</h4>
              <div className="studio-form__row">
                <label className="studio-field">
                  <span>ID</span>
                  <input value={form.skills[key].id} onChange={(e) => patchSkill(key, { id: e.target.value })} />
                </label>
                <label className="studio-field">
                  <span>Nom</span>
                  <input value={form.skills[key].name} onChange={(e) => patchSkill(key, { name: e.target.value })} />
                </label>
              </div>
              <div className="studio-form__row--3 studio-form__row">
                <label className="studio-field">
                  <span>Puissance</span>
                  <input
                    type="number"
                    min={0}
                    step={0.1}
                    value={form.skills[key].power}
                    onChange={(e) => patchSkill(key, { power: e.target.value })}
                  />
                  <span className="studio-field__hint">1 = 100 % ATK</span>
                </label>
                <label className="studio-field">
                  <span>Cible</span>
                  <select
                    value={form.skills[key].targeting}
                    onChange={(e) => patchSkill(key, { targeting: e.target.value as SpiritFormState["skills"][SkillSlotKey]["targeting"] })}
                  >
                    {TARGETING_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="studio-field studio-field--row">
                  <input
                    type="checkbox"
                    checked={form.skills[key].tribeBonus}
                    onChange={(e) => patchSkill(key, { tribeBonus: e.target.checked })}
                  />
                  <span>Bonus tribu</span>
                </label>
              </div>
              <label className="studio-field">
                <span>Description (optionnel)</span>
                <input
                  value={form.skills[key].description}
                  onChange={(e) => patchSkill(key, { description: e.target.value })}
                  placeholder="Laisser vide = texte auto"
                />
              </label>
            </div>
          ))}
        </div>
      </fieldset>

      <div className="studio-form__row">
        <label className="studio-field studio-field--row">
          <input type="checkbox" checked={form.active} onChange={(e) => patch({ active: e.target.checked })} />
          <span>Actif en jeu</span>
        </label>
        <label className="studio-field">
          <span>Ordre tri</span>
          <input type="number" value={form.sort_order} onChange={(e) => patch({ sort_order: Number(e.target.value) })} />
        </label>
      </div>

      <div className="studio-form__actions">
        <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
          {saving ? "Enregistrement…" : editKey ? "Enregistrer" : "Créer"}
        </button>
        <button type="button" className="studio-btn" onClick={onCancel}>
          {editKey ? "Annuler" : "Effacer"}
        </button>
      </div>
    </form>
  );
}
