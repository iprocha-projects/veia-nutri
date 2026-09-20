# VEIA Nutri — Plataforma de Gestão Nutricional Contínua

Plataforma premium para nutricionistas acompanharem a evolução de seus pacientes através de IA, diários alimentares fluidos e dados clínicos em tempo real.

---

## 🛠️ Stack Tecnológica

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router, Server Actions, Server Components)
- **Linguagem**: TypeScript 5
- **Estilização**: Tailwind CSS v4 + Lucide React
- **Banco de Dados**: PostgreSQL 16
- **ORM**: [Prisma ORM 6](https://www.prisma.io/) com geração de índices de alta performance
- **Autenticação**: Tokens JWT assinados com `jose` (compatível com Node.js e Edge Runtime)
- **Containerização**: Docker & Docker Compose

---

## 🚀 Como Executar

### 1. Clonar o repositório e instalar dependências

```bash
git clone https://github.com/iprocha-projects/veia-nutri.git
cd veia-nutri
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env`:

```bash
cp .env.example .env
```

Defina sua chave de segurança `JWT_SECRET`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nutrimvo?schema=public"
JWT_SECRET="sua_chave_jwt_super_segura_de_no_minimo_32_caracteres"
```

*(Opcional: configure `OPENAI_API_KEY` ou `GEMINI_API_KEY` para ativar a consolidação de resumos semanais com IA externa. Se omitidas, a plataforma utiliza o motor local inteligente de resumos).*

### 3. Subir o Banco de Dados com Docker

```bash
docker-compose up -d db
```

### 4. Sincronizar o Banco e Criar o Usuário Administrador

```bash
npx prisma db push
npm run db:seed
```

> **Credenciais Iniciais do Super Admin:**
> - **E-mail:** `admin@exemplo.com`
> - **Senha:** `123456` *(recomenda-se trocar a senha após o primeiro acesso)*

### 5. Iniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🏛️ Estrutura do Projeto

```
veia-nutri/
├── prisma/
│   ├── schema.prisma       # Schema com índices relacionais para alta escala
│   └── seed.ts             # Script seguro de inicialização de super admin (upsert)
├── public/
│   └── uploads/            # Armazenamento temporário de mídia (ignorado no Git)
├── src/
│   ├── app/
│   │   ├── admin/          # Painel Master Admin para gerenciar nutricionistas
│   │   ├── api/            # Rotas de API protegidas com isolamento multitenant
│   │   ├── client/         # Interface mobile/PWA para o paciente
│   │   ├── dashboard/      # Painel clínico do nutricionista
│   │   │   └── clients/[id]/components/ # Abas modulares (Visão Geral, Plano, etc.)
│   │   ├── login/          # Autenticação segura com redirecionamento por cargo
│   │   ├── globals.css     # Design tokens e utilitários da estética VEIA
│   │   ├── layout.tsx      # RootLayout com fontes otimizadas
│   │   └── page.tsx        # Landing page institucional
│   ├── components/         # Componentes compartilhados (Header, Logo)
│   ├── lib/
│   │   ├── ai-summary.ts   # Motor de síntese clínica semanal com fallback inteligente
│   │   ├── auth.ts         # Utilitários de sessão JWT com 'jose'
│   │   └── prisma.ts       # Singleton Prisma Client para Next.js
│   └── middleware.ts       # Proteção de rotas RBAC no Edge Runtime
├── docker-compose.yml      # Configuração para banco de dados e containerização
├── Dockerfile              # Imagem Docker multi-stage para produção
└── package.json            # Scripts de build, prisma e dependências otimizadas
```

---

## 🔒 Segurança e Melhores Práticas Implementadas

1. **Proteção Multitenant (Anti-IDOR)**:
   - Todas as rotas de dados clínicos (`/api/photos`, `/api/logs`, `/api/meal-plans`, `/api/measurements`, `/api/checkins`, `/api/ai-summary`) validam rigorosamente se o paciente pertence ao nutricionista autenticado.
2. **Prevenção de Perda de Dados em Produção**:
   - `seed.ts` utiliza `upsert` e não realiza comandos destrutivos (`deleteMany`) na inicialização do container.
3. **Validação de Uploads**:
   - Verificação de tipos MIME permitidos (`image/jpeg`, `image/png`, `image/webp`) e limite de tamanho de 10MB por arquivo.
4. **Token JWT Seguro**:
   - Assinatura via padrão HMAC SHA-256 (`jose`) com bloqueio de execução em produção caso `JWT_SECRET` não seja configurado.
