'use strict';

const configureStore = require('redux-mock-store').default;
const thunkMiddleware = require('redux-thunk').default;
const { createStore, applyMiddleware, compose } = require('redux');

const setupMockStore = () => {
    const awaitActions = require('../../lib');
    const store = configureStore([thunkMiddleware])();

    return {
        awaitActions,
        store,
    };
};

const setupRealStore = () => {
    const awaitActions = require('../../lib');
    const middlewareEnhancer = applyMiddleware(thunkMiddleware);
    const composedEnhancers = compose(middlewareEnhancer, awaitActions.mockStoreAdapter);
    const store = createStore((state = {}) => state, {}, composedEnhancers);

    return {
        awaitActions,
        store,
    };
};

exports.setupMockStore = setupMockStore;
exports.setupRealStore = setupRealStore;
