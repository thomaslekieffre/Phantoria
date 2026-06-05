"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { SpiritTemplateRow } from "@/app/api/studio/spirits/route";
import { TRIBE_INFO } from "@phantoria/game-core";
import { useGameContent } from "@/components/providers/game-content-provider";
import { SpiritEditorForm } from "@/components/studio/spirit-editor-form";
import { StudioEmptyState } from "@/components/studio/studio-empty-state";
import {
  buildCharacterPayload,
  emptySpiritForm,
  spiritFormFromPayload,
  type SpiritFormState,
} from "@/lib/studio/spirit-form";

export default function StudioSpiritsPage() {
  const { reload: reloadGame } = useGameContent();
  const [spirits, setSpirits] = useState<SpiritTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<SpiritFormState>(emptySpiritForm);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "catalog" | "enemy">("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/studio/spirits");
    const json = (await res.json()) as { spirits?: SpiritTemplateRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erreur chargement");
      setLoading(false);
      return;
    }
    setSpirits(json.spirits ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let list = filter === "all" ? spirits : spirits.filter((s) => s.kind === filter);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.template_key.toLowerCase().includes(q) ||
          (s.hub_id ?? "").toLowerCase().includes(q),
      );
    }
    return list;
  }, [spirits, filter, search]);

  function startNew() {
    setEditKey(null);
    setEditorOpen(true);
    setForm(emptySpiritForm());
    setError(null);
  }

  function startEdit(s: SpiritTemplateRow) {
    setEditKey(s.template_key);
    setEditorOpen(true);
    setForm(spiritFormFromPayload(s));
    setError(null);
  }

  function closeEditor() {
    setEditKey(null);
    setEditorOpen(false);
    setForm(emptySpiritForm());
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    const { payload, error: buildErr } = buildCharacterPayload(form);
    if (buildErr) {
      setError(buildErr);
      return;
    }

    setSaving(true);
    const body = {
      template_key: form.template_key.trim(),
      kind: form.kind,
      hub_id: form.hub_id.trim() || null,
      name: form.name.trim(),
      tribe: form.tribe,
      rarity: form.rarity,
      payload,
      active: form.active,
      sort_order: form.sort_order,
      portrait_url: form.portrait_url.trim() || null,
    };

    const res = editKey
      ? await fetch(`/api/studio/spirits/${encodeURIComponent(editKey)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
      : await fetch("/api/studio/spirits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

    const json = (await res.json()) as { error?: string };
    setSaving(false);
    if (!res.ok) {
      setError(json.error ?? "Erreur sauvegarde");
      return;
    }

    await load();
    await reloadGame();
    if (!editKey) {
      setEditKey(form.template_key.trim());
    }
  }

  async function remove(key: string) {
    if (!confirm(`Supprimer ${key} ?`)) return;
    const res = await fetch(`/api/studio/spirits/${encodeURIComponent(key)}`, { method: "DELETE" });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Erreur");
      return;
    }
    if (editKey === key) closeEditor();
    await load();
    await reloadGame();
  }

  const showEditor = editorOpen;

  return (
    <div className="studio-spirits">
      <h2 className="studio-section__title">Esprits & ennemis</h2>
      <p className="studio-section__desc">
        Édite les personnages du jeu : stats (HP, ATK, DEF, VIT) et 3 compétences. Plus de JSON à la main.
      </p>
      {error ? <p className="studio-events__error">{error}</p> : null}

      <div className="studio-spirits__layout">
        <aside className="studio-spirits__sidebar">
          <div className="studio-spirits__toolbar">
            <input
              type="search"
              className="studio-spirits__search"
              placeholder="Rechercher…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="button" className="studio-btn studio-btn--primary studio-btn--sm" onClick={startNew}>
              + Nouveau
            </button>
          </div>
          <div className="studio-spirits__filters">
            {(["all", "catalog", "enemy"] as const).map((f) => (
              <button
                key={f}
                type="button"
                className="studio-btn studio-btn--sm"
                data-active={filter === f}
                onClick={() => setFilter(f)}
              >
                {f === "all" ? "Tous" : f === "catalog" ? "Jouables" : "Ennemis"}
              </button>
            ))}
            <span className="studio-spirits__count">{loading ? "…" : filtered.length}</span>
          </div>

          <div className="studio-spirits__list-wrap">
            {loading ? (
              <p className="studio-empty__hint">Chargement…</p>
            ) : spirits.length === 0 ? (
              <StudioEmptyState
                title="Aucun esprit"
                hint="Importe tout le catalogue depuis characters.json."
                onSeeded={load}
              />
            ) : filtered.length === 0 ? (
              <p className="studio-empty__hint">Aucun résultat pour cette recherche.</p>
            ) : (
              <ul className="studio-spirits__list">
                {filtered.map((s) => {
                  const tribe = TRIBE_INFO[s.tribe as keyof typeof TRIBE_INFO];
                  const selected = editKey === s.template_key;
                  return (
                    <li key={s.template_key}>
                      <button
                        type="button"
                        className={`studio-spirits__item${selected ? " studio-spirits__item--active" : ""}`}
                        onClick={() => startEdit(s)}
                      >
                        <span className="studio-spirits__item-name">
                          {tribe?.emoji ?? "·"} {s.name}
                        </span>
                        <span className="studio-spirits__item-meta">
                          {s.rarity} · {s.kind === "catalog" ? "jouable" : "ennemi"}
                        </span>
                        <span className="studio-spirits__item-key">{s.template_key}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <div className="studio-spirits__editor">
          {showEditor ? (
            <SpiritEditorForm
              form={form}
              editKey={editKey}
              saving={saving}
              onChange={setForm}
              onSubmit={() => void handleSubmit()}
              onCancel={() => (editKey ? closeEditor() : setForm(emptySpiritForm()))}
            />
          ) : (
            <div className="studio-spirits__placeholder">
              <p>Sélectionne un esprit dans la liste ou clique <strong>+ Nouveau</strong>.</p>
            </div>
          )}

          {editKey ? (
            <div className="studio-spirits__danger">
              <button type="button" className="studio-btn studio-btn--danger" onClick={() => void remove(editKey)}>
                Supprimer {editKey}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
