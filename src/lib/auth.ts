import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

export interface UserSession {
  userId: string
  email: string
  role: 'ADMIN' | 'NUTRITIONIST' | 'CLIENT'
  name: string
  professionalId?: string
  clientId?: string
}

export function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is missing in production.')
    }
    return new TextEncoder().encode('veia_nutri_local_development_jwt_secret_key_32bytes_long')
  }
  return new TextEncoder().encode(secret)
}

export async function signToken(payload: UserSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJwtSecret())
}

export async function verifyToken(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    return payload as unknown as UserSession
  } catch {
    return null
  }
}

export async function getSession(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get('nutrimvo_token')?.value
  if (!token) return null
  return verifyToken(token)
}
