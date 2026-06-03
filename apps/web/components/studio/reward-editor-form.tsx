"use client";

import {
  REWARD_KIND_OPTIONS,
  REWARD_STAT_OPTIONS,
  type RewardFormState,
} from "@/lib/studio/reward-form";

type Props = {
  form: RewardFormState;
  editId: string | null;
  saving: boolean;
  onChange: (f: RewardFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function RewardEditorForm({ form, editId, saving, onChange, onSubmit, onCancel }: Props) {
  const patch = (p: Partial<RewardFormState>) => onChange({ ...form, ...p });

  return (
    <form
      className="studio-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h3>{editId ? `Édition · ${editId}` : "Nouvelle relique"}</h3>

      <fieldset className="studio-fieldset">
        <legend>Identité</legend>
        {!editId && (
          <label className="studio-field">
            <span>ID</span>
            <input value={form.id} onChange={(e) => patch({ id: e.target.value })} required placeholder="griffe_ardente" />
          </label>
        )}
        <div className="studio-form__row">
          <label className="studio-field">
            <span>Nom</span>
            <input value={form.name} onChange={(e) => patch({ name: e.target.value })} required />
          </label>
          <label className="studio-field">
            <span>Emoji</span>
            <input value={form.emoji} onChange={(e) => patch({ emoji: e.target.value })} maxLength={4} />
          </label>
        </div>
        <label className="studio-field">
          <span>Description (affichée en run)</span>
          <input value={form.description} onChange={(e) => patch({ description: e.target.value })} required />
        </label>
      </fieldset>

      <fieldset className="studio-fieldset">
        <legend>Effet</legend>
        <div className="studio-form__row--3 studio-form__row">
          <label className="studio-field">
            <span>Type</span>
            <select value={form.kind} onChange={(e) => patch({ kind: e.target.value as RewardFormState["kind"] })}>
              {REWARD_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="studio-field">
            <span>Valeur</span>
            <input type="number" step={0.01} value={form.value} onChange={(e) => patch({ value: e.target.value })} />
            <span className="studio-field__hint">Ex: 8 (ATK), 0.35 (soin %)</span>
          </label>
          {form.kind === "stat_all" ? (
            <label className="studio-field">
              <span>Stat</span>
              <select value={form.stat} onChange={(e) => patch({ stat: e.target.value as RewardFormState["stat"] })}>
                {REWARD_STAT_OPTIONS.filter((o) => o.value).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </label>
          ) : null}
        </div>
        <label className="studio-field studio-field--row">
          <input type="checkbox" checked={form.stackable} onChange={(e) => patch({ stackable: e.target.checked })} />
          <span>Cumulable</span>
        </label>
      </fieldset>

      <div className="studio-form__row">
        <label className="studio-field">
          <span>Ordre tri</span>
          <input type="number" value={form.sort_order} onChange={(e) => patch({ sort_order: Number(e.target.value) })} />
        </label>
        <label className="studio-field studio-field--row">
          <input type="checkbox" checked={form.active} onChange={(e) => patch({ active: e.target.checked })} />
          <span>Actif en run</span>
        </label>
      </div>

      <div className="studio-form__actions">
        <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
          {saving ? "…" : editId ? "Enregistrer" : "Créer"}
        </button>
        <button type="button" className="studio-btn" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}
