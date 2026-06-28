export function replaceFileExtension(name: string, extension: string): string {
  const cleanExtension = extension.replace(/^\./, '')
  const baseName = name.replace(/\.[^/.]+$/, '')

  return `${baseName}.${cleanExtension}`
}

export function appendFileSuffix(name: string, suffix: string): string {
  const dotIndex = name.lastIndexOf('.')

  if (dotIndex <= 0)
    return `${name}-${suffix}`

  return `${name.slice(0, dotIndex)}-${suffix}${name.slice(dotIndex)}`
}
