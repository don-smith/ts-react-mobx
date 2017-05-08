/*global describe,it, beforeEach, expect*/
import LinkedRepresentation from './representation/LinkedRepresentation';
import CollectionRepresentation from './representation/CollectionRepresentation';
import RestDomain from './RestDomain';
import PseudoPromise from './promise/PseudoPromise';
import * as sinon from 'sinon';
import Rest from "./Rest";

describe('RestDomain', () => {
    const url = 'url33';
    let restDomain;
    let rest;
    let factory;

    beforeEach(() => {
        rest = {
            http: {patch: sinon.stub()},
            setPostContentTypeFormUrlEncoded: sinon.stub(),
            hydrate: sinon.stub(),
            hydrateRelationships: sinon.stub(),
            httpPatch: sinon.stub(),
            waitForEach: (elements, f) => new PseudoPromise(elements.map(f)),
            resolve: v => new PseudoPromise(v)
        };
        restDomain = new RestDomain(LinkedRepresentation.makeLinksFrom(url), rest);
        factory = sinon.stub();
    });

    describe('hydrate', () => {
        it('with no options', () => {
            //Given
            rest.hydrate
                .withArgs(restDomain, {reloadResource: false})
                .returns(new PseudoPromise(restDomain));
            // When/then
            restDomain
                .hydrate()
                .thenExpect(restDomain);
        });

        it('with options', () => {
            //Given
            rest.hydrate
                .withArgs(restDomain, {options: true})
                .returns(new PseudoPromise(restDomain));
            // When/then
            restDomain
                .hydrate({options: true})
                .thenExpect(restDomain);
        });
    });

    describe('dataToPutOrPost', () => {
        it('with []', () => {
            expect(restDomain.dataToPutOrPost([])).toEqual({});
        });

        it('with 2 elements in list', () => {
            // Given
            restDomain.a = 1;
            restDomain.b = 22;
            // When/then
            expect(restDomain.dataToPutOrPost(['a', 'b'])).toEqual({a: 1, b: 22});
        });
    });

    describe('patch', () => {
        const whateverResult = {xyz: true};

        it('with []', () => {
            rest.http.patch
                .withArgs(url, [])
                .returns(new PseudoPromise(whateverResult));
            // When/then
            restDomain
                .patch([])
                .thenExpect(whateverResult);
        });

        it('with 2 elements in list', () => {
            // Given
            restDomain.a = 1;
            restDomain.b = 22;
            rest.http.patch
                .withArgs(url, [
                    {op: "replace", path: "/a", value: 1},
                    {op: "replace", path: "/b", value: 22}])
                .returns(new PseudoPromise(whateverResult));
            // When/then
            restDomain
                .patch(['a', 'b'])
                .thenExpect(whateverResult);
        });
    });


    it('addElementsToCollectionOnServer', () => {
        // Given
        const element1 = new RestDomain(LinkedRepresentation.makeLinksFrom('childUrl1'), rest);
        const element2 = new RestDomain(LinkedRepresentation.makeLinksFrom('childUrl2'), rest);
        const as_ = {name: 'as', toMany: true, make: () => factory};
        rest.addElementsToCollectionOnServer = sinon.mock();
        rest.addElementsToCollectionOnServer
            .withArgs(restDomain, [element1, element2], as_, {reloadFeed: false})
            .returns(new PseudoPromise(111));
        // When/Then
        restDomain
            .addElementsToCollectionOnServer([element1, element2], as_, {reloadFeed: false})
            .thenExpect(111);
    });

    describe('save(): ', () => {
        it('unchanged', () => {
            // Given
            // When/Then
            restDomain
                .save()
                .thenExpect(restDomain);
        });

        it('changed', () => {
            // Given
            restDomain.change();
            const editForm = {
                submitEdit: sinon.mock()
            };
            restDomain.editForm = editForm; // pre-hydrate it for test
            rest.hydrateRelationships
                .withArgs(restDomain, [sinon.match(v => v.name = "editForm")])
                .returns(new PseudoPromise(111));
            editForm.submitEdit
                .withArgs(restDomain)
                .returns(new PseudoPromise(undefined));
            // When/Then
            restDomain
                .save()
                .then(result => {
                    expect(result).toEqual(restDomain);
                    expect(restDomain.changed).toEqual(false);
                })
        });

        it('changed with options', () => {
            // Given
            restDomain.change();
            const editForm = {
                submitEdit: sinon.mock()
            };
            restDomain.editForm = editForm; // pre-hydrate it for test
            rest.hydrateRelationships
                .withArgs(restDomain, [sinon.match(v => v.name = "editForm")])
                .returns(new PseudoPromise(111));
            editForm.submitEdit
                .withArgs(restDomain)
                .returns(new PseudoPromise(undefined));
            rest.hydrate
                .withArgs({reloadResource: true})
                .returns(new PseudoPromise(222));
            // When/Then
            restDomain
                .save({reloadResource: true})
                .then(result => {
                    expect(result).toEqual(restDomain);
                    expect(restDomain.changed).toEqual(false);
                })
        });
    });

    describe('searching', () => {
        let searchForm;
        let cancellable;

        class SearchableCollection extends CollectionRepresentation<RestDomain> {
            constructor(public search: any) {
                super([],[]);
            }
        }

        beforeEach(() => {
            searchForm = {
                submitSearch: sinon.mock()
            };
            cancellable = new PseudoPromise();
        });

        it('searchCollection', () => {
            // Given
            const collection = new SearchableCollection(searchForm);
            rest.hydrateRelationships
                .withArgs(collection, [sinon.match(v => v.name === 'search')], {cancellable: cancellable})
                .returns(new PseudoPromise(111));
            searchForm.submitSearch
                .withArgs('Rob', cancellable)
                .returns(new PseudoPromise("anything"));
            // When/Then
            restDomain
                .searchCollection(collection, 'Rob', cancellable)
                .thenExpect("anything");
        });

        it('search', () => {
            // Given
            const searchForm_ = {name: 'search', toOne: true, make: () => sinon.mock()};
            const linked = new SearchableCollection(searchForm);
            rest.hydrateRelationships
                .withArgs(linked, [sinon.match(v => v.name === 'search')], {cancellable: cancellable})
                .returns(new PseudoPromise(111));
            searchForm.submitSearch
                .withArgs('Rob', cancellable)
                .returns(new PseudoPromise("something"));
            // When/Then
            restDomain
                .search(linked, searchForm_, 'Rob', cancellable)
                .thenExpect("something");
        });
    });

    describe('doInformOnHydrated', () => {
        it('first', () => {
            // Given
            restDomain.onHydrated = sinon.mock();
            restDomain.onHydrated
                .withArgs(false)
                .returns();
            // When/Then
            restDomain.doInformOnHydrated();
        });

        it('subsequent', () => {
            // Given
            restDomain.doInformOnHydrated();
            restDomain.onHydrated = sinon.mock();
            restDomain.onHydrated
                .withArgs(true)
                .returns();
            // When/Then
            restDomain.doInformOnHydrated();
        });
    });
});
