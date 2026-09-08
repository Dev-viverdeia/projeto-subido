import { SubidoLogo } from '@/components/brand/SubidoLogo';
import { ViverDeIaLogo } from '@/components/brand/ViverDeIaLogo';
import { BadgeCheck } from 'lucide-react';
import Image from 'next/image';
import { apresentacaoCertificado } from '@/lib/certificados/apresentacao';
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
  const apresentacao = apresentacaoCertificado(nome);
  const ilustrativo = modelo || apresentacao.demonstracao;
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
      <div className={styles.assinaturaVisual} aria-hidden="true">
        <div className={styles.placa}>
          <Image
            src="/brand/via/monogram-white.png"
            width={434}
            height={239}
            alt=""
            loading="eager"
          />
        </div>
      </div>
      <header className={styles.marcas}>
        <SubidoLogo size={compacto ? 16 : 20} className={styles.subidoMarca} />
        <span className={styles.separadorMarcas} aria-hidden="true" />
        <ViverDeIaLogo className={styles.viaMarca} size="default" produto={false} />
      </header>

      <div className={styles.corpo}>
        <p className={styles.tipo}>
          {apresentacao.demonstracao
            ? 'Certificado de demonstração'
            : modelo
              ? 'Modelo de certificado'
              : 'Certificado de conclusão'}
        </p>
        <p className={styles.nome} data-extenso={apresentacao.nome.length > 40 || undefined}>
          {apresentacao.nome}
        </p>
        <p className={styles.concluiu}>
          {ilustrativo ? 'Prévia' : 'Pela conclusão'}{' '}
          {origem === 'formacao'
            ? 'da formação'
            : 'do aprendizado e da implementação guiada do projeto'}
        </p>
        <Titulo className={styles.titulo}>{titulo}</Titulo>
      </div>

      <footer className={styles.base}>
        {data ? (
          <div className={styles.data}>
            <span>{ilustrativo ? 'Data ilustrativa' : 'Concluído em'}</span>
            <time dateTime={concluidoEm!}>{data}</time>
          </div>
        ) : null}
        {codigo ? (
          <div className={styles.codigo}>
            <span>
              <BadgeCheck size={17} strokeWidth={1.6} aria-hidden="true" />
              Código de verificação
            </span>
            <code>{codigo}</code>
          </div>
        ) : null}
        {ilustrativo ? (
          <span className={styles.avisoModelo}>Prévia ilustrativa · sem validade</span>
        ) : null}
      </footer>
    </article>
  );
}
