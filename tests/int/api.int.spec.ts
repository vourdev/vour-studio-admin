import { describe, it, expect } from 'vitest'

import { db } from '@/db'
import { users } from '@/db/schema'

describe('API', () => {
  it('fetches users', async () => {
    const list = await db.select().from(users)
    expect(list).toBeDefined()
  })

  it('creates and fetches a project with technology subfields', async () => {
    const { projects, projectsTechnology } = await import('@/db/schema')
    const { fetchFullDoc } = await import('@/lib/crud')
    const { eq } = await import('drizzle-orm')

    const testSlug = `test-project-${Date.now()}`
    const [inserted] = await db
      .insert(projects)
      .values({
        name: 'Test Project',
        slug: testSlug,
        industry: 'Technology',
        year: '2026',
        result: 'Increased revenue by 50%',
        challenge: 'Legacy system overhaul',
        solution: 'Built with Next.js and Drizzle',
      })
      .returning()

    expect(inserted).toBeDefined()
    expect(inserted.id).toBeTypeOf('number')

    await db.insert(projectsTechnology).values([
      {
        id: `${inserted.id}_tech_0`,
        order: 1,
        parentId: inserted.id,
        tech: 'Next.js',
      },
      {
        id: `${inserted.id}_tech_1`,
        order: 2,
        parentId: inserted.id,
        tech: 'Tailwind CSS',
      },
    ])

    const fullDoc = (await fetchFullDoc('projects', projects, inserted.id)) as any
    expect(fullDoc).toBeDefined()
    expect(fullDoc.name).toBe('Test Project')
    expect(fullDoc.result).toBe('Increased revenue by 50%')
    expect(fullDoc.challenge).toBe('Legacy system overhaul')
    expect(fullDoc.solution).toBe('Built with Next.js and Drizzle')
    expect(fullDoc.technology).toHaveLength(2)
    expect(fullDoc.technology[0].tech).toBe('Next.js')

    // Cleanup
    await db.delete(projectsTechnology).where(eq(projectsTechnology.parentId, inserted.id))
    await db.delete(projects).where(eq(projects.id, inserted.id))
  })
})
