-- =============================================================================
-- PROJETOS GUIADOS
--
-- A antiga solução dizia o que construir. O projeto guiado também diz em que
-- ordem, qual ação executar, como saber que ela terminou e o que entregar ao
-- cliente. O roteiro é versionado como JSON porque a hierarquia editorial
-- (fase -> passos -> evidência) viaja inteira para a tela e muda em conjunto.
-- =============================================================================

create table public.projeto_roteiros (
  projeto_id uuid primary key references public.solucoes (id) on delete cascade,
  resultado text not null,
  cliente_ideal text not null,
  entregavel_final text not null,
  roteiro jsonb not null,
  versao integer not null default 1,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),

  constraint projeto_roteiros_resultado_tamanho
    check (char_length(resultado) between 20 and 500),
  constraint projeto_roteiros_cliente_tamanho
    check (char_length(cliente_ideal) between 20 and 600),
  constraint projeto_roteiros_entregavel_tamanho
    check (char_length(entregavel_final) between 20 and 500),
  constraint projeto_roteiros_roteiro_objeto
    check (jsonb_typeof(roteiro) = 'object'),
  constraint projeto_roteiros_roteiro_tamanho
    check (octet_length(roteiro::text) <= 200000),
  constraint projeto_roteiros_versao_positiva check (versao > 0)
);

comment on table public.projeto_roteiros is
  'Roteiro editorial versionado dos cinco Projetos: fases, passos e evidências de conclusão.';

create trigger projeto_roteiros_atualizado_em
  before update on public.projeto_roteiros
  for each row execute function private.tocar_atualizado_em();

alter table public.projeto_roteiros enable row level security;

create policy projeto_roteiros_select on public.projeto_roteiros
  for select to authenticated
  using (
    exists (
      select 1 from public.solucoes s
      where s.id = projeto_id
    )
  );
create policy projeto_roteiros_insert on public.projeto_roteiros
  for insert to authenticated with check (private.eh_admin());
create policy projeto_roteiros_update on public.projeto_roteiros
  for update to authenticated
  using (private.eh_admin()) with check (private.eh_admin());
create policy projeto_roteiros_delete on public.projeto_roteiros
  for delete to authenticated using (private.eh_admin());

revoke all on public.projeto_roteiros from anon;
revoke all on public.projeto_roteiros from authenticated;
grant select, insert, update, delete on public.projeto_roteiros to authenticated;

-- O produto começa com cinco Projetos deliberados. Os demais conteúdos ficam
-- arquivados: continuam recuperáveis no admin, mas não confundem a formação.
update public.solucoes
set status = 'arquivado'
where slug not in (
  'nina-plataforma-de-sdr-com-ia',
  'plataforma-de-atendimento-multi-agentes-com-ai',
  'central-financeira-gestao-de-contas-a-pagar-e-plano-orcamentario',
  'flow-crm-crm-plug-and-play',
  'socialmedia-ai-roteiros-e-analise-de-perfis-do-instagram'
);

update public.solucoes
set
  slug = case slug
    when 'plataforma-de-atendimento-multi-agentes-com-ai' then 'atendimento-com-ia-no-whatsapp'
    when 'nina-plataforma-de-sdr-com-ia' then 'qualificacao-de-leads-com-ia'
    when 'flow-crm-crm-plug-and-play' then 'crm-comercial-com-ia'
    when 'socialmedia-ai-roteiros-e-analise-de-perfis-do-instagram' then 'maquina-de-conteudo-com-ia'
    when 'central-financeira-gestao-de-contas-a-pagar-e-plano-orcamentario' then 'financeiro-sem-planilhas'
  end,
  titulo = case slug
    when 'plataforma-de-atendimento-multi-agentes-com-ai' then 'Atendimento com IA no WhatsApp'
    when 'nina-plataforma-de-sdr-com-ia' then 'Qualificação de Leads com IA'
    when 'flow-crm-crm-plug-and-play' then 'CRM Comercial com IA'
    when 'socialmedia-ai-roteiros-e-analise-de-perfis-do-instagram' then 'Máquina de Conteúdo com IA'
    when 'central-financeira-gestao-de-contas-a-pagar-e-plano-orcamentario' then 'Financeiro sem Planilhas'
  end,
  resumo = case slug
    when 'plataforma-de-atendimento-multi-agentes-com-ai' then 'Implemente um atendimento que responde dúvidas, coleta contexto e transfere a conversa para uma pessoa sem perder o histórico.'
    when 'nina-plataforma-de-sdr-com-ia' then 'Construa uma operação que recebe, enriquece e qualifica cada lead antes de encaminhar a oportunidade ao comercial.'
    when 'flow-crm-crm-plug-and-play' then 'Entregue um CRM que transforma conversas, atividades e próximas ações em uma jornada comercial acompanhável.'
    when 'socialmedia-ai-roteiros-e-analise-de-perfis-do-instagram' then 'Monte uma linha editorial que pesquisa referências, produz rascunhos e mantém aprovação humana antes de publicar.'
    when 'central-financeira-gestao-de-contas-a-pagar-e-plano-orcamentario' then 'Centralize contas, comprovantes, aprovações e orçamento em um fluxo auditável com leitura assistida por IA.'
  end,
  categoria = case slug
    when 'plataforma-de-atendimento-multi-agentes-com-ai' then 'Atendimento'
    when 'nina-plataforma-de-sdr-com-ia' then 'Leads'
    when 'flow-crm-crm-plug-and-play' then 'Vendas'
    when 'socialmedia-ai-roteiros-e-analise-de-perfis-do-instagram' then 'Marketing'
    when 'central-financeira-gestao-de-contas-a-pagar-e-plano-orcamentario' then 'Operações'
  end,
  ordem = case slug
    when 'plataforma-de-atendimento-multi-agentes-com-ai' then 1
    when 'nina-plataforma-de-sdr-com-ia' then 2
    when 'flow-crm-crm-plug-and-play' then 3
    when 'socialmedia-ai-roteiros-e-analise-de-perfis-do-instagram' then 4
    when 'central-financeira-gestao-de-contas-a-pagar-e-plano-orcamentario' then 5
  end,
  status = 'publicado',
  publicado_em = coalesce(publicado_em, now())
where slug in (
  'nina-plataforma-de-sdr-com-ia',
  'plataforma-de-atendimento-multi-agentes-com-ai',
  'central-financeira-gestao-de-contas-a-pagar-e-plano-orcamentario',
  'flow-crm-crm-plug-and-play',
  'socialmedia-ai-roteiros-e-analise-de-perfis-do-instagram'
);

delete from public.solucao_itens
where solucao_id in (
  select id from public.solucoes
  where slug in (
    'atendimento-com-ia-no-whatsapp',
    'qualificacao-de-leads-com-ia',
    'crm-comercial-com-ia',
    'maquina-de-conteudo-com-ia',
    'financeiro-sem-planilhas'
  )
);

insert into public.solucao_itens (solucao_id, tipo, ordem, titulo, conteudo)
select s.id, v.tipo, v.ordem, v.titulo, v.conteudo
from public.solucoes s
join (values
  ('atendimento-com-ia-no-whatsapp', 'etapa', 1, 'Entender o atendimento', 'Mapeie canais, volume, dúvidas, horários e limites antes de desenhar qualquer automação.'),
  ('atendimento-com-ia-no-whatsapp', 'etapa', 2, 'Preparar a operação', 'Organize acessos, base de conhecimento, regras de transferência e responsáveis humanos.'),
  ('atendimento-com-ia-no-whatsapp', 'etapa', 3, 'Construir o fluxo', 'Implemente entrada, classificação, resposta, memória e passagem para o atendente.'),
  ('atendimento-com-ia-no-whatsapp', 'etapa', 4, 'Validar em cenários reais', 'Teste perguntas comuns, exceções, dados sensíveis, indisponibilidade e retorno humano.'),
  ('atendimento-com-ia-no-whatsapp', 'etapa', 5, 'Entregar e acompanhar', 'Treine a equipe, publique com controle e entregue indicadores para a primeira revisão.'),
  ('atendimento-com-ia-no-whatsapp', 'ferramenta', 1, 'WhatsApp Business Cloud API', 'Canal oficial para receber e responder mensagens com rastreabilidade.'),
  ('atendimento-com-ia-no-whatsapp', 'ferramenta', 2, 'Supabase', 'Banco de conversas, contatos, base de conhecimento e eventos.'),
  ('atendimento-com-ia-no-whatsapp', 'ferramenta', 3, 'Claude Sonnet', 'Classificação de intenção, resposta contextual e resumo para transferência.'),
  ('atendimento-com-ia-no-whatsapp', 'prompt', 1, 'Agente de atendimento', 'Você atende em nome da empresa. Use somente a base fornecida, faça uma pergunta por vez, nunca invente política ou prazo e transfira para uma pessoa quando faltar informação, houver risco ou o cliente pedir.'),
  ('atendimento-com-ia-no-whatsapp', 'prompt', 2, 'Resumo para transferência', 'Resuma a conversa em: objetivo do cliente, dados já confirmados, tentativas realizadas, pendência e próxima ação esperada. Não inclua suposições.'),

  ('qualificacao-de-leads-com-ia', 'etapa', 1, 'Definir o lead certo', 'Transforme o perfil ideal e os sinais de compra em critérios que possam ser confirmados.'),
  ('qualificacao-de-leads-com-ia', 'etapa', 2, 'Preparar as entradas', 'Conecte formulários, campanhas e indicações sem criar contatos duplicados.'),
  ('qualificacao-de-leads-com-ia', 'etapa', 3, 'Construir a qualificação', 'Enriqueça o que for público, converse com o lead e calcule prioridade com rastreabilidade.'),
  ('qualificacao-de-leads-com-ia', 'etapa', 4, 'Validar o critério', 'Compare a pontuação com casos reais e corrija falsos positivos e falsos negativos.'),
  ('qualificacao-de-leads-com-ia', 'etapa', 5, 'Entregar ao comercial', 'Encaminhe contexto, motivo da prioridade e próxima ação para quem vai vender.'),
  ('qualificacao-de-leads-com-ia', 'ferramenta', 1, 'Supabase', 'Cadastro único de leads, sinais, histórico e regras de acesso.'),
  ('qualificacao-de-leads-com-ia', 'ferramenta', 2, 'Meta Lead Ads ou formulário próprio', 'Origem dos leads com identificador e consentimento preservados.'),
  ('qualificacao-de-leads-com-ia', 'ferramenta', 3, 'Claude Sonnet', 'Leitura dos sinais e geração de perguntas de qualificação.'),
  ('qualificacao-de-leads-com-ia', 'ferramenta', 4, 'Google Calendar', 'Agendamento da próxima conversa quando o lead estiver pronto.'),
  ('qualificacao-de-leads-com-ia', 'prompt', 1, 'Analista de qualificação', 'Classifique apenas com base nos critérios e fatos recebidos. Separe fato de hipótese, explique o motivo da pontuação e escreva a pergunta que confirma cada lacuna.'),
  ('qualificacao-de-leads-com-ia', 'prompt', 2, 'Preparação comercial', 'Gere um briefing curto com contexto, necessidade declarada, sinais encontrados, dúvidas abertas e melhor próxima ação. Não invente urgência nem orçamento.'),

  ('crm-comercial-com-ia', 'etapa', 1, 'Desenhar a jornada comercial', 'Mapeie etapas, critérios de passagem, responsáveis e fatos que precisam ficar registrados.'),
  ('crm-comercial-com-ia', 'etapa', 2, 'Preparar dados e acessos', 'Crie o modelo de empresas, contatos, oportunidades, atividades e permissões.'),
  ('crm-comercial-com-ia', 'etapa', 3, 'Construir o CRM factual', 'Implemente pipeline, linha do tempo, próximas ações e automações acionadas por eventos reais.'),
  ('crm-comercial-com-ia', 'etapa', 4, 'Validar a operação', 'Teste concorrência, permissões, importação, mobile e consistência dos indicadores.'),
  ('crm-comercial-com-ia', 'etapa', 5, 'Entregar e adotar', 'Migre um lote controlado, treine o time e acompanhe a primeira semana de uso.'),
  ('crm-comercial-com-ia', 'ferramenta', 1, 'Next.js', 'Interface do pipeline, ficha do lead e atividades comerciais.'),
  ('crm-comercial-com-ia', 'ferramenta', 2, 'Supabase', 'Banco relacional, autenticação, RLS e eventos do CRM.'),
  ('crm-comercial-com-ia', 'ferramenta', 3, 'Resend', 'E-mails transacionais disparados por ações explícitas.'),
  ('crm-comercial-com-ia', 'ferramenta', 4, 'Claude Sonnet', 'Resumo de histórico e recomendação de próxima ação com fontes.'),
  ('crm-comercial-com-ia', 'prompt', 1, 'Leitura da oportunidade', 'Leia apenas os eventos fornecidos. Liste fatos, riscos, lacunas e a próxima ação mais simples. Para cada recomendação, cite o evento que a sustenta.'),
  ('crm-comercial-com-ia', 'prompt', 2, 'Resumo de passagem', 'Prepare a passagem da oportunidade para outra pessoa com contexto, decisões, objeções, compromissos e pendências. Não transforme ausência de resposta em desinteresse.'),

  ('maquina-de-conteudo-com-ia', 'etapa', 1, 'Definir a tese editorial', 'Registre público, posicionamento, pilares, provas disponíveis e assuntos que a marca não aborda.'),
  ('maquina-de-conteudo-com-ia', 'etapa', 2, 'Preparar as referências', 'Organize fontes próprias, referências externas e uma base de voz aprovada.'),
  ('maquina-de-conteudo-com-ia', 'etapa', 3, 'Construir a linha de produção', 'Implemente pesquisa, pauta, rascunho, revisão factual, aprovação e calendário.'),
  ('maquina-de-conteudo-com-ia', 'etapa', 4, 'Validar voz e qualidade', 'Teste aderência à marca, originalidade, fontes, claims e adaptação por canal.'),
  ('maquina-de-conteudo-com-ia', 'etapa', 5, 'Entregar o calendário', 'Publique somente o aprovado e entregue processo, biblioteca e plano de trinta dias.'),
  ('maquina-de-conteudo-com-ia', 'ferramenta', 1, 'Supabase', 'Biblioteca de fontes, pautas, versões, aprovações e calendário.'),
  ('maquina-de-conteudo-com-ia', 'ferramenta', 2, 'Claude Sonnet', 'Síntese de fontes, pauta e rascunho conforme a voz da marca.'),
  ('maquina-de-conteudo-com-ia', 'ferramenta', 3, 'Transcrição de vídeo', 'Transformação de falas próprias em matéria-prima pesquisável.'),
  ('maquina-de-conteudo-com-ia', 'prompt', 1, 'Editor de pauta', 'Use as fontes fornecidas para propor pautas específicas. Para cada pauta, declare tese, evidência, formato e o que o leitor leva. Rejeite ideias sem prova ou consequência.'),
  ('maquina-de-conteudo-com-ia', 'prompt', 2, 'Revisor de marca', 'Compare o texto com a voz aprovada. Marque genericidade, afirmações sem fonte, repetição e trechos que parecem publicidade. Sugira mudanças sem apagar a opinião do autor.'),

  ('financeiro-sem-planilhas', 'etapa', 1, 'Mapear o fluxo financeiro', 'Desenhe entrada, conferência, aprovação, pagamento, baixa e fechamento com responsáveis.'),
  ('financeiro-sem-planilhas', 'etapa', 2, 'Preparar regras e dados', 'Defina categorias, centros de custo, alçadas, documentos obrigatórios e perfis de acesso.'),
  ('financeiro-sem-planilhas', 'etapa', 3, 'Construir a central', 'Implemente captura, extração assistida, aprovação, orçamento e trilha de auditoria.'),
  ('financeiro-sem-planilhas', 'etapa', 4, 'Validar números e segurança', 'Reconcilie cálculos, teste duplicidade, permissões, anexos e histórico de alterações.'),
  ('financeiro-sem-planilhas', 'etapa', 5, 'Entregar o fechamento', 'Migre saldos controlados, simule um fechamento e entregue manual e plano de contingência.'),
  ('financeiro-sem-planilhas', 'ferramenta', 1, 'Next.js', 'Central de contas, aprovações, orçamento e relatórios.'),
  ('financeiro-sem-planilhas', 'ferramenta', 2, 'Supabase', 'Banco financeiro, arquivos privados, permissões e auditoria.'),
  ('financeiro-sem-planilhas', 'ferramenta', 3, 'Claude Sonnet', 'Extração assistida e classificação que sempre exige confirmação humana.'),
  ('financeiro-sem-planilhas', 'prompt', 1, 'Leitor de documento financeiro', 'Extraia fornecedor, documento, vencimento, valor e categoria sugerida. Devolva null quando não houver evidência, marque divergências e nunca autorize pagamento.'),
  ('financeiro-sem-planilhas', 'prompt', 2, 'Analista de orçamento', 'Compare realizado e planejado por centro de custo. Mostre a conta, destaque variações e faça perguntas antes de sugerir qualquer ação.')
) as v(slug, tipo, ordem, titulo, conteudo)
  on v.slug = s.slug;

insert into public.projeto_roteiros (
  projeto_id, resultado, cliente_ideal, entregavel_final, roteiro, versao
)
select s.id, v.resultado, v.cliente_ideal, v.entregavel_final, v.roteiro, 1
from public.solucoes s
join (values
  (
    'atendimento-com-ia-no-whatsapp',
    'Um atendimento disponível o tempo todo, com respostas rastreáveis e transferência humana sem perda de contexto.',
    'Empresas que recebem volume recorrente no WhatsApp, repetem respostas e perdem conversas fora do horário ou nas trocas de atendente.',
    'Canal funcionando, base aprovada, fila humana, painel de conversas, suíte de testes e manual de operação.',
    $roteiro_atendimento${
      "fases": [
        {"id":"entender","titulo":"Entender","objetivo":"Transformar o atendimento atual em um mapa verificável antes de automatizar.","passos":[
          {"id":"mapear-demanda","titulo":"Medir a demanda real","acao":"Exporte sete dias de conversas. Conte entradas por hora, assuntos recorrentes, tempo até a primeira resposta e pontos em que o cliente abandona.","concluidoQuando":"A planilha tem volume por faixa de horário e os dez assuntos mais frequentes.","entregavel":"Mapa de demanda do atendimento."},
          {"id":"desenhar-limites","titulo":"Definir o que a IA não decide","acao":"Liste dados sensíveis, temas de risco, pedidos de cancelamento, negociação e qualquer situação que exige uma pessoa. Nomeie o responsável por cada transferência.","concluidoQuando":"Toda situação de risco tem gatilho, destino e prazo humano definidos.","entregavel":"Matriz de limites e escalonamento."}
        ]},
        {"id":"preparar","titulo":"Preparar","objetivo":"Organizar acessos, conhecimento e responsabilidades para a construção.","passos":[
          {"id":"configurar-canal","titulo":"Configurar o canal oficial","acao":"Valide a conta comercial, número, templates e webhook em ambiente de teste. Registre os identificadores e quem mantém o acesso.","concluidoQuando":"Uma mensagem de teste entra e uma resposta autorizada retorna pelo canal oficial.","entregavel":"Canal de teste conectado."},
          {"id":"montar-base","titulo":"Montar a base aprovada","acao":"Converta políticas, serviços, horários e perguntas frequentes em respostas curtas. Para cada resposta, registre a fonte e a data de revisão.","concluidoQuando":"As dez perguntas mais frequentes têm resposta e fonte aprovadas pelo cliente.","entregavel":"Base de conhecimento versionada."}
        ]},
        {"id":"construir","titulo":"Construir","objetivo":"Fazer a mensagem percorrer entrada, decisão, resposta e transferência.","passos":[
          {"id":"registrar-conversa","titulo":"Registrar contato e conversa","acao":"Ao receber a mensagem, localize ou crie o contato, abra a conversa e grave cada evento com horário e origem. Bloqueie duplicidade pelo identificador do canal.","concluidoQuando":"Reenviar o mesmo evento não duplica mensagem nem contato.","entregavel":"Entrada idempotente e histórico completo."},
          {"id":"responder-transferir","titulo":"Responder e transferir com contexto","acao":"Classifique a intenção, busque apenas trechos aprovados e gere a resposta. Quando houver gatilho de risco, pare a IA, crie a tarefa humana e anexe o resumo factual.","concluidoQuando":"O atendente recebe conversa, resumo e motivo da transferência no mesmo painel.","entregavel":"Agente com handoff humano."}
        ]},
        {"id":"validar","titulo":"Validar","objetivo":"Provar que o fluxo responde bem e falha de forma segura.","passos":[
          {"id":"rodar-cenarios","titulo":"Rodar vinte cenários","acao":"Teste perguntas simples, ambíguas, fora da base, com dado sensível, cliente irritado e canal indisponível. Registre resposta esperada e resultado real.","concluidoQuando":"Todos os cenários críticos transferem corretamente e nenhum inventa informação.","entregavel":"Relatório de testes com evidências."},
          {"id":"validar-operacao","titulo":"Validar a fila humana","acao":"Simule troca de turno, atendente offline e resposta simultânea. Confirme dono da conversa, notificações e retomada sem mensagens duplicadas.","concluidoQuando":"A equipe conclui três transferências sem ajuda do implementador.","entregavel":"Aceite operacional da equipe."}
        ]},
        {"id":"entregar","titulo":"Entregar","objetivo":"Colocar no ar com controle, responsáveis e revisão marcada.","passos":[
          {"id":"publicar-controlado","titulo":"Publicar para uma faixa controlada","acao":"Ative por horário ou origem limitada. Acompanhe conversas ao vivo e mantenha um interruptor documentado para voltar ao atendimento humano.","concluidoQuando":"O primeiro lote termina sem conversa órfã e com todos os eventos registrados.","entregavel":"Go-live controlado."},
          {"id":"entregar-manual","titulo":"Entregar operação e indicadores","acao":"Treine quem revisa a base, quem recebe transferências e quem acompanha qualidade. Agende a primeira revisão com volume, resolução, transferência e falhas.","concluidoQuando":"Responsáveis, rotina, indicadores e data da revisão estão registrados.","entregavel":"Manual e agenda de acompanhamento."}
        ]}
      ]
    }$roteiro_atendimento$::jsonb
  ),
  (
    'qualificacao-de-leads-com-ia',
    'Cada lead entra uma vez, ganha contexto verificável e chega ao comercial com prioridade e próxima ação explicadas.',
    'Operações que captam leads por mais de um canal, demoram para responder ou gastam o tempo comercial qualificando contatos sem perfil.',
    'Captação integrada, enriquecimento com fontes, critérios de qualificação, agenda e passagem completa para o comercial.',
    $roteiro_leads${
      "fases": [
        {"id":"entender","titulo":"Entender","objetivo":"Definir quem merece prioridade sem transformar opinião em pontuação.","passos":[
          {"id":"mapear-origens","titulo":"Mapear todas as origens","acao":"Liste formulário, campanha, indicação, evento e entrada manual. Para cada origem, registre campos disponíveis, consentimento e tempo atual de resposta.","concluidoQuando":"Nenhuma origem ativa ficou sem responsável e identificador.","entregavel":"Mapa de captação."},
          {"id":"definir-criterios","titulo":"Traduzir o perfil ideal em critérios","acao":"Escreva sinais confirmáveis de aderência, momento e capacidade de decisão. Separe critérios obrigatórios de sinais que apenas aumentam prioridade.","concluidoQuando":"O cliente consegue classificar cinco leads históricos usando a mesma regra.","entregavel":"Matriz de qualificação."}
        ]},
        {"id":"preparar","titulo":"Preparar","objetivo":"Criar a base única e as integrações que recebem o lead.","passos":[
          {"id":"modelar-lead","titulo":"Criar o cadastro único","acao":"Defina empresa, contato, oportunidade, origem, consentimento e eventos. Escolha chaves de deduplicação para e-mail, telefone e identificador externo.","concluidoQuando":"O mesmo lead vindo por duas origens termina em um contato e dois eventos.","entregavel":"Modelo de dados e regra de deduplicação."},
          {"id":"preparar-destino","titulo":"Preparar agenda e comercial","acao":"Confirme calendários, horários, responsável por região ou oferta e informação mínima que o vendedor precisa receber.","concluidoQuando":"Existe um destino válido para cada combinação de lead qualificado.","entregavel":"Matriz de roteamento."}
        ]},
        {"id":"construir","titulo":"Construir","objetivo":"Captar, enriquecer, conversar e encaminhar com rastreabilidade.","passos":[
          {"id":"captar-enriquecer","titulo":"Captar e enriquecer sem inventar","acao":"Receba o lead, deduplique e consulte somente fontes públicas autorizadas. Grave valor, origem, data e status de cada informação encontrada.","concluidoQuando":"Todo dado enriquecido mostra a fonte ou aparece explicitamente como hipótese.","entregavel":"Dossiê rastreável do lead."},
          {"id":"qualificar-encaminhar","titulo":"Qualificar e definir próxima ação","acao":"Faça uma pergunta por vez para preencher lacunas. Calcule a prioridade com os critérios aprovados e encaminhe agenda ou tarefa junto do motivo.","concluidoQuando":"O comercial recebe contexto, score explicado e próxima ação sem abrir outra ferramenta.","entregavel":"Fluxo de qualificação ativo."}
        ]},
        {"id":"validar","titulo":"Validar","objetivo":"Calibrar a regra contra casos que a empresa já conhece.","passos":[
          {"id":"comparar-historico","titulo":"Comparar com vinte leads históricos","acao":"Rode a regra em ganhos, perdas e leads descartados. Marque falsos positivos, falsos negativos e qual critério causou cada erro.","concluidoQuando":"A equipe concorda com a prioridade ou documenta a exceção para ajuste.","entregavel":"Relatório de calibração."},
          {"id":"testar-falhas","titulo":"Testar duplicidade e indisponibilidade","acao":"Repita webhooks, remova um campo, deixe a agenda offline e simule fonte pública indisponível. Confirme que o lead não some nem recebe dado inventado.","concluidoQuando":"Cada falha vira estado visível e ação de recuperação.","entregavel":"Suíte de falhas validada."}
        ]},
        {"id":"entregar","titulo":"Entregar","objetivo":"Colocar o fluxo em uso e dar ao comercial uma rotina simples.","passos":[
          {"id":"ativar-origem","titulo":"Ativar uma origem primeiro","acao":"Escolha o canal de maior controle, acompanhe as primeiras entradas e compare tempo de resposta e qualidade da passagem com o processo anterior.","concluidoQuando":"O lote inicial chega ao responsável correto sem duplicidade.","entregavel":"Primeira origem em produção."},
          {"id":"treinar-revisao","titulo":"Treinar revisão dos critérios","acao":"Mostre onde corrigir dado, ajustar critério e registrar resultado da oportunidade. Marque revisão após volume suficiente para comparar.","concluidoQuando":"Um responsável consegue explicar e alterar a regra sem o implementador.","entregavel":"Manual de qualificação e revisão."}
        ]}
      ]
    }$roteiro_leads$::jsonb
  ),
  (
    'crm-comercial-com-ia',
    'Um CRM que registra fatos da jornada, mostra a próxima ação e reduz a dependência da memória individual do vendedor.',
    'Times comerciais que trabalham com planilhas, mensagens dispersas ou CRMs preenchidos tarde demais para orientar a venda.',
    'Pipeline, fichas de empresa e contato, linha do tempo factual, automações, permissões, importação e manual de adoção.',
    $roteiro_crm${
      "fases": [
        {"id":"entender","titulo":"Entender","objetivo":"Desenhar o processo real antes de desenhar telas.","passos":[
          {"id":"mapear-jornada","titulo":"Mapear a jornada da oportunidade","acao":"Acompanhe uma venda do primeiro contato ao ganho ou perda. Registre etapas, decisões, responsáveis, documentos e canais usados.","concluidoQuando":"O mapa mostra o que faz uma oportunidade entrar e sair de cada etapa.","entregavel":"Mapa da jornada comercial."},
          {"id":"definir-fatos","titulo":"Definir o que vira fato","acao":"Liste eventos que precisam alimentar a linha do tempo: call, mensagem, proposta, mudança de etapa, compromisso e próxima ação. Defina origem e responsável.","concluidoQuando":"Cada indicador futuro aponta para os eventos que o sustentam.","entregavel":"Dicionário de eventos do CRM."}
        ]},
        {"id":"preparar","titulo":"Preparar","objetivo":"Organizar dados, permissões e migração antes da interface.","passos":[
          {"id":"modelar-dados","titulo":"Modelar empresas, contatos e oportunidades","acao":"Crie relações e restrições que impeçam contato de uma empresa aparecer na oportunidade de outra. Defina campos obrigatórios mínimos.","concluidoQuando":"O banco rejeita vínculos incoerentes e aceita mais de um contato por empresa.","entregavel":"Modelo relacional validado."},
          {"id":"preparar-acesso","titulo":"Preparar acesso e importação","acao":"Defina papéis, propriedade das linhas e visibilidade. Limpe uma amostra da planilha atual e documente regras de transformação.","concluidoQuando":"Um usuário não acessa dados fora do escopo e o lote de amostra importa sem órfãos.","entregavel":"Matriz de acesso e lote de migração."}
        ]},
        {"id":"construir","titulo":"Construir","objetivo":"Transformar o modelo em pipeline, contexto e próximas ações.","passos":[
          {"id":"construir-pipeline","titulo":"Construir o pipeline operacional","acao":"Implemente Kanban com critérios de etapa, busca, filtros e ação clara no card. Grave cada movimentação como evento, não apenas como estado final.","concluidoQuando":"Mover uma oportunidade atualiza a etapa e cria um evento com autor e horário.","entregavel":"Pipeline factual."},
          {"id":"conectar-contexto","titulo":"Conectar calls e próxima ação","acao":"Relacione reunião, transcrição e análise à oportunidade. Gere recomendações com fontes e permita que a pessoa aceite ou edite antes de salvar.","concluidoQuando":"A ficha mostra histórico, compromissos e uma próxima ação rastreável.","entregavel":"Ficha inteligente da oportunidade."}
        ]},
        {"id":"validar","titulo":"Validar","objetivo":"Garantir consistência antes de migrar a operação.","passos":[
          {"id":"testar-permissoes","titulo":"Testar acesso como cada papel","acao":"Execute leitura e escrita como vendedor, gestor e usuário anônimo. Teste URLs diretas, exportação e tentativa de trocar o dono da linha.","concluidoQuando":"As tentativas fora do escopo falham e os caminhos autorizados permanecem funcionais.","entregavel":"Matriz de testes de acesso."},
          {"id":"testar-rotina","titulo":"Simular um dia comercial","acao":"Crie lead, agende call, registre objeção, mova etapa, envie proposta e marque perda. Faça no desktop e no celular com duas pessoas.","concluidoQuando":"A linha do tempo explica toda a simulação sem consulta a mensagens externas.","entregavel":"Aceite de operação ponta a ponta."}
        ]},
        {"id":"entregar","titulo":"Entregar","objetivo":"Migrar com controle e criar hábito de uso.","passos":[
          {"id":"migrar-lote","titulo":"Migrar um lote controlado","acao":"Importe oportunidades abertas de uma equipe ou período. Reconcilie contagem, responsáveis, valores e próxima ação com a origem.","concluidoQuando":"Origem e CRM têm a mesma quantidade de oportunidades válidas e divergências explicadas.","entregavel":"Relatório de migração."},
          {"id":"conduzir-adocao","titulo":"Conduzir a primeira semana","acao":"Treine com casos reais, acompanhe campos ignorados e remova atritos. Entregue rotina diária do vendedor e revisão semanal do gestor.","concluidoQuando":"O time atualiza o CRM durante o trabalho e o gestor usa os fatos na reunião.","entregavel":"Playbook de adoção."}
        ]}
      ]
    }$roteiro_crm$::jsonb
  ),
  (
    'maquina-de-conteudo-com-ia',
    'Uma operação editorial contínua que usa fontes próprias, preserva a voz da marca e mantém aprovação humana antes da publicação.',
    'Especialistas e empresas com conhecimento acumulado, produção irregular e dificuldade de transformar reuniões, aulas e pesquisas em conteúdo consistente.',
    'Base editorial, fluxo de pesquisa e produção, biblioteca de versões, calendário de trinta dias e manual de aprovação.',
    $roteiro_conteudo${
      "fases": [
        {"id":"entender","titulo":"Entender","objetivo":"Dar à máquina editorial uma tese, uma voz e fronteiras claras.","passos":[
          {"id":"definir-tese","titulo":"Definir a tese editorial","acao":"Escreva para quem a marca fala, o que ela acredita, quais problemas interpreta melhor e qual mudança quer provocar. Use exemplos reais, não adjetivos.","concluidoQuando":"Cinco pautas podem ser aprovadas ou rejeitadas usando a tese sem opinião adicional.","entregavel":"Documento de tese editorial."},
          {"id":"mapear-voz","titulo":"Mapear voz e restrições","acao":"Separe dez conteúdos aprovados e cinco rejeitados. Marque abertura, ritmo, vocabulário, nível de certeza, chamadas e temas proibidos.","concluidoQuando":"O guia mostra exemplos do que usar e do que evitar em cada regra.","entregavel":"Guia de voz com exemplos."}
        ]},
        {"id":"preparar","titulo":"Preparar","objetivo":"Transformar conhecimento espalhado em fontes utilizáveis.","passos":[
          {"id":"organizar-fontes","titulo":"Organizar fontes próprias","acao":"Reúna transcrições, artigos, apresentações e perguntas de clientes. Dê título, data, autor, tema e permissão de uso a cada item.","concluidoQuando":"Toda fonte usada pelo gerador pode ser localizada e citada.","entregavel":"Biblioteca editorial rastreável."},
          {"id":"definir-fluxo","titulo":"Definir papéis e estados","acao":"Escolha quem pesquisa, escreve, revisa fatos, aprova e publica. Crie estados claros e prazo esperado para cada passagem.","concluidoQuando":"Nenhum conteúdo chega à publicação sem uma pessoa responsável pela aprovação.","entregavel":"Fluxo editorial e matriz de papéis."}
        ]},
        {"id":"construir","titulo":"Construir","objetivo":"Criar a linha de produção sem automatizar a decisão editorial.","passos":[
          {"id":"pesquisar-pautar","titulo":"Pesquisar e montar a pauta","acao":"Busque sinais nas fontes próprias e referências externas autorizadas. Para cada pauta, registre tese, evidência, formato, canal e por que ela importa agora.","concluidoQuando":"Cada pauta tem ao menos uma fonte e uma consequência específica para o público.","entregavel":"Backlog priorizado de pautas."},
          {"id":"rascunhar-aprovar","titulo":"Gerar rascunho e preservar aprovação","acao":"Gere a primeira versão com trechos das fontes, rode revisão factual e de voz e mantenha alterações visíveis. Só permita publicar uma versão explicitamente aprovada.","concluidoQuando":"O histórico mostra fonte, versões, revisão e quem aprovou o texto final.","entregavel":"Fluxo de produção e aprovação."}
        ]},
        {"id":"validar","titulo":"Validar","objetivo":"Provar aderência à marca e segurança factual.","passos":[
          {"id":"teste-cego","titulo":"Fazer revisão cega de dez textos","acao":"Misture textos antigos e novos sem identificar origem. Peça ao responsável pela marca para avaliar voz, utilidade, precisão e trechos genéricos.","concluidoQuando":"Os textos novos atingem o padrão aprovado ou geram regras objetivas de correção.","entregavel":"Relatório de aderência de voz."},
          {"id":"testar-canais","titulo":"Validar adaptação por canal","acao":"Adapte uma mesma tese para LinkedIn, vídeo curto e e-mail sem repetir o mesmo texto. Confirme limites, links, menções e formato de cada canal.","concluidoQuando":"Cada versão mantém a tese e respeita a linguagem do canal.","entregavel":"Matriz de adaptação por canal."}
        ]},
        {"id":"entregar","titulo":"Entregar","objetivo":"Colocar uma rotina editorial sustentável nas mãos do cliente.","passos":[
          {"id":"montar-calendario","titulo":"Montar trinta dias de conteúdo","acao":"Distribua pilares, formatos e canais conforme capacidade real de aprovação. Deixe fonte e responsável anexados a cada pauta.","concluidoQuando":"O calendário cabe na rotina do time e nenhuma pauta está sem fonte ou dono.","entregavel":"Calendário editorial de trinta dias."},
          {"id":"treinar-operacao","titulo":"Treinar produção e revisão","acao":"Faça a equipe criar uma pauta, gerar, revisar, aprovar e devolver para correção. Entregue a rotina semanal e os indicadores de qualidade.","concluidoQuando":"A equipe completa um ciclo sem intervenção do implementador.","entregavel":"Manual da máquina editorial."}
        ]}
      ]
    }$roteiro_conteudo$::jsonb
  ),
  (
    'financeiro-sem-planilhas',
    'Um fluxo financeiro centralizado, com documentos, aprovações e orçamento rastreáveis sem autorizar pagamentos pela IA.',
    'Empresas que recebem pedidos e comprovantes por mensagem, controlam vencimentos em planilhas e não conseguem reconstruir quem aprovou cada despesa.',
    'Central privada, fluxo de aprovação, extração assistida, orçamento, auditoria, migração controlada e manual de fechamento.',
    $roteiro_financeiro${
      "fases": [
        {"id":"entender","titulo":"Entender","objetivo":"Reconstruir o caminho do documento até o fechamento.","passos":[
          {"id":"mapear-processo","titulo":"Acompanhar três despesas reais","acao":"Siga uma nota, um reembolso e um contrato desde a chegada até a baixa. Registre canal, conferência, aprovação, pagamento e arquivo.","concluidoQuando":"Cada etapa tem entrada, responsável, decisão e evidência identificados.","entregavel":"Mapa do processo financeiro."},
          {"id":"definir-controles","titulo":"Definir regras e alçadas","acao":"Liste campos obrigatórios, centros de custo, categorias, limites de aprovação e situações bloqueantes. Mantenha pagamento fora do escopo da IA.","concluidoQuando":"Toda despesa de exemplo encontra categoria, aprovador e documentos exigidos.","entregavel":"Matriz de controles e alçadas."}
        ]},
        {"id":"preparar","titulo":"Preparar","objetivo":"Organizar dados e acesso antes de receber documentos.","passos":[
          {"id":"modelar-financeiro","titulo":"Modelar contas e orçamento","acao":"Crie fornecedor, documento, parcela, vencimento, valor, centro de custo, orçamento, aprovação e baixa. Defina unicidade para impedir documento duplicado.","concluidoQuando":"O banco representa parcelamento e rejeita a mesma chave de documento no mesmo fornecedor.","entregavel":"Modelo financeiro validado."},
          {"id":"configurar-seguranca","titulo":"Configurar perfis e arquivos privados","acao":"Separe solicitante, aprovador e financeiro. Restrinja linhas e anexos por papel e empresa; teste também acesso por URL direta.","concluidoQuando":"Usuários acessam somente despesas e arquivos permitidos para o papel.","entregavel":"Matriz de acesso testada."}
        ]},
        {"id":"construir","titulo":"Construir","objetivo":"Centralizar captura, conferência e aprovação com trilha completa.","passos":[
          {"id":"capturar-conferir","titulo":"Capturar e conferir documentos","acao":"Receba arquivo, extraia campos como sugestão e mostre documento ao lado dos valores. Exija confirmação humana para divergência, campo vazio e categoria.","concluidoQuando":"Nenhuma extração vira dado confirmado sem revisão e o arquivo original permanece ligado ao registro.","entregavel":"Entrada assistida de documentos."},
          {"id":"aprovar-orcamento","titulo":"Construir aprovação e orçamento","acao":"Encaminhe pela alçada correta, registre decisão e compare o valor aprovado com orçamento disponível. Gere alerta, nunca decisão automática de pagamento.","concluidoQuando":"Aprovação, rejeição e alteração deixam autor, horário, motivo e valores anteriores.","entregavel":"Fluxo de aprovação auditável."}
        ]},
        {"id":"validar","titulo":"Validar","objetivo":"Garantir que números e permissões sobrevivem aos casos difíceis.","passos":[
          {"id":"reconciliar-calculos","titulo":"Reconciliar cinquenta lançamentos","acao":"Compare totais por status, vencimento, centro de custo e orçamento com uma apuração independente. Investigue cada centavo divergente.","concluidoQuando":"Totais batem com a fonte e critérios de arredondamento estão documentados.","entregavel":"Relatório de reconciliação."},
          {"id":"testar-excecoes","titulo":"Testar exceções e auditoria","acao":"Envie duplicado, arquivo ilegível, parcela, aprovação fora da alçada e tentativa de trocar valor após aprovação. Reconstrua o histórico completo.","concluidoQuando":"Cada exceção é bloqueada ou exige revisão, e nenhuma alteração apaga o valor anterior.","entregavel":"Suíte de controles financeiros."}
        ]},
        {"id":"entregar","titulo":"Entregar","objetivo":"Migrar sem perder controle e provar um fechamento completo.","passos":[
          {"id":"migrar-abertos","titulo":"Migrar somente o necessário","acao":"Limpe fornecedores e contas abertas, importe em lote pequeno e reconcilie contagem e saldo. Preserve a planilha original como evidência do corte.","concluidoQuando":"Toda conta aberta tem origem, saldo e responsável reconciliados.","entregavel":"Relatório de migração financeira."},
          {"id":"simular-fechamento","titulo":"Simular o fechamento mensal","acao":"Faça a equipe capturar, aprovar, baixar e fechar um período de teste. Entregue contingência, rotina e responsáveis por revisão de acesso.","concluidoQuando":"O cliente gera o fechamento e explica cada número pela trilha de eventos.","entregavel":"Manual de operação e fechamento."}
        ]}
      ]
    }$roteiro_financeiro$::jsonb
  )
) as v(slug, resultado, cliente_ideal, entregavel_final, roteiro)
  on v.slug = s.slug
on conflict (projeto_id) do update set
  resultado = excluded.resultado,
  cliente_ideal = excluded.cliente_ideal,
  entregavel_final = excluded.entregavel_final,
  roteiro = excluded.roteiro,
  versao = excluded.versao;
