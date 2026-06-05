"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { GachaEntryRow, GachaPoolRow } from "@/app/api/studio/gacha/route";
import type { SpiritTemplateRow } from "@/app/api/studio/spirits/route";
import { RARITIES, TRIBE_INFO, TRIBES } from "@phantoria/game-core";
import { formatRatePct, spiritPullProbability } from "@/lib/player/gacha-rates";
import type { GachaPoolEntry } from "@/lib/player/gacha-pool";
import {
  gachaEntryFromCatalogPick,
  mergeGachaCatalog,
  type GachaCatalogPick,
} from "@/lib/studio/gacha-catalog";
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
  weight: 100,
};

export default function StudioGachaPage() {
  const [pools, setPools] = useState<GachaPoolRow[]>([]);
  const [entries, setEntries] = useState<GachaEntryRow[]>([]);
  const [catalogSpirits, setCatalogSpirits] = useState<SpiritTemplateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spiritSearch, setSpiritSearch] = useState("");
  const [entryManualMode, setEntryManualMode] = useState(false);
  const [addingHubId, setAddingHubId] = useState<string | null>(null);
  const [poolCreatorOpen, setPoolCreatorOpen] = useState(false);
  const [newPoolId, setNewPoolId] = useState("");
  const [creatingPool, setCreatingPool] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState<string | null>(null);
  const [entryForm, setEntryForm] = useState(EMPTY_ENTRY);
  const [entryEditId, setEntryEditId] = useState<string | null>(null);
  const [entryEditorOpen, setEntryEditorOpen] = useState(false);
  const [poolDraft, setPoolDraft] = useState({
    ticket_cost: 1,
    gem_cost: 50,
    multi_count: 10,
    banner_url: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [gachaRes, spiritsRes] = await Promise.all([
      fetch("/api/studio/gacha"),
      fetch("/api/studio/spirits"),
    ]);
    const json = (await gachaRes.json()) as { pools?: GachaPoolRow[]; entries?: GachaEntryRow[]; error?: string };
    const spiritsJson = (await spiritsRes.json()) as { spirits?: SpiritTemplateRow[] };
    if (!gachaRes.ok) {
      setError(json.error ?? "Erreur");
      setLoading(false);
      return;
    }
    const p = json.pools ?? [];
    setPools(p);
    setEntries(json.entries ?? []);
    setCatalogSpirits(
      (spiritsJson.spirits ?? []).filter((s) => s.kind === "catalog" && s.active && s.hub_id),
    );
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

  const poolEntriesAsGacha = useMemo(
    (): GachaPoolEntry[] =>
      poolEntries.map((e) => ({
        hubId: e.hub_id,
        templateKey: e.template_key,
        name: e.name,
        tribe: e.tribe,
        hue: e.hue,
        rarity: e.rarity as GachaPoolEntry["rarity"],
        weight: e.weight ?? 100,
      })),
    [poolEntries],
  );

  const catalogMerged = useMemo(() => mergeGachaCatalog(catalogSpirits), [catalogSpirits]);

  const poolHubIds = useMemo(() => new Set(poolEntries.map((e) => e.hub_id)), [poolEntries]);

  const availableCatalog = useMemo(
    () => catalogMerged.filter((s) => !poolHubIds.has(s.hub_id)),
    [catalogMerged, poolHubIds],
  );

  const pickableSpirits = useMemo(() => {
    const q = spiritSearch.trim().toLowerCase();
    if (!q) return availableCatalog;
    return availableCatalog.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.template_key.toLowerCase().includes(q) ||
        s.hub_id.toLowerCase().includes(q) ||
        s.tribe.toLowerCase().includes(q),
    );
  }, [availableCatalog, spiritSearch]);

  useEffect(() => {
    if (selectedPool) {
      setPoolDraft({
        ticket_cost: selectedPool.ticket_cost,
        gem_cost: selectedPool.gem_cost,
        multi_count: selectedPool.multi_count,
        banner_url: selectedPool.banner_url ?? "",
      });
    }
  }, [
    selectedPool?.id,
    selectedPool?.ticket_cost,
    selectedPool?.gem_cost,
    selectedPool?.multi_count,
    selectedPool?.banner_url,
  ]);

  async function savePoolCosts() {
    if (!selectedPool) return;
    const res = await fetch(`/api/studio/gacha/pools/${selectedPool.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...poolDraft,
        banner_url: poolDraft.banner_url.trim() || null,
      }),
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
    setEntryManualMode(false);
    setSpiritSearch("");
    setEntryForm({ ...EMPTY_ENTRY, pool_id: selectedPoolId });
  }

  async function createPool() {
    const id = newPoolId.trim().toLowerCase();
    if (!id) {
      setError("ID de pool requis");
      return;
    }
    setCreatingPool(true);
    setError(null);
    const res = await fetch("/api/studio/gacha/pools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        ticket_cost: 1,
        gem_cost: 50,
        multi_count: 10,
        active: true,
      }),
    });
    const json = (await res.json()) as { error?: string; pool?: GachaPoolRow };
    setCreatingPool(false);
    if (!res.ok) {
      setError(json.error ?? "Erreur création pool");
      return;
    }
    setPoolCreatorOpen(false);
    setNewPoolId("");
    await load();
    if (json.pool?.id) selectPool(json.pool.id);
  }

  async function addFromCatalog(pick: GachaCatalogPick) {
    if (!selectedPoolId) return;
    const draft = gachaEntryFromCatalogPick(pick, selectedPoolId, poolEntries.length);
    if (poolHubIds.has(draft.hub_id)) {
      setError(`${draft.name} est déjà dans ce pool`);
      return;
    }
    setError(null);
    setAddingHubId(draft.hub_id);
    const res = await fetch("/api/studio/gacha", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = (await res.json()) as { error?: string };
    setAddingHubId(null);
    if (!res.ok) {
      setError(json.error ?? "Erreur");
      return;
    }
    setEntryEditorOpen(false);
    await load();
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
      weight: e.weight ?? 100,
    });
  }

  async function saveEntryWeight() {
    if (!entryEditId) return;
    if (entryForm.weight <= 0) {
      setError("Poids > 0 requis");
      return;
    }
    setError(null);
    const res = await fetch(`/api/studio/gacha/entries/${entryEditId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight: entryForm.weight }),
    });
    const json = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(json.error ?? "Erreur poids");
      return;
    }
    await load();
  }

  async function saveEntry() {
    if (!entryForm.hub_id.trim() || !entryForm.template_key.trim() || !entryForm.name.trim()) {
      setError("hub_id, template_key et nom requis");
      return;
    }
    setError(null);
    if (entryEditId) return;
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
            <button
              type="button"
              className="studio-btn studio-btn--sm studio-btn--primary"
              onClick={() => {
                setPoolCreatorOpen((v) => !v);
                setError(null);
              }}
            >
              + Pool
            </button>
          </StudioMdToolbar>
          {poolCreatorOpen ? (
            <div className="studio-form studio-md__pool-card" style={{ marginBottom: "0.5rem" }}>
              <label className="studio-field">
                <span>ID pool (slug)</span>
                <input
                  value={newPoolId}
                  onChange={(e) => setNewPoolId(e.target.value)}
                  placeholder="ex: event-ete-2026"
                  autoFocus
                />
              </label>
              <p className="studio-field__hint">Coûts par défaut : 1 ticket · 50 💎 · multi ×10</p>
              <div className="studio-form__actions">
                <button
                  type="button"
                  className="studio-btn studio-btn--sm studio-btn--primary"
                  disabled={creatingPool}
                  onClick={() => void createPool()}
                >
                  {creatingPool ? "…" : "Créer"}
                </button>
                <button
                  type="button"
                  className="studio-btn studio-btn--sm"
                  onClick={() => setPoolCreatorOpen(false)}
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : null}
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
                          meta={`${e.rarity} · poids ${e.weight ?? 100} · ${e.hub_id}`}
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
              <label className="studio-field">
                <span>Bannière (URL publique)</span>
                <input
                  value={poolDraft.banner_url}
                  onChange={(e) => setPoolDraft({ ...poolDraft, banner_url: e.target.value })}
                  placeholder="/assets/gacha/banners/mon-event.png"
                />
              </label>
              <p className="studio-field__hint studio-field__hint--block">
                Dépose ton PNG dans <code>apps/web/public/assets/gacha/banners/</code> puis colle le chemin
                (ex. <code>/assets/gacha/banners/event-demo.png</code>).
              </p>
              {poolDraft.banner_url.trim() ? (
                <div className="studio-gacha-banner-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={poolDraft.banner_url.trim()} alt="Aperçu bannière" />
                </div>
              ) : null}
              <button type="button" className="studio-btn studio-btn--primary studio-btn--sm" onClick={() => void savePoolCosts()}>
                Enregistrer pool
              </button>
            </div>

            {entryEditorOpen ? (
              entryEditId || entryManualMode ? (
              <form
                className="studio-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  void saveEntry();
                }}
              >
                <h3>{entryEditId ? "Entrée pool" : "Saisie manuelle"}</h3>
                {!entryEditId ? (
                  <button
                    type="button"
                    className="studio-btn studio-btn--sm"
                    onClick={() => setEntryManualMode(false)}
                  >
                    ← Choisir dans le catalogue
                  </button>
                ) : null}
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
                <label className="studio-field">
                  <span>Poids drop</span>
                  <input
                    type="number"
                    min={1}
                    value={entryForm.weight}
                    onChange={(e) => setEntryForm({ ...entryForm, weight: Number(e.target.value) })}
                  />
                </label>
                {entryEditId ? (
                  <p className="studio-field__hint">
                    Taux estimé :{" "}
                    {formatRatePct(
                      spiritPullProbability(
                        {
                          hubId: entryForm.hub_id,
                          templateKey: entryForm.template_key,
                          name: entryForm.name,
                          tribe: entryForm.tribe,
                          hue: entryForm.hue,
                          rarity: entryForm.rarity as GachaPoolEntry["rarity"],
                          weight: entryForm.weight,
                        },
                        poolEntriesAsGacha,
                        {
                          mode: selectedPoolId === "welcome" ? "welcome" : "gacha",
                          pity: 0,
                        },
                      ),
                    )}
                    {selectedPoolId !== "welcome" ? " (pity 0, hors doublons)" : ""}
                  </p>
                ) : (
                  <p className="studio-field__hint">100 = référence. Plus haut = plus fréquent dans la même rareté.</p>
                )}
                <div className="studio-form__actions">
                  {!entryEditId ? (
                    <button type="submit" className="studio-btn studio-btn--primary">
                      Ajouter
                    </button>
                  ) : (
                    <button type="button" className="studio-btn studio-btn--primary" onClick={() => void saveEntryWeight()}>
                      Enregistrer poids
                    </button>
                  )}
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
              <div className="studio-form studio-gacha-picker">
                <h3>Ajouter depuis le catalogue</h3>
                <p className="studio-field__hint studio-field__hint--block">
                  Clique un esprit — nom, tribu, rareté et couleur sont remplis automatiquement.
                </p>
                <label className="studio-field">
                  <span>Rechercher</span>
                  <input
                    value={spiritSearch}
                    onChange={(e) => setSpiritSearch(e.target.value)}
                    placeholder="Nom, hub_id, template…"
                    autoFocus
                  />
                </label>
                <div className="studio-gacha-picker__list">
                  {pickableSpirits.length === 0 ? (
                    <p className="studio-empty__hint">
                      {spiritSearch.trim()
                        ? `Aucun résultat pour « ${spiritSearch.trim()} »${availableCatalog.length === 0 ? " — pool complet" : ""}.`
                        : availableCatalog.length === 0
                          ? "Tous les esprits connus sont déjà dans ce pool."
                          : "Aucun esprit disponible."}
                    </p>
                  ) : (
                    <ul className="studio-md__list">
                      {pickableSpirits.map((s) => {
                        const busy = addingHubId === s.hub_id;
                        return (
                          <li key={`${s.hub_id}-${s.template_key}`}>
                            <button
                              type="button"
                              className="studio-md__item studio-gacha-picker__item"
                              disabled={Boolean(addingHubId)}
                              onClick={() => void addFromCatalog(s)}
                            >
                              <span className="studio-md__item-name">{s.name}</span>
                              <span className="studio-md__item-meta">
                                {s.rarity} · {s.hub_id}
                                {busy ? " · …" : ""}
                              </span>
                              <span className="studio-md__item-key">{s.tribe}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
                <div className="studio-form__actions">
                  <button
                    type="button"
                    className="studio-btn studio-btn--sm"
                    onClick={() => setEntryManualMode(true)}
                  >
                    Saisie manuelle
                  </button>
                  <button
                    type="button"
                    className="studio-btn studio-btn--sm"
                    onClick={() => setEntryEditorOpen(false)}
                  >
                    Annuler
                  </button>
                </div>
              </div>
              )
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
