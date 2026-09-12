import { ChevronDown } from 'lucide-react';
import { compararEdicoes, type ConteudoEdicao } from '@/lib/propostas/edicao';
import styles from './RevisaoEdicao.module.css';

export function ComparacaoConteudo({
  local,
  salva,
  rotuloLocal = 'Sua edição',
  rotuloSalva = 'Versão salva',
}: {
  local: ConteudoEdicao;
  salva: ConteudoEdicao;
  rotuloLocal?: string;
  rotuloSalva?: string;
}) {
  return (
    <div className={styles.diferencas}>
      {compararEdicoes(local, salva).map((item, indice) => (
        <details key={item.rotulo} open={indice === 0}>
          <summary>
            {item.rotulo}
            <ChevronDown size={17} aria-hidden="true" />
          </summary>
          <div className={styles.comparacao}>
            <div>
              <h3>{rotuloLocal}</h3>
              <p>{item.local || 'Não preenchido'}</p>
            </div>
            <div>
              <h3>{rotuloSalva}</h3>
              <p>{item.salva || 'Não preenchido'}</p>
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}
