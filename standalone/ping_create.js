var request = require("request");
var config = require("config");
var Shopify = require("shopify-api");
var rand = Math.floor((Math.random()*100000)+1);
var order = require("./order.js")(rand).order;
var shopify = Shopify(config.shopify);
var url = "http://localhost:3000";
var path = "/order_created";

request({
    "url": url + path,
    "method": "POST",
    "json": order,
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
}, function(err, response, body){
    if(err) throw err;
    console.log(body);
});
