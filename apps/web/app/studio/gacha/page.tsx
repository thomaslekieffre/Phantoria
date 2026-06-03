"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GachaEntryRow, GachaPoolRow } from "@/app/api/studio/gacha/route";
import { RARITIES, TRIBE_INFO, TRIBES } from "@phantoria/game-core";
import { StudioEmptyState } from "@/components/studio/studio-empty-state";
import {
  StudioMasterDetail,
  StudioMdFilters,
  StudioMdItemButton,
  StudioMdListWrap,
  StudioMdPlaceholder,
  StudioMdToolbar,
} from "@/components/studio/studio-master-detail";

const EMPTY_ENTRY = {
  pool_id: "standard",
  hub_id: "",
  template_key: "",
  name: "",
  tribe: "vaillants",
  hue: "#86efac",
  rarity: "C" as string,
  sort_order: 0,
};

export default function StudioGachaPage() {
  const [pools, setPools] = useState<GachaPoolRow[]>([]);
  const [entries, setEntries] = useState<GachaEntryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY);
  const [entryEditId, setEntryEditId] = useState<string | null>(null);
  const [entryEditorOpen, setEntryEditorOpen] = useState(false);
  const [poolDraft, setPoolDraft] = useState({ ticket_cost: 1, gem_cost: 50, multi_count: 10 });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/studio/gacha");
    const json = (await res.json()) as { pools?: GachaPoolRow[]; entries?: GachaEntryRow[]; error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erreur");
      setLoading(false);
      return;
    }
    const p = json.pools ?? [];
    setPools(p);
    setEntries(json.entries ?? []);
    setSelectedPoolId((cur) => cur ?? p[0]?.id ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const selectedPool = pools.find((p) => p.id === selectedPoolId) ?? null;
  const poolEntries = useMemo(
    () => (selectedPoolId ? entries.filter((e) => e.pool_id === selectedPoolId) : []),
    [entries, selectedPoolId],
  );

  useEffect(() => {
    if (selectedPool) {
      setPoolDraft({
        ticket_cost: selectedPool.ticket_cost,
        gem_cost: selectedPool.gem_cost,
        multi_count: selectedPool.multi_count,
      });
    }
  }, [selectedPool?.id, selectedPool?.ticket_cost, selectedPool?.gem_cost, selectedPool?.multi_count]);

  async function savePoolCosts() {
    if (!selectedPool) return;
    const res = await fetch(`/api/studio/gacha/pools/${selectedPool.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(poolDraft),
    });
    if (!res.ok) {
      const json = (await res.json()) as { error?: string };
      setError(json.error ?? "Erreur pool");
      return;
    }
    await load();
  }

  function selectPool(id: string) {
    setSelectedPoolId(id);
    setEntryEditId(null);
    setEntryEditorOpen(false);
    setEntryForm({ ...EMPTY_ENTRY, pool_id: id });
  }

  function startNewEntry() {
    if (!selectedPoolId) return;
    setEntryEditId(null);
    setEntryEditorOpen(true);
    setEntryForm({ ...EMPTY_ENTRY, pool_id: selectedPoolId });
  }

  function startEditEntry(e: GachaEntryRow) {
    setEntryEditId(e.id);
    setEntryEditorOpen(true);
    setEntryForm({
      pool_id: e.pool_id,
      hub_id: e.hub_id,
      template_key: e.template_key,
      name: e.name,
      tribe: e.tribe,
      hue: e.hue,
      rarity: e.rarity,
      sort_order: e.sort_order,
    });
  }

  async function saveEntry() {
    if (!entryForm.hub_id.trim() || !entryForm.template_key.trim() || !entryForm.name.trim()) {
      setError("hub_id, template_key et nom requis");
      return;
    }
    setError(null);
    if (entryEditId) {
      setError("Édition entrée : supprime et recrée pour l'instant");
      return;
    }
    const res = await fetch("/api/studio/gacha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entryForm),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erreur");
      return;
    }
    setEntryEditorOpen(false);
    setEntryForm({ ...EMPTY_ENTRY, pool_id: selectedPoolId ?? "standard" });
    await load();
  }

  async function removeEntry(id: string) {
    if (!confirm("Retirer du pool ?")) return;
    await fetch(`/api/studio/gacha/entries/${id}`, { method: "DELETE" });
    if (entryEditId === id) {
      setEntryEditId(null);
      setEntryEditorOpen(false);
    }
    await load();
  }

  return (
    <StudioMasterDetail
      title="Gacha pools"
      description="Bannières d'invocation : coûts par pool et liste des esprits tirables."
      error={error}
      sidebar={
        <>
          <StudioMdToolbar>
            <span className="studio-empty__hint" style={{ flex: 1, margin: 0 }}>
              Pools
            </span>
          </StudioMdToolbar>
          <StudioMdListWrap>
            {loading ? (
              <p className="studio-empty__hint">Chargement…</p>
            ) : pools.length === 0 ? (
              <StudioEmptyState title="Aucune pool" hint="Importe welcome + standard" onSeeded={load} />
            ) : (
              <ul className="studio-md__list">
                {pools.map((p) => (
                  <li key={p.id}>
                    <StudioMdItemButton
                      active={selectedPoolId === p.id}
                      onClick={() => selectPool(p.id)}
                      title={p.id}
                      meta={`${entries.filter((e) => e.pool_id === p.id).length} esprits`}
                      sub={`${p.ticket_cost} tickets · ${p.gem_cost} 💎`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </StudioMdListWrap>
          {selectedPoolId ? (
            <>
              <StudioMdFilters>
                <span className="studio-md__count">{poolEntries.length} entrées</span>
                <button type="button" className="studio-btn studio-btn--sm studio-btn--primary" onClick={startNewEntry}>
                  + Esprit
                </button>
              </StudioMdFilters>
              <div className="studio-md__list-wrap studio-md__list-wrap--short">
                {poolEntries.length === 0 ? (
                  <p className="studio-empty__hint">Pool vide.</p>
                ) : (
                  <ul className="studio-md__list">
                    {poolEntries.map((e) => (
                      <li key={e.id}>
                        <StudioMdItemButton
                          active={entryEditId === e.id}
                          onClick={() => startEditEntry(e)}
                          title={e.name}
                          meta={`${e.rarity} · ${e.hub_id}`}
                          sub={e.template_key}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          ) : null}
        </>
      }
      editor={
        selectedPool ? (
          <>
            <div className="studio-form studio-md__pool-card">
              <h3>Pool « {selectedPool.id} »</h3>
              <div className="studio-form__row--3 studio-form__row">
                <label className="studio-field">
                  <span>Tickets (×1)</span>
                  <input
                    type="number"
                    min={0}
                    value={poolDraft.ticket_cost}
                    onChange={(e) => setPoolDraft({ ...poolDraft, ticket_cost: Number(e.target.value) })}
                  />
                </label>
                <label className="studio-field">
                  <span>Gemmes (×1)</span>
                  <input
                    type="number"
                    min={0}
                    value={poolDraft.gem_cost}
                    onChange={(e) => setPoolDraft({ ...poolDraft, gem_cost: Number(e.target.value) })}
                  />
                </label>
                <label className="studio-field">
                  <span>Multi (×N)</span>
                  <input
                    type="number"
                    min={1}
                    value={poolDraft.multi_count}
                    onChange={(e) => setPoolDraft({ ...poolDraft, multi_count: Number(e.target.value) })}
                  />
                </label>
              </div>
              <button type="button" className="studio-btn studio-btn--primary studio-btn--sm" onClick={() => void savePoolCosts()}>
                Enregistrer coûts
              </button>
            </div>

            {entryEditorOpen ? (
              <form
                className="studio-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveEntry();
                }}
              >
                <h3>{entryEditId ? "Voir entrée" : "Ajouter au pool"}</h3>
                <div className="studio-form__row">
                  <label className="studio-field">
                    <span>Hub ID</span>
                    <input
                      value={entryForm.hub_id}
                      onChange={(e) => setEntryForm({ ...entryForm, hub_id: e.target.value })}
                      required
                      disabled={Boolean(entryEditId)}
                    />
                  </label>
                  <label className="studio-field">
                    <span>Template key</span>
                    <input
                      value={entryForm.template_key}
                      onChange={(e) => setEntryForm({ ...entryForm, template_key: e.target.value })}
                      required
                      disabled={Boolean(entryEditId)}
                    />
                  </label>
                </div>
                <label className="studio-field">
                  <span>Nom carte</span>
                  <input
                    value={entryForm.name}
                    onChange={(e) => setEntryForm({ ...entryForm, name: e.target.value })}
                    required
                    disabled={Boolean(entryEditId)}
                  />
                </label>
                <div className="studio-form__row--3 studio-form__row">
                  <label className="studio-field">
                    <span>Tribu</span>
                    <select
                      value={entryForm.tribe}
                      onChange={(e) => setEntryForm({ ...entryForm, tribe: e.target.value })}
                      disabled={Boolean(entryEditId)}
                    >
                      {TRIBES.map((t) => (
                        <option key={t} value={t}>{TRIBE_INFO[t].emoji} {TRIBE_INFO[t].label}</option>
                      ))}
                    </select>
                  </label>
                  <label className="studio-field">
                    <span>Rareté</span>
                    <select
                      value={entryForm.rarity}
                      onChange={(e) => setEntryForm({ ...entryForm, rarity: e.target.value })}
                      disabled={Boolean(entryEditId)}
                    >
                      {RARITIES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                  <label className="studio-field">
                    <span>Couleur</span>
                    <input
                      type="color"
                      value={entryForm.hue.startsWith("#") ? entryForm.hue : "#86efac"}
                      onChange={(e) => setEntryForm({ ...entryForm, hue: e.target.value })}
                      disabled={Boolean(entryEditId)}
                    />
                  </label>
                </div>
                <div className="studio-form__actions">
                  {!entryEditId ? (
                    <button type="submit" className="studio-btn studio-btn--primary">
                      Ajouter
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="studio-btn"
                    onClick={() => {
                      setEntryEditorOpen(false);
                      setEntryEditId(null);
                    }}
                  >
                    Fermer
                  </button>
                  {entryEditId ? (
                    <button
                      type="button"
                      className="studio-btn studio-btn--danger"
                      onClick={() => void removeEntry(entryEditId)}
                    >
                      Retirer
                    </button>
                  ) : null}
                </div>
              </form>
            ) : (
              <StudioMdPlaceholder>
                <p>Sélectionne une entrée ou <strong>+ Esprit</strong> pour ajouter au pool.</p>
              </StudioMdPlaceholder>
            )}
          </>
        ) : (
          <StudioMdPlaceholder>
            <p>Sélectionne une pool à gauche.</p>
          </StudioMdPlaceholder>
        )
      }
    />
  );
}
