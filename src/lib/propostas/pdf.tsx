/* eslint-disable max-lines -- template PDF declarativo; páginas e estilos são validados visualmente juntos. */
import 'server-only';

import path from 'node:path';
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from '@react-pdf/renderer';
import { BRAND, CST, DOCUMENT } from '@/lib/brand';
import { subtituloVisivel } from './apresentacao';
import type { PropostaCompleta } from './queries';
import { formatarReais } from './schema';

const PASTA_FONTES = path.join(process.cwd(), 'src/assets/fonts/pdf');

Font.register({
  family: 'OutfitPdf',
  fonts: [
    { src: path.join(PASTA_FONTES, 'Outfit-Regular.ttf'), fontWeight: 400 },
    { src: path.join(PASTA_FONTES, 'Outfit-SemiBold.ttf'), fontWeight: 600 },
  ],
});
Font.register({
  family: 'GeistMonoPdf',
  src: path.join(PASTA_FONTES, 'GeistMono-Medium.ttf'),
  fontWeight: 500,
});
Font.registerHyphenationCallback((palavra) => [palavra]);

const COR = {
  navy: CST.navy,
  deep: CST.navyDeep,
  blue: CST.blue,
  blueInk: BRAND.accentInk,
  paper: DOCUMENT.paper,
  soft: DOCUMENT.soft,
  line: DOCUMENT.line,
  body: DOCUMENT.body,
  faint: DOCUMENT.faint,
  white: BRAND.white,
  coverMuted: DOCUMENT.coverMuted,
  coverLine: DOCUMENT.coverLine,
  coverFaint: DOCUMENT.coverFaint,
  coverDetail: DOCUMENT.coverDetail,
  coverBlue: DOCUMENT.coverBlue,
  coverMid: DOCUMENT.coverMid,
  decisionMuted: DOCUMENT.decisionMuted,
  signature: DOCUMENT.signature,
};

const estilos = StyleSheet.create({
  pagina: {
    padding: '58 54 52',
    backgroundColor: COR.paper,
    color: COR.navy,
    fontFamily: 'OutfitPdf',
    fontSize: 9.4,
    lineHeight: 1.46,
  },
  capa: {
    padding: '52 54',
    backgroundColor: COR.navy,
    color: COR.white,
    fontFamily: 'OutfitPdf',
  },
  marca: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  pontoMarca: { width: 7, height: 7, borderRadius: 4, backgroundColor: COR.blue },
  marcaTexto: {
    fontFamily: 'GeistMonoPdf',
    fontSize: 7.2,
    letterSpacing: 1.1,
    color: COR.white,
  },
  marcaX: { fontFamily: 'GeistMonoPdf', fontSize: 7, color: COR.coverMid },
  capaCentro: { marginTop: 135, width: '84%' },
  etiquetaAzul: {
    fontFamily: 'GeistMonoPdf',
    fontSize: 7.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COR.coverBlue,
  },
  capaTitulo: {
    marginTop: 14,
    fontSize: 38,
    fontWeight: 600,
    lineHeight: 0.96,
    letterSpacing: -1.4,
    color: COR.white,
  },
  capaSubtitulo: { marginTop: 16, fontSize: 11, lineHeight: 1.4, color: COR.coverMuted },
  capaMeta: {
    position: 'absolute',
    left: 54,
    right: 54,
    bottom: 54,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COR.coverLine,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaGrupo: { width: '60%' },
  metaGrupoDireita: { width: '30%', alignItems: 'flex-end' },
  metaRotulo: {
    marginBottom: 6,
    fontFamily: 'GeistMonoPdf',
    fontSize: 6.7,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COR.coverFaint,
  },
  metaValor: { fontSize: 12, fontWeight: 600, color: COR.white },
  metaDetalhe: { marginTop: 3, fontSize: 8, color: COR.coverDetail },
  cabecalho: {
    position: 'absolute',
    left: 54,
    right: 54,
    top: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cabecalhoMarca: {
    fontFamily: 'GeistMonoPdf',
    fontSize: 6.5,
    letterSpacing: 0.9,
    color: COR.navy,
  },
  cabecalhoMeta: {
    fontFamily: 'GeistMonoPdf',
    fontSize: 6.3,
    letterSpacing: 0.5,
    color: COR.faint,
  },
  rodape: {
    position: 'absolute',
    left: 54,
    right: 54,
    top: 805,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COR.line,
    flexDirection: 'row',
    justifyContent: 'space-between',
    color: COR.faint,
    fontFamily: 'GeistMonoPdf',
    fontSize: 6.3,
    letterSpacing: 0.5,
  },
  trilho: { flexDirection: 'row', marginBottom: 38 },
  trilhoItem: { flexGrow: 1, position: 'relative' },
  trilhoLinha: {
    position: 'absolute',
    left: 16,
    right: 0,
    top: 6,
    height: 1,
    backgroundColor: COR.line,
  },
  trilhoPonto: {
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: COR.navy,
    color: COR.white,
    textAlign: 'center',
    fontFamily: 'GeistMonoPdf',
    fontSize: 5.7,
    paddingTop: 2.1,
  },
  trilhoPontoFinal: { backgroundColor: COR.blue, color: COR.deep },
  trilhoTexto: {
    marginTop: 6,
    fontFamily: 'GeistMonoPdf',
    fontSize: 5.9,
    letterSpacing: 0.45,
    textTransform: 'uppercase',
    color: COR.faint,
  },
  tituloPagina: {
    marginBottom: 10,
    fontFamily: 'GeistMonoPdf',
    fontSize: 7.2,
    letterSpacing: 1.15,
    textTransform: 'uppercase',
    color: COR.blueInk,
  },
  tituloGrande: {
    width: '86%',
    marginBottom: 20,
    fontSize: 27,
    fontWeight: 600,
    lineHeight: 1.02,
    letterSpacing: -0.8,
    color: COR.navy,
  },
  intro: { width: '88%', marginBottom: 30, fontSize: 11, lineHeight: 1.55, color: COR.body },
  blocoFundo: { padding: 24, borderRadius: 10, backgroundColor: COR.soft },
  blocoRotulo: {
    marginBottom: 8,
    fontFamily: 'GeistMonoPdf',
    fontSize: 6.7,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    color: COR.blueInk,
  },
  blocoTitulo: { fontSize: 15, fontWeight: 600, lineHeight: 1.14, color: COR.navy },
  blocoTexto: { marginTop: 10, fontSize: 9.2, lineHeight: 1.55, color: COR.body },
  numeroSecao: { fontFamily: 'GeistMonoPdf', fontSize: 7.2, color: COR.blueInk },
  secaoCabecalho: { flexDirection: 'row', gap: 18, marginBottom: 22 },
  secaoTitulo: { marginTop: 4, fontSize: 23, fontWeight: 600, letterSpacing: -0.5 },
  escopoGrade: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: COR.line,
  },
  escopoItem: {
    width: '50%',
    minHeight: 98,
    padding: 15,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: COR.line,
  },
  escopoNumero: { marginBottom: 9, fontFamily: 'GeistMonoPdf', fontSize: 6.5, color: COR.blueInk },
  escopoTitulo: { marginBottom: 6, fontSize: 10.5, fontWeight: 600, lineHeight: 1.15 },
  escopoTexto: { fontSize: 8, lineHeight: 1.45, color: COR.body },
  duasColunas: { flexDirection: 'row', gap: 28 },
  coluna: { width: '50%' },
  listaItem: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  listaMarca: { width: 12, color: COR.blueInk, fontSize: 9 },
  listaTexto: { flexGrow: 1, fontSize: 8.7, lineHeight: 1.42, color: COR.body },
  marco: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 13,
    marginBottom: 13,
    borderBottomWidth: 1,
    borderBottomColor: COR.line,
  },
  marcoNumero: { width: 22, fontFamily: 'GeistMonoPdf', fontSize: 6.7, color: COR.blueInk },
  marcoCorpo: { flexGrow: 1 },
  marcoTopo: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  marcoTitulo: { fontSize: 10.2, fontWeight: 600 },
  marcoDuracao: { fontFamily: 'GeistMonoPdf', fontSize: 6.4, color: COR.faint },
  marcoTexto: { marginTop: 5, fontSize: 8.2, lineHeight: 1.42, color: COR.body },
  investimento: {
    marginTop: 32,
    padding: 28,
    borderRadius: 11,
    backgroundColor: COR.navy,
    color: COR.white,
  },
  investimentoTopo: { flexDirection: 'row', justifyContent: 'space-between', gap: 24 },
  investimentoValor: { marginTop: 9, fontSize: 27, fontWeight: 600, color: COR.white },
  investimentoValidade: { alignItems: 'flex-end' },
  validadeValor: { marginTop: 7, fontSize: 13, fontWeight: 600, color: COR.white },
  condicoes: {
    width: '78%',
    marginTop: 15,
    fontSize: 8.2,
    lineHeight: 1.45,
    color: COR.decisionMuted,
  },
  passoDecisao: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  passoCirculo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    paddingTop: 5,
    backgroundColor: COR.navy,
    color: COR.white,
    fontFamily: 'GeistMonoPdf',
    fontSize: 6.8,
    textAlign: 'center',
  },
  passoTexto: { flexGrow: 1, paddingTop: 4, fontSize: 10, color: COR.body },
  observacoes: { marginTop: 25, paddingTop: 18, borderTopWidth: 1, borderTopColor: COR.line },
  assinatura: {
    marginTop: 40,
    padding: 25,
    borderRadius: 10,
    backgroundColor: COR.soft,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 30,
  },
  assinaturaLinha: {
    width: '46%',
    paddingTop: 38,
    borderBottomWidth: 1,
    borderBottomColor: COR.signature,
  },
  assinaturaRotulo: {
    marginTop: 7,
    fontFamily: 'GeistMonoPdf',
    fontSize: 6.2,
    color: COR.faint,
    textTransform: 'uppercase',
  },
});

function textoPdf(valor: string): string {
  return valor
    .replace(/[–—−]/g, '-')
    .replace(/\u00a0/g, ' ')
    .trim();
}

function dataLonga(data: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  }).format(data);
}

function ElementosFixos({ versao }: { versao: number }) {
  return (
    <>
      <View style={estilos.cabecalho} fixed>
        <Text style={estilos.cabecalhoMarca}>SUBIDO × VIVER DE IA</Text>
        <Text style={estilos.cabecalhoMeta}>PROPOSTA V{String(versao).padStart(2, '0')}</Text>
      </View>
      <View style={estilos.rodape} fixed>
        <Text>CONFIDENCIAL · PROPOSTA COMERCIAL</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );
}

function LinhaDecisao() {
  return (
    <View style={estilos.trilho}>
      {['Contexto', 'Entrega', 'Prazo', 'Investimento', 'Decisão'].map((item, indice) => (
        <View style={estilos.trilhoItem} key={item}>
          {indice < 4 && <View style={estilos.trilhoLinha} />}
          <Text style={[estilos.trilhoPonto, indice === 4 ? estilos.trilhoPontoFinal : {}]}>
            {indice + 1}
          </Text>
          <Text style={estilos.trilhoTexto}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function PropostaPdf({
  proposta,
  profissional,
  geradoEm,
}: {
  proposta: PropostaCompleta;
  profissional: string;
  geradoEm: Date;
}) {
  const doc = proposta.documento;
  const subtitulo = subtituloVisivel(proposta.titulo, doc.projeto.titulo);
  return (
    <Document
      title={textoPdf(proposta.titulo)}
      author={profissional}
      subject={`Proposta comercial para ${textoPdf(doc.cliente.empresa)}`}
      creator="Viver de IA Subido"
      producer="Viver de IA Subido"
      language="pt-BR"
    >
      <Page size="A4" style={estilos.capa}>
        <View style={estilos.marca}>
          <View style={estilos.pontoMarca} />
          <Text style={estilos.marcaTexto}>SUBIDO</Text>
          <Text style={estilos.marcaX}>×</Text>
          <Text style={estilos.marcaTexto}>VIVER DE IA</Text>
        </View>
        <View style={estilos.capaCentro}>
          <Text style={estilos.etiquetaAzul}>Proposta comercial</Text>
          <Text style={estilos.capaTitulo}>{textoPdf(doc.projeto.titulo)}</Text>
          {subtitulo && <Text style={estilos.capaSubtitulo}>{textoPdf(subtitulo)}</Text>}
        </View>
        <View style={estilos.capaMeta}>
          <View style={estilos.metaGrupo}>
            <Text style={estilos.metaRotulo}>Preparada para</Text>
            <Text style={estilos.metaValor}>{textoPdf(doc.cliente.empresa)}</Text>
            {doc.cliente.contato && (
              <Text style={estilos.metaDetalhe}>
                {textoPdf(doc.cliente.contato)}
                {doc.cliente.cargo ? ` · ${textoPdf(doc.cliente.cargo)}` : ''}
              </Text>
            )}
          </View>
          <View style={estilos.metaGrupoDireita}>
            <Text style={estilos.metaRotulo}>Documento</Text>
            <Text style={estilos.metaValor}>V{String(proposta.versao).padStart(2, '0')}</Text>
            <Text style={estilos.metaDetalhe}>{dataLonga(geradoEm)}</Text>
          </View>
        </View>
      </Page>

      <Page size="A4" style={estilos.pagina}>
        <ElementosFixos versao={proposta.versao} />
        <LinhaDecisao />
        <Text style={estilos.tituloPagina}>Contexto e objetivo</Text>
        <Text style={estilos.tituloGrande}>Uma decisão clara começa pelo problema certo.</Text>
        <Text style={estilos.intro}>{textoPdf(doc.desafio)}</Text>
        <View style={estilos.blocoFundo} wrap={false}>
          <Text style={estilos.blocoRotulo}>Resultado esperado</Text>
          <Text style={estilos.blocoTitulo}>{textoPdf(doc.objetivo)}</Text>
          <Text style={estilos.blocoTexto}>{textoPdf(doc.projeto.resumo)}</Text>
        </View>
      </Page>

      <Page size="A4" style={estilos.pagina}>
        <ElementosFixos versao={proposta.versao} />
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.numeroSecao}>02</Text>
          <View>
            <Text style={estilos.tituloPagina}>O que será entregue</Text>
            <Text style={estilos.secaoTitulo}>Escopo do projeto</Text>
          </View>
        </View>
        <View style={estilos.escopoGrade}>
          {doc.escopo.map((item, indice) => (
            <View style={estilos.escopoItem} key={`${item.titulo}-${indice}`} wrap={false}>
              <Text style={estilos.escopoNumero}>{String(indice + 1).padStart(2, '0')}</Text>
              <Text style={estilos.escopoTitulo}>{textoPdf(item.titulo)}</Text>
              <Text style={estilos.escopoTexto}>{textoPdf(item.descricao)}</Text>
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={estilos.pagina}>
        <ElementosFixos versao={proposta.versao} />
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.numeroSecao}>03</Text>
          <View>
            <Text style={estilos.tituloPagina}>Forma de execução</Text>
            <Text style={estilos.secaoTitulo}>Entregáveis e cronograma</Text>
          </View>
        </View>
        <View style={estilos.duasColunas}>
          <View style={estilos.coluna}>
            <Text style={estilos.blocoRotulo}>O cliente recebe</Text>
            {doc.entregaveis.map((item, indice) => (
              <View style={estilos.listaItem} key={`${item}-${indice}`} wrap={false}>
                <Text style={estilos.listaMarca}>✓</Text>
                <Text style={estilos.listaTexto}>{textoPdf(item)}</Text>
              </View>
            ))}
          </View>
          <View style={estilos.coluna}>
            <Text style={estilos.blocoRotulo}>Marcos do projeto</Text>
            {doc.cronograma.map((item, indice) => (
              <View style={estilos.marco} key={`${item.fase}-${indice}`} wrap={false}>
                <Text style={estilos.marcoNumero}>{String(indice + 1).padStart(2, '0')}</Text>
                <View style={estilos.marcoCorpo}>
                  <View style={estilos.marcoTopo}>
                    <Text style={estilos.marcoTitulo}>{textoPdf(item.fase)}</Text>
                    <Text style={estilos.marcoDuracao}>{textoPdf(item.duracao)}</Text>
                  </View>
                  <Text style={estilos.marcoTexto}>{textoPdf(item.descricao)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </Page>

      <Page size="A4" style={estilos.pagina}>
        <ElementosFixos versao={proposta.versao} />
        <View style={estilos.secaoCabecalho}>
          <Text style={estilos.numeroSecao}>04</Text>
          <View>
            <Text style={estilos.tituloPagina}>Condições para avançar</Text>
            <Text style={estilos.secaoTitulo}>Investimento e decisão</Text>
          </View>
        </View>

        <View style={estilos.investimento} wrap={false}>
          <View style={estilos.investimentoTopo}>
            <View>
              <Text style={[estilos.blocoRotulo, { color: COR.coverBlue }]}>
                Investimento do projeto
              </Text>
              <Text style={estilos.investimentoValor}>
                {formatarReais(doc.investimento.valorCentavos)}
              </Text>
            </View>
            <View style={estilos.investimentoValidade}>
              <Text style={[estilos.blocoRotulo, { color: COR.coverFaint }]}>Validade</Text>
              <Text style={estilos.validadeValor}>{doc.validadeDias} dias</Text>
            </View>
          </View>
          <Text style={estilos.condicoes}>{textoPdf(doc.investimento.condicoes)}</Text>
        </View>

        <View style={{ marginTop: 32 }}>
          <Text style={estilos.blocoRotulo}>Próximos passos</Text>
          {doc.proximosPassos.map((item, indice) => (
            <View style={estilos.passoDecisao} key={`${item}-${indice}`} wrap={false}>
              <Text style={estilos.passoCirculo}>{indice + 1}</Text>
              <Text style={estilos.passoTexto}>{textoPdf(item)}</Text>
            </View>
          ))}
        </View>

        {doc.observacoes && (
          <View style={estilos.observacoes}>
            <Text style={estilos.blocoRotulo}>Observações</Text>
            <Text style={estilos.blocoTexto}>{textoPdf(doc.observacoes)}</Text>
          </View>
        )}

        <View style={estilos.assinatura} wrap={false}>
          <View style={estilos.assinaturaLinha}>
            <Text style={estilos.assinaturaRotulo}>Responsável pela proposta</Text>
          </View>
          <View style={estilos.assinaturaLinha}>
            <Text style={estilos.assinaturaRotulo}>Aprovação do cliente</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export async function renderizarPropostaPdf({
  proposta,
  profissional,
  geradoEm = new Date(),
}: {
  proposta: PropostaCompleta;
  profissional: string;
  geradoEm?: Date;
}): Promise<Buffer> {
  return renderToBuffer(
    <PropostaPdf proposta={proposta} profissional={profissional} geradoEm={geradoEm} />,
  );
}
