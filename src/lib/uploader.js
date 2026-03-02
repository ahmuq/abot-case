import axios from "axios";
import FormData from "form-data";
import fs from "node:fs";

/**
 * Upload file ke Telegra.ph
 * @param {string} filePath - Path ke file yang akan diupload
 * @returns {Promise<string>} URL hasil upload
 */
export async function telegraph(filePath) {
  if (!fs.existsSync(filePath)) throw new Error("File not found");

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath));

  const { data } = await axios({
    url: "https://telegra.ph/upload",
    method: "POST",
    headers: form.getHeaders(),
    data: form,
  });

  return "https://telegra.ph" + data[0].src;
}

/**
 * Upload file ke Uguu.se
 * @param {string} filePath - Path ke file yang akan diupload
 * @returns {Promise<object>} Data hasil upload
 */
export async function uploadFileUgu(filePath) {
  const form = new FormData();
  form.append("files[]", fs.createReadStream(filePath));

  const { data } = await axios({
    url: "https://uguu.se/upload.php",
    method: "POST",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      ...form.getHeaders(),
    },
    data: form,
  });

  return data.files[0];
}

/**
 * Upload image buffer & return URL (via telegraph)
 * Berguna untuk fitur yang butuh URL gambar
 * @param {Buffer} buffer - Buffer gambar
 * @param {string} ext - Extension file (default: 'jpg')
 * @returns {Promise<string>} URL gambar
 */
export async function bufferToUrl(buffer, ext = "jpg") {
  const tmpPath = `/tmp/upload_${Date.now()}.${ext}`;
  fs.writeFileSync(tmpPath, buffer);
  try {
    const url = await telegraph(tmpPath);
    return url;
  } finally {
    if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath);
  }
}
