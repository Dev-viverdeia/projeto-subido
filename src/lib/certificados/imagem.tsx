import 'server-only';

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { CST, DOCUMENT, SUBIDO } from '@/lib/brand';
import { TAMANHO_IMAGEM_CERTIFICADO } from './compartilhamento';

type Dados = { nome: string; titulo: string; concluido_em: string; origem: string };

/** Composição própria para o feed, com as mesmas marcas e dados da folha.
 * Next 16.3 já incorpora Geist Regular ao ImageResponse; não baixamos fontes externas.
 * O renderer não lê CSS variables: tintas vêm exclusivamente do módulo canônico de marca.
 */
export async function criarImagemCertificado(dados: Dados, modelo = false) {
  const [monograma, wordmark] = await Promise.all([
    readFile(join(process.cwd(), 'public/brand/via/monogram-navy.png'), 'base64'),
    readFile(join(process.cwd(), 'public/brand/via/wordmark-navy.png'), 'base64'),
  ]);
  const data = new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'long',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(dados.concluido_em));
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        padding: 28,
        background: DOCUMENT.soft,
        color: CST.navy,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          padding: '38px 52px',
          background: DOCUMENT.paper,
          border: `1px solid ${DOCUMENT.line}`,
          borderLeft: `8px solid ${CST.navy}`,
          borderRadius: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="30" height="30" viewBox="0 0 64 64">
              <path
                d="M21 4h25c8.3 0 14 5.9 14 14.5v23C60 50.1 54.1 56 45.5 56H26L10 64V20C10 10.7 14.5 4 21 4Z"
                fill={SUBIDO.blue}
              />
              <path d="M21 20h27v27H38V34L26 46l-8-8 12-12h-9V20Z" fill={CST.white} />
            </svg>
            <span style={{ fontSize: 30, letterSpacing: -1.2 }}>subido</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Satori requer img nativo; assets locais oficiais, nunca URL fornecida pelo usuário. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`data:image/png;base64,${monograma}`} width={51} height={28} alt="" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${wordmark}`}
              width={168}
              height={14}
              alt="Viver de IA"
            />
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 22, color: DOCUMENT.faint, marginBottom: 22 }}>
            {modelo ? 'Modelo de certificado' : 'Certificado de conclusão'}
          </div>
          <div
            style={{
              fontSize: dados.nome.length > 90 ? 34 : dados.nome.length > 45 ? 44 : 62,
              letterSpacing: -1.7,
              lineHeight: 1.12,
              maxWidth: 990,
              wordBreak: 'break-word',
            }}
          >
            {dados.nome}
          </div>
          <div style={{ marginTop: 18, fontSize: 18, color: DOCUMENT.faint }}>
            {dados.origem === 'formacao'
              ? 'Formação concluída'
              : 'Aprendizado e implementação guiada concluídos'}
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: dados.titulo.length > 90 ? 26 : 32,
              lineHeight: 1.2,
              maxWidth: 930,
              wordBreak: 'break-word',
            }}
          >
            {dados.titulo}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            paddingTop: 18,
            borderTop: `1px solid ${DOCUMENT.line}`,
            fontSize: 17,
            color: DOCUMENT.faint,
          }}
        >
          <span>{modelo ? 'Prévia ilustrativa · sem validade' : 'Subido + Viver de IA'}</span>
          <span>{data}</span>
        </div>
      </div>
    </div>,
    {
      ...TAMANHO_IMAGEM_CERTIFICADO,
      headers: {
        'Cache-Control': modelo ? 'no-store' : 'public, max-age=300, s-maxage=300',
        'Content-Disposition': 'inline; filename="certificado-subido.png"',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
