import { MeasurementUnit } from '@/generated/prisma/enums'

export const unitLabel: Record<MeasurementUnit, string> = {
  TSP: 'tsp',
  TBSP: 'tbsp',
  G: 'g',
  ML: 'ml',
  LITRE: 'litre',
  PINT: 'pint',
  OZ: 'oz',
  LB: 'lb',
}

// Units conventionally written flush against the number (25g, 100ml);
// everything else gets a space (1 tsp, 2 lb).
const NO_SPACE_UNITS = new Set<MeasurementUnit>(['G', 'ML'])

export function formatIngredientLine(ingredient: {
  name: string
  amount: number | null
  unit: MeasurementUnit | null
}): string {
  if (ingredient.amount == null) return ingredient.name

  const amountStr = String(ingredient.amount)
  if (!ingredient.unit) return `${amountStr} ${ingredient.name}`

  const joiner = NO_SPACE_UNITS.has(ingredient.unit) ? '' : ' '
  return `${amountStr}${joiner}${unitLabel[ingredient.unit]} ${ingredient.name}`
}
