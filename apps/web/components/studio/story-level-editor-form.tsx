"use client";

import type { StoryZoneRow } from "@/app/api/studio/story/route";
import { emptyEnemyRow, type StoryLevelFormState } from "@/lib/studio/story-form";

type Props = {
  form: StoryLevelFormState;
  zones: StoryZoneRow[];
  editId: string | null;
  spiritKeys: string[];
  saving: boolean;
  onChange: (f: StoryLevelFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function StoryLevelEditorForm({ form, zones, editId, spiritKeys, saving, onChange, onSubmit, onCancel }: Props) {
  const patch = (p: Partial<StoryLevelFormState>) => onChange({ ...form, ...p });

  function patchEnemy(i: number, p: Partial<StoryLevelFormState["enemies"][0]>) {
    const enemies = form.enemies.map((e, idx) => (idx === i ? { ...e, ...p } : e));
    onChange({ ...form, enemies });
  }

  return (
    <form
      className="studio-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h3>{editId ? `Édition · ${editId}` : "Nouveau niveau"}</h3>

      <fieldset className="studio-fieldset">
        <legend>Niveau</legend>
        <div className="studio-form__row--3 studio-form__row">
          <label className="studio-field">
            <span>ID</span>
            <input value={form.id} disabled={Boolean(editId)} onChange={(e) => patch({ id: e.target.value })} required placeholder="1-3" />
          </label>
          <label className="studio-field">
            <span>Zone</span>
            <select value={form.zone_id} onChange={(e) => patch({ zone_id: Number(e.target.value) })}>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.emoji} {z.name}</option>
              ))}
              {zones.length === 0 && <option value={1}>Zone 1</option>}
            </select>
          </label>
          <label className="studio-field">
            <span>Index</span>
            <input type="number" min={1} value={form.level_index} onChange={(e) => patch({ level_index: Number(e.target.value) })} />
          </label>
        </div>
        <label className="studio-field">
          <span>Titre</span>
          <input value={form.title} onChange={(e) => patch({ title: e.target.value })} required />
        </label>
        <div className="studio-form__row">
          <label className="studio-field">
            <span>Intro</span>
            <textarea className="studio-field__textarea" rows={3} value={form.intro} onChange={(e) => patch({ intro: e.target.value })} />
          </label>
          <label className="studio-field">
            <span>Outro</span>
            <textarea className="studio-field__textarea" rows={3} value={form.outro} onChange={(e) => patch({ outro: e.target.value })} />
          </label>
        </div>
        <div className="studio-form__row">
          <label className="studio-field">
            <span>3★ max rounds</span>
            <input type="number" min={1} value={form.stars_round3} onChange={(e) => patch({ stars_round3: Number(e.target.value) })} />
          </label>
          <label className="studio-field studio-field--row">
            <input type="checkbox" checked={form.active} onChange={(e) => patch({ active: e.target.checked })} />
            <span>Actif</span>
          </label>
        </div>
      </fieldset>

      <fieldset className="studio-fieldset">
        <legend>Ennemis ({form.enemies.length})</legend>
        <datalist id="spirit-keys">
          {spiritKeys.map((k) => (
            <option key={k} value={k} />
          ))}
        </datalist>
        <div className="studio-enemies">
          {form.enemies.map((en, i) => (
            <div key={i} className="studio-skill-card">
              <div className="studio-form__row--3 studio-form__row">
                <label className="studio-field">
                  <span>Clé template</span>
                  <input list="spirit-keys" value={en.key} onChange={(e) => patchEnemy(i, { key: e.target.value })} required />
                </label>
                <label className="studio-field">
                  <span>Niveau</span>
                  <input type="number" min={1} value={en.level} onChange={(e) => patchEnemy(i, { level: e.target.value })} />
                </label>
                <label className="studio-field">
                  <span>Mult. stats</span>
                  <input type="number" step={0.01} min={0.1} value={en.statMult} onChange={(e) => patchEnemy(i, { statMult: e.target.value })} />
                </label>
              </div>
              {form.enemies.length > 1 ? (
                <button type="button" className="studio-btn studio-btn--sm studio-btn--danger" onClick={() => patch({ enemies: form.enemies.filter((_, j) => j !== i) })}>
                  Retirer
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <button type="button" className="studio-btn studio-btn--sm" onClick={() => patch({ enemies: [...form.enemies, emptyEnemyRow()] })}>
          + Ennemi
        </button>
      </fieldset>

      <div className="studio-form__actions">
        <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
          {saving ? "…" : editId ? "Enregistrer" : "Créer"}
        </button>
        <button type="button" className="studio-btn" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}
