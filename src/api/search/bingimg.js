const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {
  app.get("/search/bing-image", async (req, res) => {
    const { q } = req.query;
    if (!q) {
      return res
        .status(400)
        .json({ status: false, message: "Parameter 'q' diperlukan" });
    }

    try {
      const { data: html } = await axios.get(
        `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`,
        {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            "Accept-Language": "en-US,en;q=0.9",
          },
        },
      );

      const $ = cheerio.load(html);

      const images = $(".iuscp")
        .map((_, el) => {
          const container = $(el);
          const linkElement = container.find("a.iusc");
          const metadataAttr = linkElement.attr("m");
          if (!metadataAttr) return null;

          try {
            const metadata = JSON.parse(metadataAttr);
            return {
              title: metadata.t || null,
              imageUrl: metadata.murl,
              sourceUrl: metadata.purl,
              width: metadata.w,
              height: metadata.h,
            };
          } catch {
            return null;
          }
        })
        .get()
        .filter(Boolean);

      res.status(200).json({
        status: true,
        query: q,
        total: images.length,
        result: images,
      });
    } catch (error) {
      res.status(500).json({ status: false, message: error.message });
    }
  });
};
