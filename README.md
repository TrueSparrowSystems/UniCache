![UniCache logo Dark](https://user-images.githubusercontent.com/7627517/195535780-47906a3b-c302-4c59-bb1e-d171914ff1bd.png)

[![Latest version](https://img.shields.io/npm/v/@truesparrow/unicache.svg?maxAge=3600)][npm]

[npm]: https://www.npmjs.com/package/@truesparrow/unicache

UniCache is an open-source NPM package that provides unified / singleton interface and behavior for [Memcached](https://memcached.org/), 
[Redis](https://redis.io/docs/) and In-memory caching. Easily interact or switch between them in minutes!

## Why UniCache?
- UniCache abstracts the unnecessary deviations between the base NPM packages of Memcached and Redis, in turn helping you 
learn about and interact with 3 different caching engines (Memcached, Redis and In-memory) all at once.
- Singleton interface of UniCache is not only compatible with Memcached and Redis but also for In-Memory cache.
- If your backend is interacting with multiple caching engines, UniCache helps developers to reduce translation layer 
for input and output - thus reducing development time and effort. Even exceptions are given out consistently.
- When using multiple caching engines simultaneously or want to switch between them, consistent output from UniCache 
will help in faster development.
- Be rest assured that your code will not need any further changes in order to use the upcoming base NPM package versions. 
UniCache will take care of it.
- UniCache is thoroughly tested and is fully compatible with AWS ElastiCache for Redis and AWS ElastiCache for Memcached.

## Prerequisites
- [Node.js](https://nodejs.org/en/) (>= version 6)
- [NPM](https://www.npmjs.com/package/npm)

Follow the installation guides to get the caching engines of your choice, up and running:
- [Memcached installation guide](https://memcached.org/)
- [Redis installation guide](https://redis.io/docs/getting-started/installation/)

## Install NPM
```shell script
npm install @truesparrow/unicache --save
```

## Initialize
While using the package, create a singleton object of UniCache for each caching engines and then use it across the application.
Example snippet for the UniCache singleton object initialization is given below.

```js
// Include the following snippet in a separate file, which can be required all accross the code to get unicache instance.
// If using different caching engines simultaneously in a single codebase, have different files for each.
const UniCache = require('@truesparrow/unicache');

const configStrategy = {
  engine: "none/redis/memcached",
  // Other keys depend on the engine, refer to the next section on Config Strategy, for the same.
};

module.exports = UniCache.getInstance(configStrategy);
```

The singleton object can be used as given below. 
```js
const cacheProvider = require('path-to-your-uni-cache-singleton-provider');
const cacheImplementer = cacheProvider.cacheInstance;

cacheImplementer.set('testKey', 'testValue', 5000).then(console.log);
cacheImplementer.get('testKey').then(console.log);
```

**Note**: To print detailed logs, add `UNICACHE_DEBUG_ENABLED = '1'` in the ENV variables.

### Config Strategy
**`configStrategy`** is a mandatory parameter which specifies the configuration to be used for the caching engine.
Using the `engine` property, you can select which caching engine to use.

An example of the configStrategy is:
```js
const configStrategy = {
    engine: "none/redis/memcached",
  // other keys depend on the engine.
};
```

#### Redis Config Strategy
Following is how the config strategy looks for redis caching engine.
```js
const configStrategy = {
  engine: "redis",
  host: "localhost",
  port: "6380",
  password: "dsdsdsd",
  enableTsl: "0",
  defaultTtl: 36000,
  consistentBehavior: "1"
}
````
- **engine**: Pass value `redis` for using UniCahce with Redis. 
- **host**: Host of the Redis server.
- **port**: Port of the Redis server.
- **password**: Password for auth with Redis server.
- **enableTsl**: Pass '1' for enabling TSL. Otherwise '0'
- **defaultTtl**: Default time to live (TTL) for cache in seconds.
- **consistentBehavior**: Pass '1' to use the consistent behaviour accross various caching engines option. Otherwise '0'.

#### Memcache Config Strategy
Following is how the config strategy looks for Memcache caching engine.
```js
const configStrategy = {
  engine: "memcached",
  servers: ["127.0.0.1:11211"],
  defaultTtl: 36000,
  consistentBehavior: "1"
}
````
- **engine**: Pass value `memcached` for using UniCahce with Memcache.
- **servers**: Servers is an array of memcached servers' hosts.
- **defaultTtl**: Default time to live (TTL) for cache in seconds.
- **consistentBehavior**: Pass '1' to use the consistent behaviour accross various caching engines option. Otherwise '0'.

#### In-Memory Config Strategy
Following is how the config strategy looks for In-memory caching engine.
```js
const configStrategy = {
  engine: "none",
  namespace: "A",
  defaultTtl: "36000",
  consistentBehavior: "1"
}
```
- **engine**: Pass value `none` for using UniCahce with In-memory cache.
- **namespace**: In-memory cache namespace. You can segregate cache keys in the same machine with different namespaces.
- **defaultTtl**: Default time to live (TTL) for cache in seconds.
- **consistentBehavior**: Pass '1' to use the consistent behaviour accross various caching engines option. Otherwise '0'.

## `cacheImplementer` methods
Irrespective of the caching engine, the methods exposed in `cacheImplementer` have the consistent signature, 
i.e. singleton interface implementation.

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

## Test Cases
Test cases cover all the 3 caching engines. Also a coverage report is generated at the end.
Running test cases is a 2 step process.

### Step 1: Start Cache Engines
Following processes are needed for running test cases.

* Start Redis on 2 ports - 6380 and 6381 as needed by the test cases.
```shell script
redis-server --port 6380
redis-server --port 6381
```

* Start Memcached on 4 ports - 11212,11213,11214 and 11215 as needed by the test cases.
```shell script
memcached -p 11212 -d
memcached -p 11213 -d
memcached -p 11214 -d
memcached -p 11215 -d
```

### Step 2: Run tests
For running tests for all the 3 caching engines, use the following command.
```shell script
npm run test
```

## Contribution
We welcome more helping hands to make UniCache better. Feel free to report issues, raise PRs for fixes & enhancements.

<p align="left">Built with :heart: by <a href="https://plgworks.com/" target="_blank">PLG Works</a></p>
