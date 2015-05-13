module.exports = {
    "enabled": true,
    "order_email_lock": false,
    "mongodb": process.env.MONGOHQ_URL,
    "domain": "sw.getsimpleapps.com",
    "shopify": {
        "apikey": process.env.SHOPIFY_API_KEY,
        "password": process.env.SHOPIFY_PASSWORD,
        "shared_secret": process.env.SHOPIFY_SHARED_SECRET,
        "hostname": process.env.SHOPIFY_HOST_NAME
    },
    "sixworks": {
        "url":process.env.SIXWORKS_URL,
        "key":process.env.SIXWORKS_KEY,
        "webhook_url": process.env.SIXWORKS_WEBHOOK_URL
    }
}
