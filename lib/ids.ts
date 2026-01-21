const toBase64Url = (input: string) => Buffer.from(input).toString("base64url");

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function newToken(prefix: string) {
  return `${prefix}_${toBase64Url(crypto.randomUUID())}`;
}
