/* jshint node: true */
"use strict";

let express = require('express');
let fetch = require('node-fetch');

const PORT = 8081;
const GEO_KEY = "at_IUxTwRiCCI0kwGkZSDm3VGaWxF4LY";

let app = express();

// Server static pages located in script dir
app.use(express.static(__dirname));

// Get geographical info using callers IP
// TODO: move to axios (http://tiny.cc/0nrx5y and http://tiny.cc/qnrx5y)
app.get('/geo_info', function(req, res) {
  // Careful: req.ip doesn't work if we're behind an nginx proxy!
  // https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node
  let ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  console.log("Called geo_info, IP is " + ip);
  fetch(`https://geo.ipify.org/api/v1?apiKey=${GEO_KEY}&ipAddress=${ip}`)
    .then(handleFetchErrors)
    .then(response => response.json())
    .then(json => res.send(json))
    .catch(error => console.log(error));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Since `fetch()` doesn't "catch" HTTP errors, we need to handle them ourselves
// TODO: share code with front-end
// https://stackoverflow.com/questions/3225251/how-can-i-share-code-between-node-js-and-the-browser
// https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
// https://medium.com/the-node-js-collection/an-update-on-es6-modules-in-node-js-42c958b890c
function handleFetchErrors(response) {
    if (!response.ok) {
        throw Error(response.statusText);
    }
    return response;
}
