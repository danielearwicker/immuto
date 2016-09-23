# How properties, references and actions are related

The fundamental thing all these three have in common is that you can add them to your reducer.

```ts
const reduce = reducer(empty)
    .action(someProperty1)
    .action(someReference2)
    .action(someAction3)
```

This is because they each define a single action. As far as `Reducer#action` is concerned, it just requires that you pass it an object with two properties:

```ts
interface ActionDefinition<S, T extends string, P> {
    readonly type: T;
    reduce(state: S, payload: P): S;
}
```

Here `reduce` is simpler than a full reducer function. It's a *partial* reducer: it only gets the payload, because the `type` is already guaranteed to be whatever the definition says it accepts. The combined `reducer` just forwards actions to the correct partial reducer.

## Actions

When you declare a plain `action`:

```ts
export const initialize = action("INITIALIZE", 
    (state: People, payload: People) => payload);
```

this is made completely explicit, because you have to supply the `type` and `reduce` functions yourself. Internally an action creator function is built (this is pretty trivial: accept a `payload` and wrap it in an action alongside `type`), and then the `type` and `reduce` properties are added directly onto the action creator. So in the above example, `initialize` is an action creator function.

## References

References are all about forwarding to another object. So you have to tell them what type they forward to, and where to find an instance of it. In return, a reference gives you a way to wrap action 

```ts
interface Human { ... }

namespace Human { ... }

interface Pet {
    owner: Human;
}

namespace Pet {
    export const owner = reference("OWNER", Human, (p: Pet) => p.owner);
}
```

There's a few tricks going on here. First, it's exactly equivalent to:

```ts
export const owner = reference("OWNER", Human, (p: Pet) => p.owner,
    (p: Pet, owner: Human) => { amend(p, { owner })});
```

The additional function is the "setter", responsible for storing a new `Human` in the pet's `owner` field. The first function is the "getter". For simple cases, Immuto can parse the source of the getter and so auto-generate the getter. For more complex ways of finding the referred-to object, you'll have to write your own setter.

The `Human` argument is actually shorthand for `Human.reduce`, so we could have said:

```ts
export const owner = reference("OWNER", Human.reduce, (p: Pet) => p.owner,
    (p: Pet, owner: Human) => { amend(p, { owner })});
```

Therefore, to use the shorter version, make sure you use the name `reduce` in the namespaces for your types.

