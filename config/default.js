module.exports = {
    "enabled": true,
    "order_email_lock": process.env.ORDER_EMAIL_LOCK,
    "mongodb": "mongo://localhost:27017/shoify-sixworks",
    "domain": "localhost",
    "shopify": {
        "apikey": process.env.SHOPIFY_DEV_API_KEY,
        "password": process.env.SHOPIFY_DEV_PASSWORD,
        "shared_secret": process.env.SHOPIFY_DEV_SHARED_SECRET,
        "hostname": process.env.SHOPIFY_DEV_HOST_NAME
    },
    "sixworks": {
        "url":process.env.SIXWORKS_URL,
        "key":process.env.SIXWORKS_KEY
    }
}