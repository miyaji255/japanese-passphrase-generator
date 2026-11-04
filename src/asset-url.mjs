export function assetUrl(path, base = import.meta.env.BASE_URL) {
  return `${base}${path.replace(/^\/+/, '')}`;
}
