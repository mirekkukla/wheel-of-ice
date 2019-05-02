/* jshint node: true */
"use strict";

let express = require('express');
let fetch = require('node-fetch');
let emailjs = require('emailjs-com');

const PORT = 8081;
const GEO_KEY = "at_IUxTwRiCCI0kwGkZSDm3VGaWxF4LY";
const EMAILJS_KEY = "user_8JLOO0Mj5SQ4um0RmAmTP";
const EMAIL_JS_TEMPATE = "wheel_of_ice";

emailjs.init(EMAILJS_KEY);
let app = express();

// Server static pages located in script dir
app.use(express.static(__dirname));

// Get geographical info using callers IP
app.get('/geo_info', (req, res) => {
  fetchGeo(req)
    .then(geoInfoJson => res.send(geoInfoJson))
    .catch(error => console.error(error));
});

// TODO: move from fetch to axios (http://tiny.cc/0nrx5y and http://tiny.cc/qnrx5y)
function fetchGeo(req) {
  let ip = getRequestIP(req);
  console.log("Fetching geo info for IP " + ip);
  let url = `https://geo.ipify.org/api/v1?apiKey=${GEO_KEY}&ipAddress=${ip}`;
  return fetch(url).then(handleFetchErrors).then(response => response.json());
}

// require query parameter `?outcome=XYZ``
// TODO: make POST
app.get('/send_email', (req, res) => {
  // TODO: check to make sure query param exists, respond accordingly if not

  let outcome = req.query.outcome;
  if (!outcome) {
    throw new Error('Send email route called without an "outcome" parameter');
  }
  console.log(`Send email route called, outcome param is '${outcome}'`);

  let stashedGeoInfo = null;
  fetchGeo(req)
    .then(geoInfoJson => {
      stashedGeoInfo = geoInfoJson;
      return sendEmail(outcome, geoInfoJson);
    })
    .then(() => res.send(stashedGeoInfo)) // do we have access to it here?
    .catch(error => console.error(error));
});


// Send email using EmailJS (note that gmail might categorize the email as spam)
function sendEmail(outcome, geoInfo) {
    let loc = geoInfo.location;
    let locationStr = `${loc.city}, ${loc.region}, ${loc.country} (from ${geoInfo.ip})`;
    let mapsLink = `https://www.google.com/maps/@${loc.lat},${loc.lng},12z`;

    let templateParams = {
        location: locationStr,
        outcome: outcome,
        maps_link: mapsLink
    };

    let emailJSData = {
      service_id: 'sendgrid',
      template_id: EMAIL_JS_TEMPATE,
      user_id: EMAILJS_KEY,
      template_params: templateParams
    };

    console.log(`Sending email with params '${JSON.stringify(templateParams)}' to EmailJS`);
    return fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      body: JSON.stringify(emailJSData)
    })
      .then(handleFetchErrors)
      .then(response => response.json())
      .then(json => console.log('EMAIL SUCCESS!', json))
      .catch(error => console.error('EMAIL FAILED...', error));
}

// HELPERS AND UTILS

function getRequestIP(req) {
  // Careful: req.ip doesn't work if we're behind an nginx proxy!
  // https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node
  let raw_ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  return raw_ip.split(",")[0].trim();
}

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// Since `fetch()` doesn't "catch" HTTP errors, we need to handle them ourselves
// TODO: share code with front-end
// https://stackoverflow.com/questions/3225251/how-can-i-share-code-between-node-js-and-the-browser
// https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
// https://medium.com/the-node-js-collection/an-update-on-es6-modules-in-node-js-42c958b890c
function handleFetchErrors(response) {
  // clone the response and extract text from clone, in case of a response failure
  return Promise.all([response.ok, response.clone().text()])
    .then(([responseOk, bodyTxt]) => {
      if (!responseOk) {
        throw new Error(`status: '${response.status}', body: '${bodyTxt}'`);
      }
      return response;
    });
}
