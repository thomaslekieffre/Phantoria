"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { HubEventRow } from "@/app/api/studio/hub-events/route";
import { EventEditorForm } from "@/components/studio/event-editor-form";
import {
  StudioMasterDetail,
  StudioMdFilters,
  StudioMdItemButton,
  StudioMdListWrap,
  StudioMdPlaceholder,
  StudioMdSearch,
  StudioMdToolbar,
} from "@/components/studio/studio-master-detail";
import {
  emptyEventForm,
  EVENT_KIND_OPTIONS,
  eventFormFromRow,
  eventPayloadFromForm,
  validateEventForm,
  type EventFormState,
} from "@/lib/studio/event-form";

export default function StudioEventsPage() {
  const [events, setEvents] = useState<HubEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormState>(emptyEventForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/studio/hub-events");
    const json = (await res.json()) as { events?: HubEventRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erreur");
      setLoading(false);
      return;
    }
    setEvents(json.events ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) => e.title.toLowerCase().includes(q) || e.id.toLowerCase().includes(q) || (e.kind ?? "").includes(q),
    );
  }, [events, search]);

  function startNew() {
    setEditId(null);
    setEditorOpen(true);
    setForm(emptyEventForm());
    setError(null);
  }

  function startEdit(ev: HubEventRow) {
    setEditId(ev.id);
    setEditorOpen(true);
    setForm(eventFormFromRow(ev));
    setError(null);
  }

  function closeEditor() {
    setEditId(null);
    setEditorOpen(false);
    setForm(emptyEventForm());
  }

  async function handleSubmit() {
    const err = validateEventForm(form);
    if (err) {
      setError(err);
      return;
    }
    setSaving(true);
    setError(null);
    const payload = eventPayloadFromForm(form);
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
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Erreur");
      return;
    }
    await load();
    if (!editId) setEditId(form.id.trim());
  }

  async function toggleActive(ev: HubEventRow) {
    await fetch(`/api/studio/hub-events/${encodeURIComponent(ev.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !ev.active }),
    });
    await load();
  }

  async function remove(id: string) {
    if (!confirm(`Supprimer ${id} ?`)) return;
    await fetch(`/api/studio/hub-events/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (editId === id) closeEditor();
    await load();
  }

  const kindLabel = (k: string) => EVENT_KIND_OPTIONS.find((o) => o.value === k)?.label ?? k;

  return (
    <StudioMasterDetail
      title="Events hub"
      description="Live-ops : bandeaux, boost capture en run, bannières gacha temporaires."
      error={error}
      sidebar={
        <>
          <StudioMdToolbar>
            <StudioMdSearch placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <button type="button" className="studio-btn studio-btn--primary studio-btn--sm" onClick={startNew}>
              + Nouveau
            </button>
          </StudioMdToolbar>
          <StudioMdFilters>
            <span className="studio-md__count">{loading ? "…" : filtered.length} events</span>
          </StudioMdFilters>
          <StudioMdListWrap>
            {loading ? (
              <p className="studio-empty__hint">Chargement…</p>
            ) : filtered.length === 0 ? (
              <div className="studio-empty">
                <p className="studio-empty__title">Aucun event</p>
                <p className="studio-empty__hint">Crée un event pour animer le sanctuaire.</p>
              </div>
            ) : (
              <ul className="studio-md__list">
                {filtered.map((ev) => (
                  <li key={ev.id}>
                    <StudioMdItemButton
                      active={editId === ev.id}
                      onClick={() => startEdit(ev)}
                      title={ev.title}
                      meta={`${ev.active ? "actif" : "off"} · ${kindLabel(ev.kind ?? "banner")}`}
                      sub={ev.id}
                    />
                    <div style={{ display: "flex", gap: "0.3rem", marginTop: "0.25rem", paddingLeft: "0.25rem" }}>
                      <button
                        type="button"
                        className="studio-btn studio-btn--sm"
                        title={ev.active ? "Désactiver l’event" : "Activer l’event"}
                        onClick={() => void toggleActive(ev)}
                      >
                        {ev.active ? "Désactiver" : "Activer"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </StudioMdListWrap>
        </>
      }
      editor={
        editorOpen ? (
          <EventEditorForm
            form={form}
            editId={editId}
            saving={saving}
            onChange={setForm}
            onSubmit={() => void handleSubmit()}
            onCancel={closeEditor}
          />
        ) : (
          <StudioMdPlaceholder>
            <p>Sélectionne un event ou <strong>+ Nouveau</strong>.</p>
          </StudioMdPlaceholder>
        )
      }
      footer={
        editId ? (
          <div className="studio-md__danger">
            <button type="button" className="studio-btn studio-btn--danger" onClick={() => void remove(editId)}>
              Supprimer {editId}
            </button>
          </div>
        ) : null
      }
    />
  );
}
