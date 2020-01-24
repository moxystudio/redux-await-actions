'use strict';

const { setupMockStore, setupRealStore } = require('./utils/setupTestSuite');
const { action1, action2 } = require('./utils/fixtures');
const spyOnUnsubscribe = require('./utils/spyOnUnsubscribe');
const spyOnThrottleCancel = require('./utils/spyOnThrottleCancel');
const createAsyncActionsThunk = require('./utils/createAsyncActionsThunk');

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
});

describe.each`
    setup             | store
    ${setupMockStore} | ${'mock store'}
    ${setupRealStore} | ${'real store'}
`('$store', ({ setup }) => {
    it('should teardown correctly when promise fulfills', async () => {
        expect.assertions(2);

        const { awaitActions, store } = setup();
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const getUnsubcribeSpy = spyOnUnsubscribe(store);

        store.dispatch(createAsyncActionsThunk([action1]));

        await awaitActions(store, action1);

        expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
        expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
    });

    it('should teardown correctly when promise rejects via timeout', async () => {
        expect.assertions(1);

        const { awaitActions, store } = setup();
        const getUnsubcribeSpy = spyOnUnsubscribe(store);

        store.dispatch(createAsyncActionsThunk([action1]));

        try {
            await awaitActions(store, [action1, action2]);
        } catch (err) {
            expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
        }
    });

    it('should teardown correctly when promise rejects via cancelation', async () => {
        expect.assertions(3);

        const throttleCancelSpy = spyOnThrottleCancel();
        const { awaitActions, store } = setup();
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const getUnsubcribeSpy = spyOnUnsubscribe(store);

        store.dispatch(createAsyncActionsThunk([action1]));

        const promise = awaitActions(store, [action1, action2], { throttleWait: 100 });

        setTimeout(() => promise.cancel(), 10);

        try {
            await promise;
        } catch (err) {
            expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
            expect(throttleCancelSpy()).toHaveBeenCalledTimes(1);
            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
        }
    });

    it('should teardown correctly when promise rejects with mismatch', async () => {
        expect.assertions(2);

        const { awaitActions, store } = setup();
        const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
        const getUnsubcribeSpy = spyOnUnsubscribe(store);

        store.dispatch(createAsyncActionsThunk([action1]));

        try {
            await awaitActions(store, action2);
        } catch (err) {
            expect(getUnsubcribeSpy()).toHaveBeenCalledTimes(1);
            expect(clearTimeoutSpy).toHaveBeenCalledTimes(1);
        }
    });
});

