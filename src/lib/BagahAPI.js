import axios from "axios";

export default class BagahAPI {
  #baseUrl;
  #apiKey;

  constructor(baseUrl, apiKey) {
    this.#baseUrl = baseUrl.replace(/\/+$/, "");
    this.#apiKey = apiKey;
  }

  async #request(endpoint, params = {}) {
    const { data } = await axios.get(`${this.#baseUrl}${endpoint}`, {
      params,
      headers: { "x-api-key": this.#apiKey },
    });

    if (!data.success) {
      throw new Error(data.message || "API request failed");
    }

    return data.data;
  }

  async facebookDownload(url) {
    const result = await this.#request("/api/facebook-downloader-s2", { url });
    const best =
      result.results?.find((r) => /hd|720/i.test(r.quality)) ||
      result.results?.[0];

    return {
      thumbnail: result.thumbnail,
      description: result.description,
      url: best?.url,
      quality: best?.quality,
      results: result.results,
    };
  }

  async instagramDownload(url) {
    const results = await this.#request("/api/instagram-downloader-s2", {
      url,
    });

    if (!Array.isArray(results) || !results.length) {
      throw new Error("Tidak ada media ditemukan");
    }

    return results.map((item) => ({
      type: item.type,
      url: item.url,
    }));
  }

  async igStory(username) {
    const result = await this.#request("/api/igstory", { username });

    return {
      user: {
        username: result.user?.username,
        fullName: result.user?.fullName,
        biography: result.user?.biography,
        profilePic: result.user?.profile_pic_url,
        followers: result.user?.followers,
        following: result.user?.following,
        posts: result.user?.posts,
        isPrivate: result.user?.is_private,
      },
      stories: (result.url || []).map((item) => ({
        type: item.type,
        url: item.url,
      })),
    };
  }
}
