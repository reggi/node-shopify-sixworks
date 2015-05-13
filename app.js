var express = require('express')
  , http = require('http')
  , path = require('path')
  , config = require("config")
  , Shopify = require("shopify-api")
  , Mongolian = require("mongolian")
  , Sixworks = require("node-sixworks-api")
  , middleware = require("./middleware");

var app = express();

var shopify = new Shopify(config.shopify);
var sixworks = new Sixworks(config.sixworks);
var mongolian = new Mongolian(config.mongodb);
var db = {"orders": mongolian.collection("orders")};

var establish_webhook = require("./lib/establish_webhook.js");
var url = process.env.SIXWORKS_WEBHOOK_URL+"/order_created";
establish_webhook(shopify, url, function(err, deleted, webhook){
    if(err) console.log("app : webhook establish failed");
    console.log("app : webhook establish success");
});

app.set('port', process.env.PORT || 3000);
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.errorHandler());

app.param("hash", middleware.hash_param(db));

app.all("/", function(req, res){res.send("OK Running shopify-sixworks");});
app.all('/order_created', middleware.order_created(config, db, shopify, sixworks));
app.all('/order_fulfilled/:hash', middleware.order_fulfilled(config, db, shopify, sixworks));

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
