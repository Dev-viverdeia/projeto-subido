import type { ExemploProjeto } from './exemplo-projeto';

export const PROSPECCAO_SLUG = 'maquina-prospeccao-b2b';

/** Empresas, fontes e números abaixo são simulados. Não iniciam buscas nem contatos. */
export const exemplosPassosProspeccao = {
  'traduzir-icp': {
    tipo: 'analise',
    titulo: 'Quem entra nesta lista?',
    casos: [
      {
        nome: 'Com perfil',
        empresa: 'Rede Horizonte',
        criterios: [
          { rotulo: 'Segmento', dado: 'Odontologia · página de serviços', estado: 'confirmado' },
          {
            rotulo: 'Ao menos 3 unidades',
            dado: '4 unidades · página de endereços',
            estado: 'confirmado',
          },
          {
            rotulo: 'Canal de atendimento',
            dado: 'WhatsApp · página de contato',
            estado: 'confirmado',
          },
        ],
        decisao: 'Pesquisar esta conta',
        motivo: 'Atende aos filtros do exemplo. Isso ainda não confirma interesse em comprar IA.',
      },
      {
        nome: 'Fora do perfil',
        empresa: 'Consultório Aurora',
        criterios: [
          { rotulo: 'Segmento', dado: 'Odontologia · página de serviços', estado: 'confirmado' },
          {
            rotulo: 'Ao menos 3 unidades',
            dado: 'Unidade única · confirmado com a empresa',
            estado: 'nao_atende',
          },
          {
            rotulo: 'Canal de atendimento',
            dado: 'WhatsApp · página de contato',
            estado: 'confirmado',
          },
        ],
        decisao: 'Descartar deste lote',
        motivo:
          'Não atende ao número mínimo de unidades. Registrar o motivo, sem apagar o histórico.',
      },
      {
        nome: 'Dados incompletos',
        empresa: 'Clínica Caminho',
        criterios: [
          { rotulo: 'Segmento', dado: 'Odontologia · página de serviços', estado: 'confirmado' },
          {
            rotulo: 'Ao menos 3 unidades',
            dado: 'O site não informa o total',
            estado: 'desconhecido',
          },
          {
            rotulo: 'Canal de atendimento',
            dado: 'WhatsApp · página de contato',
            estado: 'confirmado',
          },
        ],
        decisao: 'Revisar antes de decidir',
        motivo: 'Dado ausente não prova falta de perfil. Confirmar as unidades em outra fonte.',
      },
    ],
    entrega: 'Filtros verificáveis, exclusões e exemplos de quem entra na lista.',
  },
  'definir-sinais-limites': {
    tipo: 'ficha',
    titulo: 'Fato recente não é intenção de compra',
    campos: [
      { rotulo: 'Sinal simulado', valor: 'A rede anunciou uma nova unidade.' },
      {
        rotulo: 'Fonte e validade',
        valor: 'Notícia no site · publicada há 10 dias · janela definida de 30 dias',
      },
      {
        rotulo: 'Hipótese a validar',
        valor: 'A expansão pode aumentar o volume de atendimento.',
        pendente: true,
      },
      {
        rotulo: 'Limite de contato',
        valor: 'Revisão humana, canal autorizado e respeito ao pedido de não receber mensagens.',
      },
    ],
    entrega: 'Sinais com fonte, prazo de validade e regras de contato.',
  },
  'modelar-conta': {
    tipo: 'fluxo',
    titulo: 'Duas fontes. Uma empresa.',
    etapas: [
      { titulo: 'Receber', detalhe: 'Comparar nome e domínio' },
      { titulo: 'Identificar', detalhe: 'Conferir CNPJ e unidade' },
      { titulo: 'Unir', detalhe: 'Guardar ambas as fontes' },
      { titulo: 'Revisar', detalhe: 'Manter um cadastro único' },
    ],
    desvio: {
      quando: 'Mesmo nome, identificadores diferentes',
      acao: 'Revisar as empresas e filiais. Não unir só pela semelhança do nome.',
    },
    entrega: 'Um cadastro sem duplicatas, com o histórico de cada fonte.',
  },
  'configurar-fontes-crm': {
    tipo: 'ficha',
    titulo: 'Cada fonte tem uma função',
    campos: [
      { rotulo: 'Empresa', valor: 'Fonte empresarial → identificação, domínio e região' },
      { rotulo: 'Pessoa', valor: 'Fonte profissional permitida → cargo e vínculo a confirmar' },
      { rotulo: 'Site público', valor: 'Serviços, unidades e canais → URL e data da coleta' },
      {
        rotulo: 'Antes de conectar',
        valor: 'Definir custo por fonte, limites e campos que chegam ao CRM de teste.',
        pendente: true,
      },
    ],
    entrega: 'Fontes testadas, custos conhecidos e campos mapeados para o CRM.',
  },
  'buscar-enriquecer': {
    tipo: 'fluxo',
    titulo: 'Da busca ao cadastro revisável',
    etapas: [
      { titulo: 'Buscar', detalhe: 'Redes odontológicas em SC' },
      { titulo: 'Deduplicar', detalhe: 'Uma conta por empresa' },
      { titulo: 'Enriquecer', detalhe: 'Unidades, canal e fontes' },
      { titulo: 'Revisar', detalhe: 'Confirmar perfil e lacunas' },
    ],
    desvio: {
      quando: 'O cargo do contato não foi encontrado',
      acao: 'Manter como desconhecido. Não inventar um decisor para completar a lista.',
    },
    entrega: 'Um lote pequeno com consulta, fontes, datas e custo registrados.',
  },
  'pontuar-briefar': {
    tipo: 'conversa',
    titulo: 'Do fato à primeira pergunta',
    rotulos: { entrada: 'O que a pesquisa trouxe', resposta: 'Rascunho para revisão' },
    cenarios: [
      {
        nome: 'Com sinal recente',
        entrada:
          'Rede Horizonte, fictícia: 4 unidades, WhatsApp público e nova unidade anunciada há 10 dias.',
        resposta:
          'Vi o anúncio da nova unidade. Como vocês distribuem os pedidos que chegam pelo WhatsApp entre as equipes?',
        decisao:
          'Validar o processo antes de oferecer um projeto. Revisar fonte, destinatário e canal antes de enviar.',
      },
      {
        nome: 'Sem sinal recente',
        entrada: 'O site confirma 4 unidades e WhatsApp. Não há notícia recente de expansão.',
        resposta: 'Como funciona o atendimento pelo WhatsApp entre as unidades hoje?',
        decisao:
          'Não inventar crescimento, demora ou perda de vendas para personalizar a mensagem.',
      },
      {
        nome: 'Contato recusado',
        entrada: 'A empresa já pediu para não receber novas mensagens.',
        resposta: 'Não preparar um novo contato para envio.',
        decisao:
          'Respeitar a recusa, registrar a restrição e retirar a conta da fila de abordagem.',
      },
    ],
    entrega:
      'Briefing com cálculo do score, fatos, lacunas e uma pergunta revisada. Nada é enviado aqui.',
  },
  'auditar-amostra': {
    tipo: 'ficha',
    titulo: 'Confira a qualidade, não só o volume',
    campos: [
      { rotulo: 'Amostra simulada', valor: '30 contas, entre prioridades altas, médias e baixas' },
      { rotulo: 'Cobertura do cargo', valor: '24 de 30 contas têm cargo informado → 80%' },
      { rotulo: 'Precisão do cargo', valor: '21 dos 24 cargos informados estão corretos → 87,5%' },
      {
        rotulo: 'Antes de ampliar',
        valor: 'Corrigir 3 cargos e revisar as 6 lacunas. Retestar os registros afetados.',
        pendente: true,
      },
    ],
    entrega: 'Auditoria por campo, custo por conta válida e correções verificadas.',
  },
  'testar-falhas': {
    tipo: 'conversa',
    titulo: 'Como o processo deve reagir',
    rotulos: { entrada: 'Falha simulada', resposta: 'Comportamento esperado' },
    cenarios: [
      {
        nome: 'Fonte indisponível',
        entrada: 'O provedor parou após processar 8 das 20 contas.',
        resposta: 'Preservar as 8 contas e sinalizar as 12 pendentes.',
        decisao: 'Retomar do ponto correto. Não mostrar o lote como concluído.',
      },
      {
        nome: 'Lote repetido',
        entrada: 'A mesma lista foi importada outra vez, com dados ainda válidos.',
        resposta: 'Reutilizar os registros válidos e não criar outra oportunidade.',
        decisao: 'Conferir identidade, validade e regras de cobrança antes de repetir a pesquisa.',
      },
      {
        nome: 'Fontes divergem',
        entrada: 'Uma fonte informa 3 unidades; outra informa 4.',
        resposta: 'Guardar ambos os valores e encaminhar para revisão.',
        decisao:
          'Abrir fontes e datas. Não sobrescrever o número nem recalcular a prioridade silenciosamente.',
      },
    ],
    entrega: 'Testes de falha, repetição e divergência com retomada verificada.',
  },
  'entregar-primeiro-lote': {
    tipo: 'fluxo',
    titulo: 'Só o que foi aceito chega ao CRM',
    etapas: [
      { titulo: 'Auditar', detalhe: 'Revisar 20 a 50 contas' },
      { titulo: 'Decidir', detalhe: 'Aceitar ou descartar com motivo' },
      { titulo: 'Organizar', detalhe: 'Definir responsável e tarefa' },
      { titulo: 'Entregar', detalhe: 'Enviar aprovadas ao CRM' },
    ],
    desvio: {
      quando: 'Enviar ao CRM não significa abordar',
      acao: 'A mensagem e o canal precisam de revisão humana. Não há disparo automático neste projeto.',
    },
    entrega: 'Primeiro lote aceito, com fontes, briefing e próxima ação ainda não executada.',
  },
  'documentar-rotina': {
    tipo: 'ficha',
    titulo: 'Uma rotina que o cliente consegue repetir',
    campos: [
      { rotulo: 'Buscar', valor: 'Reutilizar os filtros e limites de custo aprovados.' },
      { rotulo: 'Revisar', valor: 'Conferir dados vencidos, duplicatas e restrições de contato.' },
      { rotulo: 'Medir', valor: 'Acompanhar precisão, cobertura e custo por conta aceita.' },
      {
        rotulo: 'Combinar com o cliente',
        valor: 'Responsável, regra de pausa e data da próxima revisão.',
        pendente: true,
      },
    ],
    entrega: 'Manual testado pela equipe, com responsáveis e próxima revisão.',
  },
} satisfies Record<string, ExemploProjeto>;

const exemplosAulasProspeccao: Record<string, ExemploProjeto> = {
  'Transforme o ICP em evidência pesquisável': exemplosPassosProspeccao['traduzir-icp'],
  'Enriqueça sem perder origem, validade ou identidade': {
    tipo: 'ficha',
    titulo: 'Duas fontes, um dado a conferir',
    campos: [
      {
        rotulo: 'Registro simulado',
        valor: 'Rede Horizonte · mesmo identificador nas duas fontes',
      },
      { rotulo: 'Fonte A', valor: 'Diretório empresarial · 3 unidades · atualizado há 6 meses' },
      { rotulo: 'Fonte B', valor: 'Site da rede · 4 unidades · consultado hoje' },
      {
        rotulo: 'Decisão de revisão',
        valor: 'Confirmar no site quais unidades estão ativas. Preservar a divergência e as datas.',
        pendente: true,
      },
    ],
    entrega: 'Registro único com origem, data e motivo de escolha de cada valor.',
  },
  'Priorize, audite e entregue ao comercial': {
    tipo: 'ficha',
    titulo: 'Prioridade com a conta aberta',
    campos: [
      {
        rotulo: 'Perfil · pesos simulados',
        valor: 'Segmento confirmado: 3 + três ou mais unidades: 2 = 5 pontos',
      },
      {
        rotulo: 'Momento · separado do perfil',
        valor: 'Nova unidade dentro da janela definida: 1 ponto',
      },
      {
        rotulo: 'Ainda não confirmado',
        valor: 'Cargo do contato. Não soma ponto nem comprova falta de perfil.',
        pendente: true,
      },
      {
        rotulo: 'Decisão do comercial',
        valor: 'Revisar fontes e contato antes de aceitar a conta no CRM.',
      },
    ],
    entrega: 'Cinco scores recalculados por duas pessoas, com divergências revisadas.',
  },
};

export function exemploPassoProspeccao(slug: string, passoId: string): ExemploProjeto | null {
  if (slug !== PROSPECCAO_SLUG || !Object.hasOwn(exemplosPassosProspeccao, passoId)) return null;
  return exemplosPassosProspeccao[passoId as keyof typeof exemplosPassosProspeccao];
}
export function exemploAulaProspeccao(slug: string, titulo: string): ExemploProjeto | null {
  return slug === PROSPECCAO_SLUG && Object.hasOwn(exemplosAulasProspeccao, titulo)
    ? exemplosAulasProspeccao[titulo]!
    : null;
}
