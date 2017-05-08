/*global describe,it, beforeEach, sinon, expect*/
import LinkedRepresentation from './LinkedRepresentation';
import FeedRepresentation from './FeedRepresentation';

describe('FeedRepresentation', () => {
    describe('makeFrom', () => {
        it('has no items', () => {
            const url1 = "url1";
            const feed = FeedRepresentation.makeFrom(url1);
            expect(feed.getUrl()).toEqual(url1);
            expect(feed.items).toEqual([]);
        });

        it('has 2 items', () => {
            const url1 = "url1";
            const feed = FeedRepresentation.makeFrom(url1).addItem('url2','t2').addItem('url3','t3');
            expect(feed.getUrl()).toEqual(url1);
            expect(feed.items.length).toEqual(2);
        });
    });
});