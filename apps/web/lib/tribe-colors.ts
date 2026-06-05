/** Fond carte / fiche — une teinte par tribu (libellé FR du catalogue). */
const TRIBE_BG: Record<string, string> = {
  Vaillants: "#b91c1c",
  Bienveillants: "#15803d",
  Mystérieux: "#6d28d9",
  Costauds: "#78716c",
  Mignons: "#db2777",
  Sombres: "#312e81",
  Sinistres: "#4c1d95",
  Insaisissables: "#0284c7",
  Perfides: "#0d9488",
  Enma: "#ca8a04",
  Néants: "#334155",
};

export function tribeBgColor(tribe: string): string {
  return TRIBE_BG[tribe] ?? "#475569";
}
