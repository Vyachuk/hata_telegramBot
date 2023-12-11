const app = require("./app");

const mongoose = require("mongoose");

require("dotenv").config();

const { PORT, DB_HOST } = process.env;

mongoose
  .connect(DB_HOST)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Example app listening on port ${PORT}!`);
    });
  })
  .catch((e) => {
    console.log(e.message);
    process.exit(1);
  });
