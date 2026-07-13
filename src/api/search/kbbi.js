const axios = require("axios");

module.exports = function (app) {
  app.get("/search/kbbi", async (req, res) => {
    const kata = req.query.kata;

    if (!kata) {
      return res.status(400).json({
        status: false,
        message: "Parameter 'kata' diperlukan",
      });
    }

    try {
      const apiUrl = `https://ikyyzyyrestapi.my.id/search/kbbi?kata=${encodeURIComponent(kata)}`;
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
