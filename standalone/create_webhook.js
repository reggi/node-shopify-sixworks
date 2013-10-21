var config = require("config");
var Shopify = require("shopify-api");
var shopify = new Shopify(config.shopify);

//var url = "http://sr.getsimpleapps.com/webhook/shopify";
var url = "http://shopify-sixworks.herokuapp.com/order_created";
//var url = "http://requestb.in/1l0sbge1";
//var url = "http://requestb.in/16v7p7w1";

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
}, function(err, data) {
    console.log(err);
    console.log(data);
});