export function getMimeType(ext: string): string {
  switch (ext) {
    case ".opus":
      return "audio/ogg; codecs=opus"
    case ".mp3":
      return "audio/mpeg"
    case ".ogg":
      return "audio/ogg"
    case ".wav":
      return "audio/wav"
    case ".html":
      return "text/html"
    case ".js":
      return "application/javascript"
    case ".css":
      return "text/css"
    case ".json":
      return "application/json"
    default:
      return "application/octet-stream"
  }
}
