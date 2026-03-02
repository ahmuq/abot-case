import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Scrape gambar dari Pinterest
 */
export async function pinterest(query) {
  const { data } = await axios.get(
    `https://id.pinterest.com/search/pins/?autologin=true&q=${encodeURIComponent(query)}`,
  );
  const $ = cheerio.load(data);
  const results = [];

  $("div > a").each((_, el) => {
    const link = $(el).find("img").attr("src");
    if (link) results.push(link.replace(/236/g, "736"));
  });

  return results.slice(1);
}

/**
 * Scrape gambar dari Wikimedia
 */
export async function wikimedia(title) {
  const { data } = await axios.get(
    `https://commons.wikimedia.org/w/index.php?search=${encodeURIComponent(title)}&title=Special:MediaSearch&go=Go&type=image`,
  );
  const $ = cheerio.load(data);
  const results = [];

  $(".sdms-search-results__list-wrapper > div > a").each((_, el) => {
    results.push({
      title: $(el).find("img").attr("alt"),
      source: $(el).attr("href"),
      image:
        $(el).find("img").attr("data-src") || $(el).find("img").attr("src"),
    });
  });

  return results;
}

/**
 * Ambil quotes anime acak
 */
export async function quotesAnime() {
  const page = Math.floor(Math.random() * 184);
  const { data } = await axios.get(`https://otakotaku.com/quote/feed/${page}`);
  const $ = cheerio.load(data);
  const results = [];

  $("div.kotodama-list").each((_, el) => {
    results.push({
      link: $(el).find("a").attr("href"),
      gambar: $(el).find("img").attr("data-src"),
      karakter: $(el).find("div.char-name").text().trim(),
      anime: $(el).find("div.anime-title").text().trim(),
      episode: $(el).find("div.meta").text(),
      up_at: $(el).find("small.meta").text(),
      quotes: $(el).find("div.quote").text().trim(),
    });
  });

  return results;
}

/**
 * Cari wallpaper
 */
export async function wallpaper(title, page = "1") {
  const { data } = await axios.get(
    `https://www.besthdwallpaper.com/search?CurrentPage=${page}&q=${encodeURIComponent(title)}`,
  );
  const $ = cheerio.load(data);
  const results = [];

  $("div.grid-item").each((_, el) => {
    results.push({
      title: $(el).find("div.info > a > h3").text(),
      type: $(el).find("div.info > a:nth-child(2)").text(),
      source:
        "https://www.besthdwallpaper.com/" +
        $(el).find("div > a:nth-child(3)").attr("href"),
      image: [
        $(el).find("picture > img").attr("data-src") ||
          $(el).find("picture > img").attr("src"),
        $(el).find("picture > source:nth-child(1)").attr("srcset"),
        $(el).find("picture > source:nth-child(2)").attr("srcset"),
      ],
    });
  });

  return results;
}

/**
 * Cari ringtone
 */
export async function ringtone(title) {
  const { data } = await axios.get(
    `https://meloboom.com/en/search/${encodeURIComponent(title)}`,
  );
  const $ = cheerio.load(data);
  const results = [];

  $(
    "#__next > main > section > div.jsx-2244708474.container > div > div > div > div:nth-child(4) > div > div > div > ul > li",
  ).each((_, el) => {
    results.push({
      title: $(el).find("h4").text(),
      source: "https://meloboom.com/" + $(el).find("a").attr("href"),
      audio: $(el).find("audio").attr("src"),
    });
  });

  return results;
}
