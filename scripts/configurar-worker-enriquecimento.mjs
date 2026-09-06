/** Provisionamento inicial. Nunca imprime nem grava a credencial em arquivo. */
import { randomBytes, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';

if (!process.argv.includes('--confirmar-configuracao'))
  throw new Error('Use --confirmar-configuracao após aplicar a migration do worker.');
const ref = process.env.SUPABASE_PROJECT_REF;
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!ref || !/^[a-z]{20}$/.test(ref) || !token)
  throw new Error('Configure projeto e acesso Supabase.');
async function sql(query) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`Configuração no banco falhou: HTTP ${response.status}.`);
  return response.json();
}
const [estado] = await sql(`select
  (select count(*) from private.crm_worker_credencial) as credenciais,
  (select count(*) from public.crm_enriquecimentos where status in ('na_fila','processando')) as ativos`);
if (Number(estado.ativos))
  throw new Error('Aguarde as execuções ativas antes de configurar o worker.');
if (Number(estado.credenciais))
  throw new Error('Worker já provisionado. Não rotacionar durante um deploy comum.');
const chave = randomBytes(32).toString('hex');
const hash = createHash('sha256').update(chave).digest('hex');
const secret = spawnSync(
  'supabase',
  ['secrets', 'set', '--project-ref', ref, '--env-file', '/dev/stdin'],
  {
    input: `CRM_ENRIQUECIMENTO_WORKER_KEY=${chave}\n`,
    encoding: 'utf8',
    timeout: 45000,
    env: process.env,
  },
);
if (secret.status !== 0) throw new Error('Não foi possível configurar o segredo da Edge.');
await sql(
  `insert into private.crm_worker_credencial(id,hash) values(true,decode('${hash}','hex'))`,
);
const [verificado] = await sql(
  `select hash=decode('${hash}','hex') as ok from private.crm_worker_credencial`,
);
if (!verificado?.ok) throw new Error('Configuração não confirmada.');
console.log(
  'Credencial dedicada configurada na Edge e hash confirmado no banco. Nenhum segredo exibido.',
);
