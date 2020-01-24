'use strict';

const { setupMockStore, setupRealStore } = require('./utils/setupTestSuite');
const { action1, action2, action3 } = require('./utils/fixtures');
const createActionsThunk = require('./utils/createActionsThunk');

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
    it('should reject the promise via timeout when expected actions do not match a subset of property values of dispatched actions', async () => {
        jest.useFakeTimers();

        const { awaitActions, store } = setup();
        const actions = [action1, action2];

        store.dispatch(createActionsThunk(actions));

        const promise = awaitActions(store, [
            { type: 'ACTION-1', payload: { a: 1 } },
            { type: 'ACTION-3', payload: { name: 'ACTION THREE' } },
        ], { matcher: awaitActions.wasDispatchedMatcher });

        jest.runAllTimers();

        await expect(promise).rejects.toHaveProperty('code', 'ETIMEDOUT');
        await expect(promise).rejects.toHaveProperty('name', 'TimeoutError');
    });

    it('should reject the promise when expected actions are not received and timeout expires', async () => {
        jest.useFakeTimers();

        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3];

        store.dispatch(action1);
        store.dispatch(action2);

        const promise = awaitActions(store, actions);

        jest.runAllTimers();

        await expect(promise).rejects.toHaveProperty('code', 'ETIMEDOUT');
        await expect(promise).rejects.toHaveProperty('name', 'TimeoutError');
    });

    it('should reject the promise when the default timeout expires', async () => {
        jest.useFakeTimers();

        const { awaitActions, store } = setup();

        const promise = awaitActions(store, action1);

        jest.runAllTimers();

        await expect(promise).rejects.toHaveProperty('code', 'ETIMEDOUT');
        await expect(promise).rejects.toHaveProperty('name', 'TimeoutError');
    });

    it('should reject the promise when the specified timeout expires', async () => {
        const { awaitActions, store } = setup();

        jest.useFakeTimers();

        const promise = awaitActions(store, action1, { timeout: 1000 });

        jest.advanceTimersByTime(1000);

        await expect(promise).rejects.toHaveProperty('code', 'ETIMEDOUT');
        await expect(promise).rejects.toHaveProperty('name', 'TimeoutError');
    });
});

