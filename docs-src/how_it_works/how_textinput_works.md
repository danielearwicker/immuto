# How TextInput works

The source for `TextInput` is so short, leaving aside some interface declarations, it's worth taking a look to see how little magic is involved.

Basically it's Redux being played out on a microscopic scale.

First, you need to know that actions in Immuto always conform to this interface:

```ts
export interface Action<T extends string, P> {
    readonly type: T;
    readonly payload: P;
}
```

Second, those things we previously talked about called cursors are represented by this interface:

```ts
export interface Cursor<S, A> {
    readonly state: S;
    (action: A): Cursor<S, A>;
}
```

So a cursor is a function that (a) accepts an action (and returns another cursor) and (b) has a `state` property so you can access the current value. It's like a terse, immutable version of a Redux store.

Third, there's a built-in action creator in Immuto called `replace`, which builds an action such as:

```ts
{ type: "REPLACE", payload: "Homer" }
```

The intention of a `"REPLACE"` action is to tell its target to replace the existing value with the one in the `payload`.

And last, there's a type called `Property`, defined as:

```ts
export type Property<V> = Cursor<V, Action<"REPLACE", V>>;
```

So it's just a cursor that only supports `"REPLACE"` actions, and (as you'd expect) its state is the same type that it receives in the replacement payload.

So with this knowledge, you may be able to predict how `TextInput` works. No cheating! Okay, you can look now:

```ts
export interface TextInputProps extends StandardTextInputProps {
    binding: Property<string>;
}

export const TextInput = (props: TextInputProps) => (
    <input type="text" {...removeProps(props, "binding")}
        value={props.binding.state}
        onChange={e => props.binding(replace(e.currentTarget.value))} />
);
```

It's just an `<input>` element. Any properties besides `binding` are passed straight through, so you can use it just as you would a plain `<input>`.

The key to understanding it is to see how it reads and writes values through the `binding` prop. To read, it accesses `state`, which contains the current value of the string. To write, it calls `binding` as a function, passing it an action built with the `replace` action builder.

In Immuto, exactly the same Redux concepts (immutable data updated by actions) are applied at the very small scale of individual values, all the way out to the scale of the entire application.
