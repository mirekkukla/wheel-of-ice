/* jshint node: true */
"use strict";

let express = require('express');
let fetch = require('node-fetch');

const PORT = 8081;
const GEO_KEY = "at_IUxTwRiCCI0kwGkZSDm3VGaWxF4LY";
const EMAILJS_KEY = "user_8JLOO0Mj5SQ4um0RmAmTP";
const EMAIL_JS_TEMPATE = "wheel_of_ice";

let app = express();

// Server static pages located in script dir
app.use(express.static(__dirname));
app.use(express.json());

// Get geographical info using callers IP
app.get('/geo_info', (req, res) => {
  console.log("GET /geo_info " + getIP(req));
  fetchGeo(req)
    .then(geoInfoJson => res.send(geoInfoJson))
    .catch(error => {
      console.log("Geo fetch failed , error below. Returning dummy json with IP");
      console.error(error);
      res.send(getFakeGeoJson(req));
    });
});

// Trigger the sending of an email via emailjs
// Post body should be `{'outcome': 'description of spin outcome'}`
app.post('/send_email', (req, res) => {
  console.log("POST /send_email " + getIP(req));

  // It's easy to forget you need to set Content-Type if
  // you're using `fetch` on the front-end
  let contentHeader = req.header('Content-Type');
  if (contentHeader !== "application/json") {
    let errorMsg = `Content-Type header must be 'application/json' (${contentHeader})`;
    res.status("400").send(errorMsg);
    throw new Error(errorMsg);
  }

  // Sanity check the body content
  let bodyStr = JSON.stringify(req.body);
  let outcome = req.body.outcome;
  if (!outcome) {
    let errorMsg = `Missing or empty missing 'outcome' parameter (${bodyStr})`;
    res.status("400").send(errorMsg);
    throw new Error(errorMsg);
  }

  console.log(`Sending email with outcome ${outcome}`);
  fetchGeo(req)
    .catch(error => {
      console.log("Geo fetch failed , error below. Continuing with email logic");
      console.error(error);
      return getFakeGeoJson(req);
    })
    .then(geoInfoJson => sendEmail(outcome, geoInfoJson))
    .then(templateParams => {
      let payload = {
        message: "Email succesfull sent",
        template_params: templateParams
      };
      res.send(payload);
    })
    .catch(error => console.error(error));
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});


// HELPERS

// TODO: move from fetch to axios (http://tiny.cc/0nrx5y and http://tiny.cc/qnrx5y)
function fetchGeo(req) {
  // Careful: req.ip doesn't work if we're behind an nginx proxy!
  // https://stackoverflow.com/questions/8107856/how-to-determine-a-users-ip-address-in-node
  let ip = getIP(req);
  console.log("Fetching geo info for IP " + ip);
  let url = `https://geo.ipify.org/api/v1?apiKey=${GEO_KEY}&ipAddress=${ip}`;
  return fetch(url).then(handleFetchErrors).then(response => response.json());
}

function getIP(req) {
  let raw_ip = req.header('x-forwarded-for') || req.connection.remoteAddress;
  return raw_ip.split(",")[0].trim();
}

// If our called to the geo info API fails, you can use this "dummy"
// object that looks like the standard geo call response. Most values
// contain an error message, but since we have the IP from the request,
// we might as well use it
function getFakeGeoJson(req) {
    const errMsg = "geo fetching error";
    let fakeGeoJson = {
      ip: getIP(req),
      location: {
        city: errMsg,
        region: errMsg,
        country: errMsg,
        lat: errMsg,
        lng: errMsg
      }
    };
    return fakeGeoJson;
}

// Send email using EmailJS (note that gmail might categorize the email as spam)
// Returns a promise chain where the final promise contains the email template params
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
      body: JSON.stringify(emailJSData),
      headers: {'Content-Type': 'application/json'}
    })
      .then(handleFetchErrors)
      .then(response => response.text())
      .then(text => console.log('EMAIL SUCCESS!', text))
      .then(_ => templateParams)
      .catch(error => console.error('EMAIL FAILED...', error));
}


// UTILS

// Since `fetch()` doesn't "catch" HTTP errors, we need to handle them ourselves
// TODO: share code with front-end
// https://stackoverflow.com/questions/3225251/how-can-i-share-code-between-node-js-and-the-browser
// https://stackoverflow.com/questions/950087/how-do-i-include-a-javascript-file-in-another-javascript-file
// https://medium.com/the-node-js-collection/an-update-on-es6-modules-in-node-js-42c958b890c
function handleFetchErrors(response) {
  // 'clone' so we can still read the original `response` downstream)
  return response.clone().text()
    .then(bodyTxt => {
      if (!response.ok) {
        console.error("Fetch response wasn't OK");
        throw new Error(`status: '${response.status}', body: '${bodyTxt}'`);
      }
      return response;
    });
}
