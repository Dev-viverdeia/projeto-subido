'use client';

import Image from 'next/image';
import { useActionState, useMemo, useRef, useState } from 'react';
import { Check, ExternalLink, ImageUp, RotateCcw, Trash2 } from 'lucide-react';
import { Spinner } from '@/design-system/via';
import { salvarPerfilComercial, type EstadoPerfilComercial } from '@/lib/perfil-comercial/actions';
import type { PerfilComercial } from '@/lib/perfil-comercial/schema';
import { createClient } from '@/lib/supabase/client';
import styles from './FormularioPerfilComercial.module.css';

const INICIAL: EstadoPerfilComercial = {};
const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const LIMITE = 2 * 1024 * 1024;

type Campos = {
  nomeResponsavel: string;
  nomeNegocio: string;
  email: string;
  telefone: string;
  site: string;
  logoPath: string;
  logoUrl: string;
  linkPagamentoPadrao: string;
};

function camposDoPerfil(perfil: PerfilComercial): Campos {
  return {
    nomeResponsavel: perfil.nomeResponsavel,
    nomeNegocio: perfil.nomeNegocio ?? '',
    email: perfil.email ?? '',
    telefone: perfil.telefone ?? '',
    site: perfil.site ?? '',
    logoPath: perfil.logoPath ?? '',
    logoUrl: perfil.logoUrl ?? '',
    linkPagamentoPadrao: perfil.linkPagamentoPadrao ?? '',
  };
}

export function FormularioPerfilComercial({ perfil }: { perfil: PerfilComercial }) {
  const baseInicial = useMemo(() => camposDoPerfil(perfil), [perfil]);
  const [salvo, setSalvo] = useState(baseInicial);
  const [campos, setCampos] = useState(baseInicial);
  const [estado, acao, salvando] = useActionState(
    async (estadoAnterior: EstadoPerfilComercial, dados: FormData) => {
      const resultado = await salvarPerfilComercial(estadoAnterior, dados);
      if (resultado.sucesso) setSalvo(campos);
      return resultado;
    },
    INICIAL,
  );
  const [enviandoLogo, setEnviandoLogo] = useState(false);
  const [erroLogo, setErroLogo] = useState<string | null>(null);
  const arquivo = useRef<HTMLInputElement>(null);
  const alterado = JSON.stringify(campos) !== JSON.stringify(salvo);

  function mudar(campo: keyof Campos, valor: string) {
    setCampos((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviarLogo(imagem: File) {
    setErroLogo(null);
    if (!TIPOS.includes(imagem.type)) {
      setErroLogo('Use uma imagem JPG, PNG, WebP ou AVIF.');
      return;
    }
    if (imagem.size > LIMITE) {
      setErroLogo('A imagem precisa ter no máximo 2 MB.');
      return;
    }

    setEnviandoLogo(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setEnviandoLogo(false);
      setErroLogo('Sua sessão expirou. Entre novamente para enviar a marca.');
      return;
    }

    const extensao = imagem.type.split('/')[1]?.replace('jpeg', 'jpg') ?? 'png';
    const caminho = `${user.id}/marca-${Date.now()}.${extensao}`;
    const { error } = await supabase.storage
      .from('identidade-comercial')
      .upload(caminho, imagem, { cacheControl: '31536000', upsert: false });

    if (error) {
      console.error('[perfil-comercial:logo]', error.message);
      setEnviandoLogo(false);
      setErroLogo('Não foi possível enviar a marca. Tente novamente.');
      return;
    }

    const { data } = supabase.storage.from('identidade-comercial').getPublicUrl(caminho);
    setCampos((atual) => ({ ...atual, logoPath: caminho, logoUrl: data.publicUrl }));
    setEnviandoLogo(false);
  }

  function removerLogo() {
    setErroLogo(null);
    setCampos((atual) => ({ ...atual, logoPath: '', logoUrl: '' }));
  }

  return (
    <form action={acao} className={styles.formulario}>
      <input type="hidden" name="logoPath" value={campos.logoPath} />

      <div className={styles.marcaArea}>
        <div className={styles.marcaPreview}>
          {campos.logoUrl ? (
            <Image src={campos.logoUrl} alt="Marca comercial" width={128} height={64} unoptimized />
          ) : (
            <span>{campos.nomeNegocio.slice(0, 2).toUpperCase() || 'SUA'}</span>
          )}
        </div>
        <div>
          <strong>Sua marca na proposta</strong>
          <p>Use uma versão horizontal, com fundo transparente e boa leitura em fundo claro.</p>
          <div className={styles.acoesMarca}>
            <button type="button" onClick={() => arquivo.current?.click()} disabled={enviandoLogo}>
              {enviandoLogo ? <Spinner size="sm" /> : <ImageUp size={15} aria-hidden="true" />}
              {enviandoLogo ? 'Enviando' : campos.logoUrl ? 'Trocar marca' : 'Enviar marca'}
            </button>
            {campos.logoUrl && (
              <button type="button" onClick={removerLogo} className={styles.remover}>
                <Trash2 size={14} aria-hidden="true" /> Remover
              </button>
            )}
          </div>
          <input
            ref={arquivo}
            className={styles.arquivo}
            type="file"
            accept={TIPOS.join(',')}
            onChange={(evento) => {
              const imagem = evento.target.files?.[0];
              if (imagem) void enviarLogo(imagem);
              evento.target.value = '';
            }}
          />
          {erroLogo && <em role="alert">{erroLogo}</em>}
        </div>
      </div>

      <div className={styles.gradeCampos}>
        <label>
          <span>Responsável pelas propostas</span>
          <input
            name="nomeResponsavel"
            value={campos.nomeResponsavel}
            minLength={2}
            maxLength={120}
            required
            onChange={(evento) => mudar('nomeResponsavel', evento.target.value)}
            aria-invalid={Boolean(estado.porCampo?.nomeResponsavel)}
          />
          {estado.porCampo?.nomeResponsavel && <em>{estado.porCampo.nomeResponsavel}</em>}
        </label>
        <label>
          <span>
            Nome do negócio <small>opcional</small>
          </span>
          <input
            name="nomeNegocio"
            value={campos.nomeNegocio}
            maxLength={160}
            placeholder="Ex.: Milagre Automações"
            onChange={(evento) => mudar('nomeNegocio', evento.target.value)}
          />
        </label>
        <label>
          <span>E-mail comercial</span>
          <input
            name="email"
            type="email"
            value={campos.email}
            maxLength={254}
            placeholder="voce@suaempresa.com.br"
            onChange={(evento) => mudar('email', evento.target.value)}
            aria-invalid={Boolean(estado.porCampo?.email)}
          />
          {estado.porCampo?.email && <em>{estado.porCampo.email}</em>}
        </label>
        <label>
          <span>Telefone ou WhatsApp</span>
          <input
            name="telefone"
            value={campos.telefone}
            maxLength={40}
            placeholder="(11) 99999-9999"
            onChange={(evento) => mudar('telefone', evento.target.value)}
          />
        </label>
        <label>
          <span>Site</span>
          <input
            name="site"
            type="url"
            value={campos.site}
            maxLength={500}
            placeholder="https://suaempresa.com.br"
            onChange={(evento) => mudar('site', evento.target.value)}
            aria-invalid={Boolean(estado.porCampo?.site)}
          />
          {estado.porCampo?.site && <em>{estado.porCampo.site}</em>}
        </label>
        <label>
          <span>
            Link de pagamento padrão <small>opcional</small>
          </span>
          <div className={styles.campoComIcone}>
            <ExternalLink size={15} aria-hidden="true" />
            <input
              name="linkPagamentoPadrao"
              type="url"
              value={campos.linkPagamentoPadrao}
              maxLength={1000}
              placeholder="https://seu-checkout.com/..."
              onChange={(evento) => mudar('linkPagamentoPadrao', evento.target.value)}
              aria-invalid={Boolean(estado.porCampo?.linkPagamentoPadrao)}
            />
          </div>
          {estado.porCampo?.linkPagamentoPadrao && <em>{estado.porCampo.linkPagamentoPadrao}</em>}
        </label>
      </div>

      <aside className={styles.nota}>
        A Subido apenas leva o cliente ao seu checkout. O pagamento, as taxas e o recebimento ficam
        na conta que você já usa.
      </aside>

      <div className={styles.rodape}>
        <p className={estado.erro ? styles.erro : estado.sucesso ? styles.sucesso : undefined}>
          {estado.erro ??
            estado.sucesso ??
            (alterado ? 'Salve para usar estes dados nas próximas propostas.' : 'Tudo salvo.')}
        </p>
        <div>
          <button
            type="button"
            className={styles.descartar}
            disabled={!alterado || salvando}
            onClick={() => setCampos(salvo)}
          >
            <RotateCcw size={14} aria-hidden="true" /> Descartar
          </button>
          <button type="submit" className={styles.salvar} disabled={!alterado || salvando}>
            {salvando ? (
              <Spinner size="sm" tone="inverse" />
            ) : (
              <Check size={15} aria-hidden="true" />
            )}
            {salvando ? 'Salvando' : 'Salvar identidade'}
          </button>
        </div>
      </div>
    </form>
  );
}
