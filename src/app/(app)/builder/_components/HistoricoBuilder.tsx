import Link from 'next/link';
import { Pill } from '@/design-system/via';
import type { ItemHistorico } from '@/lib/builder/queries';
import { ROTULO_STATUS, VARIANTE_STATUS, dataCurta } from './statusBuilder';
import styles from './HistoricoBuilder.module.css';

/**
 * Os projetos já formulados, do mais recente para o mais antigo.
 *
 * CARD SEM CAPA, COMO O DE SOLUÇÃO
 * O texto carrega. Ícone em círculo numa grade de cards é a assinatura mais óbvia
 * de design gerado, e aqui não haveria o que ilustrar — cada projeto é um texto.
 *
 * O RASCUNHO MOSTRA A IDEIA; O PRONTO MOSTRA O TÍTULO.
 * Enquanto a entrevista não terminou não existe título — o modelo só o escreve
 * junto com o documento. Um "Sem título" ali seria um campo vazio com nome; a
 * ideia original é o que a pessoa reconhece.
 */
export function HistoricoBuilder({ itens }: { itens: ItemHistorico[] }) {
  return (
    <ul className={styles.grade}>
      {itens.map((item) => {
        const pronta = item.status === 'pronta';

        return (
          <li key={item.id}>
            <Link href={`/builder/${item.id}`} className={styles.cartao}>
              <div className={styles.topo}>
                <span className={styles.data}>{dataCurta(item.criadoEm)}</span>
                <Pill variant={VARIANTE_STATUS[item.status]} size="sm">
                  {ROTULO_STATUS[item.status]}
                </Pill>
              </div>

              <h3 className={styles.titulo}>{pronta ? item.titulo : item.ideiaOriginal}</h3>

              {pronta ? <p className={styles.ideia}>{item.ideiaOriginal}</p> : null}

              <span className={styles.abrir} aria-hidden="true">
                {pronta ? 'Abrir projeto' : 'Retomar projeto'}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
