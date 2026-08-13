# Subido

Sistema operacional do profissional que vende e implementa projetos de IA em empresas.

O produto organiza uma jornada contínua:

**aprender → prospectar → vender → entregar → evoluir**

CRM, Calls, Live Coach, propostas, projetos, Estúdio, formações, mentorias, certificados e Sobral
AI compartilham o mesmo contexto. A tela Início calcula uma prioridade factual e abre o registro
exato que precisa avançar.

## Stack

- Next.js 16, React 19 e TypeScript strict;
- Supabase com RLS;
- LiveKit para salas em tempo real;
- OpenAI para Sobral AI, Live Coach e diagnósticos;
- CSS Modules sobre o Design System oficial da Viver de IA;
- npm como único gerenciador de pacotes.

## Desenvolvimento local

1. Use Node 24.15 ou mais recente e npm 11.
2. Copie `.env.example` para `.env.local` e use as credenciais do ambiente autorizado.
3. Instale e execute:

```bash
npm install
npm run dev
```

O app abre em `http://localhost:3000`.

## Gates principais

```bash
npm run typecheck
npm run lint
npm run check:identidade
npm run check:fronteira
npm run check:ds-drift
npm run check:schema-edge
npm run format:check
npm test
npm run build
```

## Fontes de verdade

- `AGENTS.md`: convenções técnicas, produto e design system;
- `docs/PLANO_MESTRE_PRODUTO.md`: visão, arquitetura e ordem de construção;
- `src/lib/jornada/`: motor factual de etapa e próxima ação;
- `src/lib/consultor/`: contexto e orientação do Sobral AI;
- `supabase/migrations/`: histórico imutável do banco.

O Design System vendorizado em `src/design-system/via/` não recebe edições manuais. Alterações de
marca e produto ficam nas camadas próprias da aplicação.
