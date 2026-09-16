import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

/** Banco descartável. Sem credenciais, empresas reais ou uso de provedores. */
export async function verificarEdicaoEmpresa({ sql }) {
  const dono = randomUUID(),
    outro = randomUUID(),
    empresa = randomUUID();
  const oportunidade = randomUUID(),
    segunda = randomUUID(),
    pesquisa = randomUUID();
  await sql(`
    alter table crm_empresas add column if not exists setor text;
    alter table crm_empresas add column if not exists porte text;
    alter table crm_empresas add column if not exists cidade text;
    alter table crm_empresas add column if not exists estado text;
    alter table crm_empresas add column if not exists resumo text;
    alter table crm_empresas add column if not exists enriquecimento jsonb default '{}';
    alter table crm_empresas add column if not exists enriquecido_em timestamptz;
    alter table crm_eventos add column if not exists descricao text;
    alter table crm_eventos add column if not exists fonte_id text;
    insert into auth.users(id) values('${dono}'),('${outro}');
    insert into crm_empresas(id,dono,nome,dominio,setor,enriquecimento)
      values('${empresa}','${dono}','Nome antigo','antigo.com.br','Saúde','{"preservado":true}');
    insert into crm_oportunidades(id,dono,empresa_id,titulo,etapa)
      values('${oportunidade}','${dono}','${empresa}','Título do projeto','proposta'),
        ('${segunda}','${dono}','${empresa}','Outro projeto','descoberta');
    insert into crm_enriquecimentos(id,dono,empresa_id,oportunidade_id,dominio,status)
      values('${pesquisa}','${dono}','${empresa}','${oportunidade}','antigo.com.br','processando');
  `);
  await sql(
    await readFile(
      new URL('../../supabase/migrations/20260915223000_crm_editar_empresa.sql', import.meta.url),
      'utf8',
    ),
  );
  await sql(`create trigger qa_publicar_empresa after update of status on crm_enriquecimentos
    for each row when (old.status is distinct from new.status and new.status='concluido' and new.resultado is not null)
    execute function private.crm_publicar_enriquecimento();`);
  const gravar = (
    nome,
    revisao = 0,
    usuario = dono,
    site = 'novo.com.br',
    oportunidadeId = oportunidade,
    empresaId = empresa,
  ) =>
    sql(`
    set role authenticated; select set_config('request.jwt.claim.sub','${usuario}',false);
    select crm_editar_empresa('${oportunidadeId}','${empresaId}',${revisao},'${nome}','${site}');
  `);
  await assert.rejects(gravar('Intruso', 0, outro), /oportunidade_indisponivel/);
  await assert.rejects(
    gravar('Outra empresa', 0, dono, '', oportunidade, randomUUID()),
    /oportunidade_indisponivel/,
  );
  for (const site of [
    '127.0.0.1',
    'empresa.local',
    'https://empresa.com',
    'empresa.com/path',
    '-erro.com',
  ])
    await assert.rejects(gravar('Inválida', 0, dono, site), /empresa_invalida/);
  await assert.rejects(gravar('', 0), /empresa_invalida/);
  // Duas fichas da mesma empresa: a revisão impede sobrescrita silenciosa.
  const disputa = await Promise.allSettled([
    gravar('Empresa A'),
    gravar('Empresa B', 0, dono, 'novo.com.br', segunda),
  ]);
  assert.equal(disputa.filter((r) => r.status === 'fulfilled').length, 1);
  assert.match(disputa.find((r) => r.status === 'rejected').reason.message, /empresa_alterada/);
  const atual = JSON.parse(
    (await sql(`select row_to_json(e) from crm_empresas e where id='${empresa}';`))
      .split('\n')
      .at(-1),
  );
  assert.equal(atual.revisao, 1);
  assert.equal(atual.site_manual, true);
  assert.ok(atual.cadastro_editado_em);
  assert.equal(atual.setor, 'Saúde');
  assert.deepEqual(atual.enriquecimento, { preservado: true });
  assert.equal((await gravar(atual.nome, 1)).split('\n').at(-1), 'f');
  assert.equal(
    (await sql(`select count(*) from crm_eventos where empresa_id='${empresa}';`))
      .split('\n')
      .at(-1),
    '1',
  );
  assert.equal(
    (await sql(`select titulo||'/'||etapa from crm_oportunidades where id='${oportunidade}';`))
      .split('\n')
      .at(-1),
    'Título do projeto/proposta',
  );
  // Uma pesquisa que termina depois da edição não restaura o site anterior.
  await sql(
    `update crm_enriquecimentos set status='concluido',resultado='{"resumo":"Pesquisa anterior","fatos":[],"hipoteses":[]}' where id='${pesquisa}';`,
  );
  assert.equal(
    (await sql(`select dominio from crm_empresas where id='${empresa}';`)).split('\n').at(-1),
    'novo.com.br',
  );
  await gravar('Empresa corrigida', 2, dono, '');
  await sql(`update crm_enriquecimentos set status='processando' where id='${pesquisa}';
    update crm_enriquecimentos set status='concluido' where id='${pesquisa}';`);
  assert.equal(
    (await sql(`select (dominio is null and site_manual) from crm_empresas where id='${empresa}';`))
      .split('\n')
      .at(-1),
    't',
  );
  await assert.rejects(
    sql(`set role anon; select crm_editar_empresa('${oportunidade}','${empresa}',4,'A','');`),
    /permission denied/,
  );
  await sql(
    `update auth.users set raw_app_meta_data='{"plano_subido":"starter"}' where id='${dono}';`,
  );
  await assert.rejects(gravar('Starter', 4), /acesso_negado/);
  return {
    isolamento: true,
    concorrenciaEntreFichas: true,
    siteManualPreservado: true,
    limpezaSite: true,
    etapaETituloPreservados: true,
  };
}
