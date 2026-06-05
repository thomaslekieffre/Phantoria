import { TRIBE_INFO, type Tribe } from "@phantoria/game-core";
import { tribeBgColor } from "@/lib/tribe-colors";

export function tribeDisplayLabel(tribe: string): string {
  return TRIBE_INFO[tribe as Tribe]?.label ?? tribe;
}

export function defaultHueForTribe(tribe: string): string {
  return tribeBgColor(tribeDisplayLabel(tribe));
}
