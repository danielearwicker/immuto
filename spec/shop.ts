import * as I from "../index";
import { action, reducer, objectByString, reference, amend } from "../index";

import { Book } from "./book";
import { Shelf } from "./shelf";

export type Shelves = { [id: string]: Shelf }

export namespace Shelves {

    export const empty: Shelves = {};
    export const at = objectByString(Shelf.reduce);
    export const reduce = reducer(empty).action(at);
}

export interface Shop {
    readonly name: string;
    readonly shelves: { [id: string]: Shelf };
}

export namespace Shop {

    export const setName = action("SET_NAME",
        (shop: Shop, name: string) => amend(shop, { name }));

    export const shelves = reference("SHELVES", 
        Shelves.reduce, (shop: Shop) => shop.shelves);

    export const empty: Shop = {
        name: "",
        shelves: Shelves.empty
    };

    export const reduce = reducer(empty)
        .action(setName)
        .action(shelves);
}
