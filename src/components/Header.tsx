'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Activity, Users, FileText, UserCheck, RefreshCw, Bell, Settings, Loader2, Camera, Shield, User as UserIcon, LogOut } from 'lucide-react'
import { Logo } from './Logo'

interface HeaderProps {
  currentUser?: {
    id?: string
    name: string
    role: 'NUTRITIONIST' | 'CLIENT'
    avatarUrl?: string | null
    description?: string | null
  }
}

export function Header({ currentUser }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [isForcePassword, setIsForcePassword] = useState(false)

  // Profile State
  const [name, setName] = useState(currentUser?.name || '')
  const [description, setDescription] = useState(currentUser?.description || '')
  const [avatarUrl, setAvatarUrl] = useState(currentUser?.avatarUrl || '')
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [profileMessage, setProfileMessage] = useState('')

  // Password State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loadingPwd, setLoadingPwd] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

  const isNutri = currentUser?.role === 'NUTRITIONIST' || pathname.startsWith('/dashboard')

  // Check for force password on mount and fetch fresh profile
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const forcePwd = localStorage.getItem('forcePasswordChange')
      if (forcePwd === 'true') {
        setIsForcePassword(true)
        setActiveTab('security')
        setIsProfileOpen(true)
        localStorage.removeItem('forcePasswordChange')
      }
    }

    // Always fetch latest profile data to keep UI synced
    fetch('/api/auth/profile')
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setName(data.user.name)
          setDescription(data.user.description || '')
          setAvatarUrl(data.user.avatarUrl || '')
        }
      })
      .catch(console.error)
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingProfile(true)
    setProfileMessage('')
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description })
      })
      if (res.ok) {
        setProfileMessage('Perfil atualizado com sucesso!')
        router.refresh()
      } else {
        setProfileMessage('Erro ao atualizar perfil')
      }
    } catch (err) {
      setProfileMessage('Erro de conexão')
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingPwd(true)
    setPwdError('')
    setPwdSuccess('')

    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      
      if (res.ok) {
        setPwdSuccess('Senha alterada com sucesso!')
        setCurrentPassword('')
        setNewPassword('')
        setIsForcePassword(false)
        setTimeout(() => setIsProfileOpen(false), 2000)
      } else {
        setPwdError(data.error || 'Erro ao alterar senha')
      }
    } catch (err) {
      setPwdError('Erro de conexão')
    } finally {
      setLoadingPwd(false)
    }
  }

  const handleLogout = async () => {
    // Aqui você chamaria a API de logout que remove o cookie se existir, 
    // ou apenas redireciona para login onde o cookie é sobreescrito no próximo login
    router.push('/login')
  }

  return (
    <>
      <header className="bg-white border-b border-[var(--border-light)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <Link href={isNutri ? '/dashboard' : '/client'} className="group">
              <Logo width={100} height={32} />
            </Link>
          </div>

          {/* Center Nav Links - Only for Nutri */}
          {isNutri && (
            <nav className="hidden md:flex items-center space-x-1 bg-transparent p-1">
              <Link
                href="/dashboard"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname === '/dashboard' ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/clients"
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                  pathname.startsWith('/dashboard/clients') ? 'text-[var(--text-main)] font-bold' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Pacientes
              </Link>
            </nav>
          )}

          {/* Right User Actions */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center space-x-2 hover:bg-[var(--bg-main)] p-1.5 rounded-lg transition"
              title="Editar Perfil"
            >
              <div className="w-8 h-8 rounded-full bg-[var(--accent)] text-[var(--text-main)] font-semibold text-xs flex items-center justify-center overflow-hidden border border-[var(--border-light)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  name ? name.charAt(0).toUpperCase() : 'A'
                )}
              </div>
              <span className="text-xs font-medium text-[var(--text-main)] hidden lg:block">
                {name || 'Usuário'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 bg-[#262D31]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-[var(--surface)] border-b border-[var(--border-light)] p-5 flex items-center justify-between">
              <h3 className="font-bold text-lg text-[var(--text-main)]">Configurações da Conta</h3>
              {!isForcePassword && (
                <button onClick={() => setIsProfileOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text-main)]">
                  &times;
                </button>
              )}
            </div>

            {isForcePassword && (
              <div className="bg-[#FFF5F5] border-b border-[#FFD8D8] p-3 text-center text-xs text-[#D94949] font-medium">
                Por segurança, altere a senha provisória para continuar.
              </div>
            )}

            {/* Tabs */}
            <div className="flex border-b border-[var(--border-light)]">
              <button 
                onClick={() => setActiveTab('profile')}
                disabled={isForcePassword}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 ${activeTab === 'profile' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)] disabled:opacity-50'}`}
              >
                <UserIcon className="w-4 h-4" />
                <span>Perfil</span>
              </button>
              <button 
                onClick={() => setActiveTab('security')}
                className={`flex-1 py-3 text-xs font-semibold flex items-center justify-center space-x-2 ${activeTab === 'security' ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'}`}
              >
                <Shield className="w-4 h-4" />
                <span>Segurança</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto">
              {activeTab === 'profile' ? (
                <form onSubmit={handleUpdateProfile} className="space-y-5">
                  {profileMessage && (
                    <div className="text-xs text-[var(--secondary)] bg-[#F0F8F5] p-2 rounded">{profileMessage}</div>
                  )}
                  
                  <div className="flex flex-col items-center justify-center space-y-3 pb-4 border-b border-[var(--border-light)]">
                    <div className="w-20 h-20 rounded-full bg-[var(--bg-main)] border-2 border-[var(--border-light)] flex items-center justify-center text-[var(--text-muted)] relative overflow-hidden group">
                       {avatarUrl ? (
                         <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                       ) : (
                         <Camera className="w-8 h-8" />
                       )}
                       <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                          <span className="text-white text-[10px] font-bold uppercase tracking-wider">Alterar</span>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Nome Completo</label>
                      <input 
                        required 
                        type="text" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full text-sm p-2.5 rounded-lg border border-[var(--border-light)] focus:outline-none focus:border-[var(--primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Descrição / Biografia</label>
                      <textarea 
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        rows={3}
                        placeholder="Nutricionista esportiva..."
                        className="w-full text-sm p-2.5 rounded-lg border border-[var(--border-light)] focus:outline-none focus:border-[var(--primary)] resize-none" 
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button type="submit" disabled={loadingProfile} className="btn-primary w-full text-xs flex justify-center items-center space-x-2 py-3">
                      {loadingProfile && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>Salvar Perfil</span>
                    </button>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-light)]">
                    <button type="button" onClick={handleLogout} className="flex items-center justify-center space-x-2 w-full text-xs text-[#D94949] font-medium p-2 hover:bg-[#FFF5F5] rounded-lg transition">
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta</span>
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-5">
                  {pwdError && <div className="text-xs text-[#D94949] bg-[#FFF5F5] p-2 rounded">{pwdError}</div>}
                  {pwdSuccess && <div className="text-xs text-[var(--secondary)] bg-[#F0F8F5] p-2 rounded">{pwdSuccess}</div>}
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Senha Atual</label>
                      <input 
                        required 
                        type="password" 
                        value={currentPassword} 
                        onChange={e => setCurrentPassword(e.target.value)} 
                        className="w-full text-sm p-2.5 rounded-lg border border-[var(--border-light)] focus:outline-none focus:border-[var(--primary)]" 
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--text-muted)] block mb-1">Nova Senha</label>
                      <input 
                        required 
                        type="password" 
                        value={newPassword} 
                        onChange={e => setNewPassword(e.target.value)} 
                        minLength={6}
                        className="w-full text-sm p-2.5 rounded-lg border border-[var(--border-light)] focus:outline-none focus:border-[var(--primary)]" 
                      />
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button type="submit" disabled={loadingPwd} className="btn-primary w-full text-xs flex justify-center items-center space-x-2 py-3">
                      {loadingPwd && <Loader2 className="w-3 h-3 animate-spin" />}
                      <span>{isForcePassword ? 'Salvar e Continuar' : 'Atualizar Senha'}</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
