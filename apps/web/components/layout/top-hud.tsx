import { IconCoin, IconGem, IconSoul } from "@/components/ui/icons";

export function TopHud() {
  return (
    <header className="hud safe-top">
      <div className="hud__profile">
        <div className="hud__avatar">T</div>
        <div className="hud__lvl">
          <span className="hud__lvl-num">12</span>
        </div>
      </div>
      <div className="hud__wallet">
        <span className="hud__pill">
          <IconCoin className="hud__ico" />
          <span>1,2k</span>
        </span>
        <span className="hud__pill">
          <IconSoul className="hud__ico" />
          <span>35</span>
        </span>
        <span className="hud__pill">
          <IconGem className="hud__ico" />
          <span>2</span>
        </span>
      </div>
    </header>
  );
}
