'use strict';

const stripAnsi = require('strip-ansi');
const {
    setupMockStore /* setupRealStore */,
} = require('./utils/setupTestSuite');
const { action1, action2, action3 } = require('./utils/fixtures');
const createActionsThunk = require('./utils/createActionsThunk');
// const createAsyncActionsThunk = require('./utils/createAsyncActionsThunk');

afterEach(() => {
    jest.restoreAllMocks();
    jest.resetModules();
});

it.only('should reject the promise when an action creator is dispatched and the order of expected and dispatched actions mismatch', async () => {
    const { awaitActions, store } = setupMockStore();
    const actions = [action1, action2, action3];

    store.dispatch(createActionsThunk(actions));

    const promise = awaitActions(store, [action3, action2, action1]);

    await expect(promise).rejects.toHaveProperty('code', 'EMISMATCH');
    await expect(promise).rejects.toHaveProperty('name', 'MismatchError');

    try {
        await promise;
    } catch (error) {
        expect(stripAnsi(error.message)).toMatchInlineSnapshot(`
            "Found mismatch between the order of the array of expected and dispatched actions:

            - Expected
            + Received

              Array [
                Object {
                  \\"payload\\": Object {
            -       \\"id\\": 3,
            -       \\"name\\": \\"ACTION THREE\\",
            +       \\"id\\": 1,
            +       \\"name\\": \\"ACTION ONE\\",
                  },
            -     \\"type\\": \\"ACTION-3\\",
            +     \\"type\\": \\"ACTION-1\\",
                },
                Object {
                  \\"payload\\": Object {
                    \\"id\\": 2,
                    \\"name\\": \\"ACTION TWO\\",
                  },
                  \\"type\\": \\"ACTION-2\\",
                },
                Object {
                  \\"payload\\": Object {
            -       \\"id\\": 1,
            -       \\"name\\": \\"ACTION ONE\\",
            +       \\"id\\": 3,
            +       \\"name\\": \\"ACTION THREE\\",
                  },
            -     \\"type\\": \\"ACTION-1\\",
            +     \\"type\\": \\"ACTION-3\\",
                },
              ]"
        `);
    }
});

// describe.each`
//     setup             | store
//     ${setupMockStore} | ${'mock store'}
//     ${setupRealStore} | ${'real store'}
// `('$store', ({ setup }) => {
//     it('should reject the promise when an action creator is dispatched and the order of expected and dispatched actions mismatch', async () => {
//         const { awaitActions, store } = setup();
//         const actions = [action1, action2, action3];

//         store.dispatch(createActionsThunk(actions));

//         const promise = awaitActions(store, [action3, action2, action1]);

//         await expect(promise).rejects.toHaveProperty('code', 'EMISMATCH');
//         await expect(promise).rejects.toHaveProperty('name', 'MismatchError');
//     });

//     it('should reject the promise when an async action creator is dispatched and the order of expected and dispatched actions mismatch', async () => {
//         const { awaitActions, store } = setup();
//         const actions = [action1, action2, action3];

//         store.dispatch(createAsyncActionsThunk(actions));

//         const promise = awaitActions(store, [action3, action1, action2]);

//         await expect(promise).rejects.toHaveProperty('code', 'EMISMATCH');
//         await expect(promise).rejects.toHaveProperty('name', 'MismatchError');
//     });
// });
