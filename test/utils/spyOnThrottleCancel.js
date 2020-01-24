/* global jest */

'use strict';

function spyOnThrottleCancel() {
    const cancelMock = jest.fn();

    jest.doMock('lodash/throttle', () => (fn, options) => {
        const throttle = jest.requireActual('lodash/throttle');
        const throttledFn = throttle(fn, options);

        throttledFn.cancel = cancelMock;

        return throttledFn;
    });

    return () => cancelMock;
}

module.exports = spyOnThrottleCancel;
