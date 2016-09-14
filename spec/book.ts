import { List, Map } from "immutable";

import * as I from "../index";
import { action, property, reducer, amend } from "../index";

export interface Book {
    readonly title: string;
    readonly price: number;
    readonly authors: List<string>;
}

export namespace Book {

    export const title = property("TITLE", (book: Book) => book.title);

    export const setTitle = action("SET_TITLE",
        (book: Book, title: string) => amend(book, { title }));

    export const setPrice = action("SET_PRICE",
        (book: Book, price: number) => amend(book, { price }));

    export const addAuthor = action("ADD_AUTHOR",
        (book: Book, author: string) => amend(book, { authors: book.authors.push(author) }));

    export const empty: Book = {
        title: "",
        price: 0,
        authors: List<string>()
    };

    export const reduce = reducer<Book>(empty)
        .action(title)
        .action(setTitle)
        .action(setPrice)
        .action(addAuthor);
}

