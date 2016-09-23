# References

Redux says that to modify your data, you send it actions. Immuto is really some tools to help you structure your data in a hierarchy, and then target actions at the right place. A "parent" object can refer to a "child" object, and sometimes you'll need a way to send actions to the child, and you don't want to have to think about how to channel it through the parent. You need a [cursor](cursors.md) to the child. A reference is a way of obtaining that cursor.

To set up a reference, we need to know the type of the child, and where to find an instance of the child given a parent. The resulting reference definition is function that, when given a cursor to the parent, returns a cursor to the child. This makes it ideal for passing to the [piping operator](the_piping_operator.md).

```ts
interface Human { ... }

namespace Human {
    export const reduce = ...;
}

interface Pet {
    owner: Human;
}

namespace Pet {
    export const owner = reference("OWNER", Human, 
        (p: Pet) => p.owner);
}
```

Hey presto. We can call `owner` as a function, passing it a cursor to a `Pet`, and we'll get a cursor to that pet's `Human` owner.

We can then send an action to the `Human` cursor. Behind the scenes, it will go on a boomarang-style there-and-back-again journey. It is automatically wrapped in a forwarding action and submitted to the `Pet` cursor. This wrapping/forwarding process continues back through the chain of cursors until it reaches the store. Then the resulting combined action is dispatched to the store, and that means the action passed back down the hierarchy of reducers, being unwrapped along the way, until it reaches the `Pet`'s reducer where the change is applied.

As for the declaration itself, there are a few sneaky tricks going on. First, the above `owner` definition is exactly equivalent to:

```ts
export const owner = reference("OWNER", Human, 
    (p: Pet) => p.owner,
    (p: Pet, owner: Human) => { amend(p, { owner })});
```

The additional function is the "setter", responsible for storing a new `Human` in the pet's `owner` field. The first function is the "getter". For simple cases, Immuto can parse the source of the getter and so auto-generate the getter. For more complex ways of finding the referred-to object, you'll have to write your own setter.

The `Human` argument is actually shorthand for `Human.reduce`, so we could have said:

```ts
export const owner = reference("OWNER", Human.reduce, (p: Pet) => p.owner,
    (p: Pet, owner: Human) => { amend(p, { owner })});
```

To use the shorter version, make sure you use the name `reduce` in the namespaces for your types.