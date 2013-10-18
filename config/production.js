module.exports = {
    "enabled": false,
    "order_email_lock" false,
    "domain": "sr.getsimpleapps.com",
    "shopify": {
        "apikey": process.env.SHOPIFY_API_KEY,
        "password": process.env.SHOPIFY_PASSWORD,
        "shared_secret": process.env.SHOPIFY_SHARED_SECRET,
        "hostname": process.env.SHOPIFY_HOST_NAME
    },
    "sixworks": {
        "url":process.env.SIXWORKS_URL,
        "key":process.env.SIXWORKS_KEY
    }
}