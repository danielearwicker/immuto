import { Action, Reducer, Store, action, reducer, defineCursor, createStoreCursor } from "../index";
import { List } from "immutable";

export class Book {

    constructor(
        public readonly title: string,
        public readonly price: number,
        public readonly authors: List<string>) {
    }

    static readonly setTitle = action<Book, "SET_TITLE", string>(
            "SET_TITLE", (book, title) => new Book(title, book.price, book.authors));

    static readonly setPrice = action<Book, "SET_PRICE", number>(
            "SET_PRICE", (book, price) => new Book(book.title, price, book.authors));

    static readonly addAuthor = action<Book, "SET_AUTHOR", string>(
            "SET_AUTHOR", (book, author) => new Book(book.title, book.price, book.authors.push(author)));

    static readonly reduce = reducer<Book>(new Book("", 0, List<string>()))
                            .add(Book.setTitle)
                            .add(Book.setPrice)
                            .add(Book.addAuthor);
}

class Shelf {

    constructor(
        public readonly description: string,
        public readonly books: List<Book>) {
    }

    static readonly setDescription = action<Shelf, "SET_DESCRIPTION", string>(
            "SET_DESCRIPTION", (shelf, descr) => new Shelf(descr, shelf.books));

    static readonly addBook = action<Shelf, "ADD_BOOK", string>(
            "ADD_BOOK", (shelf, title) => new Shelf(shelf.description, shelf.books.push(new Book(title, 0, List<string>()))));

    static readonly updateBook = action<Shelf, "UPDATE_BOOK", [number, typeof Book.reduce.actionType]>(
            "UPDATE_BOOK", (shelf, args) => new Shelf(shelf.description, shelf.books.update(args[0], b => Book.reduce(b, args[1]))));

    static readonly reduce = reducer<Shelf>(new Shelf("", List<Book>()))
                            .add(Shelf.setDescription)
                            .add(Shelf.addBook)
                            .add(Shelf.updateBook);

    static readonly bookAt = defineCursor(
        (shelf: Shelf, pos: number) => shelf.books.get(pos),
        (pos: number, bookAction: typeof Book.reduce.actionType) => Shelf.updateBook([pos, bookAction]));
}

class Shop {
    constructor(
        public readonly name: string,
        public readonly shelves: List<Shelf>) {
    }

    static readonly setName = action<Shop, "SET_NAME", string>(
            "SET_NAME", (shop, name) => new Shop(name, shop.shelves));

    static readonly addShelf = action<Shop, "ADD_SHELF", string>(
            "ADD_SHELF", (shop, name) => new Shop(shop.name, shop.shelves.push(new Shelf(name, List<Book>()))));

    static readonly updateShelf = action<Shop, "UPDATE_SHELF", [number, typeof Shelf.reduce.actionType]>(
            "UPDATE_SHELF", (shop, args) => new Shop(shop.name, shop.shelves.update(args[0], s => Shelf.reduce(s, args[1]))));

    static readonly reduce = reducer<Shop>(new Shop("", List<Shelf>()))
                            .add(Shop.setName)
                            .add(Shop.addShelf)
                            .add(Shop.updateShelf);

    static readonly shelfAt = defineCursor(
        (shop: Shop, pos: number) => shop.shelves.get(pos),
        (pos: number, shelfAction: typeof Shelf.reduce.actionType) => Shop.updateShelf([pos, shelfAction]));
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

        const book = createStoreCursor(logStore(Book.reduce.createStore()))();

        expect(book.title).toEqual("");
        expect(book.price).toEqual(0);
        expect(book.authors.count()).toEqual(0);

        expect(JSON.stringify(book)).toEqual(`{"title":"","price":0,"authors":[]}`);
    });

    it("can be updated via late-bound cursors", () => {

        const shelf = createStoreCursor(logStore(Shelf.reduce.createStore()));
        shelf(Shelf.setDescription("Romance"));

        expect(JSON.stringify(shelf())).toEqual(`{"description":"Romance","books":[]}`);

        // Create cursor here, before adding book!
        const firstBook = Shelf.bookAt(shelf, 0);

        shelf(Shelf.addBook("1985"));

        expect(JSON.stringify(shelf())).toEqual(`{"description":"Romance","books":[{"title":"1985","price":0,"authors":[]}]}`);

        expect(firstBook().title).toEqual("1985");
        expect(firstBook().price).toEqual(0);

        firstBook(Book.setPrice(5.99));

        expect(JSON.stringify(shelf())).toEqual(`{"description":"Romance","books":[{"title":"1985","price":5.99,"authors":[]}]}`);

        expect(firstBook().price).toEqual(5.99);
    });

    it("can be updated via snapshot cursors", () => {

        const shelf = createStoreCursor(logStore(Shelf.reduce.createStore()));
        shelf(Shelf.setDescription("Romance"));
        shelf(Shelf.addBook("1985"));

        expect(JSON.stringify(shelf())).toEqual(`{"description":"Romance","books":[{"title":"1985","price":0,"authors":[]}]}`);

        // ask for snapshot cursor, so have to do it after adding book
        const firstBook = Shelf.bookAt(shelf, 0, true);

        expect(firstBook().title).toEqual("1985");
        expect(firstBook().price).toEqual(0);

        firstBook(Book.setPrice(5.99));

        expect(JSON.stringify(shelf())).toEqual(`{"description":"Romance","books":[{"title":"1985","price":5.99,"authors":[]}]}`);

        // firstBook is a snapshot so doesn't see the change
        expect(firstBook().price).toEqual(0);

        // take another shapshot
        const firstBookAgain = Shelf.bookAt(shelf, 0, true);
        expect(firstBookAgain().price).toEqual(5.99);
    });

    it("supports nested layers of cursors", () => {

        const shop = createStoreCursor(logStore(Shop.reduce.createStore()));
        shop(Shop.setName("Buy the Book, Inc."));

        shop(Shop.addShelf("Adventure"));

        const firstShelf = Shop.shelfAt(shop, 0);
        expect(firstShelf().description).toEqual("Adventure");

        firstShelf(Shelf.addBook("Indiana Smith"));

        expect(JSON.stringify(shop())).toEqual(`{"name":"Buy the Book, Inc.","shelves":[{"description":"Adventure","books":[{"title":"Indiana Smith","price":0,"authors":[]}]}]}`);

        const firstBookOfFirstShelf = Shelf.bookAt(firstShelf, 0);
        expect(firstBookOfFirstShelf().title).toEqual("Indiana Smith");

        firstBookOfFirstShelf(Book.setPrice(4.99));
        firstBookOfFirstShelf(Book.addAuthor("Jim Orwell"));

        expect(JSON.stringify(shop())).toEqual(`{"name":"Buy the Book, Inc.","shelves":[{"description":"Adventure","books":[{"title":"Indiana Smith","price":4.99,"authors":["Jim Orwell"]}]}]}`);

        expect(firstBookOfFirstShelf().title).toEqual("Indiana Smith");
        expect(firstBookOfFirstShelf().price).toEqual(4.99);
        expect(firstBookOfFirstShelf().authors.first()).toEqual("Jim Orwell");
    });
});
