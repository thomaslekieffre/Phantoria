"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RunRewardRow } from "@/app/api/studio/rewards/route";
import { RewardEditorForm } from "@/components/studio/reward-editor-form";
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
  buildRewardPayload,
  emptyRewardForm,
  rewardFormFromRow,
  rewardPayloadPreview,
  type RewardFormState,
} from "@/lib/studio/reward-form";

export default function StudioRewardsPage() {
  const [rewards, setRewards] = useState<RunRewardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<RewardFormState>(emptyRewardForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/studio/rewards");
    const json = (await res.json()) as { rewards?: RunRewardRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erreur");
      setLoading(false);
      return;
    }
    setRewards(json.rewards ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rewards;
    return rewards.filter((r) => {
      const { name } = rewardPayloadPreview(r.payload, r.id);
      return r.id.toLowerCase().includes(q) || name.toLowerCase().includes(q);
    });
  }, [rewards, search]);

  function startNew() {
    setEditId(null);
    setEditorOpen(true);
    setForm(emptyRewardForm());
    setError(null);
  }

  function startEdit(r: RunRewardRow) {
    setEditId(r.id);
    setEditorOpen(true);
    setForm(rewardFormFromRow(r));
    setError(null);
  }

  function closeEditor() {
    setEditId(null);
    setEditorOpen(false);
    setForm(emptyRewardForm());
  }

  async function handleSubmit() {
    const { payload, error: buildErr } = buildRewardPayload(form);
    if (buildErr) {
      setError(buildErr);
      return;
    }
    setSaving(true);
    const body = { payload, sort_order: form.sort_order, active: form.active };
    const res = editId
      ? await fetch(`/api/studio/rewards/${encodeURIComponent(editId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/studio/rewards", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: form.id.trim(), ...body }),
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
    await fetch(`/api/studio/rewards/${encodeURIComponent(id)}`, { method: "DELETE" });
    if (editId === id) closeEditor();
    await load();
  }

  return (
    <StudioMasterDetail
      title="Reliques run"
      description="Récompenses entre les vagues du roguelite — buffs, soins, balls, etc."
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
            <span className="studio-md__count">{loading ? "…" : filtered.length}</span>
          </StudioMdFilters>
          <StudioMdListWrap>
            {loading ? (
              <p className="studio-empty__hint">Chargement…</p>
            ) : rewards.length === 0 ? (
              <StudioEmptyState title="Pool vide" hint="Importe depuis run-rewards.ts" onSeeded={load} />
            ) : filtered.length === 0 ? (
              <p className="studio-empty__hint">Aucun résultat.</p>
            ) : (
              <ul className="studio-md__list">
                {filtered.map((r) => {
                  const p = rewardPayloadPreview(r.payload, r.id);
                  return (
                    <li key={r.id}>
                      <StudioMdItemButton
                        active={editId === r.id}
                        onClick={() => startEdit(r)}
                        title={`${p.emoji} ${p.name}`}
                        meta={`${p.kind}${r.active ? "" : " · off"}`}
                        sub={r.id}
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
          <RewardEditorForm
            form={form}
            editId={editId}
            saving={saving}
            onChange={setForm}
            onSubmit={() => void handleSubmit()}
            onCancel={closeEditor}
          />
        ) : (
          <StudioMdPlaceholder>
            <p>Sélectionne une relique ou <strong>+ Nouveau</strong>.</p>
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
