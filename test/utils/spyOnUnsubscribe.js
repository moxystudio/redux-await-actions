/* global jest */

'use strict';

const wrap = require('lodash/wrap');

function spyOnUnsubscribe(store) {
    let unsubscribeMock;

    store.subscribe = wrap(store.subscribe, (subscribe, callback) => {
        const unsubscribe = subscribe(callback);

        unsubscribeMock = jest.fn(() => unsubscribe());

        return unsubscribeMock;
    });

    return () => unsubscribeMock;
}

module.exports = spyOnUnsubscribe;
