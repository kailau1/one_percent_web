/** Only ever redirect to a path inside this app, never to another site passed in the URL. */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/today'
}
