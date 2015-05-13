var dotty = require("dotty");
var argv = require('optimist').argv;
var request = require("request");
var url = "http://localhost:3000";
if(!dotty.exists(argv, "hash")) throw new Error("no hash argument");
var path = "/order_fulfilled/"+ argv.hash;

request({
    "url": url + path,
    "method": "POST",
    "json": {
        "client_ref": "45429",
        "date_despatched": "2013-10-22T18:13:08+01:00",
        "client_area_link": "http://holstee.sixworks.co.uk/order/203646",
        "postage_method": "1st Class Packet",
        "boxed_weight": 276,
        "postage_cost": 1
    }
}, function(err, response, body){
    if(err) throw err;
    console.log(body);
});
