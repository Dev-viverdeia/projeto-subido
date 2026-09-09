import { ArrowUpRight, ChevronDown, LifeBuoy, ShieldCheck, UserRound } from 'lucide-react';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/tipos';
import { formatarGarantia } from '@/lib/projetos-execucao/encerramento';
import styles from './MateriaisPortal.module.css';

// Canal é texto livre. Só um e-mail simples ou URL HTTPS vira link; nunca inferir um destino.
export function linkSuporte(canal: string): string | null {
  const valor = canal.trim();
  if (/^[\w.+-]+@[\w.-]+\.[a-z]{2,}$/i.test(valor)) return `mailto:${valor}`;
  if (/\s/.test(valor)) return null;
  try {
    const url = new URL(valor);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch {
    return null;
  }
}

export function PosEntregaPortal({ projeto }: { projeto: ProjetoPortalCliente }) {
  const encerramento = projeto.encerramento;
  const canal = encerramento?.canalSuporte?.trim();
  const destino = canal ? linkSuporte(canal) : null;
  return (
    <aside className={styles.suporte} aria-labelledby="suporte-titulo">
      <div className={styles.suporteTopo}>
        <LifeBuoy size={23} aria-hidden="true" />
        <h2 id="suporte-titulo">Suporte do projeto</h2>
      </div>
      {canal ? (
        <>
          <p className={styles.canal}>{canal}</p>
          {destino && (
            <a
              className={styles.contato}
              href={destino}
              target={destino.startsWith('https:') ? '_blank' : undefined}
              rel={destino.startsWith('https:') ? 'noreferrer' : undefined}
            >
              Falar com o suporte <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          )}
        </>
      ) : (
        <p className={styles.canal}>Use o contato combinado com o profissional.</p>
      )}
      {projeto.briefing?.responsavelTecnico && (
        <div className={styles.responsavel}>
          <UserRound size={18} aria-hidden="true" />
          <div>
            <span>Responsável pelo projeto</span>
            <strong>{projeto.briefing.responsavelTecnico}</strong>
          </div>
        </div>
      )}
      {encerramento && (
        <details className={styles.garantia}>
          <summary>
            <ShieldCheck size={18} aria-hidden="true" />
            <span>Garantia e continuidade</span>
            <ChevronDown size={16} aria-hidden="true" />
          </summary>
          <div>
            <strong>{formatarGarantia(encerramento)}</strong>
            <p>Cobre: {encerramento.garantiaCobre}</p>
            <p>Não cobre: {encerramento.garantiaNaoCobre}</p>
            <span>Continuidade: {encerramento.responsavelContinuidade}</span>
            <p>{encerramento.orientacaoContinuidade}</p>
          </div>
        </details>
      )}
    </aside>
  );
}
