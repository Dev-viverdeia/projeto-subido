import 'server-only';

import path from 'node:path';
import {
  Document,
  Font,
  Link,
  Page,
  Path,
  Svg,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';
import { CST } from '@/lib/brand';
import { subtituloVisivel } from './apresentacao';
import { estilosPdf as e } from './pdf-estilos';
import type { PropostaCompleta } from './queries';
import { formatarReais } from './schema';

const PASTA_FONTES = path.join(process.cwd(), 'src/assets/fonts/pdf');
Font.register({
  family: 'GeistPdf',
  fonts: [
    { src: path.join(PASTA_FONTES, 'Geist-Regular.ttf'), fontWeight: 400 },
    { src: path.join(PASTA_FONTES, 'Geist-SemiBold.ttf'), fontWeight: 600 },
  ],
});
Font.register({
  family: 'GeistMonoPdf',
  src: path.join(PASTA_FONTES, 'GeistMono-Medium.ttf'),
  fontWeight: 500,
});
Font.registerHyphenationCallback((palavra) => [palavra]);

/** Prepara o texto para a largura disponível, sem resumir conteúdo do snapshot. */
function textoPdf(valor: string, limiteToken = 40): string {
  return (
    valor
      .replace(/[–—−‑]/g, '-')
      .replace(/\u00a0/g, ' ')
      // URLs/identificadores longos precisam de quebras explícitas: o renderer
      // pode cortá-los e pontos de quebra invisíveis acrescentam hífens no PDF.
      // Só o texto renderizado muda de linha; o snapshot original é preservado.
      .replace(new RegExp(`\\S{${limiteToken},}`, 'gu'), (palavra) => {
        const caracteres = Array.from(palavra);
        const linhas = [];
        for (let i = 0; i < caracteres.length; i += limiteToken) {
          linhas.push(caracteres.slice(i, i + limiteToken).join(''));
        }
        return linhas.join('\n');
      })
      .trim()
  );
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
      <View style={e.cabecalho} fixed>
        <Text style={e.cabecalhoTitulo}>Proposta</Text>
        <Text style={e.metadado}>Versão {versao}</Text>
      </View>
      <View style={e.rodape} fixed>
        <Text>Confidencial · Criado com Subido</Text>
        <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
      </View>
    </>
  );
}

function TituloSecao({ id, children }: { id: string; children: string }) {
  // 4.5.1 resolve bookmarks em qualquer nó, mas os tipos só os declaram em Page.
  // O sumário e seus destinos são conferidos no PDF gerado pelo teste de integração.
  const marcador = { bookmark: children };
  return (
    <View id={id} {...marcador} minPresenceAhead={160}>
      <Text style={e.secaoTitulo}>{children}</Text>
    </View>
  );
}

function PropostaPdf({
  proposta,
  profissional,
  geradoEm,
}: {
  proposta: Pick<PropostaCompleta, 'titulo' | 'versao' | 'documento'>;
  profissional: string;
  geradoEm: Date;
}) {
  const d = proposta.documento;
  const fornecedor = d.fornecedor;
  const subtitulo = subtituloVisivel(proposta.titulo, d.projeto.titulo);
  const marcadorResumo = { bookmark: 'Resumo' };
  return (
    <Document
      title={textoPdf(proposta.titulo)}
      author={profissional}
      subject={`Proposta para ${textoPdf(d.cliente.empresa)}`}
      creator="Viver de IA Subido"
      producer="Viver de IA Subido"
      language="pt-BR"
    >
      <Page size="A4" style={e.pagina}>
        <ElementosFixos versao={proposta.versao} />
        <Text style={e.fornecedor}>{textoPdf(profissional)}</Text>
        <View {...marcadorResumo}>
          <Text style={e.titulo}>{textoPdf(d.projeto.titulo, 16)}</Text>
        </View>
        {subtitulo && <Text style={e.subtitulo}>{textoPdf(subtitulo)}</Text>}
        <View style={e.destinatario}>
          <Text style={e.rotulo}>Preparada para</Text>
          <Text style={e.empresa}>{textoPdf(d.cliente.empresa)}</Text>
          {(d.cliente.contato || d.cliente.cargo) && (
            <Text style={e.contato}>
              {textoPdf([d.cliente.contato, d.cliente.cargo].filter(Boolean).join(' · '))}
            </Text>
          )}
          {d.cliente.email && <Text style={e.contato}>{textoPdf(d.cliente.email)}</Text>}
        </View>

        <View style={e.investimento}>
          <View style={e.investimentoTopo} wrap={false}>
            <View style={e.valorGrupo}>
              <Text id="investimento" style={e.rotulo}>
                Investimento
              </Text>
              <Text style={e.valor}>{formatarReais(d.investimento.valorCentavos)}</Text>
            </View>
            <View style={e.validade}>
              <Text style={e.rotulo}>Validade</Text>
              <Text style={e.validadeValor}>
                {d.validadeDias} {d.validadeDias === 1 ? 'dia' : 'dias'}
              </Text>
            </View>
          </View>
          <Text style={e.condicoes} orphans={3} widows={3}>
            {textoPdf(d.investimento.condicoes)}
          </Text>
        </View>

        <View style={e.indice} wrap={false}>
          <Link src="#escopo" style={e.linkIndice}>
            Escopo e entregáveis
          </Link>
          <Link src="#prazo" style={e.linkIndice}>
            Cronograma
          </Link>
          <Link src="#proximos-passos" style={e.linkIndice}>
            Próximos passos
          </Link>
        </View>
        <Text style={e.resumo}>{textoPdf(d.projeto.resumo)}</Text>
        <Text style={e.subsecao} minPresenceAhead={48}>
          Desafio
        </Text>
        <Text style={e.texto} orphans={3} widows={3}>
          {textoPdf(d.desafio)}
        </Text>
        <Text style={e.subsecao} minPresenceAhead={48}>
          Objetivo
        </Text>
        <Text style={e.texto} orphans={3} widows={3}>
          {textoPdf(d.objetivo)}
        </Text>
      </Page>

      <Page size="A4" style={e.pagina}>
        <ElementosFixos versao={proposta.versao} />
        <TituloSecao id="escopo">Escopo e entregáveis</TituloSecao>
        {d.escopo.map((item, indice) => (
          <View style={e.escopo} key={`escopo-${indice}`}>
            <Text style={e.texto} orphans={5} widows={3}>
              <Text style={e.escopoTitulo}>{textoPdf(item.titulo)}</Text>
              {'\n'}
              {textoPdf(item.descricao)}
            </Text>
          </View>
        ))}

        <Text style={e.subsecao} minPresenceAhead={54}>
          O que você recebe
        </Text>
        {d.entregaveis.map((item, indice) => (
          <View style={e.entregavel} key={`entregavel-${indice}`} wrap={false}>
            <Svg width={13} height={13} viewBox="0 0 16 16" style={e.check}>
              <Path d="M3 8.5 6.5 12 13 4.5" stroke={CST.navy} strokeWidth={1.5} fill="none" />
            </Svg>
            <Text style={e.itemTexto}>{textoPdf(item)}</Text>
          </View>
        ))}

        <TituloSecao id="prazo">Cronograma</TituloSecao>
        {d.cronograma.map((item, indice) => (
          <View style={e.marco} key={`marco-${indice}`} wrap={false}>
            <Text style={e.marcoNumero}>{String(indice + 1).padStart(2, '0')}</Text>
            <View style={e.marcoCorpo}>
              <Text style={e.marcoTitulo}>{textoPdf(item.fase, 32)}</Text>
              <Text style={e.marcoDuracao}>{textoPdf(item.duracao)}</Text>
              <Text style={e.texto}>{textoPdf(item.descricao)}</Text>
            </View>
          </View>
        ))}

        <TituloSecao id="proximos-passos">Próximos passos</TituloSecao>
        {d.proximosPassos.map((item, indice) => (
          <View style={e.passo} key={`passo-${indice}`} wrap={false}>
            <Text style={e.passoNumero}>{String(indice + 1).padStart(2, '0')}</Text>
            <Text style={e.itemTexto}>{textoPdf(item)}</Text>
          </View>
        ))}

        {d.observacoes && (
          <View style={e.observacoes}>
            <Text style={e.subsecao} minPresenceAhead={48}>
              Observações
            </Text>
            <Text style={e.texto} orphans={3} widows={3}>
              {textoPdf(d.observacoes)}
            </Text>
          </View>
        )}

        <View style={e.assinaturas} wrap={false}>
          <View style={e.assinatura}>
            <View style={e.assinaturaLinha} />
            <Text style={e.rotulo}>Responsável</Text>
            <Text style={e.assinaturaNome}>
              {textoPdf(fornecedor?.nomeResponsavel ?? profissional, 20)}
            </Text>
          </View>
          <View style={e.assinatura}>
            <View style={e.assinaturaLinha} />
            <Text style={e.rotulo}>Aprovação do cliente</Text>
            <Text style={e.assinaturaNome}>
              {textoPdf(d.cliente.contato || d.cliente.empresa, 20)}
            </Text>
          </View>
        </View>
        <View style={e.final} wrap={false}>
          {fornecedor?.email && <Text style={e.contato}>{textoPdf(fornecedor.email)}</Text>}
          {fornecedor?.telefone && <Text style={e.contato}>{textoPdf(fornecedor.telefone)}</Text>}
          {fornecedor?.site && <Text style={e.contato}>{textoPdf(fornecedor.site)}</Text>}
          <Text style={e.geradoEm}>
            PDF gerado em {dataLonga(geradoEm)} · Versão {proposta.versao}
          </Text>
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
  proposta: Pick<PropostaCompleta, 'titulo' | 'versao' | 'documento'>;
  profissional: string;
  geradoEm?: Date;
}): Promise<Buffer> {
  return renderToBuffer(
    <PropostaPdf proposta={proposta} profissional={profissional} geradoEm={geradoEm} />,
  );
}
