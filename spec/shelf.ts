import * as I from "../index";
import { action, reducer, objectByNumber, removeFromObjectByNumber, reference, amend } from "../index";

import { Book } from "./book";

export type Books = { [id: number]: Book }

export namespace Books {

    export const empty: Books = {};
    export const at = objectByNumber(Book);
    export const remove = removeFromObjectByNumber<Book>();

    export const reduce = reducer(empty)
        .action(at)
        .action(remove);
}

export interface Shelf {
    readonly description: string;
    readonly books: Books;
}

export namespace Shelf {

    export const setDescription = action("SET_DESCRIPTION",
        (shelf: Shelf, description: string) => amend(shelf, { description }));

    export const books = reference("BOOKS", Books, (shelf: Shelf) => shelf.books);

    export const empty: Shelf = {
        description: "",
        books: Books.empty
    };

    export const reduce = reducer(empty)
        .action(setDescription)
        .action(books);
}
