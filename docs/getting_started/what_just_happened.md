# What just happened?

Immutable data is hard to modify (by design). We are forced to clone the whole data structure just to change one tiny piece. What we need is that one weird trick *(doctors hate her!)* known as a cursor.

A **cursor** represents a single location in the data structure, and when you pass it a new value for that location, it takes care of cloning the rest of the structure around it.

Immuto generalises this idea and says that cursors must be sent actions (because Immuto *is* Redux, and in Redux actions are the only way to change anything).

A **property** is a really simple example of a cursor, supporting a single action type, `"REPLACE"`, that lets you assign a new value. So it mimics a traditional cursor.

The `binding` prop of `TextInput` needs a cursor to a string, and `Person.firstName` makes exactly that. All it needs is a cursor to a `Person`. How do we get a cursor to a person? Well, in this case we used `bindToStore`, because our whole store is a `Person`.

It's good idea to only use properties for really simple individual values: strings, numbers, booleans, that can vary independently.

If you find yourself storing your whole life story in a single property, that might need a rethink. You'll probably prefer to enforce rules about how its various parts can be modified, to keep it consistent. Immuto is all about structuring stuff, so we'll get on to some ways of doing that.
