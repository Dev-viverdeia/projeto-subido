import { ArrowUpRight, BadgeCheck, LifeBuoy, ShieldCheck, UserRoundCheck } from 'lucide-react';
import { formatarGarantia, type EncerramentoProjeto } from '@/lib/projetos-execucao/encerramento';
import styles from './TermoEncerramentoPortal.module.css';

export function TermoEncerramentoPortal({
  encerramento,
  compacto = false,
}: {
  encerramento: EncerramentoProjeto;
  compacto?: boolean;
}) {
  return (
    <section className={styles.termo} data-compacto={compacto || undefined}>
      <header>
        <span className={styles.icone}>
          <BadgeCheck size={19} aria-hidden="true" />
        </span>
        <div>
          <p>{encerramento.status === 'encerrado' ? 'Combinado final' : 'Antes de aprovar'}</p>
          <h2>Resultado, garantia e continuidade.</h2>
        </div>
        {encerramento.status === 'encerrado' && <span className={styles.selo}>Aceito</span>}
      </header>

      <div className={styles.introducao}>
        <span>O que foi entregue</span>
        <p>{encerramento.resumoEntrega}</p>
      </div>

      <div className={styles.grade}>
        <article>
          <BadgeCheck size={16} aria-hidden="true" />
          <div>
            <span>Resultado registrado</span>
            <strong>{encerramento.resultadoPrincipal}</strong>
            {encerramento.evidenciaResultadoUrl && (
              <a href={encerramento.evidenciaResultadoUrl} target="_blank" rel="noreferrer">
                Ver evidência <ArrowUpRight size={13} aria-hidden="true" />
              </a>
            )}
          </div>
        </article>
        <article>
          <ShieldCheck size={16} aria-hidden="true" />
          <div>
            <span>Garantia</span>
            <strong>{formatarGarantia(encerramento)}</strong>
            <small>Cobre: {encerramento.garantiaCobre}</small>
            <small>Não cobre: {encerramento.garantiaNaoCobre}</small>
          </div>
        </article>
        <article>
          <LifeBuoy size={16} aria-hidden="true" />
          <div>
            <span>Suporte</span>
            <strong>{encerramento.canalSuporte}</strong>
          </div>
        </article>
        <article>
          <UserRoundCheck size={16} aria-hidden="true" />
          <div>
            <span>Continuidade</span>
            <strong>{encerramento.responsavelContinuidade}</strong>
            <small>{encerramento.orientacaoContinuidade}</small>
          </div>
        </article>
      </div>
    </section>
  );
}
