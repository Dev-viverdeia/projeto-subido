import type { Artigo } from './contrato';

// Conteúdo inicial revisado contra as telas e ações atuais. A edição publicada no banco é a fonte em produção.
export const GUIAS_INICIAIS: Artigo[] = [
  {
    slug: 'entrar-na-conta',
    titulo: 'Entrar na sua conta',
    categoria: 'conta',
    resumo: 'Use o mesmo e-mail e a mesma forma de entrada escolhidos no cadastro.',
    passos: [
      'Abra a tela de entrada. Se você se cadastrou pelo Google, escolha entrar com o Google e selecione a mesma conta.',
      'Se usa e-mail e senha, confira o endereço antes de tentar novamente. Para redefinir a senha, use Esqueceu a senha na tela de entrada.',
      'Procure a mensagem de recuperação também em spam. Use o link mais recente recebido.',
    ],
    dica: 'Não consegue entrar? Abra um pedido em Ajuda → Problema de acesso. Nunca envie sua senha ou código de verificação ao suporte.',
    destino: '/conta',
    tags: 'login senha acesso google cadastro email recuperar',
  },
  {
    slug: 'saldo-e-creditos',
    titulo: 'Consultar saldo e uso de créditos',
    categoria: 'conta',
    resumo:
      'Seu saldo aparece próximo ao perfil. As operações pagas informam o custo antes da confirmação.',
    passos: [
      'Abra o saldo de créditos junto ao perfil ou acesse Conta → Créditos.',
      'Consulte o histórico para identificar o uso registrado.',
      'Se uma operação não terminou como esperado, informe ao suporte o horário e a funcionalidade. Não repita vários envios para tentar corrigir.',
    ],
    dica: 'O suporte não cobra créditos. Limites de uso da IA de ajuda protegem a disponibilidade do serviço e não alteram seu saldo.',
    destino: '/conta/creditos',
    tags: 'saldo moeda custo consumo creditos enriquecimento mentoria',
  },
  {
    slug: 'conectar-google-agenda',
    titulo: 'Conectar o Google Agenda',
    categoria: 'reunioes',
    resumo: 'Conecte a agenda da conta que deve organizar e enviar os convites das suas reuniões.',
    passos: [
      'Abra Minha conta e localize a integração com o Google Agenda.',
      'Escolha conectar e, na tela do Google, selecione a conta e revise as permissões solicitadas.',
      'Ao voltar ao Subido, confira se a integração aparece conectada antes de agendar uma reunião.',
    ],
    dica: 'Se o Google mostrar um bloqueio ou aviso de verificação, não considere a conexão concluída. Envie o texto ou um print ao suporte, sem códigos ou tokens. A aprovação do aplicativo pelo Google é independente do seu cadastro no Subido.',
    destino: '/conta',
    tags: 'calendar calendario agenda oauth autorizacao conectar sincronizar google',
  },
  {
    slug: 'agendar-reuniao',
    titulo: 'Agendar uma reunião com o cliente',
    categoria: 'reunioes',
    resumo:
      'A reunião fica ligada ao seu trabalho e o convite usa o link público da sala do Subido.',
    passos: [
      'Com o Google Agenda conectado, abra Reuniões ou a ficha do cliente em Vendas e escolha agendar.',
      'Confira data, horário, fuso e e-mail dos participantes antes de confirmar.',
      'Depois de agendar, confira o estado do convite. Copie o link da sala se precisar compartilhá-lo por outro canal.',
    ],
    dica: 'Reunião salva e convite enviado são estados diferentes. Se o envio falhar, confira a conexão da agenda e o aviso da reunião antes de criar outra.',
    destino: '/reunioes',
    tags: 'call convite invite sala horario link reuniao agendar fuso',
  },
  {
    slug: 'enriquecer-oportunidade',
    titulo: 'Enriquecer uma oportunidade',
    categoria: 'vendas',
    resumo:
      'O enriquecimento usa as informações já cadastradas na ficha para pesquisar a empresa e ajudar a preparar a abordagem.',
    passos: [
      'Abra Vendas e selecione a ficha do cliente. Confira os dados de identificação e o site, quando disponível.',
      'Escolha Enriquecer oportunidade e revise o custo em créditos antes de confirmar.',
      'Acompanhe o processamento na ficha. Ao terminar, revise os dados, as fontes e as sugestões para a conversa.',
    ],
    dica: 'Hipóteses de projeto precisam ser validadas com o cliente. A pesquisa não garante encontrar todos os contatos ou decisores. Se travar, informe a ficha ao suporte sem iniciar várias tentativas.',
    destino: '/vendas',
    tags: 'enriquecimento lead pesquisar empresa dados loading travou',
  },
  {
    slug: 'criar-proposta-sem-reuniao',
    titulo: 'Criar uma proposta sem reunião',
    categoria: 'vendas',
    resumo:
      'Você pode preparar uma proposta a partir do que combinou por WhatsApp, pessoalmente ou em outro canal. Uma reunião na plataforma não é obrigatória.',
    passos: [
      'Abra a ficha do cliente em Vendas e escolha Criar proposta, ou comece pela seção Propostas.',
      'Preencha o que foi combinado: objetivo, escopo, prazo e investimento.',
      'Revise a prévia antes de compartilhar. Rascunhos e propostas enviadas ficam separados.',
    ],
    dica: 'A proposta deve refletir o que você realmente consegue entregar. Revise textos e valores antes do envio.',
    destino: '/propostas',
    tags: 'proposta rascunho enviada whatsapp offline sem call editar previa',
  },
  {
    slug: 'organizar-vendas',
    titulo: 'Organizar oportunidades no quadro de vendas',
    categoria: 'vendas',
    resumo: 'Mantenha em Vendas apenas as oportunidades em que pretende trabalhar.',
    passos: [
      'Abra Vendas e escolha uma oportunidade para consultar sua ficha.',
      'Registre a próxima ação e mova a oportunidade quando a negociação mudar de etapa.',
      'Use as ações da ficha ou do cartão para encerrar oportunidades que não seguirão e registrar o resultado da venda.',
    ],
    dica: 'Uma empresa encontrada em Prospecção ainda não representa uma venda. Leve para Vendas os contatos que vai trabalhar.',
    destino: '/vendas',
    tags: 'kanban crm ganho perdido arquivar desclassificar etapa lead',
  },
  {
    slug: 'aprender-e-implementar',
    titulo: 'Aprender a implementar um projeto',
    categoria: 'projetos',
    resumo:
      'Cada projeto reúne aprendizado, implementação e os pré-requisitos e materiais necessários.',
    passos: [
      'Abra Projetos e escolha o serviço que quer aprender a entregar.',
      'Comece pelo conteúdo de aprendizado e confira os pré-requisitos antes da implementação.',
      'Na implementação, avance pelas fases Entender, Preparar, Construir, Validar e Entregar. Consulte o material do passo em foco quando precisar.',
    ],
    dica: 'A plataforma orienta e organiza o trabalho. Você é responsável por implementar, testar e entregar o serviço ao cliente.',
    destino: '/solucoes',
    tags: 'nina curso projeto tutorial materiais requisitos construir aprender',
  },
  {
    slug: 'entrega-pontual-recorrente',
    titulo: 'Concluir uma entrega ou manter o acompanhamento',
    categoria: 'projetos',
    resumo:
      'Projetos pontuais podem ser concluídos. Serviços recorrentes continuam com acompanhamento após a entrega inicial.',
    passos: [
      'Abra Entregas e entre na sala do projeto do cliente.',
      'Revise tarefas e materiais. Quando usar o portal do cliente, confira as aprovações e pedidos de ajuste.',
      'Na gestão do serviço, escolha a conclusão pontual ou o acompanhamento recorrente, de acordo com o que foi contratado.',
    ],
    dica: 'Marcar uma tarefa como feita não substitui o aceite do cliente. Recorrência não gera cobrança automática nesta configuração.',
    destino: '/entregas',
    tags: 'recorrente concluido entregue aceite tarefa suporte projeto finalizar',
  },
  {
    slug: 'compartilhar-certificado',
    titulo: 'Compartilhar um certificado',
    categoria: 'projetos',
    resumo:
      'Certificados disponíveis na sua conta têm uma página pública para conferir e compartilhar a conclusão.',
    passos: [
      'Abra Certificados e selecione o certificado desejado.',
      'Confira nome e conteúdo antes de baixar ou compartilhar.',
      'Use a opção de LinkedIn ou copie o link público. No LinkedIn, revise os campos antes de publicar.',
    ],
    dica: 'Se o certificado não apareceu após a conclusão, confira os requisitos do conteúdo. Informe ao suporte o nome da formação ou projeto.',
    destino: '/certificados',
    tags: 'certificado linkedin diploma nome download compartilhar conclusao',
  },
  {
    slug: 'enviar-arquivos-sobral',
    titulo: 'Enviar arquivos e áudio ao Sobral AI',
    categoria: 'ia',
    resumo:
      'Use anexos para dar mais contexto à sua pergunta, como um documento, uma imagem ou um áudio.',
    passos: [
      'Abra Sobral AI e inicie uma conversa ou escolha uma do histórico.',
      'Use a opção de arquivo ou gravação. Confira se o envio terminou antes de mandar a pergunta.',
      'Diga o que precisa que seja analisado. Se ocorrer um erro, confira o formato e o limite exibidos na tela.',
    ],
    dica: 'Envie apenas materiais que você tem autorização para compartilhar. Nunca inclua senhas, tokens ou dados de clientes que não sejam necessários.',
    destino: '/consultor',
    tags: 'audio imagem pdf documento anexo upload gravar chat sobral ia',
  },
  {
    slug: 'pagina-ou-operacao-com-erro',
    titulo: 'Uma página ou operação não terminou',
    categoria: 'outros',
    resumo:
      'Antes de repetir a ação, confira se o resultado já foi salvo. Isso ajuda a evitar duplicações.',
    passos: [
      'Anote a funcionalidade e o horário aproximado. Se houver aviso, copie o texto ou faça uma captura.',
      'Se você estava editando, preserve o texto ainda não salvo antes de atualizar a página.',
      'Abra Pedir ajuda e descreva o que tentou fazer e o que apareceu. Compartilhe somente o contexto necessário.',
    ],
    dica: 'Nunca envie dados de acesso. O suporte pode investigar o problema sem pedir sua senha.',
    destino: '/suporte',
    tags: 'erro travado loading carregando branco lento falha pagina bug',
  },
].map((artigo) => ({
  ...artigo,
  categoria: artigo.categoria as Artigo['categoria'],
  publicado: true,
  atualizado_em: '2026-09-08T19:00:00Z',
}));

export const FAQ = [
  {
    pergunta: 'O suporte consome meus créditos?',
    resposta:
      'Não. Você pode consultar guias, usar a IA de ajuda e pedir atendimento sem consumir créditos.',
    guia: 'saldo-e-creditos',
  },
  {
    pergunta: 'Preciso fazer uma reunião para criar proposta?',
    resposta: 'Não. Você pode usar o que combinou por WhatsApp, presencialmente ou em outro canal.',
    guia: 'criar-proposta-sem-reuniao',
  },
  {
    pergunta: 'O enriquecimento encontra todos os dados da empresa?',
    resposta:
      'Não há garantia de encontrar todos os dados. Confira as fontes e valide as hipóteses com o cliente.',
    guia: 'enriquecer-oportunidade',
  },
  {
    pergunta: 'A plataforma implementa o projeto por mim?',
    resposta:
      'Ela orienta o passo a passo e organiza o trabalho. A implementação e a entrega do serviço são suas.',
    guia: 'aprender-e-implementar',
  },
  {
    pergunta: 'Consigo pedir ajuda sem entrar na conta?',
    resposta:
      'Sim. Use Problema de acesso na central. Enviaremos um link ao e-mail informado para confirmar e acompanhar o pedido.',
    guia: 'entrar-na-conta',
  },
  {
    pergunta: 'A IA substitui o atendimento da equipe?',
    resposta:
      'Não. Ela responde com base nos guias do Subido. Você pode pedir atendimento da equipe a qualquer momento.',
    guia: 'pagina-ou-operacao-com-erro',
  },
];
