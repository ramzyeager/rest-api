const axios = require("axios");

module.exports = function (app) {
  app.get("/search/npm", async (req, res) => {
    const q = req.query.q;

    if (!q) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'q' diperlukan",
      });
    }

    try {
      const apiUrl = `https://ikyyzyyrestapi.my.id/search/npm?q=${encodeURIComponent(q)}`;
      const response = await axios.get(apiUrl);

      res.json({
        status: true,
        result: response.data,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  });
};
