import { Check, Layers3, LockKeyhole } from 'lucide-react';
import {
  PLANOS_SUBIDO,
  RECURSOS_BASE_PLANO,
  RECURSOS_COMERCIAIS_PLANO,
  planoTemRecurso,
  type PlanoSubido,
} from '@/lib/planos/acessos';
import styles from './PainelAcessoPlano.module.css';

export function PainelAcessoPlano({
  plano,
  destaque = false,
}: {
  plano: PlanoSubido;
  destaque?: boolean;
}) {
  const comercialLiberado = planoTemRecurso(plano, 'modulo_comercial');

  return (
    <section
      className={styles.painel}
      data-destaque={destaque || undefined}
      aria-labelledby="titulo-acesso-plano"
    >
      <header className={styles.cabecalho}>
        <span className={styles.icone} aria-hidden="true">
          <Layers3 size={19} strokeWidth={1.7} />
        </span>
        <div>
          <p>Seu acesso</p>
          <h2 id="titulo-acesso-plano">O que está liberado no {PLANOS_SUBIDO[plano].nome}</h2>
          <span>{PLANOS_SUBIDO[plano].descricao}</span>
        </div>
        <strong>{PLANOS_SUBIDO[plano].nome}</strong>
      </header>

      <div className={styles.grade}>
        <article>
          <div className={styles.tituloLista}>
            <Check size={17} strokeWidth={2} aria-hidden="true" />
            <h3>Disponível agora</h3>
          </div>
          <ul>
            {RECURSOS_BASE_PLANO.map((recurso) => (
              <li key={recurso}>
                <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                {recurso}
              </li>
            ))}
          </ul>
        </article>

        <article data-bloqueado={!comercialLiberado || undefined}>
          <div className={styles.tituloLista}>
            {comercialLiberado ? (
              <Check size={17} strokeWidth={2} aria-hidden="true" />
            ) : (
              <LockKeyhole size={17} strokeWidth={1.8} aria-hidden="true" />
            )}
            <h3>{comercialLiberado ? 'Operação comercial' : 'Disponível no Pro'}</h3>
          </div>
          <ul>
            {RECURSOS_COMERCIAIS_PLANO.map((recurso) => (
              <li key={recurso}>
                {comercialLiberado ? (
                  <Check size={14} strokeWidth={2.2} aria-hidden="true" />
                ) : (
                  <LockKeyhole size={14} strokeWidth={1.8} aria-hidden="true" />
                )}
                {recurso}
              </li>
            ))}
          </ul>
          {!comercialLiberado && (
            <p className={styles.nota}>
              Estas áreas continuam visíveis no menu com o selo Pro. Ao abri-las, você volta para
              esta explicação sem perder o que já fez na plataforma.
            </p>
          )}
        </article>
      </div>
    </section>
  );
}
