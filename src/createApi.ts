import {HttpFetch} from "./rest/http/HttpFetch";
import ES6Promises from "./rest/promise/ES6Promises";
import Rest from "./rest/Rest";
import LinkedRepresentation from "./rest/representation/LinkedRepresentation";
import { SupplierStore } from './store';

let fetcher = new HttpFetch(() => window.fetch);
export const apiUri = (document.getElementById("apiLink") as any).href;
export const rest = new Rest(fetcher, new ES6Promises(), apiUri);
export const store = new SupplierStore(LinkedRepresentation.makeLinksFrom(apiUri), rest);
store.hydrate();
