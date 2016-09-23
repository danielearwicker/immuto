# How Cursors work

A cursor is a way to read the state at some location in a data structure, and also to dispatch actions to that same location.

This is a simplified version, leaving out the [piping operator](the_piping_operator.md):

```ts
interface Cursor<S, A> {
    readonly state: S;
    (action: A): Cursor<S, A>;
}
```

Two things to note: 

1. A cursor doesn't *have* a dispatch function; it *is* a dispatch function.
2. It returns another cursor of the same type, so you can access the new state after your action has been dispatched. The value of `state` never changes on an existing cursor.

You can call `snapshot`, passing it your store` to get a cursor to the whole store, and then using the piping operator to get to the objects inside.
