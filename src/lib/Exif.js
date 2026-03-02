import ff from "fluent-ffmpeg";
import webp from "node-webpmux";
import crypto from "node:crypto";
import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export default class Exif {
  #tmpName() {
    return crypto.randomBytes(6).readUIntLE(0, 6).toString(36);
  }

  #tmpPath(ext) {
    return path.join(tmpdir(), `${this.#tmpName()}.${ext}`);
  }

  async imageToWebp(media) {
    const input = this.#tmpPath("jpg");
    const output = this.#tmpPath("webp");

    fs.writeFileSync(input, media);

    await new Promise((resolve, reject) => {
      ff(input)
        .on("error", reject)
        .on("end", () => resolve(true))
        .addOutputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
        ])
        .toFormat("webp")
        .save(output);
    });

    const buff = fs.readFileSync(output);
    fs.unlinkSync(input);
    fs.unlinkSync(output);
    return buff;
  }

  async videoToWebp(media) {
    const input = this.#tmpPath("mp4");
    const output = this.#tmpPath("webp");

    fs.writeFileSync(input, media);

    await new Promise((resolve, reject) => {
      ff(input)
        .on("error", reject)
        .on("end", () => resolve(true))
        .addOutputOptions([
          "-vcodec",
          "libwebp",
          "-vf",
          "scale=320:320:force_original_aspect_ratio=decrease,pad=320:320:(ow-iw)/2:(oh-ih)/2:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",
          "-loop",
          "0",
          "-ss",
          "00:00:00",
          "-t",
          "00:00:05",
          "-preset",
          "default",
          "-an",
          "-vsync",
          "0",
        ])
        .toFormat("webp")
        .save(output);
    });

    const buff = fs.readFileSync(output);
    fs.unlinkSync(input);
    fs.unlinkSync(output);
    return buff;
  }

  #createExifBuffer(metadata) {
    const json = {
      "sticker-pack-id": "bagah-bot",
      "sticker-pack-name": metadata.packname || "",
      "sticker-pack-publisher": metadata.author || "",
      emojis: metadata.categories || [""],
    };

    const exifAttr = Buffer.from([
      0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00, 0x01, 0x00, 0x41, 0x57,
      0x07, 0x00, 0x00, 0x00, 0x00, 0x00, 0x16, 0x00, 0x00, 0x00,
    ]);
    const jsonBuff = Buffer.from(JSON.stringify(json), "utf-8");
    const exif = Buffer.concat([exifAttr, jsonBuff]);
    exif.writeUIntLE(jsonBuff.length, 14, 4);
    return exif;
  }

  async #writeExif(webpBuffer, metadata) {
    const input = this.#tmpPath("webp");
    const output = this.#tmpPath("webp");

    fs.writeFileSync(input, webpBuffer);

    const img = new webp.Image();
    await img.load(input);
    fs.unlinkSync(input);

    img.exif = this.#createExifBuffer(metadata);
    await img.save(output);
    return output;
  }

  async writeExifImg(media, metadata) {
    const webpBuff = await this.imageToWebp(media);
    return this.#writeExif(webpBuff, metadata);
  }

  async writeExifVid(media, metadata) {
    const webpBuff = await this.videoToWebp(media);
    return this.#writeExif(webpBuff, metadata);
  }

  async writeExifWebp(media, metadata) {
    return this.#writeExif(media, metadata);
  }
}
