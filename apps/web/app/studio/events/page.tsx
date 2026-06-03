"use client";

import { useCallback, useEffect, useState } from "react";
import type { HubEventRow } from "@/app/api/studio/hub-events/route";

const EMPTY_FORM = {
  id: "",
  title: "",
  subtitle: "",
  href: "/events",
  active: false,
  starts_at: "",
  ends_at: "",
};

export default function StudioEventsPage() {
  const [events, setEvents] = useState<HubEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/studio/hub-events");
    const json = (await res.json()) as { events?: HubEventRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erreur chargement");
      setLoading(false);
      return;
    }
    setEvents(json.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(ev: HubEventRow) {
    setEditId(ev.id);
    setForm({
      id: ev.id,
      title: ev.title,
      subtitle: ev.subtitle,
      href: ev.href,
      active: ev.active,
      starts_at: ev.starts_at ? ev.starts_at.slice(0, 16) : "",
      ends_at: ev.ends_at ? ev.ends_at.slice(0, 16) : "",
    });
  }

  function resetForm() {
    setEditId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      ...form,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
      ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
    };

    const res = editId
      ? await fetch(`/api/studio/hub-events/${encodeURIComponent(editId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      : await fetch("/api/studio/hub-events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Échec sauvegarde");
      return;
    }

    resetForm();
    await load();
  }

  async function handleDelete(id: string) {
    if (!window.confirm(`Supprimer l'event « ${id} » ?`)) return;
    const res = await fetch(`/api/studio/hub-events/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Suppression impossible");
      return;
    }
    if (editId === id) resetForm();
    await load();
  }

  async function toggleActive(ev: HubEventRow) {
    const res = await fetch(`/api/studio/hub-events/${encodeURIComponent(ev.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ev.active }),
    });
    if (!res.ok) return;
    await load();
  }

  return (
    <div className="studio-events">
      <h2 className="studio-section__title">Events hub</h2>
      {error ? <p className="studio-events__error">{error}</p> : null}

      <form className="studio-form" onSubmit={handleSubmit}>
        <h3>{editId ? `Modifier ${editId}` : "Nouvel event"}</h3>
        <label className="studio-field">
          <span>ID (slug)</span>
          <input
            value={form.id}
            onChange={(e) => setForm((f) => ({ ...f, id: e.target.value }))}
            disabled={Boolean(editId)}
            required
            placeholder="lune-captures"
          />
        </label>
        <label className="studio-field">
          <span>Titre</span>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
          />
        </label>
        <label className="studio-field">
          <span>Sous-titre</span>
          <input
            value={form.subtitle}
            onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
            required
          />
        </label>
        <label className="studio-field">
          <span>Lien CTA</span>
          <input value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))} />
        </label>
        <label className="studio-field studio-field--row">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          <span>Actif sur le hub</span>
        </label>
        <div className="studio-form__row">
          <label className="studio-field">
            <span>Début (optionnel)</span>
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))}
            />
          </label>
          <label className="studio-field">
            <span>Fin (optionnel)</span>
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm((f) => ({ ...f, ends_at: e.target.value }))}
            />
          </label>
        </div>
        <div className="studio-form__actions">
          <button type="submit" className="studio-btn studio-btn--primary">
            {editId ? "Enregistrer" : "Créer"}
          </button>
          {editId ? (
            <button type="button" className="studio-btn" onClick={resetForm}>
              Annuler
            </button>
          ) : null}
        </div>
      </form>

      <section className="studio-list">
        <h3>Events ({loading ? "…" : events.length})</h3>
        {loading ? (
          <p>Chargement…</p>
        ) : events.length === 0 ? (
          <p>Aucun event.</p>
        ) : (
          <ul>
            {events.map((ev) => (
              <li key={ev.id} className="studio-list__item">
                <div className="studio-list__head">
                  <strong>{ev.title}</strong>
                  <span className={ev.active ? "studio-pill studio-pill--on" : "studio-pill"}>
                    {ev.active ? "actif" : "inactif"}
                  </span>
                </div>
                <p className="studio-list__meta">{ev.id} · {ev.subtitle}</p>
                <div className="studio-list__actions">
                  <button type="button" className="studio-btn studio-btn--sm" onClick={() => startEdit(ev)}>
                    Éditer
                  </button>
                  <button type="button" className="studio-btn studio-btn--sm" onClick={() => toggleActive(ev)}>
                    {ev.active ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    type="button"
                    className="studio-btn studio-btn--sm studio-btn--danger"
                    onClick={() => handleDelete(ev.id)}
                  >
                    Suppr.
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
