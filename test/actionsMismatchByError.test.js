'use strict';

const { setupMockStore, setupRealStore } = require('./utils/setupTestSuite');
const { action1, action2, action3 } = require('./utils/fixtures');
const createActionsThunk = require('./utils/createActionsThunk');
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
    it('should reject the promise when an action creator is dispatched and the order of expected and dispatched actions mismatch', async () => {
        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3];

        store.dispatch(createActionsThunk(actions));

        const promise = awaitActions(store, [action3, action2, action1]);

        await expect(promise).rejects.toHaveProperty('code', 'EMISMATCH');
        await expect(promise).rejects.toHaveProperty('name', 'MismatchError');
    });

    it('should reject the promise when an async action creator is dispatched and the order of expected and dispatched actions mismatch', async () => {
        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3];

        store.dispatch(createAsyncActionsThunk(actions));

        const promise = awaitActions(store, [action3, action1, action2]);

        await expect(promise).rejects.toHaveProperty('code', 'EMISMATCH');
        await expect(promise).rejects.toHaveProperty('name', 'MismatchError');
    });
});

