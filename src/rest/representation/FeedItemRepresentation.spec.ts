/*global describe,it, beforeEach, sinon, expect*/
import FeedItemRepresentation from './FeedItemRepresentation';
import LinkedRepresentation from './LinkedRepresentation';

describe('FeedItemRepresentation', () => {
    describe('toLinkedRepresentation()', () => {
        it('returns a LinkedRepresentation with the given id', () => {
            // Given
            const item = new FeedItemRepresentation("url");
            // Then
            expect(item.toLinkedRepresentation().getUrl()).toEqual("url");
        });

        it('returns a LinkedRepresentation with the given id and title', () => {
            // Given
            const item = new FeedItemRepresentation("url", "Title");
            // When
            const linkedRepresentation = item.toLinkedRepresentation();
            // Then
            expect(linkedRepresentation.getUrl()).toEqual("url");
            expect((linkedRepresentation as any).title).toEqual("Title");
        });

        it('returns a LinkedRepresentation with the given id and substituted title and defaults', () => {
            // Given
            const item = new FeedItemRepresentation("url", "Title");
            // When
            const linkedRepresentation = item.toLinkedRepresentation("substituteTitle", {count: 3});
            // Then
            expect(linkedRepresentation.getUrl()).toEqual("url");
            expect((linkedRepresentation as any).substituteTitle).toEqual("Title");
            expect((linkedRepresentation as any).count).toEqual(3);
        });
    });
});
