'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Activity, AlertCircle, Loader2 } from 'lucide-react'

import { Logo } from '@/components/Logo'

export default function LoginPage() {
 const router = useRouter()
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [loading, setLoading] = useState(false)
 const [error, setError] = useState('')

 const handleLogin = async (e: React.FormEvent) => {
 e.preventDefault()
 setLoading(true)
 setError('')

 try {
 const res = await fetch('/api/auth/login', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ email, password }),
 })

 const data = await res.json()

 if (res.ok && data.success) {
 // Se a senha for a padrão, avisamos o frontend para forçar a troca no primeiro login
 if (password === '123456') {
 localStorage.setItem('forcePasswordChange', 'true')
 }

 // Redirecionamento baseado no cargo
 if (data.user.role === 'ADMIN') {
 router.push('/admin')
 } else if (data.user.role === 'NUTRITIONIST') {
 router.push('/dashboard')
 } else {
 router.push('/client')
 }
 } else {
 setError(data.error || 'Falha no login')
 }
 } catch (err) {
 setError('Erro de conexão ao servidor.')
 } finally {
 setLoading(false)
 }
 }

 return (
 <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8">
 <div className="sm:mx-auto sm:w-full sm:max-w-md">
 <div className="flex justify-center mb-6">
 <Logo width={140} height={48} />
 </div>
 <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[var(--text-main)]">
 Acesse sua conta
 </h2>
 <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
 Bem-vindo de volta
 </p>
 </div>

 <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
 <div className="bg-[var(--surface)] py-8 px-4 sm:rounded-lg sm:px-10 border border-[var(--border-light)]">
 
 {error && (
 <div className="mb-6 bg-[#FFF5F5] border border-[#FFD8D8] text-[#D94949] p-3 rounded-lg text-sm flex items-center space-x-2">
 <AlertCircle className="w-4 h-4" />
 <span>{error}</span>
 </div>
 )}

 <form className="space-y-6" onSubmit={handleLogin}>
 <div>
 <label className="block text-xs font-semibold text-[#26343B]">
 Endereço de E-mail
 </label>
 <div className="mt-1">
 <input
 type="email"
 required
 value={email}
 onChange={(e) => setEmail(e.target.value)}
 className="block w-full appearance-none rounded-lg border border-[#E2E8EE] px-3 py-2.5 placeholder-gray-400 focus:border-[#7897A8] focus:outline-none focus:ring-1 focus:ring-[#7897A8] sm:text-sm"
 placeholder="exemplo@email.com"
 />
 </div>
 </div>

 <div>
 <label className="block text-xs font-semibold text-[#26343B]">
 Senha
 </label>
 <div className="mt-1">
 <input
 type="password"
 required
 value={password}
 onChange={(e) => setPassword(e.target.value)}
 className="block w-full appearance-none rounded-lg border border-[#E2E8EE] px-3 py-2.5 placeholder-gray-400 focus:border-[#7897A8] focus:outline-none focus:ring-1 focus:ring-[#7897A8] sm:text-sm"
 placeholder="••••••••"
 />
 </div>
 </div>

 <div>
 <button
 type="submit"
 disabled={loading}
 className="flex w-full justify-center items-center space-x-2 rounded-lg bg-[#7897A8] py-2.5 px-4 text-sm font-bold text-white hover:bg-[#6A8696] focus:outline-none focus:ring-2 focus:ring-[#7897A8] focus:ring-offset-2 disabled:opacity-50"
 >
 {loading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <span>Entrar na Plataforma</span>
 )}
 </button>
 </div>
 </form>

 <div className="mt-6 text-center">
 <Link href="/" className="text-xs text-[#71808A] hover:text-[#7897A8]">
 &larr; Voltar para a página inicial
 </Link>
 </div>
 </div>
 </div>
 </div>
 )
}
