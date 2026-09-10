/** PostgreSQL descartável: RLS real das conversas + transação e concorrência.
 * Nenhuma chamada a IA, crédito, e-mail ou banco de produção. */
import { execFile as callback } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
const exec = promisify(callback);
const container = `subido-texto-${randomUUID().slice(0, 8)}`;
const pasta = await mkdtemp(join(tmpdir(), 'subido-texto-'));
const raiz = resolve(import.meta.dirname, '..');
const docker = (...args) => exec('docker', args, { maxBuffer: 2 * 1024 * 1024 });
async function sql(texto) {
  const nome = `${randomUUID()}.sql`;
  await writeFile(join(pasta, nome), texto);
  await docker('cp', join(pasta, nome), `${container}:/tmp/${nome}`);
  return (
    await docker(
      'exec',
      container,
      'psql',
      '-U',
      'postgres',
      '-v',
      'ON_ERROR_STOP=1',
      '-At',
      '-f',
      `/tmp/${nome}`,
    )
  ).stdout
    .trim()
    .split('\n')
    .at(-1);
}
const a = randomUUID(),
  b = randomUUID(),
  thread = randomUUID(),
  mensagem = randomUUID();
const como = (dono, query) =>
  sql(
    `set role authenticated; select set_config('request.jwt.claim.sub','${dono}',false); ${query}`,
  );
const pedido = (t = thread, m = mensagem, texto = 'Pergunta de teste', nova = true) =>
  `select sobral_confirmar_texto('${t}','${m}','${texto}',${nova});`;
const migracao = (nome) => readFile(join(raiz, 'supabase/migrations', nome), 'utf8');
async function recusar(dono, query) {
  await assert.rejects(() => como(dono, query));
}
try {
  await docker(
    'run',
    '-d',
    '--name',
    container,
    '--network',
    'none',
    '--memory',
    '512m',
    '-e',
    'POSTGRES_HOST_AUTH_METHOD=trust',
    'postgres:17-alpine',
  );
  for (let n = 0; n < 30; n++) {
    try {
      await docker('exec', container, 'pg_isready', '-h', '127.0.0.1', '-U', 'postgres');
      break;
    } catch {
      if (n === 29) throw new Error('PostgreSQL não iniciou');
      await new Promise((r) => setTimeout(r, 500));
    }
  }
  await sql(`create schema auth; create schema private; create role authenticated; create role anon;
    create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
    create table auth.users(id uuid primary key); insert into auth.users values('${a}'),('${b}');
    grant usage on schema public,auth to authenticated,anon;`);
  await sql(await migracao('20260805171426_consultor_threads_e_mensagens.sql'));
  await sql(`create table public.consultor_anexos(id uuid primary key, mensagem_id uuid references consultor_mensagens,dono uuid);
    alter table consultor_anexos enable row level security;
    create policy anexos_select on consultor_anexos for select to authenticated using(dono=(select auth.uid()));
    create table sobral_geracoes(thread_id uuid,estado text,expira_em timestamptz);
    grant select,insert,delete on consultor_threads,consultor_mensagens to authenticated;
    grant select on consultor_anexos to authenticated;`);
  await sql(await migracao('20260906213400_sobral_pergunta_em_andamento.sql'));
  await sql(await migracao('20260910010552_sobral_confirmar_texto.sql'));

  // Vinte clientes em conexões independentes perdem/repetem o mesmo ACK.
  const recibos = await Promise.all(Array.from({ length: 20 }, () => como(a, pedido())));
  assert.ok(recibos.every((id) => id === mensagem));
  assert.equal(await sql('select count(*) from consultor_threads;'), '1');
  assert.equal(await sql('select count(*) from consultor_mensagens;'), '1');
  await recusar(a, pedido(thread, mensagem, 'Texto diferente'));
  await recusar(a, pedido(randomUUID(), mensagem));
  await recusar(b, pedido(thread, randomUUID(), 'Invasão', false));
  await recusar(b, pedido());
  assert.equal(
    await como(b, `select count(*) from consultor_mensagens where id='${mensagem}';`),
    '0',
  );
  await assert.rejects(() => sql(`set role anon; ${pedido()}`));
  await recusar('', pedido());
  await recusar(a, pedido(randomUUID(), randomUUID(), '   '));
  await recusar(a, pedido(randomUUID(), randomUUID(), 'x'.repeat(8001)));
  await recusar(a, pedido(randomUUID(), randomUUID(), 'Conversa removida', false));
  const segunda = randomUUID();
  assert.equal(await como(a, pedido(thread, segunda, 'Segunda pergunta', false)), segunda);
  assert.equal(await sql('select count(*) from consultor_threads;'), '1');
  // Falha depois de inserir a conversa: rollback também remove a conversa vazia.
  await sql(`create function private.falhar_teste() returns trigger language plpgsql as $$ begin if new.conteudo='Rollback' then raise exception 'Falha simulada'; end if; return new; end $$;
    create trigger falha_teste before insert on consultor_mensagens for each row execute function private.falhar_teste();`);
  const rollback = randomUUID();
  await recusar(a, pedido(rollback, randomUUID(), 'Rollback'));
  assert.equal(await sql(`select count(*) from consultor_threads where id='${rollback}';`), '0');
  // Retry confirmado funciona durante uma geração; outra pergunta continua bloqueada.
  await sql(`insert into sobral_geracoes values('${thread}','gerando',now()+interval '1 minute');`);
  assert.equal(await como(a, pedido()), mensagem);
  await recusar(a, pedido(thread, randomUUID(), 'Outra pergunta', false));
  await sql(`insert into consultor_anexos values(gen_random_uuid(),'${mensagem}','${a}');`);
  await recusar(a, pedido());
  assert.equal(await sql('select count(*) from consultor_threads;'), '1');
  assert.equal(await sql('select count(*) from consultor_mensagens;'), '2');
  console.log(
    'Texto: 20 pedidos concorrentes = 1 conversa e 1 pergunta. RLS, conteúdo, anexos, rollback e geração em andamento verificados.',
  );
} finally {
  // Somente o container desta execução; nenhum volume ou banco compartilhado.
  await docker('rm', '-f', '-v', container);
}
