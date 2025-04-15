declare module "fluent-ffmpeg" {
  interface FfmpegCommand {
    toFormat(format: string): this
    save(outputPath: string): this
    on(event: "end", callback: () => void): this
    on(event: "error", callback: (err: Error) => void): this
  }

  function ffmpeg(input: string): FfmpegCommand

  export = ffmpeg
}
