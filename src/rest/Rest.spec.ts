import LinkedRepresentation from './representation/LinkedRepresentation';
import FeedRepresentation from './representation/FeedRepresentation';
import FeedItemRepresentation from './representation/FeedItemRepresentation';
import CollectionRepresentation from './representation/CollectionRepresentation';
import Link from './representation/Link';
import Rest from './Rest';
import RestDomain from './RestDomain';
import Http from './http/Http';
import Promises from './promise/Promises';
import PseudoPromise from './promise/PseudoPromise';
import PseudoPromises from './promise/PseudoPromises';
import * as sinon from 'sinon';

describe('Rest', () => {
    'use strict';
    const baseUrl = "http://localhost:3000/";
    const promises: Promises = new PseudoPromises();
    const parentUrl = "urlParent";
    const childUrl1 = "childUrl1";
    const childUrl2 = "childUrl2";
    const childrenUrl = "childrenUrl";
    let mockHttp, factory, rest;
    /**
     * @type{LinkedRepresentation}
     */
    let linkedParent, linkedChild1, linkedChild2;

    beforeEach(() => {
        mockHttp = {
            getText: sinon.mock(),
            get: sinon.stub(),
            put: sinon.mock(),
            patch: sinon.mock(),
            postForm: sinon.mock()
        };
        factory = sinon.stub();
        rest = new Rest(mockHttp, promises, baseUrl);
        rest.waitForEach = (elements, f) => new PseudoPromise(elements.map(f));
        linkedParent = LinkedRepresentation.makeFrom(parentUrl);
        linkedChild1 = LinkedRepresentation.makeFrom(childUrl1);
        linkedChild2 = LinkedRepresentation.makeFrom(childUrl2);
    });

    function getArgs(url, timeout: number|Promise<boolean> = 0) {
        return {method: 'GET', url: url, timeout: timeout, data: null};
    }

    function createLinked(links: Array<Link>, rest: Rest): LinkedRepresentation {
        return new LinkedRepresentation(links);
    }

    it('makeUri', () => {
        expect(rest.makeUri("person", "34")).toEqual(baseUrl + "person/34");
    });

    describe('hydrateFromUrl', () => {
        it('Does not yet exist, so we GET it', () => {
            // Given
            const data = new RestDomain(LinkedRepresentation.makeLinksFrom(parentUrl), rest);
            //const data = LinkedRepresentation.makeFrom(parentUrl);
            mockHttp.get
                .withArgs(parentUrl)
                .returns(new PseudoPromise({data: data}));
            const doInformOnHydrated = sinon.stub();
            doInformOnHydrated
                .withArgs()
                .returns(undefined);
            data.doInformOnHydrated = doInformOnHydrated;
            // When/then
            rest
                .hydrateFromUrl(parentUrl, createLinked)
                .then(result => expect(result.links).toBe(data.links));
        });

        it('It is already cached, so we do not GET it', () => {
            // Given
            const data = LinkedRepresentation.makeFrom(parentUrl);
            mockHttp.get
                .withArgs(parentUrl)
                .returns(new PseudoPromise({data: data}));
            rest.hydrateFromUrl(parentUrl, createLinked);
            rest.http = undefined;
            // When/Then
            rest
                .hydrateFromUrl(parentUrl, createLinked)
                .then(result => expect(result).toMatchObject(linkedParent));
        });
    });

    describe('hydrate', () => {
        it('is already hydrated, so it is simply returned', () => {
            // Given
            linkedParent.setHydrated();
            // When/Then
            rest
                .hydrate(linkedParent)
                .thenExpect(linkedParent);
        });

        it('is not hydrated, so we GET it and update it', () => {
            // Given
            const data = LinkedRepresentation.makeFrom(parentUrl, {p: 1});
            data.addLink('child', childUrl1);
            mockHttp.get
                .withArgs(parentUrl)
                .returns(new PseudoPromise({data: data}));
            // When/Then
            rest
                .hydrate(linkedParent)
                .thenExpect(linkedParent);
            // Then
            expect(linkedParent.p).toEqual(1);
            expect(linkedParent.getLink('child')).toEqual(childUrl1);
        });

        it('with a reload, it is not hydrated, so we GET it and update it', () => {
            // Given
            const data = LinkedRepresentation.makeFrom(parentUrl, {p: 1});
            data.addLink('child', childUrl1);
            mockHttp.get
                .withArgs(parentUrl)
                .returns(new PseudoPromise({data: data}));
            // When/Then
            rest
                .hydrate(linkedParent, {reloadResource: true})
                .thenExpect(linkedParent);
            // Then
            expect(linkedParent.p).toEqual(1);
            expect(linkedParent.getLink('child')).toEqual(childUrl1);
        });

        it('is hydrated, but we are reloading, so we GET it and update it', () => {
            // Given
            linkedParent.setHydrated();
            const data = LinkedRepresentation.makeFrom(parentUrl, {p: 1});
            data.addLink('child', childUrl1);
            mockHttp.get
                .withArgs(parentUrl)
                .returns(new PseudoPromise({data: data}));
            // When/then
            rest
                .hydrate(linkedParent, {reloadResource: true})
                .thenExpect(linkedParent);
            // Then
            expect(linkedParent.p).toEqual(1);
            expect(linkedParent.getLink('child')).toEqual(childUrl1);
        });
    });

    describe('hydrateChild', () => {
        it('1. Child is already associated & hydrated, so it is simply returned', () => {
            // Given
            linkedParent
                .addLink('child', childUrl1)
                .child = linkedChild1;
            linkedChild1.setHydrated();
            // When/Then
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked)
                .thenExpect(linkedChild1);
        });

        it('1R. With reload, child is already associated & hydrated,so we GET it and update it', () => {
            // Given
            linkedParent
                .addLink('child', childUrl1)
                .child = linkedChild1;
            linkedChild1.setHydrated();

            const data1 = LinkedRepresentation
                .makeFrom(childUrl1, {p: 2})
                .addLink('up', parentUrl);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: data1}));
            // When/then
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked, {reloadResource: true})
                .thenExpect(linkedChild1);
            // Then
            expect(linkedChild1.p).toEqual(2);
        });

        it('2. Child is already associated & is not hydrated, so we GET it and update it', () => {
            // Given
            linkedParent
                .addLink('child', childUrl1)
                .child = linkedChild1;
            const data1 = LinkedRepresentation
                .makeFrom(childUrl1, {p: 2})
                .addLink('up', parentUrl);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: data1}));
            // When
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked)
                .thenExpect(linkedChild1);
            // Then
            expect(linkedChild1.isHydrated()).toEqual(true);
            expect(linkedParent.child).toEqual(linkedChild1);
            expect(linkedChild1.getLink('up')).toEqual(parentUrl);
        });

        it('2R. With reload, child is already associated & is not hydrated, so we GET it and update it', () => {
            // Given
            linkedParent
                .addLink('child', childUrl1)
                .child = linkedChild1;
            const data1 = LinkedRepresentation
                .makeFrom(childUrl1, {p: 2})
                .addLink('up', parentUrl);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: data1}));
            // When/Then
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked, {reloadResource: true})
                .thenExpect(linkedChild1);
            // Then
            expect(linkedChild1.isHydrated()).toEqual(true);
            expect(linkedParent.child).toEqual(linkedChild1);
            expect(linkedChild1.getLink('up')).toEqual(parentUrl);
        });

        it('3. Child is not associated & is not hydrated, so we GET it and update it', () => {
            // Given
            linkedParent.addLink('child', childUrl1);
            const data1 = LinkedRepresentation
                .makeFrom(childUrl1, {p: 2})
                .addLink('up', parentUrl);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: data1}));
            // When/Then
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked)
                .then(result => {
                    expect(result).toMatchObject(data1);
                    expect(result).toEqual(linkedParent.child);
                    expect(result.isHydrated()).toEqual(true);
                });
            // Then
            expect(linkedParent.child.getLink('up')).toEqual(parentUrl);
            expect(linkedParent.child.p).toEqual(2);
        });

        it('3R. With reload, child is not associated & is not hydrated, so we GET it and update it', () => {
            // Given
            linkedParent.addLink('child', childUrl1);
            const data1 = LinkedRepresentation
                .makeFrom(childUrl1, {p: 2})
                .addLink('up', parentUrl);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: data1}));
            // When/then
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked, {reloadResource: true})
                .then(result => {
                    expect(result).toMatchObject(data1);
                    expect(result).toEqual(linkedParent.child);
                    expect(result.isHydrated()).toEqual(true);
                });
            // Then
            expect(linkedParent.child.getLink('up')).toEqual(parentUrl);
            expect(linkedParent.child.p).toEqual(2);
        });

        it('4. Child is optional and missing, so it resolves to undefined', () => {
            // When/Then
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked, {optional: true})
                .thenExpect(undefined);
        });

        it('4R. With reload, child is optional and missing, so it resolves to undefined', () => {
            // When/Then
            rest
                .hydrateChild(linkedParent, 'child', /child/, createLinked, {optional: true, reloadResource: true})
                .thenExpect(undefined);
        });

        it('5. Child is not optional and missing, so it throws', () => {
            try {
                rest.hydrateChild(linkedParent, 'child', /child/, factory);
                fail("unexpected");
            } catch (e) {
                expect(e.message).toEqual(
                    'LinkedRepresentation: Unable to find \'/child/\' in links: [{"rel":"self","href":"urlParent"}]');
            }
        });

        it('5R. With reload, child is not optional and missing, so it rejects', () => {
            try {
                rest.hydrateChild(linkedParent, 'child', /child/, factory, {reloadResource: true});
                fail("unexpected");
            } catch (e) {
                expect(e.message).toEqual(
                    'LinkedRepresentation: Unable to find \'/child/\' in links: [{"rel":"self","href":"urlParent"}]');
            }
        });

        it('6. Child is not associated and not hydrated, yet is in the cache, so it is returned from there', () => {
            // Given it's already in the cache
            linkedParent.addLink('child1', childUrl1);
            linkedParent.addLink('child2', childUrl1);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: linkedChild1}));

            rest.hydrateChild(linkedParent, 'child1', /child1/, createLinked);
            linkedChild1.setHydrated();
            expect(linkedParent.child1).toMatchObject(linkedChild1);

            rest.http = undefined; // ensure it can't be used again
            // When/Then
            rest
                .hydrateChild(linkedParent, 'child2', /child2/, createLinked)
                .then(result => expect(result).toMatchObject(linkedChild1));
            // Then
            expect(linkedParent.child2).toMatchObject(linkedChild1);
        });

        it('6R. With reload, child is not associated and not hydrated, yet is in the cache, so it is returned from there', () => {
            // Given it's already in the cache
            linkedParent.addLink('child1', childUrl1);
            linkedParent.addLink('child2', childUrl1);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: linkedChild1}));
            rest.hydrateChild(linkedParent, 'child1', /child1/, createLinked);
            linkedChild1.setHydrated();
            expect(linkedParent.child1).toMatchObject(linkedChild1);

            const data1 = LinkedRepresentation
                .makeFrom(childUrl1, {p: 2})
                .addLink('up', parentUrl);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: data1}));
            // When/Then
            rest
                .hydrateChild(linkedParent, 'child2', /child2/, createLinked, {reloadResource: true})
                .then(result => {
                    expect(result).toMatchObject(data1);
                    expect(result.isHydrated()).toEqual(true);
                });
            // Then
            expect(linkedParent.child2).toMatchObject(data1);
            expect(linkedParent.child2.getLink('up')).toEqual(parentUrl);
            expect(linkedParent.child2.p).toEqual(2);
        });
    });

    describe('hydrateUpThroughFeed', ()=> {
        const up_ = {
            name: 'up', toOne: true, relationship: 'up', optional: false,
            make: () => createLinked
        };

        beforeEach(()=> {
            // Given
            linkedParent.addLink('up', childUrl1);
        });

        it('701. Up is already associated & hydrated, so it is simply returned', () => {
            // Given
            linkedParent.up = linkedChild1;
            linkedChild1.setHydrated();
            // When/Then
            rest
                .hydrateUpThroughFeed(linkedParent, up_)
                .thenExpect(linkedChild1);
        });

        it('702. Up is already associated & is not hydrated, so we GET it and update it', () => {
            // Given
            linkedParent.up = linkedChild1;
            const data1 = LinkedRepresentation
                .makeFrom(childUrl1, {p: 2})
                .addLink('up', parentUrl);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: data1}));
            // When
            rest
                .hydrateUpThroughFeed(linkedParent, up_)
                .thenExpect(linkedChild1);
            // Then
            expect(linkedChild1.isHydrated()).toEqual(true);
            expect(linkedParent.up).toEqual(linkedChild1);
        });

        it.skip('703. Up is not associated & is not hydrated, so we walk up to get it', () => {
            const realParentUrl = "realParent";
            // Given
            const realParent = LinkedRepresentation
                .makeFrom(realParentUrl, {p: 2});
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({
                    data: {
                        links: [{rel: "up", href: realParentUrl}]
                    }
                }));
            mockHttp.get
                .withArgs(realParentUrl)
                .returns(new PseudoPromise({data: realParent}));
            // When/Then
            rest
                .hydrateUpThroughFeed(linkedParent, up_)
                .then(result => {
                    expect(result).toEqual(realParent);
                    expect(result.isHydrated()).toEqual(true);
                });
            // Then
            expect(linkedParent.up.p).toEqual(2);
            expect(rest.cacheFeedUrlToFeedParent.get(childUrl1)).toEqual(realParent);
        });

        it('704. Up is already cached, so it is simply returned', () => {
            // Given
            const grandparentUrl = "grandparentUrl";
            const grandparent = LinkedRepresentation.makeFrom(grandparentUrl);
            rest.cacheFeedUrlToFeedParent.set(childUrl1, grandparent);
            // When/Then
            rest
                .hydrateUpThroughFeed(linkedParent, up_)
                .thenExpect(grandparent);
        });

        // todo handle reload
    });

    describe('hydrateCollection', () => {
        const linksToLinkedRepresentation = (links, rest) => new LinkedRepresentation(links);

        it('101. Collection is already associated/hydrated, so the items are simply returned', () => {
            // Given
            linkedParent
                .addLink('children', childrenUrl)
                .children = new CollectionRepresentation([], [linkedChild1, linkedChild2]);
            linkedChild1.setHydrated();
            // When/Then
            rest
                .hydrateCollection(linkedParent, 'children', /children/, linksToLinkedRepresentation)
                .thenExpectObservableArray([linkedChild1, linkedChild2]);
            expect(rest.cacheFeedUrlToFeedParent.get(childrenUrl)).toEqual(linkedParent);
        });

        it('102. Optional collection is not associated/hydrated and the link is missing, so [] is returned', () => {
            // When/Then
            rest
                .hydrateCollection(linkedParent, 'children', /missing-children/, factory, {optional: true})
                .thenExpectObservableArray([]);
            // Then
            expect(linkedParent.children.items.length).toEqual(0);
            expect(linkedParent.children.isHydrated()).toEqual(true);
            expect(linkedParent.children.getUrl()).toEqual(undefined);
        });

        it('102E. Collection is not associated/hydrated and the link is missing, so exception is thrown', () => {
            try {
                rest.hydrateCollection(linkedParent, 'children', /missing-children/, factory);
                fail('unexpected');
            } catch (e) {
                expect(e.message).toEqual(
                    'LinkedRepresentation: Unable to find \'/missing-children/\' in links: [{"rel":"self","href":"urlParent"}]');
            }
        });

        it('103. Collection is not associated/hydrated, so we GET it, and process the children', () => {
            // Given
            linkedParent
                .addLink('children', childrenUrl);
            const feedData = FeedRepresentation.makeFrom(childrenUrl,
                [new FeedItemRepresentation(childUrl1, 't1'), new FeedItemRepresentation(childUrl2, 't2')]);
            mockHttp.get
                .withArgs(childrenUrl)
                .returns(new PseudoPromise({data: feedData}));
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: linkedChild1}));
            mockHttp.get
                .withArgs(childUrl2)
                .returns(new PseudoPromise({data: linkedChild2}));
            // When/Then
            rest
                .hydrateCollection(linkedParent, 'children', /children/,
                    linksToLinkedRepresentation, {alsoHydrateChildren: true})
                .then(result => {
                  expect(result.slice()[0]).toMatchObject(linkedChild1)
                  expect(result.slice()[1]).toMatchObject(linkedChild2)
                });
            // Then
            // slice the ObservableArray to get an Array
            expect(linkedParent.children.items[0]).toMatchObject(linkedChild1);
            expect(linkedParent.children.items[1]).toMatchObject(linkedChild2);
            expect(linkedParent.children.isHydrated()).toBe(true);
            expect(linkedParent.children.items[0].getFeedTitle()).toEqual('t1');
            expect(linkedParent.children.items[1].getFeedTitle()).toEqual('t2');
            expect(rest.cacheFeedUrlToFeedParent.get(childrenUrl)).toEqual(linkedParent);
        });

        it('104. Collection is not associated and not hydrated, yet each of the children are in the cache', () => {
            // Given
            linkedParent.addLink('child1', childUrl1);
            linkedParent.addLink('child2', childUrl2);
            mockHttp.get
                .withArgs(childUrl1)
                .returns(new PseudoPromise({data: linkedChild1}));
            rest.hydrateChild(linkedParent, 'child1', /child1/, createLinked);
            mockHttp.get
                .withArgs(childUrl2)
                .returns(new PseudoPromise({data: linkedChild2}));
            rest.hydrateChild(linkedParent, 'child2', /child2/, createLinked);

            // Now use a new http,get() mock to ensure http is not called to GET the 2 children again
            mockHttp.get = sinon.stub();

            linkedParent.addLink('children', childrenUrl);
            const feedData = FeedRepresentation.makeFrom(childrenUrl,
                [new FeedItemRepresentation(childUrl1, 't1'), new FeedItemRepresentation(childUrl2, 't2')]);
            mockHttp.get
                .withArgs(childrenUrl)
                .returns(new PseudoPromise({data: feedData}));
            // When
            rest.hydrateCollection(linkedParent, 'children', /children/,
                linksToLinkedRepresentation, {alsoHydrateChildren: true});
            // Then
            expect(linkedParent.children.items[0]).toBe(linkedParent.child1);
            expect(linkedParent.children.items[1]).toBe(linkedParent.child2);
        });

        it('105. Collection is already associated/hydrated, but we want a reload, so we GET the collection again', () => {
            // Given
            linkedParent
                .addLink('children', childrenUrl)
                .children = new CollectionRepresentation([]).addItem(linkedChild1).addItem(linkedChild2);
            linkedParent.setHydrated();

            const feedData = FeedRepresentation.makeFrom(childrenUrl,
                [new FeedItemRepresentation(childUrl2, 't2'), new FeedItemRepresentation(childUrl1, 't1')]);
            mockHttp.get
                .withArgs(childrenUrl)
                .returns(new PseudoPromise({data: feedData}));
            // When/Then
            rest
                .hydrateCollection(linkedParent, 'children', /children/, linksToLinkedRepresentation, {reloadFeed: true})
                .thenExpectObservableArray([linkedChild2, linkedChild1]);
            // Then
            expect(linkedParent.children.items.slice()).toEqual([linkedChild2, linkedChild1]);
            expect(linkedParent.children.items[0].getFeedTitle()).toEqual('t2');
            expect(linkedParent.children.items[1].getFeedTitle()).toEqual('t1');
        });

        it('106. Collection is not associated/hydrated, so we GET it, and process the embedded children', () => {
            // Given
            linkedParent
                .addLink('children', childrenUrl);
            const feedData = FeedRepresentation.makeFrom(childrenUrl, [linkedChild1, linkedChild2]);
            mockHttp.get
                .withArgs(childrenUrl)
                .returns(new PseudoPromise({data: feedData}));
            // When/Then
            rest
                .hydrateCollection(linkedParent, 'children', /children/,
                    linksToLinkedRepresentation, {alsoHydrateChildren: true})
                .then(result => {
                  expect(result.slice()[0]).toMatchObject(linkedChild1)
                  expect(result.slice()[1]).toMatchObject(linkedChild2)
                });
            // Then
            // slice the ObservableArray to get an Array
            expect(linkedParent.children.items[0]).toMatchObject(linkedChild1);
            expect(linkedParent.children.items[1]).toMatchObject(linkedChild2);
            expect(linkedParent.children.isHydrated()).toBe(true);
            expect(linkedParent.children.items[0].getUrl()).toEqual(childUrl1);
            expect(linkedParent.children.items[1].getUrl()).toEqual(childUrl2);
            expect(rest.cacheFeedUrlToFeedParent.get(childrenUrl)).toMatchObject(linkedParent);
        });

    });

    describe('hydrateRelationships(): ', () => {
        let linked;
        let makeA, makeB;
        let makeA_, makeB_;

        beforeEach(() => {
            linked = {getUrl: () => 'URL1'};
            makeA = sinon.mock();
            makeA_ = () => makeA;
            makeB = sinon.mock();
            makeB_ = () => makeB;
            rest.hydrateCollection = sinon.mock();
            rest.hydrateTransitivelyElementsOf = sinon.mock();
            rest.hydrateChild = sinon.mock();
            rest.hydrate = sinon.mock();
            rest.hydrate
                .withArgs()
                .returns(new PseudoPromise(100001));
            rest.resolve = result => new PseudoPromise(result);
        });

        it('with an empty array of attributes', () => {
            // When/then
            rest
                .hydrateRelationships(linked, [])
                .thenExpect(linked);
        });

        it('with several optional attributes, with all options false', () => {
            //Given
            const a_ = {name: 'a', toMany: true, make: makeA_, optional: true};
            const b_ = {name: 'b', toOne: true, relationship: 'related-people', make: makeB_, optional: true};
            rest.hydrateCollection
                .withArgs(linked, 'a', 'a', makeA,
                    {optional: true, reloadFeed: false, alsoHydrateChildren: false, cancellable: undefined})
                .returns(new PseudoPromise(222));
            rest.hydrateChild
                .withArgs(linked, 'b', 'related-people', makeB, {optional: true, reloadResource: false})
                .returns(new PseudoPromise(333));
            // When/then
            rest
                .hydrateRelationships(linked, [a_, b_])
                .thenExpect(linked);
        });

        it('with several non-optional attributes, with all options false', () => {
            //Given
            const a_ = {name: 'a', toMany: true, relationship: 'aa', make: makeA_, optional: false};
            const b_ = {name: 'b', toOne: true, make: makeB_, optional: false};
            rest.hydrateCollection
                .withArgs(linked, 'a', 'aa', makeA,
                    {optional: false, reloadFeed: false, alsoHydrateChildren: false, cancellable: undefined})
                .returns(new PseudoPromise(222));
            rest.hydrateChild
                .withArgs(linked, 'b', 'b', makeB, {optional: false, reloadResource: false})
                .returns(new PseudoPromise(333));
            // When/then
            rest
                .hydrateRelationships(linked, [a_, b_])
                .thenExpect(linked);
        });

        it('with several optional attributes, with options {reloadFeed: true, reloadResource: true, alsoHydrateChildren: true}', () => {
            //Given
            const a_ = {name: 'a', toMany: true, make: makeA_, optional: true};
            const b_ = {name: 'b', toOne: true, relationship: 'related-people', make: makeB_, optional: true};
            rest.hydrateCollection
                .withArgs(linked, 'a', 'a', makeA,
                    {optional: true, reloadFeed: true, alsoHydrateChildren: true, cancellable: undefined})
                .returns(new PseudoPromise(222));
            rest.hydrateChild
                .withArgs(linked, 'b', 'related-people', makeB, {optional: true, reloadResource: true})
                .returns(new PseudoPromise(333));
            // When/then
            rest
                .hydrateRelationships(linked, [a_, b_], {
                    reloadFeed: true, reloadResource: true, alsoHydrateChildren: true
                })
                .thenExpect(linked);
        });

        it('with several optional attributes, with options {transitiveHydrate: true}', () => {
            //Given
            const a_ = {name: 'a', toMany: true, make: makeA_, optional: true};
            const b_ = {name: 'b', toOne: true, relationship: 'related-people', make: makeB_, optional: true};
            linked.a = sinon.mock();
            linked.b = {hydrateTransitively: sinon.mock()};
            rest.hydrateCollection
                .withArgs(linked, 'a', 'a', makeA,
                    {optional: true, reloadFeed: false, alsoHydrateChildren: false, cancellable: undefined})
                .returns(new PseudoPromise(222));
            rest.hydrateChild
                .withArgs(linked, 'b', 'related-people', makeB, {optional: true, reloadResource: false})
                .returns(new PseudoPromise(333));
            rest.hydrateTransitivelyElementsOf
                .withArgs(linked.a)
                .returns(new PseudoPromise(444));
            linked.b.hydrateTransitively
                .withArgs()
                .returns(new PseudoPromise(555));
            // When/then
            rest
                .hydrateRelationships(linked, [a_, b_], {transitiveHydrate: true})
                .thenExpect(linked);
        });

        it(`An optional toOne with options {transitiveHydrate: true} and which does not exist,
            so hydrateTransitively() is not called`, () => {
            //Given
            const b_ = {name: 'b', toOne: true, relationship: 'related-people', make: makeB_, optional: true};
            linked.b = undefined;
            rest.hydrateChild
                .withArgs(linked, 'b', 'related-people', makeB, {optional: true, reloadResource: false})
                .returns(new PseudoPromise(333));
            // When/then
            rest
                .hydrateRelationships(linked, [b_], {transitiveHydrate: true})
                .thenExpect(linked);
        });

    });

    describe('hydrateTransitivelyElementsOf', () => {
        // We need to introduce this following class for testiong because @observable changes properties, and we don't
        // want to change the functions, so we have to go indirect.
        class NamedRestDomain extends RestDomain {
            constructor(public name: string, links: Array<Link>, public rest: Rest,
                        protected mock_hydrateTransitively, protected mock_setHasHydratedTransitively,
                        protected hydratedTransitively: boolean) {
                super(links, rest);
            }

            hydrateTransitively() {
                return this.mock_hydrateTransitively();
            }

            hasHydratedTransitively() {
                return this.hydratedTransitively;
            }

            setHasHydratedTransitively() {
                return this.mock_setHasHydratedTransitively();
            }
        }

        let linked1_hydrateTransitively, linked1_setHasHydratedTransitively;
        let linked2_hydrateTransitively, linked2_setHasHydratedTransitively;

        beforeEach(() => {
            linked1_hydrateTransitively = sinon.stub();
            linked1_setHasHydratedTransitively = sinon.stub();
            linked2_hydrateTransitively = sinon.stub();
            linked2_setHasHydratedTransitively = sinon.stub();
        });

        it('300. with an empty collection', () => {
            //Given
            const collection = new CollectionRepresentation([]);
            // When/then
            rest
                .hydrateTransitivelyElementsOf(collection)
                .thenExpect(collection);
        });

        it('301. with a non-empty collection, not hasHydratedTransitively', () => {
            //Given
            let linked1 = new NamedRestDomain("linked1", [], rest,
                linked1_hydrateTransitively, linked1_setHasHydratedTransitively, true);
            let linked2 = new NamedRestDomain("linked2", [], rest,
                linked2_hydrateTransitively, linked2_setHasHydratedTransitively, true);

            linked1_setHasHydratedTransitively
                .withArgs()
                .returns(new PseudoPromise(111));
            linked2_setHasHydratedTransitively
                .withArgs()
                .returns(new PseudoPromise(222));
            linked1_hydrateTransitively
                .withArgs()
                .returns(new PseudoPromise(444));
            linked2_hydrateTransitively
                .withArgs()
                .returns(new PseudoPromise(555));
            const collection = new CollectionRepresentation<RestDomain>([], [linked1, linked2]);
            // When/then
            rest
                .hydrateTransitivelyElementsOf(collection)
                .thenExpect(collection);
        });

        it('302. with a non-empty collection, one hasHydratedTransitively', () => {
            //Given
            let linked1 = new NamedRestDomain("linked1", [], rest,
                linked1_hydrateTransitively, linked1_setHasHydratedTransitively, true);
            let linked2 = new NamedRestDomain("linked2", [], rest,
                linked2_hydrateTransitively, linked2_setHasHydratedTransitively, false);
            const collection = new CollectionRepresentation([], [linked1, linked2]);
            linked2_setHasHydratedTransitively
                .withArgs()
                .returns(new PseudoPromise(222));
            linked2_hydrateTransitively
                .withArgs()
                .returns(new PseudoPromise(555));
            // When/then
            rest
                .hydrateTransitivelyElementsOf(collection)
                .thenExpect(collection);
        });
    });

    describe('addElementsToCollectionOnServer:', () => {
        let restDomain;
        const childUrl1 = 'childUrl1';
        const childUrl2 = 'childUrl2';
        let element1;
        let element2;

        const collectionUrl = 'collectionUrl';
        const targetUrl = 'targetUrl';

        const factory = (links, rest) => new RestDomain(links, rest);

        beforeEach(() => {
            restDomain = {};
            rest.resolve = v => new PseudoPromise(v);
            element1 = new RestDomain(LinkedRepresentation.makeLinksFrom(childUrl1), rest);
            element2 = new RestDomain(LinkedRepresentation.makeLinksFrom(childUrl2), rest);
        });

        it('add 0 elements to empty collection', () => {
            // Given
            const as_ = {name: 'as', toMany: true, make: () => factory};
            // When/Then
            rest
                .addElementsToCollectionOnServer(restDomain, [], as_)
                .thenExpect(undefined);
        });

        describe('2 elements:', () => {
            let createForm;

            beforeEach(() => {
                createForm = {submit: sinon.stub()};
                restDomain.as = CollectionRepresentation.makeFrom(collectionUrl); // already hydrated
                restDomain.as['create-form'] = createForm; // pre-hydrate it for test

                rest.hydrateRelationships = sinon.stub();
                rest.hydrateRelationships
                    .withArgs(restDomain, [sinon.match(v => v.name == 'as')], {reloadFeed: false})
                    .returns(new PseudoPromise(111));
                rest.hydrateRelationships
                    .withArgs(restDomain, [sinon.match(v => v.name == 'createForm')])
                    .returns(new PseudoPromise(createForm));
                createForm.submit
                    .withArgs(element1)
                    .returns(new PseudoPromise(111));
                createForm.submit
                    .withArgs(element2)
                    .returns(new PseudoPromise(222));
            });

            it('add 2 elements to empty collection that is already hydrated, no reload', () => {
                // Given above
                const as_ = {name: 'as', toMany: true, make: () => factory};
                // When/Then
                rest
                    .addElementsToCollectionOnServer(restDomain, [element1, element2], as_, {reloadFeed: false})
                    .thenExpect(undefined);
            });

            it('add 2 elements to empty collection that is already hydrated, with a reload', () => {
                // Given
                const as_ = {name: 'as', toMany: true, make: () => factory};
                rest.hydrateRelationships
                    .withArgs(restDomain, [sinon.match(v => v.name == 'as')], {
                        reloadFeed: true,
                        alsoHydrateChildren: true
                    })
                    .returns(new PseudoPromise(222));

                // When/Then
                rest
                    .addElementsToCollectionOnServer(restDomain, [element1, element2], as_, {reloadFeed: true})
                    .thenExpect(222);
            });
        });

        describe('create-another-form: ', ()=> {
            // The following is not sufficient as a test, because sinon can't handle multiple calls into a mock
            // and a stub quietly fails if there is a bad match, so we can't tell.
            // Need to write "mocks" by hand here!
            it('add 2 elements to empty collection that is already hydrated, no reload', () => {
                const createAnotherForm = 'create-another-form';
                const createForm = {submit: sinon.stub()};
                restDomain.as = CollectionRepresentation.makeFrom(collectionUrl); // already hydrated
                restDomain.as[createAnotherForm] = createForm; // pre-hydrate it for test

                rest.hydrateRelationships = sinon.stub();
                rest.hydrateRelationships
                    .withArgs(restDomain, [sinon.match(v => v.name == 'as' && v.toMany)], {reloadFeed: false})
                    .returns(new PseudoPromise(111));
                rest.hydrateRelationships
                    .withArgs(sinon.match(v => v.createForm === createForm),
                        sinon.match(v => v[0].name == 'createForm' && v[0].relationship === createAnotherForm),
                        {})
                    .returns(new PseudoPromise(createForm));
                createForm.submit
                    .withArgs(element1)
                    .returns(new PseudoPromise(111));
                createForm.submit
                    .withArgs(element2)
                    .returns(new PseudoPromise(222));

                // Given above
                const as_ = {name: 'as', toMany: true, make: () => factory};
                // When/Then
                rest
                    .addElementsToCollectionOnServer(restDomain, [element1, element2], as_,
                        {reloadFeed: false, createFormName: createAnotherForm})
                    .thenExpect(undefined);
            });
        });
    });

});
