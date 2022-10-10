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

Also, you do not need to worry about breaking changes of the core packages between their major updates as PLG Works Cache will handle them.

## Prerequisites
- [Node.js](https://nodejs.org/en/) (>= version 6)
- [NPM](https://www.npmjs.com/package/npm)

Follow the installation guides to get the caching engines up and running:
- [Memcached installation guide](https://memcached.org/)
- [Redis installation guide](https://redis.io/docs/getting-started/installation/)

## Install NPM
```shell script
npm install @plgworks/cache --save
```

## Initialize
While using the package, create a singleton object of PLG Works Cache and then use it across the application. Example snippet for the PLG Works Cache singleton object is given below.

```js
const PLGWorksCache = require('@plgworks/cache');

const configStrategy = {
  cache: {
    engine: "none/redis/memcached",
    // Other keys depend on the engine, refer to the next section for the same.
  }
};

module.exports = PLGWorksCache.getInstance(configStrategy);
```

The singleton object can be used as given below. 
```js
const cacheProvider = require('path-to-your-plg_works_cache-singleton-provider');
const cacheImplementer = cacheProvider.cacheInstance;

cacheImplementer.set('testKey', 'testValue', 5000);
cacheImplementer.get('testKey');
```

**Note**: To print detailed logs, add `CACHE_DEBUG_ENABLED = '1'` in your env variables.

### Config Strategy
**`configStrategy`** is a mandatory parameter which specifies the configuration strategy to be used for the cache engine.
Using the `engine` property, you can select which caching engine to use.

An example of the configStrategy is:
```js
const configStrategy = {
  cache: {
    engine: "none/redis/memcached",
    // other keys depend on the engine.
  }
};
```

#### Redis Config Strategy
Following is the redis engine config strategy to be used in initializing PLG Works Cache.
```js
const configStrategy = {
  cache: {
    engine: "redis",
    host: "localhost",
    port: "6380",
    password: "dsdsdsd",
    enableTsl: "0",
    defaultTtl: 36000,
    consistentBehavior: "1"
  }
}
````
- **engine**: redis caching engine to be used. 
- **host**: Host of the redis caching engine.
- **port**: Port on which redis caching engine is running.
- **password**: Redis caching engine password.
- **enableTsl**: This field is used to enable tsl.
- **defaultTtl**: Default cache expiry time in sec.
- **consistentBehavior**: This field is required to create cache instance key.

#### Memcache Config Strategy
Following is the memcache engine config strategy to be used in initializing PLG Works Cache.
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
- **engine**: memcached caching engine to be used. 
- **servers**: servers is an array of memcached servers.
- **defaultTtl**: Default cache expiry time in sec.
- **consistentBehavior**: This field is required to create cache instance key.

#### In-Memory Config Strategy
Following is the in-memory engine config strategy to be used in initializing PLG Works Cache.
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
- **engine**: For in-memory cache engine parameter will be `none`. 
- **namespace**: It is in-memory cache namespace.
- **defaultTtl**: Default cache expiry time in sec.
- **consistentBehavior**: This field is required to create cache instance key.

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

## Running Test Cases
The same test cases will run for each of the caching engines. There are 3 steps in running test cases for a specific caching engine.

### Step 1: Start Cache engine
This step is only applicable to Memcached or Redis. Run the command specific to the caching engine on which you want to run the test cases.

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

### Step 2: Set caching engine specific environment variables
In a fresh shell, run one of the following `source` commands, specific to the caching engine.

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

### Step 3: Run tests
In the same shell in which the source of environment variables was done, run the following command to run the tests.
```shell script
./node_modules/.bin/mocha --recursive "./test/*.js"
```
