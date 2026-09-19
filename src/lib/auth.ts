import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.JWT_SECRET || 'nutri_mvo_super_secret_jwt_key_2026_prod'

export interface UserSession {
 userId: string
 email: string
 role: 'ADMIN' | 'NUTRITIONIST' | 'CLIENT'
 name: string
 professionalId?: string
 clientId?: string
}

export function signToken(payload: UserSession): string {
 return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): UserSession | null {
 try {
 return jwt.verify(token, JWT_SECRET) as UserSession
 } catch (error) {
 return null
 }
}

export async function getSession(): Promise<UserSession | null> {
 const cookieStore = await cookies()
 const token = cookieStore.get('nutrimvo_token')?.value
 if (!token) return null
 return verifyToken(token)
}
