import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { ViverDeIaLogo } from '@/components/brand/ViverDeIaLogo';
import styles from './DocumentoCertificado.module.css';

type Props = {
  nome: string;
  titulo: string;
  origem: 'formacao' | 'solucao';
  concluidoEm?: string | null;
  codigo?: string | null;
  compacto?: boolean;
  modelo?: boolean;
};

/** A mesma identidade no card, na folha para impressão e na verificação pública.
 * O modo modelo é sempre identificado; não representa uma conclusão ou emissão.
 */
export function DocumentoCertificado({
  nome,
  titulo,
  origem,
  concluidoEm,
  codigo,
  compacto = false,
  modelo = false,
}: Props) {
  const Titulo = compacto ? 'h3' : 'h1';
  const data = concluidoEm
    ? new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeZone: 'America/Sao_Paulo' }).format(
        new Date(concluidoEm),
      )
    : null;

  return (
    <article
      className={styles.documento}
      data-compacto={compacto || undefined}
      data-modelo={modelo || undefined}
      aria-label={modelo ? 'Modelo de certificado' : `Certificado de ${titulo}`}
    >
      <header className={styles.marcas}>
        <SubidoLogo size={compacto ? 16 : 22} />
        <span className={styles.divisor} aria-hidden="true" />
        <ViverDeIaLogo
          className={styles.viaMarca}
          size={compacto ? 'compact' : 'default'}
          produto={false}
        />
      </header>

      <div className={styles.corpo}>
        <p className={styles.tipo}>{modelo ? 'Modelo · ' : ''}Certificado de conclusão</p>
        <p className={styles.intro}>Certificamos que</p>
        <p className={styles.nome}>{nome}</p>
        <p className={styles.concluiu}>
          concluiu{' '}
          {origem === 'formacao'
            ? 'a formação'
            : 'o aprendizado e a implementação guiada do projeto'}
        </p>
        <Titulo className={styles.titulo}>{titulo}</Titulo>
      </div>

      <footer className={styles.base}>
        <div className={styles.emissor}>
          <strong>Subido + Viver de IA</strong>
          <span>Aprendizado aplicado em inteligência artificial</span>
        </div>
        {data ? <time dateTime={concluidoEm!}>{data}</time> : null}
        {modelo ? <span>Prévia ilustrativa · sem validade</span> : null}
        {codigo ? <p className={styles.codigo}>Código de verificação · {codigo}</p> : null}
      </footer>
    </article>
  );
}
