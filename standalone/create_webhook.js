var dotty = require("dotty");
var async = require("async");
var config = require("config");
var Shopify = require("shopify-api");
var shopify = new Shopify(config.shopify);
var url = "http://shopify-sixworks.herokuapp.com/order_created";

//var url = "http://sr.getsimpleapps.com/webhook/shopify";
//var url = "http://requestb.in/1l0sbge1";
//var url = "http://requestb.in/16v7p7w1";

async.waterfall([
    function(callback){
        shopify.request({
            "method": "GET",
            "path": "/admin/webhooks.json",
        }, function(err, response, body, options) {
            if(err) return callback(err);
            return callback(null, body);
        });
    },
    function(webhooks, callback){
        if(webhooks.length !== 0) return callback(null);
        var webhook_found = _.map(webhooks, function(webhook){
            return webhook.address == url;
        });
        return callback(null, webhooks);
    },
], function(err, webhook_found){
    console.log(webhook_found);
});  




/*
shopify.request({
    "method": "POST",
    "path": "/admin/webhooks.json",
    "body": {
        "webhook": {
            "topic": "orders/create",
            "address": url,
            "format": "json"
        }
    }
}, function(err, response, body, options) {
    console.log(err);
    console.log(body);
});
*/