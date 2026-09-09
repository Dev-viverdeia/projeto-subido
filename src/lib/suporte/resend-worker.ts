import 'server-only';
import { Resend } from 'resend';

/** Prazo por requisição e por ciclo, sem alterar o fetch global ou outros módulos.
 * O SDK 6.x expõe fetchRequest, mas não oferece timeout no construtor. */
export class ResendSuporte extends Resend {
  constructor(
    chave: string,
    private readonly ciclo?: AbortSignal,
  ) {
    super(chave);
  }

  override fetchRequest<T>(path: string, options: RequestInit = {}) {
    const signal = AbortSignal.any([
      AbortSignal.timeout(12_000),
      ...(this.ciclo ? [this.ciclo] : []),
      ...(options.signal ? [options.signal] : []),
    ]);
    return super.fetchRequest<T>(path, { ...options, signal });
  }
}
