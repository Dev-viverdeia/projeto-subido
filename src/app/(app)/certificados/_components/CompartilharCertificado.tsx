'use client';

import { useState } from 'react';
import { Check, Copy, Download, ExternalLink, ImageOff } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import { ModalOperacao } from '../../_components/ModalOperacao';
import {
  dadosPerfilCertificado,
  LINKEDIN_PERFIL,
  linkPublicacaoLinkedIn,
} from '@/lib/certificados/compartilhamento';
import styles from './CompartilharCertificado.module.css';

export function CompartilharCertificado({
  onClose,
  titulo,
  codigo,
  urlPublica,
  data,
  imagemPreview,
}: {
  onClose: () => void;
  titulo: string;
  codigo: string;
  urlPublica: string;
  data?: string | null;
  imagemPreview?: string;
}) {
  const [destino, setDestino] = useState<'publicacao' | 'perfil'>('publicacao');
  const [copiado, setCopiado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [imagemFalhou, setImagemFalhou] = useState(false);
  const [imagemCarregando, setImagemCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  const imagem = imagemPreview ?? `/certificado/${codigo}/imagem`;
  const campos = dadosPerfilCertificado(titulo, codigo, urlPublica, data);

  async function copiar(rotulo: string, valor: string) {
    try {
      await navigator.clipboard.writeText(valor);
      setCopiado(rotulo);
      setErro(null);
    } catch {
      setCopiado(null);
      setErro('Não foi possível copiar. Selecione o campo e copie manualmente.');
    }
  }

  return (
    <ModalOperacao
      open
      onClose={onClose}
      title="Compartilhar certificado"
      size="md"
      footer={
        <a
          className={styles.primario}
          href={destino === 'perfil' ? LINKEDIN_PERFIL : linkPublicacaoLinkedIn(urlPublica)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {destino === 'perfil' ? 'Adicionar ao perfil no LinkedIn' : 'Publicar no LinkedIn'}
          <ExternalLink size={17} aria-hidden="true" />
        </a>
      }
    >
      <div className={styles.conteudo}>
        <div className={styles.destinos} role="group" aria-label="Onde compartilhar">
          <button
            type="button"
            aria-pressed={destino === 'publicacao'}
            onClick={() => setDestino('publicacao')}
          >
            Publicação
          </button>
          <button
            type="button"
            aria-pressed={destino === 'perfil'}
            onClick={() => setDestino('perfil')}
          >
            Perfil
          </button>
        </div>

        {destino === 'publicacao' ? (
          <>
            <figure className={styles.previa}>
              {imagemFalhou ? (
                <div className={styles.falhaImagem} role="status">
                  <ImageOff size={24} aria-hidden="true" />
                  <p>A prévia não carregou. Seu link continua disponível.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setTentativa((v) => v + 1);
                      setImagemFalhou(false);
                      setImagemCarregando(true);
                    }}
                  >
                    Recarregar prévia
                  </button>
                </div>
              ) : (
                // A imagem já é um PNG de 1200 × 627; não passa por outra otimização nem depende de sessão.
                <div className={styles.moldura}>
                  {imagemCarregando ? (
                    <div className={styles.carregando} role="status">
                      <Spinner size="md" label="Preparando prévia" />
                    </div>
                  ) : null}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${imagem}${imagem.includes('?') ? '&' : '?'}v=${tentativa}`}
                    width={1200}
                    height={627}
                    alt={`Prévia do certificado de ${titulo}`}
                    onLoad={() => setImagemCarregando(false)}
                    onError={() => {
                      setImagemFalhou(true);
                      setImagemCarregando(false);
                    }}
                  />
                </div>
              )}
              <figcaption>Você revisa a publicação no LinkedIn antes de postar.</figcaption>
            </figure>
            <div className={styles.utilitarios}>
              <a href={imagem} download="certificado-subido.png">
                <Download size={17} aria-hidden="true" />
                Baixar imagem
              </a>
              <a href={urlPublica} target="_blank" rel="noopener noreferrer">
                Ver registro público
                <ExternalLink size={15} aria-hidden="true" />
              </a>
            </div>
          </>
        ) : (
          <>
            <p className={styles.orientacao}>
              Abra o LinkedIn e use estes dados em Licenças e certificados.
            </p>
            <dl className={styles.campos}>
              {campos.map(({ rotulo, valor }) => (
                <div key={rotulo}>
                  <dt>{rotulo}</dt>
                  <dd>
                    <span>{valor}</span>
                    <button
                      type="button"
                      aria-label={`Copiar ${rotulo.toLowerCase()}`}
                      onClick={() => void copiar(rotulo, valor)}
                    >
                      {copiado === rotulo ? (
                        <Check size={18} aria-hidden="true" />
                      ) : (
                        <Copy size={18} aria-hidden="true" />
                      )}
                    </button>
                  </dd>
                </div>
              ))}
            </dl>
            <p className={styles.feedback} role={erro ? 'alert' : 'status'}>
              {erro ??
                (copiado
                  ? `${copiado}: copiado.`
                  : 'O LinkedIn pode pedir o preenchimento manual.')}
            </p>
          </>
        )}
      </div>
    </ModalOperacao>
  );
}
