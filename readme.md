# Node Shopify Sixworks

## Summary

This app bridges the connection between Shopify and Sixworks.

Here's the flow:

* When the application server runs it will ensure that a webhook connection with the Shopify store is enabled.
* The server waits.
* When an order is created in the Shopify store a webhook is sent to the endpoint `/order_created`
* The middleware file `order_created.js` will then do the following:
  * Basic body validation
  * Ensure this order hasn't already been processed
  * Insert the order
  * Validate the request headers
  * Ensure it's an actual order in Shopify (not trying to invent a new order)
  * Look it it's a order that needs to be fulfilled by Sixworks
  * Make the request to create order in Sixworks
  * Save the response from creating the order in Sixworks
* When an order is fulfilled by Sixworks a webhook is sent to the endpoint `/order_fulfilled`
* The middleware file `order_fulfilled.js` will then do the following:
  * Basic body validation
  * Fulfill the order in Shopify
  * Store the Shopify response from fulfilling the order

## Environment Variables

```bash
MONGOHQ_URL={{ value }}
SHOPIFY_API_KEY={{ value }}
SHOPIFY_PASSWORD={{ value }}
SHOPIFY_SHARED_SECRET={{ value }}
SHOPIFY_HOST_NAME={{ value }}
SHOPIFY_DEV_API_KEY={{ value }}
SHOPIFY_DEV_PASSWORD={{ value }}
SHOPIFY_DEV_SHARED_SECRET={{ value }}
SHOPIFY_DEV_HOST_NAME={{ value }}
SIXWORKS_URL={{ value }}
SIXWORKS_KEY={{ value }}
SIXWORKS_WEBHOOK_URL={{ value }}
ORDER_EMAIL_LOCK={{ value }}
NODE_ENV={{ value }}
```

## Accompanying Modules

These two modules were originally included in this repo, I moved them out into their own github projects so that I can remove `node_modules` from this repo and properly install all the node modules.

The first is the simple node node sixworks api.

* https://github.com/reggi/node-sixworks-api

The second is a primative version of the node shopify api. There's a specific branch `for-node-shopify-sixworks` that is specifically the version I pulled from this source. This isn't on NPM and needs to be installed with the following command (and it's in package.json).

```bash
npm install git+https://github.com/reggi/shopify-api.git#for-node-shopify-sixworks --save
```

* https://github.com/reggi/shopify-api/tree/for-node-shopify-sixworks

## Building from scratch

> Note: Ensure you have the environment variables set in a `.env` file.

```bash
git clone git@github.com:reggi/node-shopify-sixworks.git
cd node-shopify-sixworks
npm install
npm run local
```

## Query The Last 100 Orders

Last 100 orders to enter the database that were sent to sixworks.

```javascript
find({"created.sixworks_response":{"$ne":false}}).sort({"created.date":-1}).limit(100)
```
