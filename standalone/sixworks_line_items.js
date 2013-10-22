var _ = require("underscore");
var rand = Math.floor((Math.random()*100000)+1);
var req = {};
req.order = require("./order.js")(rand).order;

var for_sixworks = function(){
    var sixworks_line_items = _.filter(req.order.line_items, function(line_item){
        if(line_item.fulfillment_service.toLowerCase() == "sixworks") return true;
    });
    var for_sixworks = _.map(sixworks_line_items, function(line_item){
        var product = {};
        product.client_ref = line_item.sku;
        product.quantity = line_item.quantity;
        product.price = line_item.price;
        return product;
    });
    return for_sixworks;
}();

var id_array = function(){
    var line_items = req.order.line_items;
    var sixworks_line_items = _.filter(line_items, function(line_item){
        if(line_item.fulfillment_service.toLowerCase() == "sixworks") return true;
    });
    var ids = _.map(sixworks_line_items, function(line_item){
        var id = {};
        id.id = line_item.id;
        return id;
    });
    return ids;
}();

console.log(id_array);