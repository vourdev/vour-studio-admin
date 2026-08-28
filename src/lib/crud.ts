import { eq, desc, asc, or, and, ilike, inArray, count } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import { db } from '@/db'
import * as schema from '@/db/schema'
import { getCurrentUser } from './get-current-user'
import { canRead, canWrite } from './permissions'
import { revalidateSite } from '@/hooks/revalidate-site'

function extractSubFields(slug: string, body: any) {
  const result: Record<string, any> = {}
  if (slug === 'products' && 'features' in body) {
    result.features = body.features
    delete body.features
  }
  if (slug === 'projects' && 'technology' in body) {
    result.technology = body.technology
    delete body.technology
  }
  if (slug === 'users') {
    if ('permissions' in body) {
      result.permissions = body.permissions
      delete body.permissions
    }
    if ('roles' in body) {
      result.roles = body.roles
      delete body.roles
    }
  }
  return Object.keys(result).length > 0 ? result : null
}

async function deleteSubFields(slug: string, parentIds: any[]) {
  if (slug === 'products') {
    await db.delete(schema.productsFeatures).where(inArray(schema.productsFeatures.parentId, parentIds))
  }
  if (slug === 'projects') {
    await db.delete(schema.projectsTechnology).where(inArray(schema.projectsTechnology.parentId, parentIds))
  }
  if (slug === 'users') {
    await db.delete(schema.usersPermissions).where(inArray(schema.usersPermissions.parentId, parentIds))
    await db.delete(schema.usersRoles).where(inArray(schema.usersRoles.parentId, parentIds))
  }
}

async function writeSubFields(slug: string, parentId: any, subFields: any) {
  await deleteSubFields(slug, [parentId])

  if (slug === 'products' && subFields.features) {
    const list = Array.isArray(subFields.features) ? subFields.features : []
    const values = list.map((item: any, index: number) => ({
      id: `${parentId}_feat_${index}_${Math.random().toString(36).substr(2, 4)}`,
      order: index + 1,
      parentId,
      feature: typeof item === 'object' ? item.feature : String(item),
    }))
    if (values.length > 0) {
      await db.insert(schema.productsFeatures).values(values)
    }
  }

  if (slug === 'projects' && subFields.technology) {
    const list = Array.isArray(subFields.technology) ? subFields.technology : []
    const values = list.map((item: any, index: number) => ({
      id: `${parentId}_tech_${index}_${Math.random().toString(36).substr(2, 4)}`,
      order: index + 1,
      parentId,
      technology: typeof item === 'object' ? item.technology : String(item),
    }))
    if (values.length > 0) {
      await db.insert(schema.projectsTechnology).values(values)
    }
  }

  if (slug === 'users') {
    if (subFields.permissions) {
      const list = Array.isArray(subFields.permissions) ? subFields.permissions : []
      const values = list.map((item: any, index: number) => ({
        id: `${parentId}_perm_${index}_${Math.random().toString(36).substr(2, 4)}`,
        order: index + 1,
        parentId,
        collection: item.collection,
        canRead: item.canRead,
        canWrite: item.canWrite,
      }))
      if (values.length > 0) {
        await db.insert(schema.usersPermissions).values(values)
      }
    }
    if (subFields.roles) {
      const list = Array.isArray(subFields.roles) ? subFields.roles : []
      const values = list.map((item: any, index: number) => ({
        order: index + 1,
        parentId,
        value: String(item),
      }))
      if (values.length > 0) {
        await db.insert(schema.usersRoles).values(values)
      }
    }
  }
}

export async function fetchFullDoc(slug: string, table: any, id: any) {
  const [doc] = await db.select().from(table).where(eq(table.id, id)).limit(1)
  if (!doc) return null

  const hydratedDoc = { ...doc } as any

  if ('status' in doc) {
    hydratedDoc._status = doc.status
  }

  if ('imageId' in doc) {
    hydratedDoc.image = null
    if (doc.imageId) {
      const [mediaDoc] = await db
        .select()
        .from(schema.media)
        .where(eq(schema.media.id, doc.imageId))
        .limit(1)
      if (mediaDoc) {
        hydratedDoc.image = {
          id: mediaDoc.id,
          alt: mediaDoc.alt,
          url: mediaDoc.url,
          filename: mediaDoc.filename,
          mimeType: mediaDoc.mimeType,
          filesize: mediaDoc.filesize,
          width: mediaDoc.width,
          height: mediaDoc.height,
          sizes: {
            card: {
              url: mediaDoc.sizesCardUrl,
              filename: mediaDoc.sizesCardFilename,
              width: mediaDoc.sizesCardWidth,
              height: mediaDoc.sizesCardHeight,
              mimeType: mediaDoc.sizesCardMimeType,
              filesize: mediaDoc.sizesCardFilesize,
            },
            og: {
              url: mediaDoc.sizesOgUrl,
              filename: mediaDoc.sizesOgFilename,
              width: mediaDoc.sizesOgWidth,
              height: mediaDoc.sizesOgHeight,
              mimeType: mediaDoc.sizesOgMimeType,
              filesize: mediaDoc.sizesOgFilesize,
            }
          }
        }
      }
    }
  }

  if (slug === 'products') {
    const features = await db
      .select()
      .from(schema.productsFeatures)
      .where(eq(schema.productsFeatures.parentId, id))
      .orderBy(asc(schema.productsFeatures.order))
    return { ...hydratedDoc, features }
  }

  if (slug === 'projects') {
    const technology = await db
      .select()
      .from(schema.projectsTechnology)
      .where(eq(schema.projectsTechnology.parentId, id))
      .orderBy(asc(schema.projectsTechnology.order))
    return { ...hydratedDoc, technology }
  }

  if (slug === 'users') {
    const permissions = await db
      .select()
      .from(schema.usersPermissions)
      .where(eq(schema.usersPermissions.parentId, id))
      .orderBy(asc(schema.usersPermissions.order))
    const roles = await db
      .select()
      .from(schema.usersRoles)
      .where(eq(schema.usersRoles.parentId, id))
      .orderBy(asc(schema.usersRoles.order))
    return {
      ...hydratedDoc,
      permissions: permissions.map((p) => ({
        collection: p.collection,
        canRead: p.canRead,
        canWrite: p.canWrite,
      })),
      roles: roles.map((r) => r.value),
    }
  }

  return hydratedDoc
}

export function createCrudHandlers(table: any, slug: string) {
  return {
    async GET(request: Request) {
      try {
        const user = await getCurrentUser()
        const isPublicRoute = ['products', 'projects', 'posts'].includes(slug)

        if (!user && !isPublicRoute) {
          return Response.json({ message: 'Unauthorized' }, { status: 401 })
        }
        if (user && !canRead(user, slug as any)) {
          return Response.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const page = Math.max(1, Number(searchParams.get('page') || '1'))
        const limit = Math.max(1, Number(searchParams.get('limit') || '10'))
        const sort = searchParams.get('sort')
        const whereParam = searchParams.get('where')

        let queryFilter: any = undefined
        if (whereParam) {
          try {
            const parsed = JSON.parse(whereParam)
            if (parsed.or && Array.isArray(parsed.or)) {
              const orConditions = parsed.or.map((cond: any) => {
                const key = Object.keys(cond)[0]
                const val = cond[key].contains
                return ilike(table[key], `%${val}%`)
              })
              queryFilter = or(...orConditions)
            } else if (parsed.id?.in) {
              queryFilter = inArray(table.id, parsed.id.in)
            }
          } catch {}
        }

        // Anonymous users can only see published posts
        if (slug === 'posts' && !user) {
          const publishedCondition = eq(table.status, 'published')
          queryFilter = queryFilter ? and(queryFilter, publishedCondition) : publishedCondition
        }

        let orderBy: any = undefined
        if (sort) {
          const isDesc = sort.startsWith('-')
          const fieldName = isDesc ? sort.substring(1) : sort
          const actualField = fieldName === '_status' ? 'status' : fieldName
          if (table[actualField]) {
            orderBy = isDesc ? desc(table[actualField]) : asc(table[actualField])
          }
        } else {
          if (table.createdAt) orderBy = desc(table.createdAt)
          else if (table.id) orderBy = asc(table.id)
        }

        const [records, [{ total }]] = await Promise.all([
          db
            .select()
            .from(table)
            .where(queryFilter)
            .orderBy(orderBy)
            .limit(limit)
            .offset((page - 1) * limit),
          db
            .select({ total: count() })
            .from(table)
            .where(queryFilter),
        ])

        // Hydrate each item with its related lists
        const hydratedDocs = await Promise.all(
          records.map((r) => fetchFullDoc(slug, table, r.id))
        )

        const totalPages = Math.ceil(total / limit)

        return Response.json({
          docs: hydratedDocs,
          totalDocs: total,
          totalPages,
          page,
          limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        })
      } catch (error) {
        return Response.json(
          { message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.' },
          { status: 500 }
        )
      }
    },

    async POST(request: Request) {
      try {
        const user = await getCurrentUser()
        if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })
        if (!canWrite(user, slug as any)) return Response.json({ message: 'Forbidden' }, { status: 403 })

        const body = await request.json()

        if ('password' in body) {
          if (body.password) {
            body.hash = bcrypt.hashSync(body.password, 10)
          }
          delete body.password
        }

        if ('image' in body) {
          body.imageId = body.image
          delete body.image
        }

        if ('_status' in body) {
          body.status = body._status
          delete body._status
        }

        const subFields = extractSubFields(slug, body)

        const [inserted] = (await db.insert(table).values(body).returning()) as any[]

        if (inserted && subFields) {
          await writeSubFields(slug, inserted.id, subFields)
        }

        if (slug === 'posts' || slug === 'products' || slug === 'projects') {
          await revalidateSite()
        }

        const finalDoc = await fetchFullDoc(slug, table, inserted.id)
        return Response.json(finalDoc)
      } catch (error) {
        return Response.json(
          { message: error instanceof Error ? error.message : 'Gagal membuat data.' },
          { status: 500 }
        )
      }
    },

    async DELETE(request: Request) {
      try {
        const user = await getCurrentUser()
        if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })
        if (!canWrite(user, slug as any)) return Response.json({ message: 'Forbidden' }, { status: 403 })

        const { searchParams } = new URL(request.url)
        const whereParam = searchParams.get('where')
        if (!whereParam) return Response.json({ message: 'Missing where query' }, { status: 400 })

        const parsed = JSON.parse(whereParam)
        const ids = parsed.id?.in
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
          return Response.json({ message: 'Invalid or empty IDs array' }, { status: 400 })
        }

        await deleteSubFields(slug, ids)
        await db.delete(table).where(inArray(table.id, ids))

        if (slug === 'posts' || slug === 'products' || slug === 'projects') {
          await revalidateSite()
        }

        return new Response(null, { status: 204 })
      } catch (error) {
        return Response.json(
          { message: error instanceof Error ? error.message : 'Gagal menghapus data.' },
          { status: 500 }
        )
      }
    },
  }
}

export function createIdCrudHandlers(table: any, slug: string) {
  return {
    async GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
      try {
        const user = await getCurrentUser()
        const isPublicRoute = ['products', 'projects', 'posts'].includes(slug)

        if (!user && !isPublicRoute) {
          return Response.json({ message: 'Unauthorized' }, { status: 401 })
        }
        if (user && !canRead(user, slug as any)) {
          return Response.json({ message: 'Forbidden' }, { status: 403 })
        }

        const { id } = await params
        const finalDoc = await fetchFullDoc(slug, table, isNaN(Number(id)) ? id : Number(id))
        if (!finalDoc) {
          return Response.json({ message: 'Data tidak ditemukan.' }, { status: 404 })
        }

        // Anonymous users cannot view draft posts
        if (slug === 'posts' && !user && finalDoc.status !== 'published') {
          return Response.json({ message: 'Unauthorized' }, { status: 401 })
        }

        return Response.json(finalDoc)
      } catch (error) {
        return Response.json({ message: 'Internal Server Error' }, { status: 500 })
      }
    },

    async PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
      try {
        const user = await getCurrentUser()
        if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        const docId = isNaN(Number(id)) ? id : Number(id)
        if (slug === 'users') {
          if (!user.roles.includes('admin') && user.id !== docId) {
            return Response.json({ message: 'Forbidden' }, { status: 403 })
          }
        } else {
          if (!canWrite(user, slug as any)) return Response.json({ message: 'Forbidden' }, { status: 403 })
        }

        const body = await request.json()

        if ('password' in body) {
          if (body.password) {
            body.hash = bcrypt.hashSync(body.password, 10)
          }
          delete body.password
        }

        if ('image' in body) {
          body.imageId = body.image
          delete body.image
        }

        if ('_status' in body) {
          body.status = body._status
          delete body._status
        }

        const subFields = extractSubFields(slug, body)

        delete body.createdAt
        delete body.updatedAt
        delete body.id

        await db.update(table).set(body).where(eq(table.id, docId))

        if (subFields) {
          await writeSubFields(slug, docId, subFields)
        }

        if (slug === 'posts' || slug === 'products' || slug === 'projects') {
          await revalidateSite()
        }

        const finalDoc = await fetchFullDoc(slug, table, docId)
        return Response.json(finalDoc)
      } catch (error) {
        return Response.json(
          { message: error instanceof Error ? error.message : 'Gagal memperbarui data.' },
          { status: 500 }
        )
      }
    },

    async DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
      try {
        const user = await getCurrentUser()
        if (!user) return Response.json({ message: 'Unauthorized' }, { status: 401 })
        if (!canWrite(user, slug as any)) return Response.json({ message: 'Forbidden' }, { status: 403 })

        const { id } = await params
        const docId = isNaN(Number(id)) ? id : Number(id)

        await deleteSubFields(slug, [docId])
        await db.delete(table).where(eq(table.id, docId))

        if (slug === 'posts' || slug === 'products' || slug === 'projects') {
          await revalidateSite()
        }

        return new Response(null, { status: 204 })
      } catch (error) {
        return Response.json(
          { message: error instanceof Error ? error.message : 'Gagal menghapus data.' },
          { status: 500 }
        )
      }
    },
  }
}
