export function shortId(id?: string, chars: number = 6) {
  if (!id) return '';
  return `${id.slice(0, chars)}…${id.slice(-chars)}`;
}
