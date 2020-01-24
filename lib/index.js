'use strict';

const isPlainObject = require('lodash/isPlainObject');
const throttle = require('lodash/throttle');
const { dispatchOrderMatcher, wasDispatchedMatcher } = require('./matchers');
const { MismatchError, TimeoutError, CancelledError } = require('./errors');
const mockStoreAdapter = require('./mockStoreAdapter');

const getSettledPromise = (matcher, expectedActions, dispatchedActions) => {
    try {
        if (matcher(expectedActions, dispatchedActions)) {
            return Promise.resolve();
        }
    } catch (err) {
        if (err instanceof MismatchError) {
            return Promise.reject(err);
        }
    }
};

module.exports = (store, expectedActions, options) => {
    const { timeout, matcher, throttleWait } = {
        timeout: 2000,
        matcher: dispatchOrderMatcher,
        throttleWait: 0,
        ...options,
    };

    if (typeof expectedActions === 'string' || isPlainObject(expectedActions)) {
        expectedActions = [expectedActions];
    }

    if (Array.isArray(expectedActions)) {
        expectedActions = expectedActions.map((value) => typeof value === 'string' ? { type: value } : value);
    }

    const matchPromise = getSettledPromise.bind(null, matcher, expectedActions);

    let promise = matchPromise(store.getActions());

    if (promise) {
        promise.cancel = () => {};

        return promise;
    }

    let cancel;

    promise = new Promise((resolve, reject) => {
        const maybeThrottled = (() => {
            const runMatcher = (dispatchedActions) => {
                const promise = matchPromise(dispatchedActions);

                if (promise) {
                    teardown();
                    resolve(promise);
                }
            };

            if (throttleWait > 0) {
                return throttle(runMatcher, throttleWait, { leading: false, trailing: true });
            }

            runMatcher.cancel = () => {};

            return runMatcher;
        })();

        const teardown = () => {
            maybeThrottled.cancel();
            clearTimeout(timeoutId);
            unsubscribe();
        };

        const timeoutId = setTimeout(() => {
            teardown();
            reject(new TimeoutError(expectedActions, store.getActions()));
        }, timeout);

        const unsubscribe = store.subscribe(() => maybeThrottled(store.getActions()));

        cancel = () => {
            teardown();
            reject(new CancelledError());
        };
    });

    promise.cancel = cancel;

    return promise;
};

module.exports.MismatchError = MismatchError;
module.exports.mockStoreAdapter = mockStoreAdapter;
module.exports.dispatchOrderMatcher = dispatchOrderMatcher;
module.exports.wasDispatchedMatcher = wasDispatchedMatcher;
