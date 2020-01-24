'use strict';

const { setupMockStore, setupRealStore } = require('./utils/setupTestSuite');
const { action1, action2, action3, action4 } = require('./utils/fixtures');
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
    it('should fulfill the promise when a single action is dispatched', async () => {
        const { awaitActions, store } = setup();

        store.dispatch(action1);
        await awaitActions(store, action1);

        expect(store.getActions()).toEqual([action1]);
    });

    it('should fulfill the promise when action creator is dispatched', async () => {
        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3];

        store.dispatch(createActionsThunk(actions));

        await awaitActions(store, [action1, action2, action3]);

        expect(store.getActions()).toEqual(actions);
    });

    it('should fulfill the promise when async action creator is dispatched', async () => {
        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3];

        store.dispatch(createAsyncActionsThunk(actions));

        await awaitActions(store, actions);

        expect(store.getActions()).toEqual(actions);
    });

    it('should fulfill the promise when no actions are expected', async () => {
        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3];

        store.dispatch(createAsyncActionsThunk(actions));

        await awaitActions(store, []);

        store.clearActions();
        store.dispatch(createAsyncActionsThunk(actions));

        await awaitActions(store, [], { matcher: awaitActions.wasDispatchedMatcher });
    });

    it('should fulfill the promise when expected actions match a subset of property values of dispatched actions', async () => {
        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3, action4];

        store.dispatch(createActionsThunk(actions));

        await awaitActions(store, [
            { type: 'ACTION-1', payload: { id: 1 } },
            { type: 'ACTION-2', payload: { name: 'ACTION TWO' } },
            { type: 'ACTION-3' },
            { type: 'ACTION-4', payload: { id: 4, name: 'ACTION FOUR' } },
        ]);
    });

    it('should fulfill the promise when a single action type is expected', () => {
        const { awaitActions, store } = setup();

        store.dispatch(action1);

        return awaitActions(store, 'ACTION-1');
    });

    it('should fulfill the promise when action types are expected', () => {
        const { awaitActions, store } = setup();

        store.dispatch(createActionsThunk([action1, action2, action3]));

        return awaitActions(store, ['ACTION-1', 'ACTION-2', 'ACTION-3']);
    });

    it('should fulfill the promise when custom matcher is passed and evaluates to true', async () => {
        const { awaitActions, store } = setup();
        const matcher = jest.fn(() => true);

        store.dispatch(action1);
        store.dispatch(action2);

        await awaitActions(store, [], { matcher });

        expect(matcher).toHaveBeenCalledWith([], [action1, action2]);
    });

    it('should fulfill the promise the array of expected actions is contained in the array of dispatched actions', () => {
        const { awaitActions, store } = setup();
        const actions = [action1, action2, action3];

        store.dispatch(createActionsThunk(actions));

        const promise = awaitActions(store, [action3, action2, action1], { matcher: awaitActions.wasDispatchedMatcher });

        return promise;
    });
});

