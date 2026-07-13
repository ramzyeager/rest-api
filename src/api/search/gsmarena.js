const axios = require("axios");

module.exports = function (app) {
  app.get("/search/gsmarena", async (req, res) => {
    const query = req.query.query;

    if (!query) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'query' diperlukan",
      });
    }

    try {
      const apiUrl = `https://ikyyzyyrestapi.my.id/search/gsmarena?query=${encodeURIComponent(query)}`;
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
