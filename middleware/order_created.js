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
            // check if order has already been sent to sixworks
            db.orders.findOne({"created.order.id": req.order.id}, function(err, order){
                if(err) return next(err);
                if(typeof order !== "undefined" && order.created.order.sixworks_response) return next(new Error("this order has already been processed"));
                return next();
            });
        },
        function(req, res, next){
            db.orders.insert({
                "created": {
                    "headers": _.clone(req.headers),
                    "order":  _.clone(req.order),
                    "sixworks_response": false,
                    "date": new Date()
                }
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
            })
        },
        function(req, res, next){
            //country
            var is_european = _.contains(countries.codes, req.order.shipping_address.country_code);
            if(!is_european) return next(new Error("country is not european"));
            return next();
        },
        function(req, res, next){
            // product
            var sixworks_line_items = _.filter(req.order.line_items, function(line_item){
                if(line_item.fulfillment_service.toLowerCase() == "sixworks") return true;
            });
            if(sixworks_line_items.length == 0) return next(new Error("order does not have a product with sixworks as fulfillment_service"));
            return next();
        },
        function(req, res, next){
            sixworks.request(req.order, function(err, body){
                if(err) return next(err);
                req.sixworks_response = body;
                return next();
            });
        },
        function(req, res, next){
            var set = {
                "$set":{
                    "created.sixworks_response": req.sixworks_response,
                }
            };
            db.orders.update({"created.order.id": req.order.id}, set, function(err){
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
            var json = {
                "code": 200,
                "method": req.method,
                "url": req.protocol + "://" + req.get('host') + req.url,
                "message": (typeof err == "object") ? err.message : err,
                "date": new Date(),
            };
            db.orders.update({"created.order.id": req.order.id}, {"$push":{"logs": json}}, function(err){
                return res.status(json.code).json(json);
            });
        }
    ];
};