var optimist = require("optimist");
var request = require("request");
var config = require("config");
var Shopify = require("shopify-api");
var order = require("./order.json");
var shopify = Shopify(config.shopify);
//var url = process.env.SIXWORKS_WEBHOOK_URL;
var url = "http://localhost:3000";
var path = "/order_created";

var options = {
    "url": url + path,
    "method": "POST",
    "body": JSON.stringify(order),
    "headers": {
        "content-type": "application/json",
        "x-shopify-topic": "orders/create",
        "x-shopify-shop-domain": config.shopify.shop,
        "x-shopify-order-id": order.id,
        "x-shopify-test": "false",
        "x-shopify-hmac-sha256": shopify.webhook.hmac(order),
        "accept": "*/*",
        "user-agent": "Ruby",
        "host": url,
    },
};

request({
    "url": url + path,
    "method": "POST",
}, function(err, response, body){
    //console.log(response);
    //console.log(err);
    console.log(body);
});
