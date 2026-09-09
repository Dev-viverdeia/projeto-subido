// Gera uma transação editorial para revisão e execução pelo conector do banco.
// Não conecta a serviços e não altera dados. Publicar só depois dos testes e do deploy.
import { readFile } from 'node:fs/promises';
const revisoes = {
  'agendar-reuniao': 'a8250a169601f9b1f6f296a250719016',
  'conectar-google-agenda': 'a75e1efcdf5fa425db8c017b0a6ee323',
  'criar-proposta-sem-reuniao': '54f32d0926be5f1ae1d06a4335b9120e',
  'entrega-pontual-recorrente': 'd7513ad72d1718bffc30147394f525b6',
};
const guias = JSON.parse(
  await readFile(new URL('../src/lib/suporte/guias-visuais.json', import.meta.url), 'utf8'),
);
if (guias.length !== 4 || new Set(guias.map((g) => g.slug)).size !== 4)
  throw new Error('Esperados quatro guias distintos.');
const dados = guias.map(({ slug, resumo, passos, dica }) => {
  if (!revisoes[slug]) throw new Error('Guia fora do escopo.');
  return { slug, resumo, passos, dica, revisao: revisoes[slug] };
});
const json = JSON.stringify(dados);
if (json.includes('$guias$')) throw new Error('Delimitador inválido.');
console.log(`do $publicacao$
declare edicao jsonb; atual public.suporte_artigos%rowtype;
begin
  for edicao in select value from jsonb_array_elements($guias$${json}$guias$::jsonb) loop
    select * into atual from public.suporte_artigos where slug = edicao->>'slug' for update;
    if not found or not atual.publicado then raise exception 'Guia ausente ou despublicado: %', edicao->>'slug'; end if;
    if jsonb_build_array(atual.resumo, atual.passos, atual.dica) =
       jsonb_build_array(edicao->>'resumo', edicao->'passos', edicao->>'dica') then continue; end if;
    if md5(jsonb_build_array(atual.resumo, atual.passos, atual.dica)::text) <> edicao->>'revisao' then
      raise exception 'Guia alterado pela equipe; revisar antes de publicar: %', edicao->>'slug';
    end if;
    update public.suporte_artigos set resumo = edicao->>'resumo', passos = edicao->'passos',
      dica = edicao->>'dica', atualizado_em = now() where slug = edicao->>'slug';
  end loop;
end $publicacao$;`);
