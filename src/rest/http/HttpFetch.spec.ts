import {HttpFetch} from './HttpFetch';
import PseudoPromise from '../promise/PseudoPromise';
import * as sinon from 'sinon';
import 'whatwg-fetch';

describe('HttpFetch', () => {
    let fetch;
    let httpFetch;

    beforeEach(() => {
        fetch = sinon.stub();
        httpFetch = new HttpFetch(() => fetch);
    });

    describe('getText', () => {
        it('not ok', () => {
            fetch
                .withArgs('uri')
                .returns(new PseudoPromise({ok: false, status: 503, statusText: '??'}));
            try {
                httpFetch
                    .getText('uri');
                fail('unexpected');
            } catch (e) {
                expect(e.message).toEqual(
                    "Failed to GET 'uri' with status '503' and statusText '??'");
            }
        });

        it('text and no headers', () => {
            fetch
                .withArgs('uri')
                .returns(new PseudoPromise({ok: true, text: () => "Hello", headers: {get: () => undefined}}));
            httpFetch
                .getText('uri')
                .then(response => {
                    expect(response.data).toBe("Hello");
                    expect(response.headers.get('date')).toBeUndefined();
                });
        });

        it('text and headers', () => {
            const get = (s: string) => (s === 'date') ? 12 : undefined;
            fetch
                .withArgs('uri')
                .returns(new PseudoPromise({ok: true, text: () => "Hello", headers: {get: get}}));
            httpFetch
                .getText('uri')
                .then(response => {
                    expect(response.data).toBe("Hello");
                    expect(response.headers.get('date')).toBe(12);
                });
        });
    });

    it('get', () => {
        fetch
            .withArgs('uri')
            .returns(new PseudoPromise({ok: true, text: () => new PseudoPromise('{"msg": "Hello"}')}));
        httpFetch
            .get('uri')
            .then(response => {
                expect(response.data).toEqual({msg: "Hello"});
            });
    });

    it('put', () => {
        fetch
            .withArgs('uri', {method: 'PUT', body: 'body'})
            .returns(new PseudoPromise({ok: true, text: () => new PseudoPromise('ok')}));
        httpFetch
            .put('uri', 'body')
            .then(response => {
                expect(response.data).toEqual('ok');
            });
    });

    it('patch', () => {
        fetch
            .withArgs('uri', {method: 'PATCH', body: '{"op":"body"}'})
            .returns(new PseudoPromise({ok: true, text: () => new PseudoPromise('ok')}));
        httpFetch
            .patch('uri', {op: 'body'})
            .then(response => {
                expect(response.data).toEqual('ok');
            });
    });

    it('postForm', () => {
        const headers = httpFetch.postFormHeaders();
        const get = (s: string) => (s === 'location') ? 'uri2' : undefined;

        fetch
            .withArgs('uri', {method: 'POST', headers: headers, body: 'body'})
            .returns(new PseudoPromise({ok: true, text: () => new PseudoPromise('ok'), headers: {get: get}}));
        httpFetch
            .postForm('uri', 'body')
            .then(response => {
                expect(response.data).toEqual('ok');
                expect(response.headers.get('location')).toEqual('uri2');
            });
    });
});