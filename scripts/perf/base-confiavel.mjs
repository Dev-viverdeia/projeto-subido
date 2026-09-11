import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/** Executado somente dentro do PostgreSQL descartável do laboratório. */
export async function verificarBaseConfiavel({ sql, funcao, raiz }) {
  const migracao = (nome) => readFile(join(raiz, 'supabase/migrations', nome), 'utf8');
  await sql(await migracao('20260911020258_sobral_orcamento_tentativas.sql'));
  const dono = await sql('select dono from perf.contas where n=60;');
  const outro = await sql('select dono from perf.contas where n=61;');
  const mes = await sql("select date_trunc('month',now() at time zone 'UTC')::date;");
  const reservas = Array.from({ length: 32 }, () => randomUUID());
  const admitidos = await Promise.all(
    reservas.map((id) =>
      sql(`select sobral_reservar_uso('${id}','${dono}',100000);`)
        .then(() => id)
        .catch((e) => {
          if (e.stderr.includes('limite_sobral_mensal')) return null;
          throw e;
        }),
    ),
  );
  assert.equal(admitidos.filter(Boolean).length, 5);
  const reserva = admitidos.find(Boolean);
  assert.equal(await sql(`select tokens from consultor_uso where dono='${dono}';`), '500000');
  assert.equal(await sql(`select sobral_reservar_uso('${reserva}','${dono}',100000);`), 'f');
  // 32 ACKs concorrentes, uma liquidação. As demais reservas incertas continuam.
  const acertos = await Promise.all(
    Array.from({ length: 32 }, () =>
      sql(`select sobral_liquidar_uso('${reserva}','${dono}',123);`),
    ),
  );
  assert.equal(acertos.filter((r) => r === 't').length, 1);
  assert.equal(await sql(`select tokens from consultor_uso where dono='${dono}';`), '400123');
  await assert.rejects(sql(`select sobral_liquidar_uso('${reserva}','${outro}',0);`));
  // Liquidação pertence ao mês da admissão, não ao relógio do worker.
  const antiga = randomUUID();
  await sql(`insert into consultor_uso values('${outro}','2020-01-01',1000,now());
    insert into sobral_uso_reservas(id,dono,mes,reservado) values('${antiga}','${outro}','2020-01-01',1000);
    select sobral_liquidar_uso('${antiga}','${outro}',300);`);
  assert.equal(
    await sql(`select tokens from consultor_uso where dono='${outro}' and mes='2020-01-01';`),
    '300',
  );
  assert.equal(
    await sql(`select count(*) from consultor_uso where dono='${outro}' and mes='${mes}';`),
    '0',
  );
  await assert.rejects(
    sql(`set role authenticated; select sobral_reservar_uso('${randomUUID()}','${dono}',1);`),
  );

  await sql(`create schema storage; create table storage.objects(bucket_id text,name text,owner_id text);
    create table projetos_execucao(id uuid primary key,dono uuid);
    create table projeto_tarefas(id uuid primary key,projeto_execucao_id uuid,dono uuid);
    create table projeto_arquivos(id uuid default gen_random_uuid(),dono uuid,projeto_execucao_id uuid,
      tarefa_id uuid,grupo_id uuid,versao integer,titulo text,descricao text,nome_original text,
      caminho_storage text,mime_type text,tamanho_bytes bigint);
    create function private.tocar_atualizado_em() returns trigger language plpgsql as $$begin new.atualizado_em=now(); return new; end;$$;`);
  await sql(
    await funcao(
      '20260809153513_central_arquivos_projetos.sql',
      'public.projeto_arquivo_registrar',
    ),
  );
  await sql(await migracao('20260911020255_arquivos_caminho_seguro.sql'));
  const projeto = randomUUID();
  const caminho = `${dono}/${projeto}/uuid-Relatorio_v2.pdf`;
  await sql(`insert into projetos_execucao values('${projeto}','${dono}');
    insert into storage.objects values('projeto-entregaveis','${caminho}','${dono}');`);
  const registrar = (chave) => `select set_config('request.jwt.claim.sub','${dono}',false);
    select (projeto_arquivo_registrar('${projeto}',null,null,'Relatorio',null,'Relatorio.pdf','${chave}','application/pdf',100)).id;`;
  await sql(registrar(caminho));
  for (const nome of [
    '../../vitima/projeto/segredo.pdf',
    '%2e%2e',
    '%252e%252e',
    'a?b',
    'a#b',
    'a\\b',
    '.',
    '..',
    '/a.pdf',
  ])
    await assert.rejects(sql(registrar(`${dono}/${projeto}/${nome}`)));
  await assert.rejects(sql(registrar(`${outro}/${projeto}/relatorio.pdf`)));
  await assert.rejects(sql(registrar(`${dono}/${projeto}/nao-enviado.pdf`)));
  await sql(
    `insert into storage.objects values('projeto-entregaveis','${dono}/${projeto}/dono-inconsistente.pdf','${outro}');`,
  );
  await assert.rejects(sql(registrar(`${dono}/${projeto}/dono-inconsistente.pdf`)));

  await sql(await migracao('20260728191837_builder_solucoes.sql'));
  await sql(`alter table builder_solucoes add column stack text, add column oportunidade_id uuid, add column projeto_base_id uuid;
    grant usage on schema public,auth to authenticated; grant select,insert,update,delete on builder_solucoes to authenticated;`);
  await sql(await migracao('20260911020302_builder_claim_seguro.sql'));
  await sql(await migracao('20260911020533_builder_worker_exclusivo.sql'));
  await sql(`insert into private.builder_worker_credencial values(true,extensions.digest(repeat('b',64),'sha256'));
    insert into builder_solucoes(id,dono,ideia_original) values('${projeto}','${dono}','Projeto sintético');`);
  const executarComoDono = (comando) =>
    `select set_config('request.jwt.claim.sub','${dono}',false); set role authenticated; ${comando}`;
  const claim = executarComoDono(
    `select builder_iniciar_geracao('${projeto}','[]',repeat('b',64))->>'executar';`,
  );
  const claims = await Promise.all(Array.from({ length: 32 }, () => sql(claim)));
  assert.equal(claims.filter((r) => r.split('\n').at(-1) === 'true').length, 1);
  const tentativa = await sql(
    `select tentativa from private.builder_geracoes where projeto='${projeto}';`,
  );
  await assert.rejects(
    sql(executarComoDono(`update builder_solucoes set status='rascunho' where id='${projeto}';`)),
  );
  await assert.rejects(
    sql(executarComoDono(`select builder_iniciar_geracao('${projeto}','[]','sem-prova');`)),
  );
  await assert.rejects(sql(executarComoDono('select * from private.builder_geracoes;')));
  await sql(
    executarComoDono(`update builder_solucoes set stack='lovable_cloud' where id='${projeto}';`),
  );
  assert.equal(
    (await sql(executarComoDono(`select builder_recuperar_geracao('${projeto}');`)))
      .split('\n')
      .at(-1),
    'f',
  );
  await sql(
    `update private.builder_geracoes set expira_em=now()-interval '1 second' where projeto='${projeto}';`,
  );
  assert.equal(
    (await sql(executarComoDono(`select builder_recuperar_geracao('${projeto}');`)))
      .split('\n')
      .at(-1),
    't',
  );
  assert.equal((await sql(claim)).split('\n').at(-1), 'true');
  for (const dados of ['\'{"titulo":"Resultado antigo"}\'', 'null']) {
    assert.equal(
      (
        await sql(
          executarComoDono(
            `select builder_finalizar_geracao('${projeto}','${tentativa}',repeat('b',64),${dados});`,
          ),
        )
      )
        .split('\n')
        .at(-1),
      'f',
    );
  }
  const atual = await sql(
    `select tentativa from private.builder_geracoes where projeto='${projeto}';`,
  );
  const finalizar = executarComoDono(
    `select builder_finalizar_geracao('${projeto}','${atual}',repeat('b',64),'{"titulo":"Plano novo"}');`,
  );
  const finais = await Promise.all(Array.from({ length: 16 }, () => sql(finalizar)));
  assert.equal(finais.filter((r) => r.split('\n').at(-1) === 't').length, 1);
  assert.equal(
    await sql(`select titulo from builder_solucoes where id='${projeto}';`),
    'Plano novo',
  );
  assert.equal(
    (await sql(executarComoDono(`select builder_recuperar_geracao('${projeto}');`)))
      .split('\n')
      .at(-1),
    'f',
  );
  // Excluir um projeto não libera o worker. Se outro dono reutilizar seu UUID
  // depois do encerramento, a nova reserva pertence somente ao novo dono.
  await sql(executarComoDono(`delete from builder_solucoes where id='${projeto}';`));
  const comoOutro = (comando) =>
    `select set_config('request.jwt.claim.sub','${outro}',false); set role authenticated; ${comando}`;
  await sql(
    comoOutro(
      `insert into builder_solucoes(id,dono,ideia_original) values('${projeto}','${outro}','Outro projeto');`,
    ),
  );
  assert.equal(
    (
      await sql(
        comoOutro(`select builder_iniciar_geracao('${projeto}','[]',repeat('b',64))->>'executar';`),
      )
    )
      .split('\n')
      .at(-1),
    'true',
  );
  assert.equal(
    await sql(`select dono from private.builder_geracoes where projeto='${projeto}';`),
    outro,
  );
  const reciclada = await sql(
    `select tentativa from private.builder_geracoes where projeto='${projeto}';`,
  );
  assert.equal(
    (
      await sql(
        comoOutro(
          `select builder_finalizar_geracao('${projeto}','${reciclada}',repeat('b',64),'{"titulo":"Outro resultado"}');`,
        ),
      )
    )
      .split('\n')
      .at(-1),
    't',
  );
  console.log(
    'Base confiável: caminhos, objetos, quotas atômicas, ACKs, meses, claims, permissões, UUIDs reciclados e workers antigos aprovados.',
  );
}
