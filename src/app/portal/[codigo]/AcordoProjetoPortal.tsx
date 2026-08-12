import { BadgeCheck, ListChecks, Target, UserRoundCheck } from 'lucide-react';
import type { ProjetoPortalCliente } from '@/lib/portal-cliente/servico';
import styles from './portal.module.css';

export function AcordoProjetoPortal({ briefing }: { briefing: ProjetoPortalCliente['briefing'] }) {
  if (!briefing) return null;

  return (
    <section className={styles.acordo} aria-labelledby="acordo-titulo">
      <header>
        <span>
          <BadgeCheck size={18} aria-hidden="true" />
        </span>
        <div>
          <p>Acordo do projeto</p>
          <h2 id="acordo-titulo">O que vamos entregar juntos.</h2>
        </div>
        <em>Confirmado</em>
      </header>
      <div className={styles.acordoGrade}>
        <article className={styles.acordoObjetivo}>
          <Target size={17} aria-hidden="true" />
          <div>
            <span>Objetivo</span>
            <strong>{briefing.objetivo}</strong>
            <small>Sucesso: {briefing.criterioSucesso}</small>
          </div>
        </article>
        <article>
          <UserRoundCheck size={17} aria-hidden="true" />
          <div>
            <span>Responsáveis</span>
            <strong>{briefing.responsavelCliente}</strong>
            <small>Implementação: {briefing.responsavelTecnico}</small>
          </div>
        </article>
        <article>
          <ListChecks size={17} aria-hidden="true" />
          <div>
            <span>Próximos passos</span>
            <ul>
              {briefing.proximosPassos.slice(0, 3).map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </section>
  );
}
