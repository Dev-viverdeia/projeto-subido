import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

/** RPC real em PostgreSQL descartável; nenhuma conta de cliente é alterada. */
export async function verificarEdicaoContato({ sql }) {
  const dono = randomUUID();
  const outro = randomUUID();
  const empresa = randomUUID();
  const oportunidade = randomUUID();
  const contato = randomUUID();
  await sql(`
    grant usage on schema private to authenticated;
    alter table crm_contatos alter column id set default gen_random_uuid();
    alter table crm_contatos add column if not exists email text;
    alter table crm_contatos add column if not exists telefone text;
    alter table crm_contatos add column if not exists cargo text;
    alter table crm_oportunidades add column if not exists etapa text default 'novo_lead';
    create table if not exists crm_eventos(id uuid primary key default gen_random_uuid(), dono uuid, empresa_id uuid, contato_id uuid, oportunidade_id uuid, tipo text, titulo text, dados jsonb, fonte text);
    insert into auth.users(id) values('${dono}'),('${outro}');
    insert into crm_empresas(id,dono,nome) values('${empresa}','${dono}','QA Contatos');
    insert into crm_contatos(id,dono,empresa_id,nome,email,telefone,cargo,linkedin_url)
      values('${contato}','${dono}','${empresa}','Ana','ana@example.test','(48) 99999-0000','Diretora','https://linkedin.com/in/ana');
    insert into crm_oportunidades(id,dono,empresa_id,contato_principal_id,titulo)
      values('${oportunidade}','${dono}','${empresa}','${contato}','QA Contatos');
  `);
  await sql(
    await readFile(
      new URL('../../supabase/migrations/20260915195500_crm_editar_contato.sql', import.meta.url),
      'utf8',
    ),
  );
  const gravar = (nome, revisao = 0, usuario = dono, id = contato) =>
    sql(`
    set role authenticated;
    select set_config('request.jwt.claim.sub','${usuario}',false);
    select crm_editar_contato('${oportunidade}','${nome}','(48) 99999-1234','novo@example.test','${id}',${revisao});
  `);
  await assert.rejects(gravar('Intruso', 0, outro), /oportunidade_indisponivel/);
  await assert.rejects(gravar('Trocou contato', 0, dono, randomUUID()), /contato_alterado/);
  // Duas conexões: só uma pode consumir a revisão inicial.
  const disputas = await Promise.allSettled([gravar('Ana A'), gravar('Ana B')]);
  assert.equal(disputas.filter((r) => r.status === 'fulfilled').length, 1);
  assert.match(disputas.find((r) => r.status === 'rejected').reason.message, /contato_alterado/);
  const atual = JSON.parse(
    (await sql(`select row_to_json(c) from crm_contatos c where id='${contato}';`))
      .split('\n')
      .at(-1),
  );
  assert.equal(atual.revisao, 1);
  assert.equal(atual.telefone_manual, true);
  assert.equal(atual.cargo, 'Diretora');
  assert.equal(atual.linkedin_url, 'https://linkedin.com/in/ana');
  assert.equal((await gravar(atual.nome, 1)).split('\n').at(-1), 'f');
  assert.equal(
    (await sql(`select count(*) from crm_eventos where oportunidade_id='${oportunidade}';`))
      .split('\n')
      .at(-1),
    '1',
  );
  assert.equal(
    (await sql(`select etapa from crm_oportunidades where id='${oportunidade}';`))
      .split('\n')
      .at(-1),
    'novo_lead',
  );
  // Mudar só nome/e-mail não transforma telefone importado em manual.
  await sql(`update crm_contatos set telefone_manual=false where id='${contato}';`);
  await gravar('Nome corrigido', 2);
  assert.equal(
    (await sql(`select telefone_manual from crm_contatos where id='${contato}';`))
      .split('\n')
      .at(-1),
    'f',
  );
  await sql(`set role authenticated; select set_config('request.jwt.claim.sub','${dono}',false);
    select crm_editar_contato('${oportunidade}','','','','${contato}',3);`);
  assert.equal(
    (
      await sql(
        `select (telefone is null and email is null and nome='Contato a identificar') from crm_contatos where id='${contato}';`,
      )
    )
      .split('\n')
      .at(-1),
    't',
  );
  // Criar o primeiro contato é atômico com o vínculo da ficha.
  const nova = randomUUID();
  await sql(
    `insert into crm_oportunidades(id,dono,empresa_id,titulo) values('${nova}','${dono}','${empresa}','Sem contato');`,
  );
  await sql(`set role authenticated; select set_config('request.jwt.claim.sub','${dono}',false);
    select crm_editar_contato('${nova}','','(48) 99999-4321','');`);
  assert.equal(
    (
      await sql(
        `select count(*) from crm_oportunidades o join crm_contatos c on c.id=o.contato_principal_id and c.dono=o.dono and c.empresa_id=o.empresa_id where o.id='${nova}' and c.telefone_manual;`,
      )
    )
      .split('\n')
      .at(-1),
    '1',
  );
  await assert.rejects(
    sql(`set role anon; select crm_editar_contato('${oportunidade}','A','','');`),
    /permission denied/,
  );
  await sql(
    `update auth.users set raw_app_meta_data='{"plano_subido":"starter"}' where id='${dono}';`,
  );
  await assert.rejects(gravar('Starter', 4), /acesso_negado/);
  return {
    concorrencia: 'uma gravação por revisão',
    isolamento: true,
    plano: true,
    camposPreservados: true,
  };
}
