import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

export async function verificarConflitosAgenda({ sql }) {
  const dono = randomUUID(),
    outro = randomUUID(),
    propria = randomUUID();
  await sql(
    await readFile(
      new URL('../../supabase/migrations/20260914210000_conflitos_agenda.sql', import.meta.url),
      'utf8',
    ),
  );
  await sql(`insert into calls_reunioes(id,dono,titulo,status,agendada_para,duracao_minutos) values
    ('${propria}','${dono}','Minha reunião','agendada','2099-10-10 15:00Z',45),
    (gen_random_uuid(),'${dono}','Consecutiva','agendada','2099-10-10 15:45Z',30),
    (gen_random_uuid(),'${dono}','Cancelada','cancelada','2099-10-10 15:00Z',45),
    (gen_random_uuid(),'${dono}','Concluída','concluida','2099-10-10 15:00Z',45),
    (gen_random_uuid(),'${dono}','Processando','processando','2099-10-10 15:00Z',45),
    (gen_random_uuid(),'${outro}','Privada','agendada','2099-10-10 15:00Z',45),
    (gen_random_uuid(),'${dono}','Virada do dia','aguardando','2099-10-10 23:30Z',60),
    (gen_random_uuid(),'${dono}','Longa','ao_vivo','2099-10-11 15:00Z',240);
    insert into calls_reunioes(dono,titulo,status,agendada_para) select '${dono}','Múltipla '||n,'agendada','2099-10-12 15:00Z' from generate_series(1,9) n;`);
  const consultar = async (inicio, duracao = 45, ignorar = null, usuario = dono) => {
    const retorno =
      await sql(`set role authenticated; select set_config('request.jwt.claim.sub','${usuario}',false);
      select coalesce(jsonb_agg(r),'[]') from calls_conferir_horario('${inicio}',${duracao},${ignorar ? `'${ignorar}'` : 'null'}) r;`);
    return JSON.parse(retorno.split('\n').at(-1));
  };
  assert.deepEqual(
    (await consultar('2099-10-10 15:00Z')).map((r) => r.titulo),
    ['Minha reunião'],
  );
  assert.deepEqual(await consultar('2099-10-10 15:00Z', 45, propria), []);
  assert.deepEqual(await consultar('2099-10-10 14:15Z'), []);
  assert.deepEqual(
    (await consultar('2099-10-10 15:45Z', 30)).map((r) => r.titulo),
    ['Consecutiva'],
  );
  assert.equal((await consultar('2099-10-10 15:30Z', 45)).length, 2);
  assert.equal((await consultar('2099-10-10 12:00-03:00')).length, 1);
  assert.deepEqual(
    (await consultar('2099-10-11 00:00Z', 15)).map((r) => r.titulo),
    ['Virada do dia'],
  );
  assert.equal((await consultar('2099-10-11 18:59Z', 15)).length, 1);
  assert.equal((await consultar('2099-10-11 19:00Z', 15)).length, 0);
  assert.deepEqual(
    (await consultar('2099-10-10 15:00Z', 45, null, outro)).map((r) => r.titulo),
    ['Privada'],
  );
  const varios = await consultar('2099-10-12 15:00Z');
  assert.equal(varios.length, 5);
  assert.equal(varios[0].total, 9);
  await sql(
    `update calls_reunioes set titulo='Alterada' where dono='${dono}' and titulo='Múltipla 9';`,
  );
  assert.notEqual((await consultar('2099-10-12 15:00Z'))[0].versao, varios[0].versao);
  for (const valor of [0, 241, 'null'])
    await assert.rejects(() => consultar('2099-10-10 15:00Z', valor));
  await assert.rejects(() => consultar('infinity'));
  await assert.rejects(() => consultar('2099-10-10 15:00Z', 45, null, ''));
  assert.equal(
    await sql(
      "select has_function_privilege('anon','public.calls_conferir_horario(timestamptz,integer,uuid)','execute');",
    ),
    'f',
  );
  console.log(
    'Conflitos: limites, duração, virada do dia, exclusão própria, estados, RLS, consentimento fresco e resposta limitada aprovados.',
  );
}
