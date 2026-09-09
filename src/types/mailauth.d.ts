declare module 'mailauth/lib/dkim/verify' {
  import type { DKIMVerifyResult, DNSResolver } from 'mailauth';
  export function dkimVerify(
    input: Buffer,
    options?: { resolver?: DNSResolver; minBitLength?: number },
  ): Promise<DKIMVerifyResult>;
}
declare module 'mailauth/lib/dkim/sign' {
  import type { DKIMSignOptions, DKIMSignResult } from 'mailauth';
  export function dkimSign(
    input: string | Buffer,
    options: { signatureData: DKIMSignOptions[] },
  ): Promise<DKIMSignResult>;
}
