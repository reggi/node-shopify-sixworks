var express = require('express')
  , http = require('http')
  , path = require('path')
  , config = require("config")
  , Shopify = require("shopify-api")
  , Mongolian = require("mongolian")
  , Sixworks = require("sixworks")
  , endpoints = require("./endpoints");
  
var app = express();

var shopify = new Shopify(config.shopify);
var sixworks = new Sixworks(config.sixworks);
var mongolian = new Mongolian(config.mongodb);

var db = {"orders": mongolian.collection("orders")};

app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.errorHandler());

app.all("/", function(req, res){res.send("shopify-sixworks");});
app.all('/order_created', endpoints.order_created.middleware(config, db, shopify, sixworks), endpoints.order_created.route());

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});