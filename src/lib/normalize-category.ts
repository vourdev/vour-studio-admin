export type PostCategory = 'Tutorial' | 'Case Study' | 'Dev Notes'

/**
 * Normalizes any category / pillar string from Topic Bank (e.g. 'trending', 'ai', 'tools')
 * to one of PostgreSQL's valid enum values: 'Tutorial' | 'Case Study' | 'Dev Notes'
 */
export function normalizeCategory(category?: string | null): PostCategory {
  if (!category) return 'Dev Notes'
  const normalized = category.trim().toLowerCase()

  if (
    normalized === 'tutorial' ||
    normalized.includes('tutorial') ||
    normalized.includes('how') ||
    normalized.includes('guide') ||
    normalized.includes('panduan') ||
    normalized.includes('tips') ||
    normalized.includes('step')
  ) {
    return 'Tutorial'
  }

  if (
    normalized === 'case study' ||
    normalized === 'case_study' ||
    normalized.includes('case') ||
    normalized.includes('studi') ||
    normalized.includes('project') ||
    normalized.includes('portfolio') ||
    normalized.includes('analisis')
  ) {
    return 'Case Study'
  }

  // Default fallback for 'trending', 'architecture', 'dev notes', 'general', etc.
  return 'Dev Notes'
}
