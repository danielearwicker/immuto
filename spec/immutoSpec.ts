import { snapshot, amend, Store, replace } from "../index";

import { Book, Product, Food } from "./book";
import { Shelf, Books } from "./shelf";
import { Shop, Shelves } from "./shop";
import { Founder } from "./founder";

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

describe("Immuto", () => {

    it("has an initial state available via cursor", () => {

        {
            const store = Shop.reduce.store();

            const shelves = snapshot(store).$(Shop.shelves);
            const shelf = shelves.$(Shelves.at("fiction"));            
            const books = shelf.$(Shelf.books);
            const book = books.$(Books.at(109423));
            book(Book.setTitle("1985"));

            expect(store.getState().shelves["fiction"].books[109423].title).toEqual("1985");
        }

        const book = snapshot(logStore(Book.reduce.store())).state;

        expect(book.title).toEqual("");
        expect(book.price).toEqual(0);
        expect(book.authors.length).toEqual(0);

        expectJson(book, `{"title":"","price":0,"authors":[]}`);
    });

    it("can be updated via cursors", () => {

        const store = logStore(Shelf.reduce.store());

        const shelf1 = snapshot(store);
        const shelf2 = shelf1(Shelf.setDescription("Romance"));

        expectJson(shelf2.state, `{"description":"Romance","books":{}}`);

        const book1 = shelf2.$(Shelf.books).$(Books.at(1001))(Book.setTitle("1985"));

        expectJson(store.getState(), `{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]}}}`);

        expect(book1.state.title).toEqual("1985");
        expect(book1.state.price).toEqual(0);

        const book2 = book1(Product.setPrice(5.99));

        expectJson(store.getState(), `{"description":"Romance","books":{"1001":{"title":"1985","price":5.99,"authors":[]}}}`);

        expect(book2.state.price).toEqual(5.99);

        const book3 = book1(Book.addAuthor("Fred Orwell"));

        expectJson(store.getState(), `{"description":"Romance","books":{"1001":{"title":"1985","price":5.99,"authors":["Fred Orwell"]}}}`);

        expect(book3.state.price).toEqual(5.99);
        expect(book3.state.authors[0]).toEqual("Fred Orwell");
    });

    it("supports references and cursors through them", () => {

        const store = logStore(Founder.reduce.store());

        const founder1 = snapshot(store)(Founder.setName("Samuel J. Borders"));

        const shop1 = Founder.shop(founder1);

        shop1(Shop.setName("Borders"));

        expect(store.getState().name).toEqual("Samuel J. Borders");
        expect(store.getState().shop.name).toEqual("Borders");
    });

    it("supports removing items from collections", () => {

        const store = logStore(Shelf.reduce.store());

        const shelf1 = snapshot(store)(Shelf.setDescription("Romance"));

        expectJson(shelf1.state, `{"description":"Romance","books":{}}`);

        shelf1.$(Shelf.books).$(Books.at(1001))(Book.setTitle("1985"));

        const books1 = shelf1.$(Shelf.books)
            (Books.at.update(1001, Book.setTitle("1985")))
            (Books.at.update(1002, Book.setTitle("Indiana Smith")))
            (Books.at.update(1003, Book.setTitle("Gone With The Runs")));

        expectJson(books1.state, `{"1001":{"title":"1985","price":0,"authors":[]},"1002":{"title":"Indiana Smith","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}`);

        const books2 = books1(Books.remove(1002));

        expectJson(books2.state, `{"1001":{"title":"1985","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}`);
    });

    it("supports nested layers of cursors", () => {

        const store = logStore(Shop.reduce.store());
        const shop1 = snapshot(store);

        const shop2 = shop1(Shop.setName("Buy the Book, Inc."));
        

        const advShelf1 = shop2.$(Shop.shelves).$(Shelves.at("ADV"));
        expect(advShelf1.state.description).toEqual("");

        const advShelf2 = advShelf1(Shelf.setDescription("Adventure"));
        expect(advShelf2.state.description).toEqual("Adventure");

        const firstBook1 = advShelf2.$(Shelf.books).$(Books.at(1002))(Book.setTitle("Indiana Smith"));

        expectJson(store.getState(), `{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":0,"authors":[]}}}}}`);

        expect(firstBook1.state.title).toEqual("Indiana Smith");

        const firstBook2 = firstBook1(Product.setPrice(4.99));
        const firstBook3 = firstBook2(Book.addAuthor("Jim Orwell"));

        expectJson(store.getState(), `{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":4.99,"authors":["Jim Orwell"]}}}}}`);

        expect(firstBook3.state.title).toEqual("Indiana Smith");
        expect(firstBook3.state.price).toEqual(4.99);
        expect(firstBook3.state.authors[0]).toEqual("Jim Orwell");
    });

    it("supports properties with magic reducers (experimental)", () => {

        const store = logStore(Book.reduce.store());

        const title1 = Book.title(snapshot(store));
        title1(replace("Star Warts"));
        expect(store.getState().title).toEqual("Star Warts");

        expect(Book.empty.title).toEqual("");

        const title2 = Book.title(snapshot(store));
        expect(title2.state).toEqual("Star Warts");
    });

    it("supports $ for piping on cursors", () => {

        const store = logStore(Shop.reduce.store());
        const shop1 = snapshot(store);
        
        const advShelf1 = shop1
            .$(Shop.shelves)
            .$(Shelves.at("ADV"))
            .$(Shelf.books)
            .$(Books.at(123))
            .$(Book.title)
                (replace("The Tiger Who Came To Tea"));

        expectJson(store.getState(), `{"name":"","shelves":{"ADV":{"description":"","books":{"123":{"title":"The Tiger Who Came To Tea","price":0,"authors":[]}}}}}`);
    });

    it("supports sub-typing", () => {

        const store = logStore(Book.reduce.store());

        store.dispatch(Book.setTitle("Fred"));

        const productCursor: Product.Cursor = snapshot(store);

        const p2 = productCursor(Product.setPrice(22));

        expect(p2.state.price).toEqual(22);

        expect(store.getState().title).toEqual("Fred");
        expect(store.getState().price).toEqual(22);
    });

});

function toCanonicalJsonStream(obj: any, stream: string[]) {
    if (obj) {
        if (Array.isArray(obj)) {
            stream.push('[');
            for (var n = 0; n < obj.length; n++) {
                if (n != 0) {
                    stream.push(',');
                }
                toCanonicalJsonStream(obj[n], stream);
            }
            stream.push(']');
            return;
        }

        if (typeof obj == 'object') {
            stream.push('{');
            var keys = Object.keys(obj);
            keys.sort();
            keys.forEach((key, i) => {
                if (i != 0) {
                    stream.push(',');
                }
                stream.push(JSON.stringify(key));
                stream.push(':');
                toCanonicalJsonStream(obj[key], stream);
            });
            stream.push('}');
            return;
        }
    }
    stream.push(JSON.stringify(obj));
}

export function toCanonicalJson(obj: any) {
    var parts: string[] = [];
    toCanonicalJsonStream(obj, parts);
    return parts.join('');
}

export function expectJson(obj: any, json: string) {
    expect(toCanonicalJson(obj)).toEqual(toCanonicalJson(JSON.parse(json)));
}
