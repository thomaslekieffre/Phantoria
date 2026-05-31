"use client";

import {
  RUN_MAX_WAVES,
  getRunReward,
  type RunRewardDef,
  type RunShopOffer,
} from "@phantoria/game-core";
import { RunRelicsTray } from "@/components/run/run-relics-tray";

type WaveRewardPickerProps = {
  wave: number;
  runGold: number;
  choices: RunRewardDef[] | null;
  shopOffers: RunShopOffer[];
  freeRewardPicked: boolean;
  relicIds: readonly string[];
  onPickFree: (rewardId: string) => void;
  onBuy: (rewardId: string) => void;
  onContinue: () => void;
};

export function WaveRewardPicker({
  wave,
  runGold,
  choices,
  shopOffers,
  freeRewardPicked,
  relicIds,
  onPickFree,
  onBuy,
  onContinue,
}: WaveRewardPickerProps) {
  const isFinalReward = wave >= RUN_MAX_WAVES;

  return (
    <div className="battle__overlay battle__overlay--dim" role="dialog" aria-label="Entre deux vagues">
      <div className="wave-reward wave-reward--wide">
        <div className="wave-reward__head">
          <div>
            <p className="wave-reward__kicker">
              {isFinalReward ? `Vague ${wave} — boss final vaincu` : `Vague ${wave} cleared`}
            </p>
            <h2 className="wave-reward__title">
              {isFinalReward ? "Dernière étape du run" : "Récompense & boutique"}
            </h2>
          </div>
          <p className="wave-reward__gold" aria-label={`${runGold} euros`}>
            <span className="wave-reward__gold-label">Trésor</span>
            <span className="wave-reward__gold-val">{runGold} €</span>
          </p>
        </div>

        <RunRelicsTray relicIds={relicIds} variant="panel" />

        <section className="wave-reward__section" aria-label="Récompense gratuite">
          <h3 className="wave-reward__section-title">Gratuit — choisis 1 objet</h3>
          {freeRewardPicked ? (
            <p className="wave-reward__picked">Récompense gratuite récupérée.</p>
          ) : choices && choices.length > 0 ? (
            <div className="wave-reward__grid">
              {choices.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="wave-reward__card wave-reward__card--free"
                  onClick={() => onPickFree(r.id)}
                >
                  <span className="wave-reward__badge">Gratuit</span>
                  <span className="wave-reward__emoji" aria-hidden>
                    {r.emoji}
                  </span>
                  <span className="wave-reward__name">{r.name}</span>
                  <span className="wave-reward__desc">{r.description}</span>
                </button>
              ))}
            </div>
          ) : null}
        </section>

        <section className="wave-reward__section" aria-label="Boutique">
          <h3 className="wave-reward__section-title">Boutique</h3>
          {shopOffers.length === 0 ? (
            <p className="wave-reward__picked">Plus rien à vendre pour l&apos;instant.</p>
          ) : (
            <div className="wave-reward__grid wave-reward__grid--shop">
              {shopOffers.map((offer) => {
                const r = getRunReward(offer.rewardId);
                if (!r) return null;
                const canAfford = runGold >= offer.price;
                return (
                  <button
                    key={offer.rewardId}
                    type="button"
                    className={`wave-reward__card wave-reward__card--shop ${!canAfford ? "wave-reward__card--broke" : ""}`}
                    onClick={() => onBuy(offer.rewardId)}
                    disabled={!canAfford}
                  >
                    <span className="wave-reward__badge wave-reward__badge--price">{offer.price} €</span>
                    <span className="wave-reward__emoji" aria-hidden>
                      {r.emoji}
                    </span>
                    <span className="wave-reward__name">{r.name}</span>
                    <span className="wave-reward__desc">{r.description}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <button
          type="button"
          className="wave-reward__continue"
          onClick={onContinue}
          disabled={!freeRewardPicked}
        >
          {isFinalReward ? "Terminer le run" : "Continuer la run"}
        </button>
      </div>
    </div>
  );
}
