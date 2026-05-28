export const foodCatalogGroups = [
  { value: "verduras", label: "Verduras" },
  { value: "frutas", label: "Frutas" },
  { value: "cereales", label: "Cereales y tuberculos" },
  { value: "leguminosas", label: "Leguminosas" },
  { value: "aoa", label: "Alimentos de origen animal" },
  { value: "leche", label: "Leche" },
  { value: "grasas", label: "Aceites y grasas" },
  { value: "azucares", label: "Azucares" },
  { value: "libres-en-energia", label: "Libres en energia" }
];

export function getFoodCatalogGroupLabel(value: string) {
  return foodCatalogGroups.find((group) => group.value === value)?.label ?? value;
}

export function formatCatalogNumber(value?: number | null, suffix = "") {
  if (value === null || value === undefined) {
    return "ND";
  }

  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}${suffix}`;
}
