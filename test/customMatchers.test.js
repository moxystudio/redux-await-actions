'use strict';

const { setupMockStore, setupRealStore } = require('./utils/setupTestSuite');
const { action1 } = require('./utils/fixtures');

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
    it('should reject the promise via timeout when custom matcher is passed and evaluates to false', async () => {
        jest.useFakeTimers();

        const { awaitActions, store } = setup();
        const matcher = jest.fn(() => false);

        store.dispatch(action1);

        const promise = awaitActions(store, [], { matcher });

        jest.runAllTimers();

        await expect(promise).rejects.toHaveProperty('code', 'ETIMEDOUT');
        await expect(promise).rejects.toHaveProperty('name', 'TimeoutError');

        expect(matcher).toHaveBeenCalledWith([], [action1]);
    });

    it('should reject the promise when custom matcher throws mismatch error', async () => {
        const { awaitActions, store } = setup();
        const matcher = jest.fn(() => { throw new awaitActions.MismatchError(); });

        store.dispatch(action1);

        const promise = awaitActions(store, [], { matcher });

        await expect(promise).rejects.toHaveProperty('code', 'EMISMATCH');
        await expect(promise).rejects.toHaveProperty('name', 'MismatchError');

        expect(matcher).toHaveBeenCalledWith([], [action1]);
    });
});

