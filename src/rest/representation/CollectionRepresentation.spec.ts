/*global describe,it, beforeEach, sinon, expect*/
import CollectionRepresentation from './CollectionRepresentation';
import LinkedRepresentation from './LinkedRepresentation';
import FeedItemRepresentation from './FeedItemRepresentation';
import Link from "./Link";
import RestDomain from "../RestDomain";
import * as sinon from 'sinon';

describe('CollectionRepresentation', () => {
    const linksToLinkedRepresentation = (links: Array<Link>) => new LinkedRepresentation(links) as RestDomain;

    describe('empty', () => {
        it('has no items', () => {
            // Given
            const collection = new CollectionRepresentation([], []);
            // Then
            expect(collection.size()).toEqual(0);
            expect(collection.findItem('url')).toEqual(undefined);
        });
    });

    describe('addItem() and findItem()', () => {
        it('2 added and can be found', () => {
            // Given
            const collection = new CollectionRepresentation([], []);
            const item1 = LinkedRepresentation.makeFrom("url1")as RestDomain;
            const item2 = LinkedRepresentation.makeFrom("url2")as RestDomain;
            // When
            collection.addItem(item1).addItem(item2);
            // Then
            expect(collection.size()).toEqual(2);
            expect(collection.findItem('url1')).toEqual(item1);
            expect(collection.findItem('url2')).toEqual(item2);
        });
    });

    describe('addItem() and clearItems()', () => {
        it('2 added and then removed', () => {
            // Given
            const item0 = LinkedRepresentation.makeFrom("url0")as RestDomain;
            const collection = new CollectionRepresentation([], [item0]);
            // Need to grab this afterwards because the @observable replaces the [item0] with an ObservableArray:
            const initialItems = collection.items;
            const item1 = LinkedRepresentation.makeFrom("url1")as RestDomain;
            const item2 = LinkedRepresentation.makeFrom("url2")as RestDomain;
            collection.addItem(item1).addItem(item2);
            // When
            collection.clearItems();
            // Then
            expect(collection.size()).toEqual(0);
            expect(collection.items).toBe(initialItems); // The array is not replaced
        });
    });

    describe('addItemFromFeed()', () => {
        it('new one', () => {
            // Given
            const collection = new CollectionRepresentation([], []);
            const item1 = LinkedRepresentation.makeFrom("url1")as RestDomain;
            collection.addItem(item1);
            // When
            collection.addItemFromFeed(new FeedItemRepresentation("url2", "t2"), linksToLinkedRepresentation);
            // Then
            expect(collection.size()).toEqual(2);
            expect(collection.findItem('url1')).toEqual(item1);
            expect(collection.findItem('url2').getFeedTitle()).toEqual("t2");
        });
    });

    describe('replaceAllItemsFromFeed()', () => {
        it('empty', () => {
            // Given
            const collection = new CollectionRepresentation([], []);
            // When
            collection.replaceAllItemsFromFeed({links: [], items: []}, linksToLinkedRepresentation);
            // Then
            expect(collection.size()).toEqual(0);
        });

        it('two in feed', () => {
            // Given
            const collection = new CollectionRepresentation([], []);
            // Need to grab this afterwards because the @observable replaces the [item0] with an ObservableArray:
            const initialItems = collection.items;
            const baseItem = LinkedRepresentation.makeFrom("feedUrl");
            // When
            const items = {
                links: baseItem.links,
                items: [
                    {id: "url1", title: "t1"} as FeedItemRepresentation,
                    {id: "url2", title: "t2"} as FeedItemRepresentation
                ]
            };
            collection.replaceAllItemsFromFeed(items, linksToLinkedRepresentation);
            // Then
            expect(collection.items).toBe(initialItems); // The array is not replaced
            expect(collection.size()).toEqual(2);
            expect(collection.findItem('url1').getFeedTitle()).toEqual("t1");
            expect(collection.findItem('url2').getFeedTitle()).toEqual("t2");
            expect(collection.getUrl()).toEqual("feedUrl");
        });
    });

    describe('hydrateEmbeddedItems()', () => {
        it('empty embedded items array', () => {
            // Given
            const collection = new CollectionRepresentation([], []);
            // When
            collection.hydrateEmbeddedItems([], undefined);
            // Then
            expect(collection.items.length).toBe(0);
        });

        it('non-empty embedded items array', () => {
            // Given
            const collection = new CollectionRepresentation([], []);
            const item1 = LinkedRepresentation.makeFrom("url1")as RestDomain;
            const item2 = LinkedRepresentation.makeFrom("url2")as RestDomain;
            const item1_fromFactory = LinkedRepresentation.makeFrom("url11")as RestDomain;
            const item2_fromFactory = LinkedRepresentation.makeFrom("url12")as RestDomain;
            const factory = sinon.stub();
            factory.withArgs([{rel: 'self', href:'url1'}]).returns(item1_fromFactory);
            factory.withArgs([{rel: 'self', href:'url2'}]).returns(item2_fromFactory);
            // When
            collection.hydrateEmbeddedItems([item1, item2], factory);
            // Then
            expect(collection.items.length).toBe(2);
            expect(collection.items[0]).toBe(item1_fromFactory);
            expect(collection.items[1]).toBe(item2_fromFactory);
        });
    });
});
