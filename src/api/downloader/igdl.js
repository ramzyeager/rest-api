const axios = require("axios");
const FormData = require("form-data");
const crypto = require("crypto");
const mime = require("mime-types");

async function uploadToIkkyzx(fileUrlOrBuffer, fileName) {
  const form = new FormData();
  let fileData;

  if (Buffer.isBuffer(fileUrlOrBuffer)) {
    fileData = fileUrlOrBuffer;
  } else {
    const response = await axios.get(fileUrlOrBuffer, {
      responseType: "arraybuffer",
    });
    fileData = Buffer.from(response.data);
  }

  const mimeType = mime.lookup(fileName) || "application/octet-stream";
  form.append("file", fileData, { filename: fileName, contentType: mimeType });

  const res = await axios.post("https://ikyyzx-uploader.lol/upload", form, {
    headers: { ...form.getHeaders(), Accept: "application/json" },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  if (!res.data?.success || !res.data?.url) throw new Error("Upload gagal");
  return res.data.url;
}

function encUrl(text) {
  const key = Buffer.from("qwertyuioplkjhgf", "utf-8");
  const cipher = crypto.createCipheriv("aes-128-ecb", key, null);
  cipher.setAutoPadding(true);
  let encrypted = cipher.update(text, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

async function fetchIgLinks(url) {
  const encLink = encUrl(url);
  const { data } = await axios.get("https://api.videodropper.app/allinone", {
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9",
      origin: "https://fastvideosave.net",
      referer: "https://fastvideosave.net/",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "cross-site",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      url: encLink,
    },
  });
  return data;
}

module.exports = function (app) {
  app.get("/downloader/igall", async (req, res) => {
    try {
      const { url } = req.query;
      if (!url)
        return res
          .status(400)
          .json({ status: false, message: "Parameter url wajib diisi" });

      const igData = await fetchIgLinks(url);

      let videos = [];
      let images = [];

      if (igData.video?.length) {
        const videoUrl = igData.video[0].video;
        const videoName = `video_${Date.now()}.mp4`;
        const videoUpload = await uploadToIkkyzx(videoUrl, videoName);
        videos.push(videoUpload);
      }

      if (igData.image?.length) {
        for (const img of igData.image) {
          const imgName = `image_${Date.now()}.jpg`;
          const imgUpload = await uploadToIkkyzx(img, imgName);
          images.push(imgUpload);
        }
      }

      res.json({
        status: true,
        result: {
          video: videos.length && images.length === 0 ? [videos[0]] : videos,
          image: images,
        },
      });
    } catch (e) {
      console.error("[IGALL]", e.message);
      res
        .status(500)
        .json({ status: false, message: "Gagal fetch dari Instagram" });
    }
  });
};
