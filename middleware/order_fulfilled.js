var dotty = require("dotty");
var _ = require("underscore");

module.exports = function(config, db, shopify, sixworks){
    return [
        function(req, res, next){
            if(req.method !== "POST") return next(new Error("http method needs to be POST"));
            return next();
        },
        function(req, res, next){
            shopify.request({
                "method":"POST",
                "path":"/admin/orders/"+"178606991"+"/fulfillments.json",
                "body":{
                    "fulfillment": {
                        "tracking_number": null,
                        "notify_customer": true
                    }
                }
            },function(err, response, body, options){
                if(err) return next(err);
                return next();
            });
        }, 
        function(req, res, next){
            db.orders.update({"_id":req.doc._id}, {"fulfilled_from_sixworks": true}, function(err){
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
            db.orders.update({"_id":req.doc._id}, {"$push":{"logs": json}}, function(err){
                return res.status(json.code).json(json);
            });
        }
    ];
}