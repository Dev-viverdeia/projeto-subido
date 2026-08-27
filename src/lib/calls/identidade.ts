import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export function resolverIdConvidado(idSalvo?: string) {
  return z.uuid().safeParse(idSalvo).success ? idSalvo! : randomUUID();
}
