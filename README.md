# PLG Works Cache

[![Latest version](https://img.shields.io/npm/v/@plgworks/cache.svg?maxAge=3600)][npm]

[npm]: https://www.npmjs.com/package/@plgworks/cache

PLG Works Cache is a NPM package that provides a wrapper over caching engines - [Memcached](https://memcached.org/) 
and [Redis](https://redis.io/docs/). Moreover, it provides in-memory caching functionality (utilizing memory on a machine).
All these 3 flavours of caching engines are exposed implementing consistent interface and behaviour.

## Why to use PLG Works Cache?
Core packages of different caching systems do not have a common interface, i.e. they have the same functionality implemented with different method signatures.
Moreover, they have differences in implementation behaviour too. Thus changing from one cache engine to another becomes difficult as all the usages need to be revisited.
PLG Works Cache solves the problem by providing common wrapper methods for memcached, redis and in-memory caching engines.

Also, you do not need to worry breaking changes of the core packages between their major updates as PLG Works Cache will handle them.

## Prerequisites
- [Node.js](https://nodejs.org/en/) (>= version 6)
- [NPM](https://www.npmjs.com/package/npm)

Follow the installation guides to get the caching engines up and running:
- [Memcached installation guide](https://memcached.org/)
- [Redis installation guide](https://redis.io/docs/getting-started/installation/)

## Installation
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
const configStrategy = {
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
const configStrategy = {
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
const configStrategy = {
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
const configStrategy = {
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
```shell script
source test/env/redis.sh
```
* Memcached
```shell script
source test/env/memcached.sh
```
* In-memory 
```shell script
source test/env/inMemory.sh
```
### Cache engines must be running on the specified ports.

* Redis (6380,6381)
```shell script
redis-server --port 6380
```
* Memcached (11212,11213,11214,11215)
```shell script
memcached -p 11212 -d
```
### Run tests
```shell script
./node_modules/.bin/mocha --recursive "./test/*.js"
```
