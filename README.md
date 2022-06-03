Cache
============
[![Latest version](https://img.shields.io/npm/v/@plgworks/cache.svg?maxAge=3600)][npm]
[![Downloads per month](https://img.shields.io/npm/dm/@plgworks/cache.svg?maxAge=3600)][npm]

[npm]: https://www.npmjs.com/package/@plgworks/cache

Cache is the central cache implementation for several modules. 
It contains three caching engines. The decision of which caching engine to use is governed while creating the cache object. 
The caching engines implemented are:

* [Memcached](https://memcached.org/)
* [Redis](https://redis.io/docs/)
* In-memory (use with single threaded process in development mode only)
## Why Cache?
 Implementation method varies according to caching systems. 
 So implementing different caching systems is always a overhead for developer.
 Our package solve this problem by providing common wrapper methods for memcached, redis and in-memory caching system.

## Prerequisites
  Required caching engine for the use case must be installed and up.
 Refer [memcached](https://gist.github.com/tomysmile/ba6c0ba4488ea51e6423d492985a7953) and [redis](https://flaviocopes.com/redis-installation/) installation guide.

## Install NPM
```bash
npm install @plgworks/cache --save
```

## Initialize

#### Cache Initialization Params
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


<b>Below are the examples of configStrategies:</b>
* Redis 

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
* Memcached 

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
* In-memory 
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
Note: To print detailed logs, add `CACHE_DEBUG_ENABLED = '1'` in your env variables.
## Examples:

#### Create Cache Object:

```js
Cache = require('@plgworks/cache');
cache = Cache.getInstance(configStrategy);

cacheImplementer = cache.cacheInstance;
```

#### Store and retrieve data in cache using `set` and `get`:

```js
cacheImplementer.set('testKey', 'testValue', 5000).then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
cacheImplementer.get('testKey').then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
```

#### Manage objects in cache using `setObject` and `getObject`:

```js
cacheImplementer.setObject('testObjKey', {dataK1: 'a', dataK2: 'b'}).then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
cacheImplementer.getObject('testObjKey').then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
```

#### Retrieve multiple cache data using `multiGet`:

###### * <b>NOTE: Redis returns null from `multiGet` for objects, even if a value is set in the cache; the other caching engines match this behaviour.</b>

```js
cacheImplementer.set('testKeyOne', 'One').then(console.log);
cacheImplementer.set('testKeyTwo', 'Two').then(console.log);
cacheImplementer.multiGet(['testKeyOne', 'testKeyTwo']).then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
```

#### Delete cache using `del`:

```js
cacheImplementer.set('testKey', 'testValue').then(console.log);
cacheImplementer.del('testKey').then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
```

#### Manage counters in cache using `increment` and `decrement`: 

```js
cacheImplementer.set('testCounterKey', 1).then(console.log);
cacheImplementer.increment('testCounterKey', 10).then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
cacheImplementer.decrement('testCounterKey', 5).then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
```

#### Change the cache expiry time using `touch`:

```js
cacheImplementer.set('testKey', "testData").then(console.log);
cacheImplementer.touch('testKey', 10).then(function(cacheResponse){
    if (cacheResponse.isSuccess()) {
      console.log(cacheResponse.data.response);
    } else {
      console.log(cacheResponse);
    }
  });
```
## Running test cases
##### Set environment variables of particular cache engine for which you want to run the tests.

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
##### Cache engines must be running on the specified ports.

* Redis (6380,6381)
````
redis-server --port 6380
````
* Memcached (11212,11213,11214,11215)
````
memcached -p 11212 -d
````
##### Run tests
````
./node_modules/.bin/mocha --recursive "./test/*.js"
````
