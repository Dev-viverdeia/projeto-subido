import type { FaqItem, Pillar, Plan, StatGroup, Testimonial } from './types';

/**
 * TODO(conteúdo) — o que ainda precisa vir de vocês antes do tráfego pago ligar:
 *   · números reais da plataforma (marcados como [N] abaixo)
 *   · preços dos três planos
 *   · data prevista do HUB
 *   · depoimentos reais OU autorização para usar os da Comunidade Subido, rotulados
 *   · VSL, retratos e screenshots dos pilares
 */

export const HERO = {
  eyebrow: 'Comunidade Subido de Tráfego',
  scrollHint: 'Role para ver',
  /** Linhas AUTORAIS: a quebra é decisão de composição, não acaso de largura — e é o
   *  que torna o mask reveal determinístico. Dois tons sólidos fazem a hierarquia.
   *  Sem <em> aqui de propósito: itálico no elemento de LCP arrastaria a face
   *  itálica (+72 kB) para o caminho crítico por causa de uma palavra. */
  titleLines: [
    { text: 'As empresas já', tone: 'strong' as const },
    { text: 'decidiram usar IA.', tone: 'strong' as const },
    { text: 'Falta quem saiba', tone: 'soft' as const },
    { text: 'implementar.', tone: 'soft' as const },
  ],
  sub: 'A assinatura que forma implementadores de IA: soluções prontas com passo a passo, formações completas, um gerador que monta o projeto a partir da sua ideia e mentoria com quem já entregou.',
  ctaPrimary: { label: 'Entrar na assinatura', href: '#planos' },
  ctaSecondary: { label: 'Ver como funciona', href: '#pilares' },
  trust: ['Pagamento seguro', '7 dias de garantia', 'Acesso imediato'],
  videoCaption: 'Como funciona · 4 min',
} as const;

/**
 * A nota de fonte no fim desta seção não é rodapé jurídico — é o elemento mais
 * credível da página. Num mercado de números inflados, dizer de onde vem o número
 * é o que separa quem mede de quem promete.
 */
export const PROOF: StatGroup[] = [
  {
    source: 'Comunidade Subido',
    stats: [
      { value: '+50 mil', label: 'membros ativos' },
      { value: '8 anos', label: 'formando profissionais' },
      { value: '+R$ 400 mi', label: 'gerenciados em anúncios pelos alunos' },
    ],
  },
  {
    source: 'A plataforma',
    stats: [
      { value: '[N]', label: 'empresas com implementação entregue' },
      { value: '103', label: 'soluções publicadas' },
      { value: '[N]', label: 'implementações rodando em produção' },
    ],
  },
];

export const PROOF_NOTE =
  'Números informados pela Comunidade Subido de Tráfego · atualizados em [mês/ano].';

/**
 * Navegação do header.
 *
 * Só entram âncoras que correspondem a uma DECISÃO do leitor — o que é, para quem é,
 * quanto custa, e as dúvidas. Índice de navegação não é sumário: item demais
 * transforma a barra em ruído e dilui o CTA, que é o elemento que precisa ganhar.
 */
export const NAV = [
  { id: 'pilares', label: 'A assinatura' },
  { id: 'caminhos', label: 'Para quem é' },
  { id: 'hub', label: 'HUB' },
  { id: 'resultados', label: 'Resultados' },
  { id: 'quem-faz', label: 'Quem faz' },
  { id: 'perguntas', label: 'Perguntas' },
] as const;

/**
 * "Planos" NÃO entra no nav: o CTA já aponta para lá. Dois links para o mesmo destino
 * na mesma barra competem entre si e enfraquecem justamente o elemento que precisa
 * ganhar. O CTA é o caminho para o preço.
 */

/**
 * "Ver planos", não "Entrar na assinatura": o link rola para a seção de preços, e um
 * CTA que promete assinatura mas entrega uma tabela é uma mentira pequena. Também
 * cabe em 375px, onde o rótulo longo estourava a viewport.
 */
export const HEADER_CTA = { label: 'Ver planos', href: '#planos' } as const;

/**
 * Entrada de quem JÁ é assinante.
 *
 * Fica separada do CTA e com peso visual menor de propósito: a landing existe para
 * converter quem ainda não assinou. Um "Entrar" tão forte quanto o CTA rouba o clique
 * de quem chegou pelo anúncio — mas escondê-lo também é errado, porque assinante que
 * não acha o login vira ticket de suporte.
 */
export const HEADER_LOGIN = { label: 'Entrar', href: '/entrar' } as const;

export const PILLARS: Pillar[] = [
  {
    index: '01',
    slug: 'solucoes',
    name: 'Soluções',
    teaser: 'O que implementar, com o passo a passo pronto.',
    title: 'Soluções prontas, com o passo a passo de quem já implementou.',
    sub: 'Você não começa da página em branco. Escolhe uma solução, segue as etapas e termina com algo rodando.',
    facts: [
      '<strong>103</strong> soluções publicadas, novas todo mês',
      'Cada uma com vídeo, checklist, ferramentas e prompts',
      'Certificado ao concluir a implementação',
    ],
  },
  {
    index: '02',
    slug: 'formacoes',
    name: 'Formações',
    teaser: 'A base técnica, do conceito à entrega para cliente.',
    title: 'Do primeiro conceito à entrega para cliente.',
    sub: 'Trilhas completas em vídeo: curso, módulos, aulas, progresso e certificado. Feitas para quem vai implementar, não para quem vai comentar.',
    facts: [
      '<strong>[N]</strong> formações · <strong>[N]</strong> aulas',
      'Progresso salvo e retomada de onde parou',
      'Certificado por formação',
    ],
  },
  {
    index: '03',
    slug: 'builder',
    name: 'Builder',
    teaser: 'Descreva a ideia. Receba o projeto montado.',
    title: 'Descreva a ideia. Receba o projeto.',
    sub: 'O Builder avalia se a ideia se sustenta e, quando sim, monta a base de conhecimento, o framework, a arquitetura, o stack de ferramentas, o plano de ação e a estimativa de economia.',
    facts: [
      'Análise de viabilidade antes de qualquer linha',
      'Arquitetura e stack de ferramentas sugeridos',
      'Plano de ação e estimativa de economia',
    ],
  },
  {
    index: '04',
    slug: 'mentorias',
    name: 'Mentorias',
    teaser: 'Gente do outro lado quando você travar.',
    title: 'Quando travar, tem gente do outro lado.',
    sub: 'Encontros em grupo toda semana e sessões individuais por crédito, em sala de vídeo dentro da plataforma. Você chega com o problema real e sai com o próximo passo.',
    facts: [
      '<strong>[N]</strong> encontros em grupo por mês',
      'Sessão individual por crédito',
      'Gravações disponíveis depois',
    ],
  },
];

export const PATHS = {
  eyebrow: 'Para quem é',
  title: 'Duas formas de usar. Você escolhe a sua.',
  options: [
    {
      title: 'Implementar no seu próprio negócio',
      body: 'Você já tem empresa ou emprego e quer cortar custo e tempo com IA. Começa pelas Soluções, usa o Builder no seu próprio processo e leva as dúvidas para a mentoria.',
    },
    {
      title: 'Implementar para o mercado',
      body: 'Você quer prestar serviço de implementação de IA. Começa pelas Formações, acumula certificados e entra no HUB para ser encontrado por empresas.',
    },
  ],
  /** O desqualificador aumenta qualidade de lead e reduz reembolso. É também a frase
   *  mais VIA da página. */
  disqualifier:
    'Para quem não é: quem procura ganho rápido sem implementar nada. Aqui o resultado vem de entrega.',
} as const;

export const HUB = {
  pill: 'em construção',
  eyebrow: 'O destino',
  title: 'Formar é metade. A outra metade é ser encontrado.',
  body: 'O HUB é o diretório onde empresas procuram implementadores de IA certificados pela plataforma. É a mesma mecânica que o Contrate um Subido já opera há anos no tráfego pago — aplicada à implementação de IA.',
  timeline: [
    { label: 'Formação', status: 'Disponível hoje', done: true },
    { label: 'Certificação', status: 'Disponível hoje', done: true },
    { label: 'HUB', status: 'Previsto para [mês/ano]', done: false },
  ],
  criteria: 'Entram no HUB os assinantes com [N] soluções implementadas e certificado ativo.',
  /** Fica NA seção, não em rodapé nem tooltip. Num mercado saturado de "ganhe R$10k/mês
   *  em 30 dias", recusar-se a prometer renda é ativo de conversão. */
  disclaimer:
    'O HUB conecta empresas a implementadores certificados. Não vendemos vaga, contrato ou faturamento: a assinatura entrega formação, ferramentas, mentoria e vitrine.',
} as const;

export const TESTIMONIALS_META = {
  eyebrow: 'Resultados',
  title: 'O que os alunos entregaram.',
  /** Enquanto for prova emprestada, a origem fica DITA. Prova emprestada rotulada é
   *  honesta e converte; sem rótulo é a única coisa capaz de derrubar a credibilidade
   *  desta página, justamente porque todo o resto dela é construído sobre atribuição. */
  note: 'TODO(prova-social): substituir por depoimentos reais desta plataforma, ou renomear para "Depoimentos da Comunidade Subido de Tráfego" e rotular a origem.',
} as const;

export const COMPARISON = {
  eyebrow: 'Comparação',
  title: 'Por que não só fazer um curso.',
  columns: ['Curso avulso', 'Consultoria', 'Aprender sozinho', 'Esta assinatura'],
  rows: [
    { label: 'Conteúdo atualizado', values: [false, true, false, true] },
    { label: 'Passo a passo de implementação', values: [false, true, false, true] },
    { label: 'Ferramentas incluídas', values: [false, false, false, true] },
    { label: 'Mentoria com humano', values: [false, true, false, true] },
    { label: 'Certificado', values: [true, false, false, true] },
    { label: 'Vitrine para ser contratado', values: [false, false, false, true] },
  ],
} as const;

export const PRICING_META = {
  eyebrow: 'Planos',
  /** A teatralidade da revelação de preço, invertida. A secura é o argumento. */
  title: 'Quanto custa.',
  stackLead: 'Somando o que existe hoje no mercado separadamente:',
  stack: [
    { label: 'Formação em implementação de IA', value: 'R$ [X]' },
    { label: 'Biblioteca de soluções prontas', value: 'R$ [X]' },
    { label: 'Ferramenta de geração de projeto', value: 'R$ [X]/ano' },
    { label: 'Mentoria mensal', value: 'R$ [X]/ano' },
  ],
  stackTotal: 'R$ [X] por ano',
  reveal: 'Na assinatura, a partir de R$ [Y] por mês.',
} as const;

export const AUTHORITY = {
  eyebrow: 'Quem faz',
  title: 'Quem está construindo isso.',
  people: [
    {
      name: 'Pedro Sobral',
      role: 'Comunidade Subido de Tráfego',
      credentials: ['8 anos formando', '+50 mil membros', '+R$ 400 mi em anúncios'],
      /** Registro dele, não o nosso. A voz autoral da página é VIA; a citada é dele. */
      quote:
        'Eu passei oito anos ensinando gente a vender tráfego. O próximo serviço que as empresas vão comprar é implementação de IA — e quase ninguém tá pronto pra entregar.',
    },
    {
      name: '[Nome do responsável técnico]',
      role: 'Direção da plataforma',
      credentials: ['[N] implementações entregues', '103 soluções publicadas', '[N] empresas'],
      quote: '[TODO: citação sobre por que a plataforma existe e o que ela entrega.]',
    },
  ],
} as const;

export const FAQ_META = {
  eyebrow: 'Perguntas',
  title: 'O que costumam perguntar.',
} as const;

/** TODO(prova-social): MOCKADOS. Antes de qualquer real de mídia paga, trocar por
 *  depoimentos reais OU renomear a seção para "Depoimentos da Comunidade Subido de
 *  Tráfego" e rotular a origem. Prova emprestada rotulada é honesta e funciona; prova
 *  emprestada sem rótulo é a única coisa capaz de derrubar a credibilidade desta página,
 *  justamente porque todo o resto dela é construído sobre atribuição. */
export const TESTIMONIALS: Testimonial[] = [
  {
    name: '[Nome do aluno]',
    role: 'Implementador de IA',
    city: '[Cidade/UF]',
    timeframe: 'em [N] semanas',
    quote:
      '[Depoimento verbatim, no português do aluno — gíria e tudo. Nunca reescrever para a voz da marca.]',
    outcome: '[Resultado concreto com número]',
  },
  {
    name: '[Nome do aluno]',
    role: 'Sócio em agência',
    city: '[Cidade/UF]',
    timeframe: 'em [N] meses',
    quote: '[Depoimento verbatim]',
    outcome: '[Resultado concreto com número]',
  },
  {
    name: '[Nome do aluno]',
    role: 'Dono de negócio local',
    city: '[Cidade/UF]',
    timeframe: 'em [N] dias',
    quote: '[Depoimento verbatim]',
    outcome: '[Resultado concreto com número]',
  },
];

/**
 * TODO(preço): valores reais dos três tiers.
 *
 * DESTINO DOS CTAs (`ctaHref`) — hoje os três vão para a tela de login.
 * O acesso é por CONVITE gerado após a compra, no mesmo modelo da plataforma de
 * referência: não há auto-cadastro, então login é a única porta que existe. Quando o
 * checkout entrar, a URL de cada plano vem para cá — o componente não muda.
 *
 * TODO(contato): o Enterprise carrega o rótulo "Falar com o time" apontando para o
 * login, o que NÃO é o destino certo — falta o canal comercial (WhatsApp ou e-mail),
 * que também está pendente no rodapé. Rótulo e destino se reconciliam quando o canal
 * existir. É dívida conhecida, não descuido: melhor um destino que abre do que uma
 * âncora morta, mas os dois precisam casar antes de a página ir a tráfego pago.
 */
export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    pitch: 'Para começar a implementar e provar que funciona.',
    priceMonthly: null,
    features: [
      'Soluções com passo a passo',
      'Formações completas',
      'Builder com limite mensal',
      'Mentoria em grupo',
    ],
    cta: 'Assinar agora',
    ctaHref: '/entrar',
  },
  {
    id: 'pro',
    name: 'Pro',
    pitch: 'Para quem vai implementar para o mercado.',
    priceMonthly: null,
    features: [
      'Tudo do Starter',
      'Builder sem limite',
      'Mentoria individual por crédito',
      'Certificação e vitrine no HUB',
    ],
    cta: 'Assinar agora',
    ctaHref: '/entrar',
    featured: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    pitch: 'Para empresas formando ou contratando times.',
    priceMonthly: null,
    features: [
      'Tudo do Pro para o time inteiro',
      'Gestão de acessos e relatórios',
      'Acesso de contratante ao HUB',
      'Onboarding e suporte dedicados',
    ],
    cta: 'Falar com o time',
    ctaHref: '/entrar',
  },
];

export const GUARANTEE = {
  title: '7 dias para testar por dentro.',
  body: 'Assine, use tudo e, se não fizer sentido, peça o reembolso em até 7 dias. Sem formulário, sem entrevista de retenção.',
} as const;

/** As perguntas 5 e 11 são as que um comprador cético realmente tem — e as que uma
 *  página de hype desvia. Responder as duas com a verdade literal do acordo é o que
 *  dá autoridade ao resto. */
export const FAQ: FaqItem[] = [
  {
    q: 'Preciso saber programar?',
    a: 'Não. As soluções e o Builder são construídos para quem implementa com ferramentas no-code e IA. Saber programar ajuda, mas não é pré-requisito de nenhuma trilha.',
  },
  {
    q: 'Quanto tempo por semana isso exige?',
    a: 'As formações são em vídeo e ficam gravadas, então o ritmo é seu. Para concluir a primeira implementação, a maioria dedica algumas horas por semana.',
  },
  {
    q: 'Já uso ChatGPT no dia a dia. Isso é para mim?',
    a: 'Usar IA e implementar IA para um negócio são coisas diferentes. Aqui o foco é o segundo: mapear o processo, escolher a ferramenta, montar, testar e deixar rodando.',
  },
  {
    q: 'Como funciona a certificação?',
    a: 'Você recebe certificado ao concluir uma formação e ao concluir a implementação de uma solução. O certificado ativo é um dos critérios de entrada no HUB.',
  },
  {
    q: 'O HUB já está no ar?',
    a: 'Ainda não. Formação e certificação estão disponíveis hoje; o HUB está previsto para [mês/ano]. Ele conecta empresas a implementadores certificados — não vendemos vaga nem garantimos contrato.',
  },
  {
    q: 'As mentorias são ao vivo? Ficam gravadas?',
    a: 'Os encontros em grupo são ao vivo, em sala de vídeo dentro da plataforma, e ficam gravados. As sessões individuais são agendadas por crédito.',
  },
  {
    q: 'O Builder tem limite de uso?',
    a: 'No Starter há um limite mensal de gerações. No Pro e no Enterprise o uso é livre.',
  },
  {
    q: 'Serve para quem ainda não tem empresa nem clientes?',
    a: 'Serve. É o caminho "implementar para o mercado": você começa pelas formações, implementa os primeiros casos e acumula certificados antes de prospectar.',
  },
  {
    q: 'Como funcionam pagamento e nota fiscal?',
    a: '[TODO: meios de pagamento aceitos, parcelamento e emissão de nota fiscal.]',
  },
  {
    q: 'Como cancelo? E o reembolso?',
    a: 'O cancelamento é feito na própria plataforma e vale ao fim do ciclo. Nos primeiros 7 dias o reembolso é integral, sem formulário e sem entrevista de retenção.',
  },
  {
    q: 'O Pedro Sobral dá aula na plataforma?',
    a: '[TODO: descrever exatamente o papel do Pedro no produto — o que ele faz e o que não faz. Esta é uma das duas perguntas que um comprador cético realmente tem; responder com a verdade literal do acordo vale mais do que qualquer promessa.]',
  },
  {
    q: 'Qual a diferença para a Comunidade Subido de Tráfego?',
    a: '[TODO: delimitar os dois produtos. A Comunidade Subido é sobre tráfego pago; esta assinatura é sobre implementação de IA. Deixar claro se um inclui o outro.]',
  },
];

/**
 * Rodapé.
 *
 * Rodapé de produto pago não é enfeite: é onde mora a informação que a lei exige e a
 * que o comprador procura quando está decidindo. Três colunas resolvem os três
 * motivos de alguém chegar ao fim da página — navegar de volta, falar com alguém, e
 * conferir as regras.
 */
export const FOOTER = {
  tagline:
    'A assinatura que forma implementadores de IA. Soluções prontas, formações, gerador de projeto e mentoria.',
  colunas: [
    {
      titulo: 'Navegar',
      links: [
        { label: 'A assinatura', href: '#pilares' },
        { label: 'Para quem é', href: '#caminhos' },
        { label: 'HUB de implementadores', href: '#hub' },
        { label: 'Resultados', href: '#resultados' },
        { label: 'Planos', href: '#planos' },
        { label: 'Perguntas', href: '#perguntas' },
      ],
    },
    {
      titulo: 'Falar com a gente',
      links: [
        // TODO(contato): número e e-mail reais.
        { label: 'WhatsApp do suporte', href: 'https://wa.me/TODO', external: true },
        { label: 'suporte@[TODO].com.br', href: 'mailto:suporte@TODO', external: true },
        { label: 'Sou empresa e quero contratar', href: '#hub' },
      ],
    },
    {
      titulo: 'Legal',
      links: [
        { label: 'Termos de uso', href: '/termos' },
        { label: 'Política de privacidade', href: '/privacidade' },
        { label: 'Política de reembolso', href: '/reembolso' },
      ],
    },
  ],
  /** TODO(legal): obrigatórios para venda online no Brasil (CDC art. 33 e Decreto 7.962). */
  razaoSocial: '[Razão Social LTDA]',
  cnpj: 'CNPJ [00.000.000/0001-00]',
  endereco: '[Endereço completo — logradouro, nº, cidade/UF, CEP]',
} as const;

export const FINAL_CTA = {
  /** Linhas autorais, como no hero: é o mesmo momento — pedir a decisão. */
  titleLines: [
    { text: 'Comece pela primeira', tone: 'strong' as const },
    { text: 'implementação.', tone: 'soft' as const },
  ],
  cta: { label: 'Entrar na assinatura', href: '#planos' },
} as const;
