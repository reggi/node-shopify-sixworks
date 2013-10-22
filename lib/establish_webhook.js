var _ = require("underscore");
var dotty = require("dotty");
var async = require("async");

module.exports = function(shopify, url, callback){

    var webhook_delete = function(){
        return function(webhook, callback){
            shopify.request({
                "method": "DELETE",
                "path": "/admin/webhooks/"+webhook.id+".json",
            }, function(err, response, body, options) {
                if(err) return callback(err);
                return callback(null, webhook);
            });
        }
    }

    async.waterfall([
        function(callback){
            shopify.request({
                "method": "GET",
                "path": "/admin/webhooks.json",
            }, function(err, response, body, options) {
                if(err) return callback(err);
                if(!dotty.exists(body,"webhooks")) return callback(null, false);
                if(body.webhooks.length > 0) return callback(null, body.webhooks);
                return callback(null, false);
            });
        },
        function(webhooks, callback){
            if(!webhooks) return callback(null);
            var webhook = _.find(webhooks, function(webhook){
                return webhook.address == url;
            });
            return callback(null, webhooks, webhook);
        },
        function(webhooks, webhook, callback){
            if(!webhook) return callback(null, webhooks, webhook);
            var delete_webhooks = _.filter(webhooks, function(webhook){
                return webhook.address !== url;
            });
            return callback(null, delete_webhooks, webhook);
        },
        function(delete_webhooks, webhook, callback){
            if(delete_webhooks.length == 0) return callback(null, [], webhook);
            async.map(delete_webhooks, webhook_delete(), function(err, bodies){
                if(err) return callback(err);
                return callback(null, bodies, webhook);
            });
        },
        function(deleted_webhooks, webhook, callback){
            if(webhook) return callback(null, deleted_webhooks, webhook);
            shopify.request({
                "method": "POST",
                "path": "/admin/webhooks.json",
                "body": {
                    "webhook": {
                        "topic": "orders/create",
                        "address": url,
                        "format": "json"
                    }
                }
            }, function(err, response, body, options) {
                if(err) return callback(err);
                if(dotty.exists(body, "webhook")) return callback(null, deleted_webhooks, body.webhook);
                return callback(new Error("created a webhook with no response"))
            });
        }
    ], function(err, deleted_webhooks, webhook){
        if(err) return callback(err);
        return callback(null, deleted_webhooks, webhook);
    });
}