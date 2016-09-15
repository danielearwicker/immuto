import { List, Map } from "immutable";

import * as I from "../index";
import { action, reducer, collection, amend, immutableMapOperations } from "../index";

import { Book } from "./book";

export interface Shelf {
    readonly description: string;
    readonly books: Map<number, Book>;
}

export namespace Shelf {

    export const setDescription = action("SET_DESCRIPTION",
        (shelf: Shelf, description: string) => amend(shelf, { description }));

    export const books = collection("BOOKS", Book.reduce,
        immutableMapOperations<number, Book>(),
        (shelf: Shelf) => shelf.books
    );

    export const empty: Shelf = {
        description: "",
        books: Map<number, Book>()
    };

    export const reduce = reducer<Shelf>(empty)
        .action(setDescription)
        .action(books);
}
