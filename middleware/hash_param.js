var dotty = require("dotty");
var _ = require("underscore");

module.exports = function(db){
    return function(req, res, next, id){
        db.orders.findOne({"created.order.token": id}, function(err, order){
            if(err) return next(err);
            if(typeof order == "undefined") return next(new Error("no order with hash "+id));
            req.order = order;
            return next();
        })
    }
}