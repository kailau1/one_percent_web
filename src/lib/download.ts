/** Hands the browser a file to save, built from text in memory (no server round trip). */
export function downloadText(fileName: string, text: string, type = 'text/markdown;charset=utf-8'): void {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  // give the browser a moment to start the download before the URL is released
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
