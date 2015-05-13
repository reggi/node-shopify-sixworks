# Shopify Sixworks

## Queries

Last 100 orders to enter the database that were sent to sixworks.

```
find({"created.sixworks_response":{"$ne":false}}).sort({"created.date":-1}).limit(100)
```
