const express = require("express");
const chalk = require("chalk");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 6000;

app.enable("trust proxy");
app.set("json spaces", 2);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

app.use(
  "/",
  express.static(path.join(__dirname, "api-page"), {
    extensions: ["html"],
  }),
);

app.use("/src", express.static(path.join(__dirname, "src")));

const settingsPath = path.join(__dirname, "src", "settings.json");
const settings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (data) {
    if (data && typeof data === "object" && !Array.isArray(data)) {
      const responseData = {
        status: data.status,
        creator: settings.apiSettings?.creator || "Base REST API",
        ...data,
      };
      return originalJson.call(this, responseData);
    }
    return originalJson.call(this, data);
  };
  next();
});

let totalRoutes = 0;
let failedRoutes = 0;
const apiFolder = path.join(__dirname, "src", "api");

fs.readdirSync(apiFolder).forEach((subfolder) => {
  const subfolderPath = path.join(apiFolder, subfolder);
  if (!fs.statSync(subfolderPath).isDirectory()) return;

  fs.readdirSync(subfolderPath).forEach((file) => {
    if (path.extname(file) !== ".js") return;

    const filePath = path.join(subfolderPath, file);
    try {
      require(filePath)(app);
      totalRoutes++;
      console.log(
        chalk
          .bgHex("#FFDB70")
          .hex("#222")
          .bold(` Loaded: ${subfolder}/${file} `),
      );
    } catch (err) {
      failedRoutes++;
      console.log(
        chalk
          .bgHex("#D9736C")
          .hex("#222")
          .bold(` Gagal load: ${subfolder}/${file} `),
      );
      console.log(chalk.hex("#D9736C")(`   -> ${err.message}`));
    }
  });
});

if (failedRoutes > 0) {
  console.log(
    chalk
      .bgHex("#E0B94F")
      .hex("#222")
      .bold(` ${failedRoutes} endpoint gagal dimuat, cek error di atas `),
  );
}

console.log(
  chalk.bgHex("#8CE99A").hex("#222").bold(" Semua route berhasil dimuat "),
);
console.log(
  chalk.bgHex("#8CE99A").hex("#222").bold(` Total endpoint: ${totalRoutes} `),
);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "api-page", "index.html"));
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "api-page", "404.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "api-page", "500.html"));
});

app.listen(PORT, () => {
  console.log(
    chalk.bgHex("#8CE99A").hex("#222").bold(` Server jalan di port ${PORT} `),
  );
});

module.exports = app;
