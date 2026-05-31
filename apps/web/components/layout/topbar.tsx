import { IconCoin, IconCube, IconGem } from "@/components/ui/icons";

export function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar__spacer" aria-hidden />

      <div className="topbar__right">
        <div className="topbar__wallet">
          <span className="topbar__cur">
            <IconCoin className="topbar__cur-ico" />
            1 200
          </span>
          <span className="topbar__cur">
            <IconGem className="topbar__cur-ico" />
            35
          </span>
          <span className="topbar__cur">
            <IconCube className="topbar__cur-ico" />
            2
          </span>
        </div>
      </div>
    </header>
  );
}
