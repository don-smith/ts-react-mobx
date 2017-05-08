/*global describe,it, beforeEach, sinon, expect*/
import LinkedRepresentation from './LinkedRepresentation';

describe('LinkedRepresentation', () => {
    describe('getUrl():', () => {
        it('returns the href of the self link', () => {
            // Given
            const linked = LinkedRepresentation.makeFrom("url");
            // Then
            expect(linked.getUrl()).toEqual("url");
        });

        it('throws when there is no self link', () => {
            try {
                const linked = new LinkedRepresentation([]);
                linked.getUrl();
                fail("Didn't expect to get here");
            } catch (e) {
                expect(e.message).toEqual('LinkedRepresentation: Unable to find \'/self|canonical/\' in links: []');
            }
        });

        it("returns undefined when there is no self link and it's optional", () => {
            // Given
            const linked = new LinkedRepresentation([]);
            // Then
            expect(linked.getUrl(true)).toEqual(undefined);
        });
    });

    describe('getRouterPath():', () => {
        it('returns the path of the self link, without the host:port', () => {
            // Given
            const linked = LinkedRepresentation.makeFrom("http://localhost:1080/subscriber/2");
            // Then
            expect(linked.getRouterPath()).toEqual("/subscriber/2");
        });

        it('returns the whole link if no ":"', () => {
            // Given
            const linked = LinkedRepresentation.makeFrom("/subscriber/2");
            // Then
            expect(linked.getRouterPath()).toEqual("/subscriber/2");
        });

        it('returns the whole link if no "/" after ":"', () => {
            // Given
            const linked = LinkedRepresentation.makeFrom(":subscriber");
            // Then
            expect(linked.getRouterPath()).toEqual(":subscriber");
        });
    });

    describe('getLink():', () => {
        it("returns url when there is such a link", () => {
            // Given
            const linked = new LinkedRepresentation([{rel: 'there', href: 'url1'}]);
            // Then
            expect(linked.getLink('there')).toEqual('url1');
        });

        it("returns url when there is such a link (pattern)", () => {
            // Given
            const linked = new LinkedRepresentation([{rel: 'there', href: 'url1'}]);
            // Then
            expect(linked.getLink(/there/)).toEqual('url1');
        });

        it("returns undefined when it's optional and there is no such link", () => {
            // Given
            const linked = new LinkedRepresentation([]);
            // Then
            expect(linked.getLink('missing', true)).toEqual(undefined);
        });

        it("returns undefined when it's optional and there is no such link (pattern)", () => {
            // Given
            const linked = new LinkedRepresentation([]);
            // Then
            expect(linked.getLink(/missing/, true)).toEqual(undefined);
        });

        it("throws when it's not optional and there is no such link", () => {
            // Given
            const linked = new LinkedRepresentation([]);
            try {
                linked.getLink('/missing/', false);
                fail("Didn't expect to get here");
            } catch (e) {
                expect(e.message).toEqual('LinkedRepresentation: Unable to find \'/missing/\' in links: []');
            }
        });
    });

    describe('addLink()', () => {
        it('adds the link and returns the linkedRepresentation', () => {
            // Given
            const linked = LinkedRepresentation.makeFrom("url");
            // When
            const result = linked.addLink('address', 'addressUrl');
            // Then
            expect(result).toEqual(linked);
            expect(linked.getLink('address')).toEqual('addressUrl');
        });
    });

    describe('update()', () => {
        it('returns the linkedRepresentation after updating it', () => {
            // Given
            const linked = new LinkedRepresentation([]);
            const update = LinkedRepresentation.makeFrom("update", {count: 22});
            // When
            const result = linked.update(update);
            // Then
            expect(result).toEqual(linked);
            expect(result).toMatchObject(update.setHydrated()); // fudge state of update for ===
            expect((linked as any).count).toEqual(22);
        });
    });

    describe('setHydrated()', () => {
        it('The internal state is initially not hydrated', () => {
            // Given
            const linked = new LinkedRepresentation([]);
            expect(linked.isHydrated()).toEqual(false);
        });

        it('The internal state changes', () => {
            // Given
            const linked = new LinkedRepresentation([]);
            // When
            const result = linked.setHydrated();
            // Then
            expect(result).toEqual(linked);
            expect(linked.isHydrated()).toEqual(true);
        });
    });

    describe('feedTitle', () => {
        it('By default, a feedTitle is undefined', () => {
            // Given
            const linked = new LinkedRepresentation([]);
            // Then
            expect(linked.getFeedTitle()).toEqual(undefined);
        });

        it('By default, a feedTitle is undefined', () => {
            // Given
            const linked = new LinkedRepresentation([]);
            // When
            linked.setFeedTitle('aTitle');
            // Then
            expect(linked.getFeedTitle()).toEqual('aTitle');
        });
    });
});
