import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

/** Esquema mínimo e trigger real no PostgreSQL descartável; nunca roda em produção. */
export async function verificarEdicaoProposta({ sql, funcao }) {
  const id = randomUUID();
  const dono = randomUUID();
  const outro = randomUUID();
  await sql(`create table propostas(id uuid primary key,dono uuid,titulo text,documento jsonb,versao integer default 1,status text default 'rascunho',visualizacoes integer default 0,apresentada_em timestamptz,aceita_em timestamptz,recusada_em timestamptz);
    alter table propostas enable row level security;
    create policy leitura on propostas for select to authenticated using(dono=(select auth.uid()));
    create policy escrita on propostas for update to authenticated using(dono=(select auth.uid())) with check(dono=(select auth.uid()));
    grant select,update on propostas to authenticated;
    insert into propostas(id,dono,titulo,documento) values('${id}','${dono}','Original','{"texto":"original"}');`);
  await sql(
    await funcao('20260815005454_proposta_portal_cliente.sql', 'private.proposta_versionar'),
  );
  await sql(
    'create trigger propostas_versionar before update on propostas for each row execute function private.proposta_versionar();',
  );
  const como = (usuario, comando) =>
    `set role authenticated; select set_config('request.jwt.claim.sub','${usuario}',false); ${comando}`;
  const gravar = (titulo, versao) =>
    `with atualizada as (update propostas set titulo='${titulo}',documento='{"texto":"${titulo}"}' where id='${id}' and dono='${dono}' and versao=${versao} returning id) select count(*) from atualizada;`;
  const tentativas = await Promise.all(
    Array.from({ length: 8 }, (_, n) => sql(como(dono, gravar(`Revisao ${n}`, 1)))),
  );
  assert.equal(tentativas.filter((v) => v.split('\n').at(-1) === '1').length, 1);
  assert.equal(await sql(`select versao from propostas where id='${id}'`), '2');
  const vencedor = await sql(`select titulo from propostas where id='${id}'`);
  assert.equal((await sql(como(outro, gravar('Conta indevida', 2)))).split('\n').at(-1), '0');
  assert.equal((await sql(como(dono, gravar('Revisao antiga', 1)))).split('\n').at(-1), '0');
  assert.equal(await sql(`select titulo from propostas where id='${id}'`), vencedor);
  await sql(`update propostas set visualizacoes=1 where id='${id}'`);
  assert.equal(await sql(`select versao from propostas where id='${id}'`), '2');
  await sql(`update propostas set status='aceita' where id='${id}'`);
  assert.equal(await sql(`select versao from propostas where id='${id}'`), '3');
  assert.equal((await sql(como(dono, gravar('Antes do aceite', 2)))).split('\n').at(-1), '0');
  assert.equal((await sql(como(dono, gravar('Revisada apos escolha', 3)))).split('\n').at(-1), '1');
  assert.equal(await sql(`select status from propostas where id='${id}'`), 'rascunho');
  console.log(
    'Propostas: oito salvamentos concorrentes, um vencedor; versão antiga, outro dono, visualização e aceite verificados.',
  );
}
