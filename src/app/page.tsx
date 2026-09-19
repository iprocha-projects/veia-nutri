import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { Activity, ShieldCheck, Sparkles, UserCircle, BrainCircuit, LineChart } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-[var(--text-main)] overflow-x-hidden selection:bg-[var(--secondary)] selection:text-white">
      {/* Navbar Minimalista */}
      <nav className="w-full border-b border-[var(--border-light)] bg-[var(--surface)]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo width={120} height={38} />
          <Link
            href="/login"
            className="btn-primary text-sm tracking-wide shadow-none hover:-translate-y-0.5 transition-transform"
          >
            Acessar Plataforma
          </Link>
        </div>
      </nav>

      {/* Hero Section (Split-Screen / Visual Impact) */}
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-32 md:pb-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 relative z-10">
            <div className="inline-flex items-center space-x-2 bg-white border border-[var(--border-light)] px-3 py-1.5 rounded-full text-xs font-semibold text-[var(--primary)] uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>O Fim da Planilha</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--text-main)] leading-[1.1] font-['var(--font-plus-jakarta)']">
              Sua consulta termina.<br />
              <span className="text-[var(--primary)]">O acompanhamento continua.</span>
            </h1>
            
            <p className="text-lg text-[var(--text-muted)] max-w-lg leading-relaxed">
              Plataforma premium para nutricionistas acompanharem a evolução de seus pacientes através de IA, diários fluidos e dados em tempo real.
            </p>
            
            <div className="pt-4">
              <Link
                href="/login"
                className="btn-primary inline-flex items-center space-x-3 text-base px-8 py-4 w-full sm:w-auto justify-center hover:scale-[1.02] transition-transform"
              >
                <UserCircle className="w-5 h-5" />
                <span>Começar Agora</span>
              </Link>
            </div>
          </div>
          
          <div className="relative w-full h-[500px] rounded-2xl bg-gradient-to-br from-[#EAEFEF] to-[#F9F9F7] border border-[var(--border-light)] overflow-hidden flex items-center justify-center p-8 group">
            {/* Pattern de fundo */}
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(var(--primary)_1px,transparent_1px)] [background-size:16px_16px]"></div>
            
            {/* Mockup Abstrato */}
            <div className="relative w-full max-w-sm bg-white rounded-xl border border-[var(--border-light)] p-6 space-y-6 shadow-2xl transition-transform duration-700 group-hover:scale-105">
              <div className="flex items-center justify-between border-b border-[var(--border-light)] pb-4">
                <div className="space-y-1">
                  <div className="h-4 w-24 bg-[var(--bg-main)] rounded"></div>
                  <div className="h-3 w-16 bg-[var(--border-light)] rounded"></div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[var(--secondary)]"></div>
              </div>
              <div className="space-y-3">
                <div className="h-3 w-full bg-[var(--bg-main)] rounded"></div>
                <div className="h-3 w-4/5 bg-[var(--bg-main)] rounded"></div>
                <div className="h-3 w-5/6 bg-[var(--bg-main)] rounded"></div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[var(--border-light)]">
                <div className="h-16 bg-[var(--bg-main)] rounded-lg"></div>
                <div className="h-16 bg-[var(--bg-main)] rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* A Surpresa: Ticker Marquee Contínuo */}
      <section className="w-full bg-white border-y border-[var(--border-light)] py-6 overflow-hidden flex items-center">
        <div className="flex w-max animate-[marquee_20s_linear_infinite] items-center">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-12 px-6">
              <span className="text-[var(--text-muted)] font-semibold uppercase tracking-widest text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Gestão Inteligente</span>
              </span>
              <span className="text-[var(--text-muted)] font-semibold uppercase tracking-widest text-sm flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Privacidade Absoluta</span>
              </span>
              <span className="text-[var(--text-muted)] font-semibold uppercase tracking-widest text-sm flex items-center space-x-2">
                <BrainCircuit className="w-4 h-4" />
                <span>Análises por IA</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Bento Box Features */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-main)] font-['var(--font-plus-jakarta)'] tracking-tight">
            Tudo o que você precisa, onde você precisa.
          </h2>
          <p className="text-[var(--text-muted)]">
            A VEIA centraliza a gestão dos seus pacientes com ferramentas projetadas para fluidez e velocidade.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[minmax(250px,auto)]">
          {/* Box 1 - IA */}
          <div className="md:col-span-2 card-clinical p-8 flex flex-col justify-between group overflow-hidden relative">
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-[var(--secondary)]/10 rounded-full blur-3xl group-hover:bg-[var(--secondary)]/20 transition-all"></div>
            <div className="space-y-4 relative z-10">
              <div className="w-12 h-12 bg-white rounded-lg border border-[var(--border-light)] flex items-center justify-center text-[var(--primary)] mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)]">Resumos Gerados por IA</h3>
              <p className="text-[var(--text-muted)] max-w-md">
                Nossa inteligência artificial analisa os diários e sintomas do paciente da última semana e entrega um prontuário sintético para você ler antes da consulta.
              </p>
            </div>
          </div>

          {/* Box 2 - Diário */}
          <div className="md:col-span-1 card-clinical p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white rounded-lg border border-[var(--border-light)] flex items-center justify-center text-[var(--primary)] mb-6">
                <Activity className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[var(--text-main)]">Diário Fluido</h3>
              <p className="text-sm text-[var(--text-muted)]">
                Pacientes registram refeições e sintomas com poucos toques na interface mobile.
              </p>
            </div>
          </div>

          {/* Box 3 - Progressão */}
          <div className="md:col-span-1 card-clinical p-8 flex flex-col justify-between bg-[var(--primary)] border-none">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center text-white mb-6">
                <LineChart className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Gráficos Elegantes</h3>
              <p className="text-sm text-[#D1DFE8]">
                Acompanhe medidas e peso de forma visual e direta.
              </p>
            </div>
          </div>

          {/* Box 4 - Multi-tenant */}
          <div className="md:col-span-2 card-clinical p-8 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-white rounded-lg border border-[var(--border-light)] flex items-center justify-center text-[var(--primary)] mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-main)]">Isolamento de Contas</h3>
              <p className="text-[var(--text-muted)] max-w-md">
                Arquitetura SaaS sólida. Seus pacientes só veem o que importa para eles, e você tem controle absoluto da sua carteira profissional.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA (Brutal Contrast) */}
      <section className="w-full bg-[var(--text-main)] py-24 md:py-32 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white font-['var(--font-plus-jakarta)'] tracking-tight">
            Pronto para evoluir seu acompanhamento?
          </h2>
          <p className="text-[#A0ABB2] text-lg max-w-xl mx-auto">
            Abandone o WhatsApp e as planilhas. Ofereça uma experiência premium para seus pacientes.
          </p>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-white text-[var(--text-main)] font-bold text-lg px-10 py-4 rounded-md hover:bg-[var(--bg-main)] transition-colors"
            >
              Acessar a Plataforma
            </Link>
          </div>
        </div>
      </section>

      {/* Footer Minimalista */}
      <footer className="w-full bg-[var(--surface)] border-t border-[var(--border-light)] py-8 text-center">
        <p className="text-[13px] font-medium text-[var(--text-muted)]">
          © {new Date().getFullYear()} VEIA - Todos os direitos reservados.
        </p>
      </footer>
    </div>
  )
}
