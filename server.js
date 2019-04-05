/* jshint node: true */
"use strict";

var express = require('express');
var app = express();
var port = 8080;

app.listen(port, function() {
  console.log('Server started');
});

// Server static pages located in script dir
app.use(express.static(__dirname));
