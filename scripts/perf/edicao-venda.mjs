import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

/** Executa a migration real em PostgreSQL descartável; não usa contas nem propostas reais. */
export async function verificarEdicaoVenda({ sql }) {
  const dono = randomUUID(),
    outro = randomUUID(),
    empresa = randomUUID(),
    venda = randomUUID();
  const proposta = randomUUID();
  await sql(`
    alter table crm_oportunidades add column if not exists valor_centavos bigint;
    insert into auth.users(id) values('${dono}'),('${outro}');
    insert into crm_empresas(id,dono,nome) values('${empresa}','${dono}','Empresa QA');
    insert into crm_oportunidades(id,dono,empresa_id,titulo,etapa,valor_centavos)
      values('${venda}','${dono}','${empresa}','Original','proposta',100000);
    insert into propostas(id,dono,titulo,documento,status) values('${proposta}','${dono}','Proposta enviada','{"valor":100000}','apresentada');
  `);
  await sql(
    await readFile(
      new URL('../../supabase/migrations/20260916120000_crm_editar_venda.sql', import.meta.url),
      'utf8',
    ),
  );
  const gravar = (titulo, revisao = 0, valor = 1250050, usuario = dono, id = venda) =>
    sql(`set role authenticated; select set_config('request.jwt.claim.sub','${usuario}',false);
      select crm_editar_venda('${id}',${revisao},'${titulo}',${valor === null ? 'null' : valor});`);
  await assert.rejects(gravar('Intruso', 0, 1, outro), /oportunidade_indisponivel/);
  await assert.rejects(gravar('Ausente', 0, 1, dono, randomUUID()), /oportunidade_indisponivel/);
  for (const titulo of ['', 'x'.repeat(181), 'A\nB'])
    await assert.rejects(gravar(titulo), /venda_invalida/);
  for (const valor of [-1, 100000000001])
    await assert.rejects(gravar('Valor inválido', 0, valor), /venda_invalida/);
  await assert.rejects(gravar('Revisão inválida', -1), /venda_invalida/);
  const disputa = await Promise.allSettled(
    Array.from({ length: 4 }, (_, n) => gravar(`Projeto ${n}`)),
  );
  assert.equal(disputa.filter((r) => r.status === 'fulfilled').length, 1);
  for (const r of disputa.filter((r) => r.status === 'rejected'))
    assert.match(r.reason.message, /venda_alterada/);
  const atual = JSON.parse(
    (await sql(`select row_to_json(v) from crm_oportunidades v where id='${venda}';`))
      .split('\n')
      .at(-1),
  );
  assert.equal(atual.revisao_comercial, 1);
  assert.equal(atual.valor_centavos, 1250050);
  assert.equal(atual.etapa, 'proposta');
  assert.equal(atual.empresa_id, empresa);
  assert.equal((await gravar(atual.titulo, 1)).split('\n').at(-1), 'f');
  assert.equal(
    (await sql(`select count(*) from crm_eventos where oportunidade_id='${venda}';`))
      .split('\n')
      .at(-1),
    '1',
  );
  await gravar(atual.titulo, 1, null);
  assert.equal(
    await sql(`select valor_centavos is null from crm_oportunidades where id='${venda}';`),
    't',
  );
  await gravar(atual.titulo, 2, 0);
  assert.equal(await sql(`select valor_centavos from crm_oportunidades where id='${venda}';`), '0');
  // Uma alteração de etapa não invalida o formulário; uma alteração de valor, sim.
  await sql(`update crm_oportunidades set etapa='descoberta' where id='${venda}';`);
  assert.equal(
    await sql(`select revisao_comercial from crm_oportunidades where id='${venda}';`),
    '3',
  );
  await sql(`update crm_oportunidades set valor_centavos=5 where id='${venda}';`);
  await assert.rejects(gravar('Aba antiga', 3), /venda_alterada/);
  assert.equal(
    await sql(
      `select titulo||'/'||status||'/'||(documento->>'valor') from propostas where id='${proposta}';`,
    ),
    'Proposta enviada/apresentada/100000',
  );
  await assert.rejects(
    sql(`set role anon; select crm_editar_venda('${venda}',4,'Anônimo',0);`),
    /permission denied/,
  );
  await assert.rejects(
    sql(
      `set role authenticated; select set_config('request.jwt.claim.sub','',false); select crm_editar_venda('${venda}',4,'Sem sessão',0);`,
    ),
    /acesso_negado/,
  );
  await sql(
    `update auth.users set raw_app_meta_data='{"plano_subido":"starter"}' where id='${dono}';`,
  );
  await assert.rejects(gravar('Starter', 4), /acesso_negado/);
  return {
    isolamento: true,
    concorrencia: true,
    valorNuloEZero: true,
    propostaPreservada: true,
    revisaoPorCampos: true,
  };
}
