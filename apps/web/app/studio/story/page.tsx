"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StoryLevelRow, StoryZoneRow } from "@/app/api/studio/story/route";
import { StoryLevelEditorForm } from "@/components/studio/story-level-editor-form";
import { StudioEmptyState } from "@/components/studio/studio-empty-state";
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
  emptyStoryLevelForm,
  storyFormFromRow,
  storyPayloadFromForm,
  type StoryLevelFormState,
} from "@/lib/studio/story-form";

export default function StudioStoryPage() {
  const [zones, setZones] = useState<StoryZoneRow[]>([]);
  const [levels, setLevels] = useState<StoryLevelRow[]>([]);
  const [spiritKeys, setSpiritKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<StoryLevelFormState>(emptyStoryLevelForm());
  const [editId, setEditId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filterZone, setFilterZone] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [storyRes, spiritsRes] = await Promise.all([
      fetch("/api/studio/story"),
      fetch("/api/studio/spirits"),
    ]);
    const storyJson = (await storyRes.json()) as { zones?: StoryZoneRow[]; levels?: StoryLevelRow[]; error?: string };
    if (!storyRes.ok) {
      setError(storyJson.error ?? "Erreur");
      setLoading(false);
      return;
    }
    setZones(storyJson.zones ?? []);
    setLevels(storyJson.levels ?? []);
    const spiritsJson = (await spiritsRes.json()) as { spirits?: { template_key: string; kind: string }[] };
    if (spiritsRes.ok && spiritsJson.spirits) {
      setSpiritKeys(spiritsJson.spirits.filter((s) => s.kind === "enemy" || s.kind === "catalog").map((s) => s.template_key));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = filterZone === null ? levels : levels.filter((l) => l.zone_id === filterZone);
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((l) => l.title.toLowerCase().includes(q) || l.id.toLowerCase().includes(q));
    return list.sort((a, b) => a.zone_id - b.zone_id || a.level_index - b.level_index);
  }, [levels, filterZone, search]);

  function startNew() {
    setEditId(null);
    setEditorOpen(true);
    setForm(emptyStoryLevelForm(filterZone ?? zones[0]?.id ?? 1));
    setError(null);
  }

  function startEdit(l: StoryLevelRow) {
    setEditId(l.id);
    setEditorOpen(true);
    setForm(storyFormFromRow(l));
    setError(null);
  }

  function closeEditor() {
    setEditId(null);
    setEditorOpen(false);
    setForm(emptyStoryLevelForm());
  }

  async function handleSubmit() {
    const { body, error: buildErr } = storyPayloadFromForm(form);
    if (buildErr || !body) {
      setError(buildErr ?? "Erreur");
      return;
    }
    setSaving(true);
    const res = editId
      ? await fetch(`/api/studio/story/${encodeURIComponent(editId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/studio/story", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
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

  async function remove(id: string) {
    if (!confirm(`Supprimer ${id} ?`)) return;
    await fetch(`/api/studio/story/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (editId === id) closeEditor();
    await load();
  }

  return (
    <StudioMasterDetail
      title="Niveaux histoire"
      description="Zones, textes, ennemis par vague et seuil 3★."
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
            <button
              type="button"
              className="studio-btn studio-btn--sm"
              data-active={filterZone === null}
              onClick={() => setFilterZone(null)}
            >
              Toutes
            </button>
            {zones.map((z) => (
              <button
                key={z.id}
                type="button"
                className="studio-btn studio-btn--sm"
                data-active={filterZone === z.id}
                onClick={() => setFilterZone(z.id)}
              >
                {z.emoji} Z{z.id}
              </button>
            ))}
            <span className="studio-md__count">{loading ? "…" : filtered.length}</span>
          </StudioMdFilters>
          <StudioMdListWrap>
            {loading ? (
              <p className="studio-empty__hint">Chargement…</p>
            ) : levels.length === 0 ? (
              <StudioEmptyState title="Aucun niveau" hint="Importe story-levels.ts" onSeeded={load} />
            ) : filtered.length === 0 ? (
              <p className="studio-empty__hint">Aucun résultat.</p>
            ) : (
              <ul className="studio-md__list">
                {filtered.map((l) => {
                  const z = zones.find((x) => x.id === l.zone_id);
                  return (
                    <li key={l.id}>
                      <StudioMdItemButton
                        active={editId === l.id}
                        onClick={() => startEdit(l)}
                        title={l.title}
                        meta={`${z?.emoji ?? ""} Z${l.zone_id} · #${l.level_index} · 3★≤${l.stars_round3}`}
                        sub={l.id}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </StudioMdListWrap>
        </>
      }
      editor={
        editorOpen ? (
          <StoryLevelEditorForm
            form={form}
            zones={zones}
            editId={editId}
            spiritKeys={spiritKeys}
            saving={saving}
            onChange={setForm}
            onSubmit={() => void handleSubmit()}
            onCancel={closeEditor}
          />
        ) : (
          <StudioMdPlaceholder>
            <p>Sélectionne un niveau ou <strong>+ Nouveau</strong>.</p>
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
