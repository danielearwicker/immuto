import { snapshot, amend, Store, replace } from "../index";

import { Book } from "./book";
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

        expect(JSON.stringify(book)).toEqual(`{"title":"","price":0,"authors":[]}`);
    });

    it("can be updated via cursors", () => {

        const store = logStore(Shelf.reduce.store());

        const shelf1 = snapshot(store);
        const shelf2 = shelf1(Shelf.setDescription("Romance"));

        expect(JSON.stringify(shelf2.state)).toEqual(`{"description":"Romance","books":{}}`);

        const book1 = shelf2.$(Shelf.books).$(Books.at(1001))(Book.setTitle("1985"));

        expect(JSON.stringify(store.getState())).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":0,"authors":[]}}}`);

        expect(book1.state.title).toEqual("1985");
        expect(book1.state.price).toEqual(0);

        const book2 = book1(Book.setPrice(5.99));

        expect(JSON.stringify(store.getState())).toEqual(`{"description":"Romance","books":{"1001":{"title":"1985","price":5.99,"authors":[]}}}`);

        expect(book2.state.price).toEqual(5.99);
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

        expect(JSON.stringify(shelf1.state)).toEqual(`{"description":"Romance","books":{}}`);

        shelf1.$(Shelf.books).$(Books.at(1001))(Book.setTitle("1985"));

        const books1 = shelf1.$(Shelf.books)
            (Books.at.update(1001, Book.setTitle("1985")))
            (Books.at.update(1002, Book.setTitle("Indiana Smith")))
            (Books.at.update(1003, Book.setTitle("Gone With The Runs")));

        expect(JSON.stringify(books1.state)).toEqual(`{"1001":{"title":"1985","price":0,"authors":[]},"1002":{"title":"Indiana Smith","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}`);

        const books2 = books1(Books.remove(1002));

        expect(JSON.stringify(books2.state)).toEqual(`{"1001":{"title":"1985","price":0,"authors":[]},"1003":{"title":"Gone With The Runs","price":0,"authors":[]}}`);
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

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":0,"authors":[]}}}}}`);

        expect(firstBook1.state.title).toEqual("Indiana Smith");

        const firstBook2 = firstBook1(Book.setPrice(4.99));
        const firstBook3 = firstBook2(Book.addAuthor("Jim Orwell"));

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"Buy the Book, Inc.","shelves":{"ADV":{"description":"Adventure","books":{"1002":{"title":"Indiana Smith","price":4.99,"authors":["Jim Orwell"]}}}}}`);

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

        expect(JSON.stringify(store.getState())).toEqual(`{"name":"","shelves":{"ADV":{"description":"","books":{"123":{"title":"The Tiger Who Came To Tea","price":0,"authors":[]}}}}}`);
    });
});

