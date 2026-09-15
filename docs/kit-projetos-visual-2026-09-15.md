# Pré-requisitos e materiais: kit de execução

## Decisão de design

Manter as três áreas existentes. Nenhum painel lateral adicional, novo cadastro ou camada de navegação.

- Paleta canônica: branco `#FFFFFF`, superfície `#F7F8FA`, navy `#0A1F3B`, navy profundo `#02162A` e azul `#1E3A5F`. No código, apenas tokens existentes.
- Geist: 20px em títulos de seção, 17px nos nomes de material e requisitos, 15px em controles e explicações, 14px em ações auxiliares. Geist Mono apenas no conteúdo dos arquivos.
- Requisitos: lista de conferência com ícone por tipo e rótulo curto; cada condição completa abre no próprio item. Não há checkboxes porque a prontidão pertence a cada cliente, não ao catálogo de aprendizado.
- Modelos: uma coluna de arquivos com ler, copiar e baixar. Ferramentas em coluna auxiliar, empilhada no celular. Prompts reutilizam o mesmo componente de arquivo.
- Vidro no conjunto de requisitos e nos arquivos, superfície tranquila nas explicações. Sem círculos decorativos, cores novas ou animação de entrada.

```text
Antes de começar                Arquivos e ferramentas
┌ Requisitos ──────┐ Cuidados    ┌ Modelos / Prompts ──────┐ Ferramentas
│ Acesso         ⌄│             │ Nome       Copiar Baixar│ Nome → abrir
│ Dados          ⌄│             │ Nome       Copiar Baixar│ Papel no projeto
│ Responsável    ⌄│             └────────────────────────┘
└─────────────────┘             Documentos da entrega ⌄
Escopo e limites ⌄
```

Revisão antes de construir: descartada uma nova grade de cartões com ícones iguais e um checklist com conclusão global. Não há razão para multiplicar caixas ou simular que todos os clientes estão preparados ao consultar um projeto.

## Limites de implementação

- O texto administrado é a fonte de verdade. Rótulos editoriais só se aplicam a correspondências exatas conhecidas; texto novo ou alterado aparece integralmente.
- Requisitos completos, limites, cuidados, modelos e prompts não são removidos nem resumidos no download.
- Copiar e baixar operam apenas sobre o conteúdo exibido. Não consomem créditos, não usam IA nem alteram oportunidades, entregas ou progresso.
- Baixar entrega um `.txt` explícito, sem simular PDF, planilha ou aplicativo executável. UTF-8 mantém acentos; nomes de arquivo são normalizados.
- Clipboard negado mostra uma saída útil e permite repetir. A confirmação só aparece depois do sucesso. Conteúdo vazio não oferece botões sem efeito.
- Ferramentas conhecidas têm destinos oficiais explícitos, sem interpretar texto arbitrário como URL. Ausência de cadastro não é tratada como prova de que o projeto não depende de ferramentas.
- Componentes e tokens do design system vendorizado não são editados. Nenhuma dependência ou migração é adicionada.

## Verificações

- Unitários: preservação do conteúdo, fallback editorial, endereços e nomes seguros, cópia, permissão negada, estado pendente, leitura por teclado e conteúdo vazio.
- Matriz de navegador: Chromium, WebKit e Firefox, através do gate existente de acabamento.
- Download real e comparação byte a byte do texto; nenhuma submissão de formulário ou alteração de dados reais.
- Axe, teclado e alvos de 44px a 320px; layout a 390, 768, 1100 e 1440px; movimento reduzido.
- Validação visual local com a moldura real da plataforma. Resultados de CI e publicação devem ser registrados no PR; não são presumidos por este plano.

Limite: auditoria automatizada e emuladores não substituem uma sessão com VoiceOver nem testes em dispositivos físicos.
