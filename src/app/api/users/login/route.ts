import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

import { db } from '@/db'
import { users, usersRoles, usersPermissions } from '@/db/schema'
import { signJWT } from '@/lib/auth-jwt'
import { isBcryptHash, verifyLegacyPassword } from '@/lib/legacy-password'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ message: 'Email dan password wajib diisi.' }, { status: 400 })
    }

    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (!userRecord || !userRecord.hash) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 })
    }

    let isValid: boolean

    if (isBcryptHash(userRecord.hash)) {
      isValid = bcrypt.compareSync(password, userRecord.hash)
    } else if (userRecord.salt) {
      // Account predates the Drizzle migration and still carries a Payload
      // PBKDF2 hash. Verify against the old scheme, then rewrite it as bcrypt
      // so each account converts on its owner's next login.
      isValid = await verifyLegacyPassword(password, userRecord.salt, userRecord.hash)

      if (isValid) {
        await db
          .update(users)
          .set({ hash: bcrypt.hashSync(password, 10), salt: null })
          .where(eq(users.id, userRecord.id))
      }
    } else {
      isValid = false
    }

    if (!isValid) {
      return NextResponse.json({ message: 'Email atau password salah.' }, { status: 401 })
    }

    const rolesRecords = await db
      .select()
      .from(usersRoles)
      .where(eq(usersRoles.parentId, userRecord.id))

    const permissionsRecords = await db
      .select()
      .from(usersPermissions)
      .where(eq(usersPermissions.parentId, userRecord.id))

    const user = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      roles: rolesRecords.map((r) => r.value as 'admin' | 'editor'),
      permissions: permissionsRecords.map((p) => ({
        collection: p.collection as any,
        canRead: p.canRead ?? true,
        canWrite: p.canWrite ?? false,
      })),
      createdAt: userRecord.createdAt.toISOString(),
      updatedAt: userRecord.updatedAt.toISOString(),
    }

    const token = await signJWT({
      id: user.id,
      email: user.email,
      collection: 'users',
    })

    const response = NextResponse.json({ user })
    response.cookies.set('payload-token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7200,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    })

    return response
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Terjadi kesalahan sistem.' },
      { status: 500 }
    )
  }
}
