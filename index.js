const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

//replace ../react-client/dist to respective folder.
app.use(express.static(path.resolve(__dirname, "./client/dist")));


app.listen(1128, () => {
  console.log("listening on port 1128!");
});