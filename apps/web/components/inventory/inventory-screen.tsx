"use client";

import Link from "next/link";
import { GameShell } from "@/components/layout/game-shell";
import { usePlayer } from "@/components/providers/player-provider";
import { INVENTORY_CATALOG, INVENTORY_ITEM_IDS, inventoryQty } from "@phantoria/game-core";
import "../shop/shop.css";

export function InventoryScreen() {
  const { inventory } = usePlayer();

  const rows = INVENTORY_ITEM_IDS.map((id) => ({
    def: INVENTORY_CATALOG[id],
    qty: inventoryQty(inventory, id),
  })).filter((r) => r.qty > 0);

  return (
    <GameShell active="more">
      <div className="page-inv">
        <h1>Inventaire</h1>
        <p className="page-inv__sub">Consommables emportés en combat histoire</p>

        {rows.length === 0 ? (
          <p className="page-inv__empty">Aucun objet — passe par la boutique.</p>
        ) : (
          <ul className="page-inv__grid">
            {rows.map(({ def, qty }) => (
              <li key={def.id} className="inv-row">
                <span className="inv-row__emoji">{def.emoji}</span>
                <span className="inv-row__name">{def.name}</span>
                <span className="inv-row__qty">×{qty}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="page-inv__actions">
          <Link href="/shop" className="page-inv__link">
            Boutique
          </Link>
          <Link href="/story" className="page-inv__link">
            Mode Histoire
          </Link>
        </div>
      </div>
    </GameShell>
  );
}
