import * as I from "../index";
import { action, reducer, reference, amend } from "../index";

import { Shop } from "./shop";

export interface Founder {
    readonly name: string;
    readonly shop: Shop;
}

export namespace Founder {

    export const setName = action("SET_NAME",
        (shop: Founder, name: string) => amend(shop, { name }));

    export const shop = reference("SHELVES", Shop,
        (founder: Founder) => founder.shop);

    export const empty: Founder = {
        name: "",
        shop: Shop.empty
    };

    export const reduce = reducer(empty)
        .action(setName)
        .action(shop);
}

