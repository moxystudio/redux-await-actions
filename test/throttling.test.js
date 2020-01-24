'use strict';

const { setupMockStore, setupRealStore } = require('./utils/setupTestSuite');
const { action1, action2, action3 } = require('./utils/fixtures');
const createAsyncActionsThunk = require('./utils/createAsyncActionsThunk');

afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    jest.resetModules();
});

describe.each`
    setup             | store
    ${setupMockStore} | ${'mock store'}
    ${setupRealStore} | ${'real store'}
`('$store', ({ setup }) => {
    it('should fulfill the promise when throttling is enabled', () => {
        jest.useFakeTimers();

        const { awaitActions, store } = setup();

        store.dispatch(createAsyncActionsThunk([action1, action2, action3]));

        const promise = awaitActions(store, [action1, action2, action3], {
            throttleWait: 100,
        });

        jest.runAllTimers();

        return promise;
    });

    it('should reject the promise via timeout when throttling is enabled', async () => {
        jest.useFakeTimers();

        const { awaitActions, store } = setup();

        store.dispatch(createAsyncActionsThunk([action1]));

        const promise = awaitActions(store, [action1, action2, action3], {
            throttleWait: 100,
        });

        jest.runAllTimers();

        await expect(promise).rejects.toHaveProperty('code', 'ETIMEDOUT');
        await expect(promise).rejects.toHaveProperty('name', 'TimeoutError');
    });
});
