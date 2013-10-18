module.exports = function(){
    return function(req, res){
        var json = {
            "code": 200,
            "method": req.method,
            "url": req.protocol + "://" + req.get('host') + req.url,
            "message": success
            "timestamp": new Date(),
        };
        return res.status(json.code).json(json);
    }
};