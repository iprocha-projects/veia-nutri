/**
 * Utility to compare meal plans with base templates to determine
 * if the client's current meal plan differs from the saved base template.
 */

export function normalizeMealsForComparison(mealsList: any[]): any[] {
  if (!Array.isArray(mealsList)) return []
  return mealsList
    .map((m) => ({
      name: (m.name || '').trim().toLowerCase(),
      time: (m.time || '').trim(),
      instructions: (m.instructions || '').trim(),
      items: Array.isArray(m.items)
        ? m.items
            .map((item: any) => ({
              foodName: (item.foodName || '').trim().toLowerCase(),
              quantity: parseFloat(item.quantity) || 0,
              unit: (item.unit || '').trim().toLowerCase(),
              notes: (item.notes || '').trim().toLowerCase(),
            }))
            .sort((a: any, b: any) => a.foodName.localeCompare(b.foodName))
        : [],
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.time.localeCompare(b.time))
}

export function areMealsDifferent(mealsA: any[], mealsB: any[]): boolean {
  const normA = normalizeMealsForComparison(mealsA)
  const normB = normalizeMealsForComparison(mealsB)
  return JSON.stringify(normA) !== JSON.stringify(normB)
}
