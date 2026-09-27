export const CATEGORIES = [
  { id: "fabric", label: "Fabrics", unit: "yards" },
  { id: "beads", label: "Beads & Waist Beads", unit: "strands" },
  { id: "headwear", label: "Beaded Caps & Gele", unit: "pieces" },
  { id: "ready", label: "Ready to Wear", unit: "pieces" },
  { id: "accessories", label: "Accessories", unit: "pieces" },
] as const;
export const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;
