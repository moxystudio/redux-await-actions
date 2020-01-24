'use strict';

const { setupMockStore, setupRealStore } = require('./utils/setupTestSuite');
const { action1, action2, action3 } = require('./utils/fixtures');

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
});

describe.each`
    setup             | store
    ${setupMockStore} | ${'mock store'}
    ${setupRealStore} | ${'real store'}
`('$store', ({ setup }) => {
    it('should return a promise with a cancel function', () => {
        const { awaitActions, store } = setup();

        const promise = awaitActions(store, action1);

        expect(promise).toHaveProperty('cancel');
        expect(promise.cancel).toBeInstanceOf(Function);

        store.dispatch(action1);

        return promise;
    });

    it('should reject the promise when cancel() is called before dispatch of remaining actions', async () => {
        const { awaitActions, store } = setup();

        const promise = awaitActions(store, [action1, action2, action3]);

        promise.cancel();

        await expect(promise).rejects.toHaveProperty('code', 'ECANCELLED');
        await expect(promise).rejects.toHaveProperty('name', 'CancelledError');
    });
});

