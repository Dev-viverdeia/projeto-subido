'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { ImageUp, Trash2 } from 'lucide-react';
import { Button } from '@/design-system/via';
import { createClient } from '@/lib/supabase/client';
import styles from './formulario.module.css';

const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const LIMITE_BYTES = 5 * 1024 * 1024;

/**
 * Envio da capa direto do browser para o Storage.
 *
 * POR QUE NÃO PASSA PELA SERVER ACTION
 * Server Action recebe o arquivo como parte do corpo do POST, e o corpo tem limite
 * de tamanho na função. Enviar direto do cliente para o Storage tira a imagem do
 * caminho do servidor de aplicação por completo — o upload é browser → Supabase, e
 * o formulário só guarda a URL resultante.
 *
 * A AUTORIZAÇÃO NÃO FICA FRACA POR ISSO: a policy de INSERT em `storage.objects`
 * exige `private.eh_admin()`, avaliada no banco com a sessão de quem envia. Um
 * não-admin que chamasse este mesmo código receberia 403 do Storage.
 *
 * As checagens de tipo e tamanho aqui são conveniência — devolvem erro na hora em
 * vez de depois do upload. A regra de verdade está no bucket (`allowed_mime_types`
 * e `file_size_limit`), que é onde ela não pode ser contornada.
 */
export function CapaUpload({
  valor,
  aoMudar,
  erro,
}: {
  valor: string;
  aoMudar: (url: string) => void;
  erro?: string;
}) {
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  async function enviar(arquivo: File) {
    setFalha(null);

    if (!TIPOS.includes(arquivo.type)) {
      setFalha('Formato não aceito. Use JPG, PNG, WebP ou AVIF.');
      return;
    }
    if (arquivo.size > LIMITE_BYTES) {
      setFalha('Imagem acima de 5 MB.');
      return;
    }

    setEnviando(true);
    const supabase = createClient();
    /* Nome derivado de crypto.randomUUID e não do nome original: nome de arquivo
       do usuário carrega acento, espaço e caminho, e dois envios do mesmo
       "capa.png" sobrescreveriam um ao outro. */
    const extensao = arquivo.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const caminho = `${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage.from('capas').upload(caminho, arquivo, {
      cacheControl: '31536000',
      upsert: false,
    });

    setEnviando(false);

    if (error) {
      console.error('[admin:capa:upload]', error.message);
      setFalha('Não foi possível enviar a imagem. Tente de novo.');
      return;
    }

    const { data } = supabase.storage.from('capas').getPublicUrl(caminho);
    aoMudar(data.publicUrl);
  }

  return (
    <div className={styles.campo}>
      <span className={styles.rotulo}>Capa</span>

      {valor ? (
        <div className={styles.capaPreview}>
          <Image src={valor} alt="Capa selecionada" width={160} height={90} unoptimized />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            iconLeft={<Trash2 size={15} strokeWidth={1.8} />}
            onClick={() => aoMudar('')}
          >
            Remover
          </Button>
        </div>
      ) : (
        <div className={styles.capaVazia}>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            loading={enviando}
            iconLeft={<ImageUp size={15} strokeWidth={1.8} />}
            onClick={() => input.current?.click()}
          >
            {enviando ? 'Enviando' : 'Enviar imagem'}
          </Button>
          <span className={styles.dica}>JPG, PNG, WebP ou AVIF · até 5 MB</span>
        </div>
      )}

      <input
        ref={input}
        type="file"
        accept={TIPOS.join(',')}
        className={styles.arquivoOculto}
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          /* `void` porque o handler é síncrono e o eslint proíbe promise solta. */
          if (arquivo) void enviar(arquivo);
          e.target.value = '';
        }}
      />

      {(falha ?? erro) && <p className={styles.erro}>{falha ?? erro}</p>}
    </div>
  );
}
