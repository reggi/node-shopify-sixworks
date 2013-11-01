var dotty = require("dotty");
var _ = require("underscore");
var countries = require("./countries.js");

module.exports = function(config, db, shopify, sixworks){
    return [
        function(req, res, next){
            // preliminary checks
            if(!config.enabled) next(new Error("app is not enabled in settings"));
            if(req.method !== "POST") return next(new Error("http method needs to be POST"));
            if(!dotty.exists(req,"body")) return next(new Error("no body"));
            if(!dotty.exists(req,"body.id")) return next(new Error("no body id"));
            return next();
        },
        function(req, res, next){
            // check if order exists
            db.orders.findOne({"created.order.id": req.body.id}, function(err, order){
                if(err) return next(err);
                if(typeof order !== "undefined" && order.created.order.sixworks_response) return next(new Error("this order has already been processed"));
                req.exists = (typeof order == "undefined") ? false : true;
                return next();
            });
        },
        function(req, res, next){
            // insert if order !exist
            if(req.exists) return next();
            db.orders.insert({
                "created": {
                    "headers": _.clone(req.headers),
                    "order":  _.clone(req.body),
                    "sixworks_response": false,
                    "date": new Date()
                }
            }, function(err){
                if(err) return next(err);
                return next();
            });
        },
        function(req, res, next){
            // prior checks
            if(!dotty.exists(req, "headers.x-shopify-topic")) return next(new Error("no header x-shopify-topic"));
            if(!dotty.exists(req, "headers.x-shopify-test")) return next(new Error("no header x-shopify-test"));
            if(!dotty.exists(req, "headers.x-shopify-shop-domain")) return next(new Error("no header x-shopify-shop-domain"));
            if(!dotty.exists(req, "headers.x-shopify-order-id")) return next(new Error("no header x-shopify-order-id"));
            if(!dotty.exists(req, "headers.x-shopify-hmac-sha256")) return next(new Error("no header x-shopify-hmac-sha256"));
            if(!dotty.exists(req, "headers.user-agent")) return next(new Error("no header user-agent"));
            if(req.headers["x-shopify-topic"] !== "orders/create") return next(new Error("webhook isn't orders/create"));
            if(req.headers["x-shopify-test"] == "true") return next(new Error("shopify test header is true"));
            if(req.headers["x-shopify-shop-domain"] !== config.shopify.hostname) return next(new Error("shopify domain header not valid"));
            if(req.headers["user-agent"] !== "Ruby") return next(new Error("user agent isn't ruby"));
            if(shopify.webhook.hmac(req.body) !== req.headers['x-shopify-hmac-sha256']) return next(new Error("failed verify hmac"));
            return next();
        },
        function(req, res, next){
            // check if order even exists in shop
            shopify.request("/orders/"+req.body.id, function(err, response, body, options){
                if(err) return next(err);
                return next();
            })
        },
        function(req, res, next){
            // check country
            var is_european = _.contains(countries.codes, req.body.shipping_address.country_code);
            if(!is_european) return next(new Error("country is not european"));
            return next();
        },
        function(req, res, next){
            // check products have sixworks as fulfilfillment service
            var sixworks_line_items = _.filter(req.body.line_items, function(line_item){
                if(line_item.fulfillment_service.toLowerCase() == "sixworks") return true;
            });
            if(sixworks_line_items.length == 0) return next(new Error("order does not have a product with sixworks as fulfillment_service"));
            return next();
        },
        function(req, res, next){
            // create in sixworks
            sixworks.request(req.body, function(err, body){
                if(err) return next(err);
                req.sixworks_response = body;
                return next();
            });
        },
        function(req, res, next){
            // update database with sixworks response
            db.orders.update({"created.order.id": req.body.id}, {"$set":{"created.sixworks_response": req.sixworks_response}}, function(err){
                if(err) return next(err);
                return next();
            });
        },
        function(req, res, next){
            var json = {
                "code": 200,
                "method": req.method,
                "url": req.protocol + "://" + req.get('host') + req.url,
                "message": "success",
                "date": new Date(),
            };
            return res.status(json.code).json(json);
        },
        function(err, req, res, next){
            console.log(err.stack);
            var json = {
                "code": 200,
                "method": req.method,
                "url": req.protocol + "://" + req.get('host') + req.url,
                "message": (typeof err == "object") ? err.message : err,
                "date": new Date(),
            };
            if(!dotty.exists(req,"order.id")) return res.status(json.code).json(json);
            db.orders.update({"created.order.id": req.body.id}, {"$push":{"logs": json}}, function(err){
                return res.status(json.code).json(json);
            });
        }
    ];
};