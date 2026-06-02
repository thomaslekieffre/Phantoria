"use client";

import { useState } from "react";
import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { usePlayer } from "@/components/providers/player-provider";
import { purchaseShopItem } from "@/lib/player/inventory-service";
import {
  INVENTORY_CATALOG,
  type InventoryItemId,
  shopItems,
} from "@phantoria/game-core";
import "./shop.css";

export function ShopScreen() {
  const { currencies, refresh, inventory } = usePlayer();
  const [busy, setBusy] = useState<InventoryItemId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const gold = currencies?.gold ?? 1200;

  const buy = async (id: InventoryItemId) => {
    setError(null);
    setBusy(id);
    try {
      await purchaseShopItem(id, 1);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Achat impossible");
    } finally {
      setBusy(null);
    }
  };

  const balls = shopItems().filter((i) => i.category === "ball");
  const heals = shopItems().filter((i) => i.category === "heal");

  return (
    <GameShell active="more">
      <div className="page-shop">
        <header className="page-shop__head">
          <div>
            <h1>Boutique</h1>
            <p className="page-shop__sub">Objets pour le mode Histoire — consommables persistants</p>
          </div>
          <p className="page-shop__gold">🪙 {gold.toLocaleString("fr-FR")} or</p>
        </header>

        {error ? <p className="page-shop__error">{error}</p> : null}

        <section className="page-shop__section">
          <h2>Phantoballs</h2>
          <ul className="page-shop__grid">
            {balls.map((item) => (
              <ShopCard
                key={item.id}
                item={item}
                owned={inventory[item.id] ?? 0}
                disabled={gold < item.price || busy === item.id}
                busy={busy === item.id}
                onBuy={() => void buy(item.id)}
              />
            ))}
          </ul>
        </section>

        <section className="page-shop__section">
          <h2>Soins</h2>
          <ul className="page-shop__grid">
            {heals.map((item) => (
              <ShopCard
                key={item.id}
                item={item}
                owned={inventory[item.id] ?? 0}
                disabled={gold < item.price || busy === item.id}
                busy={busy === item.id}
                onBuy={() => void buy(item.id)}
              />
            ))}
          </ul>
        </section>

        <p className="page-shop__hint">
          Les objets achetés vont dans ton <Link href="/inventory">inventaire</Link> et sont utilisables en combat histoire.
        </p>
      </div>
    </GameShell>
  );
}

function ShopCard({
  item,
  owned,
  disabled,
  busy,
  onBuy,
}: {
  item: (typeof INVENTORY_CATALOG)[InventoryItemId];
  owned: number;
  disabled: boolean;
  busy: boolean;
  onBuy: () => void;
}) {
  return (
    <li className="shop-card">
      <span className="shop-card__emoji">{item.emoji}</span>
      <div className="shop-card__body">
        <h3>{item.name}</h3>
        <p>{item.description}</p>
        <p className="shop-card__owned">En stock : {owned}</p>
      </div>
      <button type="button" className="shop-card__buy" disabled={disabled} onClick={onBuy}>
        {busy ? "…" : `${item.price} 🪙`}
      </button>
    </li>
  );
}
