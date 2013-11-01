var config = require("config")
  , _ = require("underscore")
  , Shopify = require("shopify-api")
  , async = require("async")
  , dotty = require("dotty")
  , Mongolian = require("mongolian");

var shopify = new Shopify(config.shopify);
var mongolian = new Mongolian(config.mongodb);
var db = {"orders": mongolian.collection("orders")};

async.waterfall([
    function(callback){
        db.orders.find().toArray(function(err, orders){
            if(err) return callback(err);
            return callback(null, orders);
        });
    },
    function(orders, callback){
        async.map(orders, function(order, next){
            var req = {}
            req.body = order.created.order;
            req.order = order.created.order;
            req.headers = order.created.headers;
            if(!dotty.exists(req, "headers.x-shopify-topic")) return next(null, new Error("no header x-shopify-topic"));
            if(!dotty.exists(req, "headers.x-shopify-test")) return next(null, new Error("no header x-shopify-test"));
            if(!dotty.exists(req, "headers.x-shopify-shop-domain")) return next(null, new Error("no header x-shopify-shop-domain"));
            if(!dotty.exists(req, "headers.x-shopify-order-id")) return next(null, new Error("no header x-shopify-order-id"));
            if(!dotty.exists(req, "headers.x-shopify-hmac-sha256")) return next(null, new Error("no header x-shopify-hmac-sha256"));
            if(!dotty.exists(req, "headers.user-agent")) return next(null, new Error("no header user-agent"));
            if(req.headers["x-shopify-topic"] !== "orders/create") return next(null, new Error("webhook isn't orders/create"));
            if(req.headers["x-shopify-test"] == "true") return next(null, new Error("shopify test header is true"));
            if(req.headers["x-shopify-shop-domain"] !== config.shopify.hostname) return next(null, new Error("shopify domain header not valid"));
            if(req.headers["user-agent"] !== "Ruby") return next(null, new Error("user agent isn't ruby"));
            if(shopify.webhook.hmac(req.body) !== req.headers['x-shopify-hmac-sha256']) return next(null, new Error("failed verify hmac"));
            return next(null, "win");
        },function(err, results){
            if(err) return callback(err);
            return callback(null, results);
        });
    }
], function(err, results){
    if(err) throw err;
    console.log(results);
})