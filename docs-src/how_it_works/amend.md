# How the amend function works

The `amend` function is defined as:

```ts
function amend<O1, O2>(o1: O1, o2: O2) {
    return assign({}, o1, o2);
}
```

And `assign` is just a substitute for the gradually appearing standard function `Object.assign`.

The purpose of amend is to fill in for the object spread operator that is not yet in TypeScript. It would be cool if we could say:

```ts
{ ...book, title }
```

which would mean: make a new object with all the properties of `book`, and add (or replace) the `title` property with the value of the `title` variable. But in the meantime this isn't so bad:

```ts
amend(book, { title })
```
