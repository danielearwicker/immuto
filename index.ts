import { Map } from "immutable";
import { Unsubscribe, createStore } from "redux"

/**
 * The only thing all action types have in common is a string
 * property called type, which must be unique across all actions
 * handled by the same reducer.
 *
 * We adopt the additional (popular) pattern of collecting any
 * further data into a single payload property. This makes the
 * very common case of a single value very succinct.
 */
export interface Action<T extends string, P> {
    readonly type: T;
    readonly payload: P;
}

/**
 * Makes it easy to create an action of a given type with full
 * type safety, as the type string will be captured at compile
 * time as a string literal type, so the combination of that
 * type string and the properties, P, can be checked by the
 * target reducer.
 */
export function action<T extends string, P>(type: T, payload: P): Action<T, P> {
    return { type, payload };
}

/**
 * A Reducer is a function that takes a state object and an action
 * and returns a modified state object. Here it is also equipped
 * with a method called action which allows multiple reducer
 * functions to be declaratively merged together into a single
 * function, and a createStore method that wraps Redux's createStore
 * to make it perfectly type-safe.
 *
 * Note that reducers are immutable - given a reducer x, calling
 * x.action(...) returns a new reducer combination rather than
 * modifying x.
 */
export interface Reducer<S, A> {

    /**
     * Reduce function
     */
    (state: S, action: A): S;

    /**
     * A suitable initial state
     */
    empty: S,

    /**
     * Dummy member for use with typeof (does not have
     * a useful runtime value.)
     */
    actionType: A;

    /**
     * Returns an enhanced Reducer capable of reducing
     * an additional action type.
     */
    action<T extends string, P>(
        type: T,
        reduce: (state: S, props: P) => S
    ): Reducer<S, A | Action<T, P>>;

    /**
     * Creates a Redux store with extra type-safety.
     */
    createStore(): Store<S, A>;
}

function isAction<T extends string>(
    obj: any,
    type: T
): obj is Action<T, any> {
    return obj && obj.type === type;
}

function chain<S, RA, HT extends string, HP>(
    headType: HT,
    empty: S,
    head: (state: S, payload: HP) => S,
    rest: (state: S, action: RA) => S
): Reducer<S, RA | Action<HT, HP>> {

    type A = RA | Action<HT, HP>;

    function reduce(state: S, action: A) {
        if (isAction(action, headType)) {
            return head(state, action.payload);
        }

        return rest(state, action);
    }

    return assign(reduce, {

        actionType: undefined! as A,

        empty,

        action<T extends string, P>(
            type: T,
            newReduce: (state: S, payload: P) => S
        ) : Reducer<S, Action<T, P> | A> {
            return chain<S, A | RA, T, P>(type, empty, newReduce, reduce);
        },

        createStore(): Store<S, A> {
            return createStore(reduce);
        }
    });
}

/**
 * Creates a starter object from which a Reducer can be formed by
 * calling the action method.
 */
export function reducer<S>(empty: S) {
    return {
        action<T extends string, P>(
            type: T,
            reduce: (state: S, payload: P) => S
        ) : Reducer<S, Action<T, P>> {
            return chain<S, never, T, P>(type, empty, reduce, s => s === undefined ? empty : s);
        }
    };
}

/**
 * Describes a minimal Redux-like store. Note that stores are not
 * immutable (that's their whole purpose) and therefore getState is
 * not pure (it may return a different value each time you call it).
 */
export interface Store<S, A> {
    dispatch(action: A): void;
    getState(): S;
    subscribe(listener: () => void): Unsubscribe;
}

/**
 * A pure representation of the state of a store or part of a store.
 * A cursor's value property never changes. Instead, the dispatch
 * method returns a new cursor representing the new state.
 *
 * Note that, unlike a plain non-Redux cursor, updating is always
 * performed by dispatching an action.
 */
export interface Cursor<S, A> {

    /**
     * The value of the store at the time this cursor was created.
     */
    readonly state: S;

    /**
     * Sends an action into the store's reducer, resulting in the
     * store updating, and a new cursor is returned representing
     * the new state.
     */
    dispatch(action: A): Cursor<S, A>;
}

/**
 * Takes a snapshot of a Redux-like store, making it into a
 * pure cursor.
 */
export function snapshot<S, A>(
    store: Store<S, A>
): Cursor<S, A> {
    return {
        state: store.getState(),
        dispatch(action) {
            store.dispatch(action);
            return snapshot(store);
        }
    };
}

/**
 * Creates a function capable of making cursors, given an outer
 * cursor (a whole store or large portion of a store) and a key
 * (such as a string or number) that identifies a smaller portion
 * of the store.
 *
 * Internally this consists of a function for fetching the inner
 * state and a function for creating an action to update the outer
 * state.
 */
export function cursor<OS, OA, K, IS, IA>(
    fetch: (outer: OS, key: K) => IS,
    update: (key: K, action: IA) => OA
) {
    return (outer: Cursor<OS, OA>, key: K): Cursor<IS, IA> => {
        return {
            state: fetch(outer.state, key),
            dispatch(innerAction: IA) {
                return cursor(fetch, update)(
                    outer.dispatch(update(key, innerAction)), key);
            }
        };
    };
}

/**
 * The payload format used by collection actions. If remove is true,
 * the action removes the specified key from the collection and the
 * update property is ignored. Otherwise if update is undefined then
 * the specified key is set to the collection's empty value. If it
 * is defined then it is an action that is dispatched to the item
 * at the specified key.
 */
export interface Update<K, U> {
    key: K;
    update?: U;
    remove?: boolean;
}

export function update<T extends string, K, U>(type: T, key: K, update?: U) {
    return action<T, Update<K, U>>(type, { key, update });
}

export function remove<T extends string, K>(type: T, key: K) {
    return action(type, { key, remove: true });
}

export interface CollectionOperations<C, K, I> {
    get: (state: C, key: K) => { exists: boolean, value?: I };
    set: (state: C, key: K, item: I) => C;
    remove: (state: C, key: K) => C;
}

export function map<K, I>(): CollectionOperations<Map<K, I>, K, I> {
    return {
        get(items, key) {
            return { exists: items.has(key), value: items.get(key) };
        },

        set(items, key, item) {
            return items.set(key, item);
        },

        remove(items, key) {
            return items.remove(key);
        }
    };
}

/**
 * A collection is a reducer that can insert, update and remove items,
 * specified by key. For example, a shop has shelves. So it has a collection
 * "SHELVES", where each has a numeric key. The action's payload is the
 * combination of a key and optionally another action that operates on the
 * shelf specified by the key, so the payload has the type:
 *
 *     { key: number, update?: Shelf.Action }
 *
 * If the key specifies an item not already in the collection, a new item
 * is created using the collection's "empty item" object. If update is
 * undefined then the item specified by key is removed from the collection.
 *
 * An item cursor is a cursor that refers to an item within a collection.
 * For example, Shop.shelfAt(shopCursor, 3) refers to the shelf with key 3.
 * It may not exist yet, in which case the cursor's value will be undefined.
 * Any action of type Shelf.Action can be dispatched through the cursor, and
 * it will automatically be wrapped in a SHELVES action with the right key:
 *
 *     {
 *       type: "SHELVES",
 *       payload: {
 *         key: 3,
 *         update: {
 *           type: "SET_PRICE",
 *           3.99
 *         }
 *       }
 *     }
 *
 * Naturally this wrapping process can be nested to any depth.
 */
export function collection<T extends string, S, C, K, I, A>({
    /** The action type name associated with this collection */
    type,
    /** A helper object that defines how to update the collection type */
    operations,
    /** The reducer function for the item type in the collection */
    reducer,
    /** Specifies how to get the collection from the object that owns it */
    get,
    /** Updates the owning object with a new version of the collection */
    set
}: {
    type: T,
    reducer: Reducer<I, A>,
    operations: CollectionOperations<C, K, I>,
    get: (state: S) => C,
    set: (state: S, collection: C) => S
}) {

    function getValue(collection: C, key: K) {

        const item = operations.get(collection, key);
        return item.exists ? item.value! : reducer.empty;
    }

    function reduce(state: S, {key, update, remove}: Update<K, A>) {

        const collection = get(state);
        const value = getValue(collection, key);

        return set(state, remove
            ? operations.remove(collection, key)
            : operations.set(collection, key, update
                ? reducer(value, update)
                : value)
        );
    }

    const item = cursor(
        (state: S, key: K) => getValue(get(state), key),
        (key: K, action: A) => update(type, key, action)
    );

    return assign(item, { type, reduce });
}

/**
 * Basic Substitute for Object.assign (and one fine day, object spread...)
 */
export function assign<T, S1, S2>(target: T, source1: S1, source2: S2): T & S1 & S2;
export function assign<T, S1>(target: T, source1: S1): T & S1;
export function assign<T>(target: T, ...sources: any[]): any {
    for (const source of sources) {
        for (const key of Object.keys(source)) {
            (target as any)[key] = (source as any)[key];
        }
    }
    return target;
}
