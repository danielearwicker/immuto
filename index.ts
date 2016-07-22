import { Map } from "immutable";
import { createStore, Unsubscribe } from "redux"

export interface Action<Type, Payload> {
    type: Type,
    payload: Payload
}

export function action<State, Type, Payload>(
    type: Type,
    reduce: (state: State, payload: Payload) => State) {

    function create(payload: Payload) {
        return { type: type, payload };
    }

    const meta = { type, reduce };
    const result: typeof create & typeof meta = create as any;
    result.type = type;
    result.reduce = reduce;

    return result;
}

export interface Store<State, ActionType> {
    dispatch(action: ActionType): void;
    getState(): State;
    subscribe(listener: () => void): Unsubscribe;
}

export interface Cursor<State, ActionType> {
    (action: ActionType): void;
    (): State;
}

export function createStoreCursor<State, ActionType>(
    store: Store<State, ActionType>
): Cursor<State, ActionType> {

    const dummyState = {} as State;

    return (action?: ActionType) => {
        if (action) {
            store.dispatch(action);
            return dummyState;
        }
        return store.getState();
    };
}

export interface Reducer<State, Types extends Action<string, any>> {

    (state: State, action: Types): State;

    add<TypeName extends string, Payload>(action: {
        type: TypeName,
        reduce: (state: State, action: Payload) => State
    }): Reducer<State, Types | Action<TypeName, Payload>>;

    createStore(): Store<State, Types>;

    readonly actionType: Types;
    readonly cursorType: Cursor<State, Types>
}

export function reducer<State>(init: State) {

    type ActionMap<State> = Map<string, (state: State, payload: any) => State>;

    function combine<State, Types extends Action<string, any>>(
        init: State,
        map: ActionMap<State>
    ): Reducer<State, Types> {

        function reduce(state: State, action: Types) {
            if (state === undefined) {
                return init;
            }

            var handler = map.get(action.type as any);
            if (!handler) {
                throw new Error(`Unrecognised action: ${action.type}`);
            }
            return handler(state, action.payload);
        }

        function add<TypeName extends string, Payload>(action: {
            type: TypeName,
            reduce: (state: State, payload: Payload) => State
        }) {
            const type = action.type as string;
            if (map.has(type)) {
                throw new Error(`Duplicate action: ${type}`);
            }

            return combine<State, Types | Action<TypeName, Payload>>(
                init, map.set(type, action.reduce));
        };

        function store() {
            return createStore(reduce);
        }

        const meta = {
            add,
            createStore: store,
            actionType: {} as Types,
            cursorType: {} as Cursor<State, Types>
        };

        const result: typeof reduce & typeof meta = reduce as any;
        result.add = add;
        result.createStore = store;

        return result;
    }

    return combine<State, never>(init, Map<any, any>());
}

export function defineCursor<ContainerState, ContainerActionType, Address, TargetState, TargetActionType>(
    fetch: (container: ContainerState, address: Address) => TargetState,
    update: (address: Address, action: TargetActionType) => ContainerActionType
) {
    const dummyState = {} as TargetState;

    return (container: Cursor<ContainerState, ContainerActionType>,
            address: Address, snapshot?: boolean): Cursor<TargetState, TargetActionType> => {

        const snapshotValue = snapshot ? fetch(container(), address) : dummyState;

        return (targetAction?: TargetActionType) => {
            if (targetAction) {
                container(update(address, targetAction));
                return dummyState;
            }
            return snapshot ? snapshotValue : fetch(container(), address);
        };
    };
}
