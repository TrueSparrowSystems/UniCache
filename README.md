# Cache

[![Latest version](https://img.shields.io/npm/v/@plgworks/cache.svg?maxAge=3600)][npm]

[npm]: https://www.npmjs.com/package/@plgworks/cache

Cache NPM implements wrapper over multiple caching engines - [Memcached](https://memcached.org/), [Redis](https://redis.io/docs/) and In-memory (use with single threaded process in development mode only).
The decision of which caching engine to use is governed while creating the Cache NPM object. 

## Why Cache?
 Core packages of different caching systems do not have a common interface, i.e. they have the same functionality implemented with different method signatures.
 Thus changing from one cache system to another becomes difficult as all the usages need to be revisited.
 This NPM package solves the problem by providing common wrapper methods for memcached, redis and in-memory caching systems.

## Prerequisites
  Required caching engine for the use case must be installed and up.
 Refer [memcached](https://memcached.org/) and [redis](https://redis.io/docs/getting-started/installation/) installation guide.

## Installion
```shell script
npm install @plgworks/cache --save
```

## Initialize

```js
const Cache = require('@plgworks/cache');

const configStrategy = {}; // Refer the next section for detailed documentation on configStrategy
const cache = Cache.getInstance(configStrategy);

const cacheImplementer = cache.cacheInstance;
```

**Note**: To print detailed logs, add `CACHE_DEBUG_ENABLED = '1'` in your env variables.

### Config Strategy
**`configStrategy`** is a mandatory parameter which specifies the configuration strategy to be used for a particular cache engine.

An example of the configStrategy is:
```js
configStrategy = {
  cache: {
    engine: "none/redis/memcached",
    host: "",
    port: "",
    password: "",
    enableTsl: "",
    defaultTtl: 10000,
    consistentBehavior: "",
    servers:[],
    namespace: ""
  }
};
```
- **engine**: redis, memcached are different types of caching engine. For in-memory cache engine parameter will be `none`. 
- **host**: Host of the redis caching engine.
- **port**: Port on which redis caching engine is running.
- **password**: Redis caching engine password.
- **enableTsl**: This field is used to enable tsl.
- **defaultTtl**: Default cache expiry time in sec.
- **consistentBehavior**: This field is required to create cache instance key.
- **servers**: servers is an array of memcached servers.
- **namespace**: It is in-memory cache namespace.


#### Redis Example
Following is an example of redis engine config strategy to be used in initializing Cache.
```js
configStrategy = {
  cache: {
    engine: "redis",
    host: "localhost",
    port: "6830",
    password: "dsdsdsd",
    enableTsl: "0",
    defaultTtl: 36000,
    consistentBehavior: "1"
  }
}
````
#### Memcache Example
Following is an example of memcache engine config strategy to be used in initializing Cache.
```js
configStrategy = {
  cache: {
    engine: "memcached",
    servers: ["127.0.0.1:11211"],
    defaultTtl: 36000,
    consistentBehavior: "1"
  }
}
````
#### In-memory Example
Following is an example of in-memory engine config strategy to be used in initializing Cache.
```js
configStrategy = {
  cache: {
    engine: "none",
    namespace: "A",
    defaultTtl: "36000",
    consistentBehavior: "1"
  }
}
```

## `cacheImplementer` methods
Irrespective of the caching engine, the methods exposed in `cacheImplementer` have the consistent signature.

### Store and retrieve data in cache using `set` and `get`:
```js
const resolvePromise = function(cacheResponse){
                           if (cacheResponse.isSuccess()) {
                             console.log(cacheResponse.data.response);
                           } else {
                             console.log(cacheResponse);
                           }
                         };

cacheImplementer.set('testKey', 'testValue', 5000).then(resolvePromise);

cacheImplementer.get('testKey').then(resolvePromise);
```

### Manage objects in cache using `setObject` and `getObject`:

```js
cacheImplementer.setObject('testObjKey', {dataK1: 'a', dataK2: 'b'}).then(resolvePromise);
cacheImplementer.getObject('testObjKey').then(resolvePromise);
```

### Retrieve multiple cache data using `multiGet`:

<b>NOTE: Redis returns null from `multiGet` for objects, even if a value is set in the cache. The other caching implementers match this behaviour.</b>

```js
cacheImplementer.set('testKeyOne', 'One').then(console.log);
cacheImplementer.set('testKeyTwo', 'Two').then(console.log);
cacheImplementer.multiGet(['testKeyOne', 'testKeyTwo']).then(resolvePromise);
```

### Delete cache using `del`:

```js
cacheImplementer.set('testKey', 'testValue').then(console.log);
cacheImplementer.del('testKey').then(resolvePromise);
```

### Manage counters in cache using `increment` and `decrement`: 

```js
cacheImplementer.set('testCounterKey', 1).then(console.log);
cacheImplementer.increment('testCounterKey', 10).then(resolvePromise);
cacheImplementer.decrement('testCounterKey', 5).then(resolvePromise);
```

### Change the cache expiry time using `touch`:

```js
cacheImplementer.set('testKey', "testData").then(console.log);
cacheImplementer.touch('testKey', 10).then(resolvePromise);
```

## Running test cases
### Set environment variables of particular cache engine for which you want to run the tests.

* Redis
````
source test/env/redis.sh
````
* Memcached
```` 
source test/env/memcached.sh
````
* In-memory 
````
source test/env/inMemory.sh
````
### Cache engines must be running on the specified ports.

* Redis (6380,6381)
````
redis-server --port 6380
````
* Memcached (11212,11213,11214,11215)
````
memcached -p 11212 -d
````
### Run tests
````
./node_modules/.bin/mocha --recursive "./test/*.js"
````
