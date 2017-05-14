import { observable } from 'mobx'
import RestDomain from "./rest/RestDomain"
import Link from "./rest/representation/Link";
import Rest from "./rest/Rest"
import CollectionRepresentation from "./rest/representation/CollectionRepresentation";
import { Item, Supplier, Service } from './interfaces'

const dummyService = {
  id: 50001,
  name: 'Grand Presidential Suite',
  text: 'Light and spaceous room',
  supplierId: 10001,
  image: 'http://placehold.it/150x150'
}

const dummySupplier =
  {
    id: 10001,
    name: 'Heritage Hotel',
    street: '90 FEDERAL STREET',
    city: 'Auckland',
    country: 'New Zealand',
    phone: '09-000-0000',
    email: 'info@heritage.com',
    description: 'An upscale hotel',
    images: [
      'http://placehold.it/150x150', 'http://placehold.it/150x150', 'http://placehold.it/150x150'
    ],
    services: [
      new Service(dummyService)
    ]
  }

export class SupplierStore extends RestDomain {
    @observable data: Supplier = new Supplier(dummySupplier)
    @observable color: string

    constructor(links: Array<Link>, rest: Rest) {
        super(links, rest);
    }

    static make(links: Array<Link>, rest: Rest): SupplierStore {
        return new SupplierStore(links, rest);
    }

    static makeUri(rest: Rest, id: string): string {
        return rest.makeUri("supplier", id);
    }

    static makeNew(rest: Rest): SupplierStore {
        const store = SupplierStore.make([], rest);
        store.color = "";
        return store;
    }
}
