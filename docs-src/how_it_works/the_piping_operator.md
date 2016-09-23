# How the Piping Operator works

The piping operator is the `$` method available on cursors. It is ridiculously simple. You pass it a function, and it calls that function, *passing itself* as the only argument, then returns whatever the function returns. That's it. The implementation, sans type declarations, is equivalent to:

```ts
$(ref) {
    return ref(this);
}
```

The type declarations are important, of course: the things being passed around must be cursors, though the input and output cursors can refer to different types:

```ts
$<S2, A2>(ref: (outer: Cursor<S, A>) => Cursor<S2, A2>): Cursor<S2, A2>;
```

The parameter is called `ref` because [reference](references.md) definitions are ideal for passing in.

Why bother with such a simple thing? So we can write easy-to-read expressions that navigate down a hierarchy. Suppose a `Shop` has a collection `Shelves` of `Shelf` objects, each having a collection `Books` of `Book` objects, each having a `title`.

Without piping, we have to write inside-out expressions. Here, `shop` is the starting point, yet appears in the middle!

```ts
const book = Book.title(
                Books.at(
                    Shelf.books(
                        Shelves.at(
                            Shop.shelves(shop),
                            13
                        )
                    ), 
                    832
                )
            );
```

With piping, we "send" the input through a pipeline of operators, and it's self-explanatory:

```ts
const title = shop.$(Shop.shelves)
                  .$(Shelves.at(13))
                  .$(Shelf.books)
                  .$(Books.at(832))
                  .$(Book.title);
```

