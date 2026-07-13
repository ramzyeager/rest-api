const axios = require("axios");
const qs = require("qs");

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "id,en;q=0.9,en-GB;q=0.8,en-US;q=0.7",
  "X-Requested-With": "XMLHttpRequest",
  Origin: "https://ilovepin.net",
  Referer: "https://ilovepin.net/id",
};

async function scrapePinterest(pinUrl) {
  const mainPage = await axios.get("https://ilovepin.net/id", {
    headers: { "User-Agent": headers["User-Agent"] },
  });

  const cookieString = mainPage.headers["set-cookie"]?.join("; ") || "";

  const body = qs.stringify({ url: pinUrl });

  const { data } = await axios.post("https://ilovepin.net/proxy.php", body, {
    headers: {
      ...headers,
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Cookie: cookieString,
    },
  });

  if (!data.api || data.api.status !== "OK") {
    throw new Error("Gagal mengambil data atau URL tidak valid.");
  }

  const api = data.api;
  const items = api.mediaItems || [];

  const videos = items.filter((i) => i.type === "Video");
  const images = items.filter((i) => i.type === "Image");

  const result = {
    title: api.title,
    description: api.description?.trim() || "-",
    author: {
      name: api.userInfo?.name,
      username: api.userInfo?.username,
      avatar: api.userInfo?.userAvatar,
    },
    stats: {
      likes: api.mediaStats?.likesCount,
      shares: api.mediaStats?.sharesCount,
    },
    media: [],
  };

  if (videos.length > 0) {
    videos.sort((a, b) => {
      const sizeA =
        parseFloat(a.mediaFileSize) *
        (a.mediaFileSize.includes("MB") ? 1024 : 1);
      const sizeB =
        parseFloat(b.mediaFileSize) *
        (b.mediaFileSize.includes("MB") ? 1024 : 1);
      return sizeB - sizeA;
    });

    result.media = videos.map((v) => ({
      type: "video",
      quality: v.mediaQuality === "HD" ? "HD" : `SD (${v.mediaRes})`,
      extension: v.mediaExtension,
      size: v.mediaFileSize,
      url: v.mediaUrl,
    }));
  } else if (images.length > 0) {
    result.media = images.map((img) => ({
      type: "image",
      quality: "Original",
      extension: img.mediaExtension,
      size: img.mediaFileSize,
      url: img.mediaUrl,
    }));
  }

  return result;
}

module.exports = function (app) {
  app.get("/downloader/pindl", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url)
        return res.status(400).json({ status: false, message: "URL required" });

      const data = await scrapePinterest(url);
      res.json({ status: true, result: data });
    } catch (e) {
      res.status(500).json({ status: false, message: e.message });
    }
  });
};
