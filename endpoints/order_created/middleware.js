var dotty = require("dotty");
var countries = require("./countries.js");

module.exports = function(config, db, shopify, sixworks){
    return [
        function(req, res, next){
            if(!config.enabled) next(new Error("app is not enabled in settings"));
            return next();
        },
        function(req, res, next){
            if(req.method !== "post") return next(new Error("http method needs to be POST"));
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
                if(typeof order !== "undefined" && order.completed) return next("this order has already been processed");
                req.unique = "req_"+Math.random().toString(36).substring(7);
                db.orders.insert({
                    "identifier": _.clone(req.unique),
                    "order":  _.clone(req.order),
                    "stringified": JSON.stringify(_.clone(req.order)),
                    "headers": _.clone(req.headers),
                    "completed": false,
                    "log": [],
                });
                return next();
            });
        },
        function(req, res, next){
            var valid = shopify.verify_webhook_headers(req,{
                "topic":"orders/create",
                "header":"x-shopify-order-id"
            });
            if(!valid) return next("shopify webhook headers failed verification");
            return next();
        },
        function(req, res, next){
            shopify.request("/orders/"+req.order.id, function(err, body){
                if(err) return next(new Error("shopify confirm order exists failed"));
                return next();
            });
        },
        function(req, res, next){
            //country
            var is_european = _.contains(req.order.shipping_address.country_code, config.countries);
            if(!is_european) return next(new Error("country is not european"));
            return next();
        },
        function(req, res, next){
            //product
            _.each(req.order.line_items, function(line_item){
                if(line_item.fulfillment_service !== "sixworks") delete line_item;
            });
            if(req.order.line_items.length > 0) return next(new Error("order does not have sixworks product"));
            return next();
        },
        function(req, res, next){
            sixworks.request(req.order, function(err, body){
                if(err) return next(err);
                return next();
            });
        },
        function(req, res, next){
            db.orders.update({"identifier": req.unique}, {"$set":{"complete": true}}, function(err){
                if(err) return next(err);
                return next();
            });
        },
        function(err, req, res, next){
            var json = {
                "code": 200,
                "method": req.method,
                "url": req.protocol + "://" + req.get('host') + req.url,
                "message": (typeof err == "object") ? err.message : err
                "timestamp": new Date(),
            };
            db.orders.update({"identifier": req.unique}, {"$push":{"logs": json}}, function(err){
                return res.status(json.code).json(json);
            });
        }
    ];
};