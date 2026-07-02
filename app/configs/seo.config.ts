export const defaultSeoConfig = {
  ogImage: '/icon.svg',
  siteName: 'web file',
  siteUrl: 'https://file.3854335.com',
} as const

export function createAbsoluteUrl(baseUrl: string, path = '/') {
  const safeBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const safePath = path.startsWith('/') ? path.slice(1) : path

  return new URL(safePath, safeBaseUrl).toString()
}
