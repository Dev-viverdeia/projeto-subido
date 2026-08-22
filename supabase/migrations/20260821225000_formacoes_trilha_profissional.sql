-- Organiza as quatro formações como uma trilha profissional curta.
-- Slugs e IDs permanecem os mesmos para preservar aulas, progresso e certificados.
with trilha(slug, titulo, resumo, ordem) as (
  values
    (
      'formacao-de-chatgpt',
      'ChatGPT para o trabalho',
      'Aprenda a usar o ChatGPT com contexto, segurança e método para pesquisar, criar e executar tarefas reais.',
      10
    ),
    (
      'formacao-de-gpt-agents',
      'Agentes no ChatGPT',
      'Crie agentes com instruções, ferramentas e limites claros para executar tarefas repetíveis com segurança.',
      20
    ),
    (
      'formacao-de-lovable',
      'Produtos com Lovable',
      'Transforme uma necessidade em um produto funcional, conecte dados e publique uma primeira versão para uso real.',
      30
    ),
    (
      'formacao-de-claude-code',
      'Projetos com Claude Code',
      'Configure o ambiente, trabalhe com código assistido por IA e construa automações e ferramentas.',
      40
    )
)
update public.formacoes as f
set
  titulo = trilha.titulo,
  resumo = trilha.resumo,
  ordem = trilha.ordem
from trilha
where f.slug = trilha.slug;
