"use client";

import { EVENT_KIND_OPTIONS, type EventFormState } from "@/lib/studio/event-form";

type Props = {
  form: EventFormState;
  editId: string | null;
  saving: boolean;
  onChange: (f: EventFormState) => void;
  onSubmit: () => void;
  onCancel: () => void;
};

export function EventEditorForm({ form, editId, saving, onChange, onSubmit, onCancel }: Props) {
  const patch = (p: Partial<EventFormState>) => onChange({ ...form, ...p });

  return (
    <form
      className="studio-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <h3>{editId ? `Édition · ${editId}` : "Nouvel event"}</h3>

      <fieldset className="studio-fieldset">
        <legend>Affichage hub</legend>
        <div className="studio-form__row">
          <label className="studio-field">
            <span>ID (slug)</span>
            <input value={form.id} disabled={Boolean(editId)} onChange={(e) => patch({ id: e.target.value })} required placeholder="lune-captures" />
          </label>
          <label className="studio-field">
            <span>Priorité</span>
            <input type="number" value={form.priority} onChange={(e) => patch({ priority: Number(e.target.value) })} />
            <span className="studio-field__hint">Plus haut = affiché en premier</span>
          </label>
        </div>
        <label className="studio-field">
          <span>Titre</span>
          <input value={form.title} onChange={(e) => patch({ title: e.target.value })} required />
        </label>
        <label className="studio-field">
          <span>Sous-titre</span>
          <input value={form.subtitle} onChange={(e) => patch({ subtitle: e.target.value })} required />
        </label>
        <label className="studio-field">
          <span>Lien CTA</span>
          <input value={form.href} onChange={(e) => patch({ href: e.target.value })} placeholder="/gacha" />
        </label>
        <div className="studio-form__row">
          <label className="studio-field">
            <span>Type</span>
            <select value={form.kind} onChange={(e) => patch({ kind: e.target.value as EventFormState["kind"] })}>
              {EVENT_KIND_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
          <label className="studio-field studio-field--row">
            <input type="checkbox" checked={form.active} onChange={(e) => patch({ active: e.target.checked })} />
            <span>Actif</span>
          </label>
        </div>
        <div className="studio-form__row">
          <label className="studio-field">
            <span>Début</span>
            <input type="datetime-local" value={form.starts_at} onChange={(e) => patch({ starts_at: e.target.value })} />
          </label>
          <label className="studio-field">
            <span>Fin</span>
            <input type="datetime-local" value={form.ends_at} onChange={(e) => patch({ ends_at: e.target.value })} />
          </label>
        </div>
      </fieldset>

      {form.kind === "capture_boost" && (
        <fieldset className="studio-fieldset">
          <legend>Boost capture</legend>
          <div className="studio-form__row">
            <label className="studio-field">
              <span>Bonus (additif)</span>
              <input type="number" step={0.01} min={0} value={form.captureBonus} onChange={(e) => patch({ captureBonus: e.target.value })} />
              <span className="studio-field__hint">0.12 = +12 pts de chance capture</span>
            </label>
            <label className="studio-field">
              <span>Label UI</span>
              <input value={form.captureLabel} onChange={(e) => patch({ captureLabel: e.target.value })} />
            </label>
          </div>
          <label className="studio-field">
            <span>Tribus (optionnel, virgules)</span>
            <input value={form.tribesCsv} onChange={(e) => patch({ tribesCsv: e.target.value })} placeholder="vaillants, perfides" />
          </label>
          <label className="studio-field">
            <span>Raretés (optionnel)</span>
            <input value={form.raritiesCsv} onChange={(e) => patch({ raritiesCsv: e.target.value })} placeholder="A, S" />
          </label>
        </fieldset>
      )}

      {form.kind === "gacha_banner" && (
        <fieldset className="studio-fieldset">
          <legend>Bannière gacha</legend>
          <label className="studio-field">
            <span>Pool ID</span>
            <input value={form.poolId} onChange={(e) => patch({ poolId: e.target.value })} required placeholder="event-perfides-2026" />
            <span className="studio-field__hint">Doit exister dans Gacha studio (ou créé via event)</span>
          </label>
          <div className="studio-form__row--3 studio-form__row">
            <label className="studio-field">
              <span>Tickets</span>
              <input type="number" min={0} value={form.ticketCost} onChange={(e) => patch({ ticketCost: e.target.value })} />
            </label>
            <label className="studio-field">
              <span>Gemmes</span>
              <input type="number" min={0} value={form.gemCost} onChange={(e) => patch({ gemCost: e.target.value })} />
            </label>
            <label className="studio-field">
              <span>Multi</span>
              <input type="number" min={1} value={form.multiCount} onChange={(e) => patch({ multiCount: e.target.value })} />
            </label>
          </div>
          <label className="studio-field">
            <span>Featured hub IDs</span>
            <input value={form.featuredCsv} onChange={(e) => patch({ featuredCsv: e.target.value })} placeholder="kiro, bram" />
          </label>
          <label className="studio-field">
            <span>Rate-up raretés</span>
            <input value={form.rateUpCsv} onChange={(e) => patch({ rateUpCsv: e.target.value })} placeholder="A, S" />
          </label>
        </fieldset>
      )}

      <div className="studio-form__actions">
        <button type="submit" className="studio-btn studio-btn--primary" disabled={saving}>
          {saving ? "…" : editId ? "Enregistrer" : "Créer"}
        </button>
        <button type="button" className="studio-btn" onClick={onCancel}>Annuler</button>
      </div>
    </form>
  );
}
