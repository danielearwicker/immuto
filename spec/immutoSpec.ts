import { action, Reducer, Store, reducer, defineCursor, createStoreCursor } from "../index";
import { List } from "immutable";

interface Book {
    readonly title: string;
    readonly price: number;
    readonly authors: List<string>;
}

namespace Book {

    export const empty: Book = {
        title: "",
        price: 0,
        authors: List<string>()
    };

    export const reduce = reducer(empty)
        .action("SET_TITLE", (book: Book, title: string) => (
            {
                title,
                price: book.price,
                authors: book.authors
            }
        ))
        .action("SET_PRICE", (book: Book, price: number) => (
            {
                title: book.title,
                price,
                authors: book.authors
            }
        ))
        .action("ADD_AUTHOR", (book: Book, author: string) => (
            {
                title: book.title,
                price: book.price,
                authors: book.authors.push(author)
            }
        ));

    export type Action = typeof reduce.actionType;
}

interface Shelf {
    readonly description: string;
    readonly books: List<Book>;
}

namespace Shelf {

    export const empty: Shelf = {
        description: "",
        books: List<Book>()
    };

    export const reduce = reducer(empty)
        .action("SET_DESCRIPTION", (shelf: Shelf, description: string) => (
            {
                description,
                books: shelf.books
            }
        ))
        .action("ADD_BOOK", (shelf: Shelf, title: string) => (
            {
                description: shelf.description,
                books: shelf.books.push({
                    title,
                    price: Book.empty.price,
                    authors: Book.empty.authors
                })
            }
        ))
        .action("UPDATE_BOOK", (shelf: Shelf, {pos, bookAction}: { pos: number, bookAction: Book.Action }) => (
            {
                description:
                shelf.description,
                books: shelf.books.update(pos, b => Book.reduce(b, bookAction))
            }
        ));

    export type Action = typeof reduce.actionType;

    export const bookAt = defineCursor(
        (shelf: Shelf, pos: number) => shelf.books.get(pos),
        (pos: number, bookAction: Book.Action) => action("UPDATE_BOOK", { pos, bookAction })
    );
}

interface Shop {
    readonly name: string;
    readonly shelves: List<Shelf>;
}

namespace Shop {

    export const empty: Shop = {
        name: "",
        shelves: List<Shelf>()
    };

    export const reduce = reducer(empty)
        .action("SET_NAME", (shop: Shop, name: string) =>
            ({ name, shelves: shop.shelves })
        )
        .action("ADD_SHELF", (shop: Shop, description: string) =>
            ({ name: shop.name, shelves: shop.shelves.push({ description, books: Shelf.empty.books }) })
        )
        .action("UPDATE_SHELF", (shop: Shop, {pos, shelfAction}: { pos: number, shelfAction: Shelf.Action }) =>
            ({ name: shop.name, shelves: shop.shelves.update(pos, s => Shelf.reduce(s, shelfAction)) })
        );

    export const shelfAt = defineCursor(
        (shop: Shop, pos: number) => shop.shelves.get(pos),
        (pos: number, shelfAction: Shelf.Action) => action("UPDATE_SHELF", {pos, shelfAction}));
}

const enableLogging = false;

function logStore<State, Types>(store: Store<State, Types>) {
    if (enableLogging) {
        store.subscribe(() => {
            console.log("");
            console.log(JSON.stringify(store.getState()));
            console.log("");
        });
    }
    return store;
}

describe("immuto", () => {

    it("has an initial state available via cursor", () => {

        const book = createStoreCursor(logStore(Book.reduce.createStore())).value;

        expect(book.title).toEqual("");
        expect(book.price).toEqual(0);
        expect(book.authors.count()).toEqual(0);

        expect(JSON.stringify(book)).toEqual(`{"title":"","price":0,"authors":[]}`);
    });

    it("can be updated via cursors", () => {

        const store = logStore(Shelf.reduce.createStore());

        const shelf1 = createStoreCursor(store);
        const shelf2 = shelf1.dispatch(action("SET_DESCRIPTION", "Romance"));

        expect(JSON.stringify(shelf2.value)).toEqual(`{"description":"Romance","books":[]}`);

        const shelf3 = shelf2.dispatch(action("ADD_BOOK", "1985"));

        expect(JSON.stringify(shelf3.value)).toEqual(`{"description":"Romance","books":[{"title":"1985","price":0,"authors":[]}]}`);

        const firstBook1 = Shelf.bookAt(shelf3, 0);

        expect(firstBook1.value.title).toEqual("1985");
        expect(firstBook1.value.price).toEqual(0);

        const firstBook2 = firstBook1.dispatch(action("SET_PRICE", 5.99));

        expect(JSON.stringify(store.getState())).toEqual(`{"description":"Romance","books":[{"title":"1985","price":5.99,"authors":[]}]}`);

        expect(firstBook2.value.price).toEqual(5.99);
    });


    it("supports nested layers of cursors", () => {

        const store = logStore(Shop.reduce.createStore());
        const shop1 = createStoreCursor(store);

        const shop2 = shop1.dispatch(action("SET_NAME", "Buy the Book, Inc."));
        const shop3 = shop2.dispatch(action("ADD_SHELF", "Adventure"));

        const firstShelf1 = Shop.shelfAt(shop3, 0);
        expect(firstShelf1.value.description).toEqual("Adventure");

        const firstShelf2 = firstShelf1.dispatch(action("ADD_BOOK", "Indiana Smith"));

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":[{"description":"Adventure","books":[{"title":"Indiana Smith","price":0,"authors":[]}]}]}`);

        const firstBook1 = Shelf.bookAt(firstShelf2, 0);
        expect(firstBook1.value.title).toEqual("Indiana Smith");

        const firstBook2 = firstBook1.dispatch(action("SET_PRICE", 4.99));
        const firstBook3 = firstBook2.dispatch(action("ADD_AUTHOR", "Jim Orwell"));

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":[{"description":"Adventure","books":[{"title":"Indiana Smith","price":4.99,"authors":["Jim Orwell"]}]}]}`);

        expect(firstBook3.value.title).toEqual("Indiana Smith");
        expect(firstBook3.value.price).toEqual(4.99);
        expect(firstBook3.value.authors.first()).toEqual("Jim Orwell");
    });
});
