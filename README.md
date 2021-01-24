# redux-await-actions

[![npm version][npm-image]][npm-url] [![ci][github-ci-image]][github-ci-url] [![codecov][codecov-image]][codecov-url]

[npm-url]:https://www.npmjs.com/package/@moxy/redux-await-actions
[npm-image]:https://img.shields.io/npm/v/@moxy/redux-await-actions.svg
[github-ci-url]:https://github.com/moxystudio/redux-await-actions/actions
[github-ci-image]:https://github.com/moxystudio/redux-await-actions/workflows/Node%20CI/badge.svg
[codecov-url]:https://codecov.io/gh/moxystudio/redux-await-actions?branch=master
[codecov-image]:https://codecov.io/gh/moxystudio/redux-await-actions/badge.svg?branch=master

> Waits for specific actions to be dispatched or a timeout expires.

## Installation

`$ npm install @moxy/redux-await-actions --save-dev`

## Motivation

Consider the following example:

```js
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';

function login(username, password) {
    return async (dispatch) => {
        dispatch({ type: 'LOGIN_START', payload: { username, password } });

        try {
            const user = await fetch('/login', {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify({ username, password })
            });

            dispatch({ type: 'LOGIN_SUCCESS', payload: user });
        } catch (err) {
            dispatch({ type: 'LOGIN_FAIL', payload: err });

            throw err;
        }

        // Side-effect: fetch orders asynchronously
        // This action could be dispatched from a middleware as well instead. See below.
        dispatch(fetchOrders());
    }
}

const middlewares = [
    thunkMiddleware,
    ({ dispatch, getState }) => (next) => (action) => {
        const result = next(action);

        if (action.type === 'LOGIN_SUCCESS') {
            // Side-effect: fetch orders asynchronously
            dispatch(fetchOrders());
        }

        return result;
    }
];
const enhancer = compose(applyMiddleware(...middlewares));
const store = createStore(/* reducer */, /* initial state */, enhancer);

store.dispatch(login('username', 'password')).then(() => {
    // For the sake of this example, assume Redux provides a getActions method
    expect(store.getActions()).toContain([
        'LOGIN_START',
        'LOGIN_SUCCESS',
        'FETCH_ORDERS_SUCCESS'
    ]);
});
```

The assertion above will fail because `FETCH_ORDERS_SUCCESS` will not yet exist in the stack of actions. To solve this, one can use `setTimeout` explicitly in each test:

```js
store.dispatch(login('username', 'password'));

setTimeout(() => expect(store.getActions()).toContain([
    'LOGIN_START',
    'FETCH_ORDERS_SUCCESS'
]), 50);
```

However, this is not pretty and is error-prone. This library makes this easier for you. It works with both [redux-mock-store](https://github.com/arnaudbenard/redux-mock-store) and real redux store. It allows you to wait out for an arbitrary number of actions dispatched asynchronously as a result a side-effect by matching the actual contents of each dispatched action with the expected contents.

## Usage

In order to ensure the `store` passed to `redux-await-actions` has a consistent interface when using either store (real and mock), a store enhancer is provided as an adapter to implement `getActions` and `clearActions` for the real store. The enhancer is exported as `mockStoreAdapter` Check the examples below.

### Example #1: action types

Supply the action types to wait for.

#### Real store

```js
import awaitActions from '@moxy/redux-await-actions';
import configureStore from 'redux';
import thunkMiddleware from 'redux-thunk';

const middlewareEnhancer = compose(applyMiddleware(thunkMiddleware));
const composedEnhancers = compose(middlewareEnhancer, awaitActions.mockStoreAdapter);
const store = createStore(/* reducer */, /* initial state */, composedEnhancers);

store.dispatch(login('username', 'password'));

await waitForActions(store, ['LOGIN_START', 'FETCH_ORDERS_SUCCESS']);
```

#### Mock store

```js
import awaitActions from '@moxy/redux-await-actions';
import configureStore from 'redux-mock-store';
import thunkMiddleware from 'redux-thunk';

const store = configureStore([thunkMiddleware])();

store.dispatch(login('username', 'password'));

await waitForActions(store, ['LOGIN_START', 'FETCH_ORDERS_SUCCESS']);
```

### Example #2: action objects

Supply the action objects to wait for, matching a subset of the properties of the dispatched actions. It performs a deep comparison between property values of dispatched and expected actions to determine whether the expected actions are partially contained in the stack of dispatched actions.

#### Mock store

```js
import awaitActions from '@moxy/redux-await-actions';
import configureStore from 'redux-mock-store';
import thunkMiddleware from 'redux-thunk';

const store = configureStore([thunkMiddleware])();

store.dispatch(login('username', 'password'));
// { type: 'LOGIN_START', payload: { username: 'username' } }
// matches
// { type: 'LOGIN_START', payload: { username: 'username', password } }
//
// { type: 'FETCH_ORDERS_SUCCESS' }
// matches
// { type: 'FETCH_ORDERS_SUCCESS', payload: orders }

await waitForActions(store, [
    {
        type: 'LOGIN_START',
        payload: { username: 'username' },
    },
    {
        type: 'FETCH_ORDERS_SUCCESS',
    },

]);
```

#### Real store

```js
import configureStore from 'redux';
import thunkMiddleware from 'redux-thunk';

const middlewareEnhancer = compose(applyMiddleware(thunkMiddleware));
const composedEnhancers = compose(middlewareEnhancer, awaitActions.mockStoreAdapter);
const store = createStore(/* reducer */, /* initial state */, composedEnhancers);

store.dispatch(login('username', 'password'));
// { type: 'LOGIN_START', payload: { username: 'username' } }
// matches
// { type: 'LOGIN_START', payload: { username: 'username', password } }
//
// { type: 'FETCH_ORDERS_SUCCESS' }
// matches
// { type: 'FETCH_ORDERS_SUCCESS', payload: orders }

await waitForActions(store, [
    {
        type: 'LOGIN_START',
        payload: { username: 'username' },
    },
    {
        type: 'FETCH_ORDERS_SUCCESS',
    },

]);
```

## API

### awaitActions(store, actions, [options])

Returns a `Promise` which fulfills if all `actions` are dispatched before the timeout expires. The `Promise` has a `.cancel()` function which, if called, will reject the `Promise`.

The `Promise` might be rejected:

* as a result of timeout expiration, throwing `TimeoutError`
* as a result of `.cancel()` invocation, throwing `CancelledError`
* when the action's matcher throws `MismatchError`

**NOTE:** Subsequent calls to `awaitActions` with the same actions should be preceded by a call to `store.clearActions()`, otherwise the returned `Promise` will resolve immediately.

#### store

Type: `Object`

The `redux-mock-store` or `redux` store enhanced with `awaitActions.mockStoreAdapter`.

#### actions

Type: `Object | String | Array | Function`

The actions to wait for. It can be either:

* `String`: an action type string.
* `Object`: an action object.
* `Array` of either
    * action objects;
    * action type strings;
    * action objects mixed with action type strings.

#### options

##### timeout

Type: `Number`   
Default: 2000

The timeout given in milliseconds.

##### throttleWait

Type: `Number`   
Default: 0

Specifies the time in milliseconds that every invocation to the action's matcher take place at since the last invocation. When set to zero, throttling is disabled.

When throttling is enabled, the `matcher` will be called at most once per `throttleWait` milliseconds receiving the array of actions dispatched until that time. If the `matcher` does not resolve the `Promise` until `timeout` milliseconds have elapsed, the `Promise` is rejected throwing `TimeoutError`.
This feature is useful when one needs to wait for several actions or a burst of actions to be dispatched, effectively skip invocations to the action's matcher until the Redux store "settles" to avoid running complex action comparison logic in the meantime and improve performance.

##### matcher

Type: `Function`   
Default: `awaitActions.dispatchOrderMatcher`

Supplies custom behavior to specify how expected and dispatched actions should be compared. The function accepts two arguments: the array of expected actions and dispatched actions.

The matcher must either:

* return `true` to indicate a match has occurred and fulfill the `Promise`.
* return `false` to indicate a match is yet to occur and the `Promise` remains in pending state.
* throw `MismatchError` to indicate a match will not occur anymore and reject the `Promise`.

Two built-in matchers are already shipped:

* `dispatchOrderMatcher` performs a comparison between the specified order of expected actions against the order of arrival of dispatched actions. On the first mismatch detected, `MismatchError` is thrown for early rejection.
* `wasDispatchedMatcher` matcher is a less strict matcher which checks whether expected actions are contained within dispatched actions.

Both matchers perform a *partial deep comparison* between dispatched and expected actions, as per [Lodash's isMatch()](https://lodash.com/docs/4.17.4#isMatch).

Example of a custom matcher implementation:

```js
import awaitActions from '@moxy/redux-await-actions';
import configureStore from 'redux-mock-store';
import thunkMiddleware from 'redux-thunk';

const store = configureStore([thunkMiddleware])();
const expectedActions = [
    { type: 'LOGIN_START', payload: { username: 'username' } },
    { type: 'FETCH_ORDERS_SUCCESS' }
];

store.dispatch(login('username', 'password'));

// Throws if LOGIN_FAIL is dispatched or
// Matches when LOGIN_START and FETCH_ORDERS_SUCCESS are dispatched
awaitActions(store, expectedActions, { matcher: (expectedActions, storeActions) => {
    const hasLoginFail = storeActions.some((action) => action.type === 'LOGIN_FAIL');

    if (hasLoginFail) {
        throw new waitForActions.MismatchError();
    }

    const hasLoginStart = storeActions.some((action) => action.type === 'LOGIN_START' && action.payload.username === 'username');
    const hasFetchOrdersSuccess = storeActions.some((action) => action.type === 'FETCH_ORDERS_SUCCESS');

    return hasLoginStart && hasFetchOrdersSuccess;
}})
.then(() => {
    // Expected actions were dispatched
})
.catch((err) => {
    // MismatchError
});
```

## Tests

`$ npm test`   
`$ npm test -- --watch` during development


## License

[MIT License](http://opensource.org/licenses/MIT)
