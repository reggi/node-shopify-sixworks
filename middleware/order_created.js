var dotty = require("dotty");
var _ = require("underscore");
var countries = require("./countries.js");

module.exports = function(config, db, shopify, sixworks){
    return [
        function(req, res, next){
            if(!config.enabled) next(new Error("app is not enabled in settings"));
            return next();
        },
        function(req, res, next){
            if(req.method !== "POST") return next(new Error("http method needs to be POST"));
            return next();
        },
        function(req, res, next){
            if(!dotty.exists(req,"body")) return next(new Error("no body"));
            if(!dotty.exists(req,"body.id")) return next(new Error("no body id"));
            req.order = req.body;
            return next();
        },
        function(req, res, next){
            if(config.order_email_lock && req.order.email !== config.order_email_lock) return next(new Error("order email lock specified and not match"));
            return next();
        },
        function(req, res, next){
            db.orders.findOne({"order.id": req.order.id}, function(err, order){
                if(err) return next(err);
                if(typeof order !== "undefined" && order.sent_to_sixworks) return next("this order has already been processed");
                req.unique = "req_"+Math.random().toString(36).substring(7);
                return next();
            });
        },
        function(req, res, next){
            db.orders.insert({
                "identifier": _.clone(req.unique),
                "order":  _.clone(req.order),
                "headers": _.clone(req.headers),
                "sent_to_sixworks": false,
                "fulfilled_from_sixworks": false,
                "log": [],
            }, function(err){
                if(err) return next(err);
                return next();
            });
        },
        function(req, res, next){
            var valid = shopify.webhook.verify_headers(req,{
                "topic":"orders/create",
                "header":"x-shopify-order-id"
            });
            if(!valid) return next("shopify webhook headers failed verification");
            return next();
        },
        function(req, res, next){
            shopify.request("/orders/"+req.order.id, function(err, response, body, options){
                if(err) return next(err);
                return next();
            });
        },
        function(req, res, next){
            //country
            var is_european = _.contains(countries.codes, req.order.shipping_address.country_code);
            if(!is_european) return next(new Error("country is not european"));
            return next();
        },
        function(req, res, next){
            //product
            var sixworks_line_items = [];
            _.each(req.order.line_items, function(line_item){
                if(line_item.fulfillment_service.toLowerCase() == "sixworks") sixworks_line_items.push(line_item);
            });
            req.order.line_items = sixworks_line_items;
            if(req.order.line_items.length == 0) return next(new Error("order does not have a product with sixworks as fulfillment_service"));
            return next();
        },
        function(req, res, next){
            sixworks.request(req.order, function(err, body){
                if(err) return next(err);
                req.sixworks = body;
                return next();
            });
        },
        function(req, res, next){
            var set = {
                "$set":{
                    "sent_to_sixworks": true,
                    "sixworks": req.sixworks
                }
            };
            db.orders.update({"identifier": req.unique}, set, function(err){
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
                "timestamp": new Date(),
            };
            return res.status(json.code).json(json);
        },
        function(err, req, res, next){
            var json = {
                "code": 200,
                "method": req.method,
                "url": req.protocol + "://" + req.get('host') + req.url,
                "message": (typeof err == "object") ? err.message : err,
                "timestamp": new Date(),
            };
            db.orders.update({"identifier": req.unique}, {"$push":{"logs": json}}, function(err){
                return res.status(json.code).json(json);
            });
        }
    ];
};