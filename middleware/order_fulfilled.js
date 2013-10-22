var dotty = require("dotty");
var _ = require("underscore");

module.exports = function(config, db, shopify, sixworks){
    return [
        function(req, res, next){
            if(req.method !== "POST") return next(new Error("http method needs to be POST"));
            if(!dotty.exists(req, "body.client_ref")) return next(new Error("no client_ref"));
            if(!dotty.exists(req, "body.date_despatched")) return next(new Error("no date_despatched"));
            if(!dotty.exists(req, "body.client_area_link")) return next(new Error("no client_area_link"));
            if(!dotty.exists(req, "body.postage_method")) return next(new Error("no postage_method"));
            if(!dotty.exists(req, "body.boxed_weight")) return next(new Error("no boxed_weight"));
            if(!dotty.exists(req, "body.postage_cost")) return next(new Error("no postage_cost"));
            return next();
        },
        function(req, res, next){
            shopify.request({
                "method":"POST",
                "path":"/admin/orders/"+req.order.created.order.id+"/fulfillments.json",
                "body":{
                    "fulfillment": {
                        "tracking_number": null,
                        "notify_customer": true,
                        "line_items": function(){
                            var line_items = req.order.created.order.line_items;
                            var sixworks_line_items = _.filter(line_items, function(line_item){
                                if(line_item.fulfillment_service.toLowerCase() == "sixworks") return true;
                            });
                            var ids = _.map(sixworks_line_items, function(line_item){
                                var id = {};
                                id.id = line_item.id;
                                return id;
                            });
                            return ids;
                        }()
                    }
                }
            },function(err, response, body, options){
                if(err) return next(err);
                req.shopify_body = body;
                return next();
            });
        }, 
        function(req, res, next){
            var set = {
                "$set":{
                    "fulfilled":{
                        "sixworks_request": req.body,
                        "shopify_response": req.shopify_body
                    }
                }
            };
            db.orders.update({"_id":req.order._id}, set, function(err){
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
            db.orders.update({"_id":req.order._id}, {"$push":{"logs": json}}, function(err){
                return res.status(json.code).json(json);
            });
        }
    ];
}