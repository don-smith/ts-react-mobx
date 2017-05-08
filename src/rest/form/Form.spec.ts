/*global describe,it, beforeEach, expect*/
//<editor-fold desc="imports">
import LinkedRepresentation from '../representation/LinkedRepresentation';
import Form from './Form';
import PseudoPromise from '../promise/PseudoPromise';
import * as sinon from 'sinon';
import Rest from "../Rest";
import Http from "../http/Http";
//</editor-fold>

describe('Form', () => {
    const url = 'url22';
    let rest;
    let form;

    beforeEach(() => {
        rest = {
            http: {postForm: sinon.mock()},
            hydrate: sinon.mock()
        };
        form = new Form(LinkedRepresentation.makeLinksFrom(url), rest);
    });

    describe('asPostStringUriEncoded()', () => {
        it('Simple cases', () => {
            expect(form.asPostStringUriEncoded({})).toEqual('');
            expect(form.asPostStringUriEncoded({a: 1})).toEqual('a=1');
            expect(form.asPostStringUriEncoded({a: 1, b: 2})).toEqual('a=1&b=2');
        });

        it('Spaces', () => {
            expect(form.asPostStringUriEncoded({a: "one and two"})).toEqual('a=one+and+two');
            expect(form.asPostStringUriEncoded({a: " three ", b: "  four  "})).toEqual('a=+three+&b=++four++');
        });

        it('UrlEncoding', () => {
            expect(form.asPostStringUriEncoded({a: '=@"'})).toEqual('a=%3D%40%22');
            expect(form.asPostStringUriEncoded({a: "!@#$%^&*()_+`~-=[]{};:'<>,."}))
                .toEqual("a=!%40%23%24%25%5E%26*()_%2B%60~-%3D%5B%5D%7B%7D%3B%3A'%3C%3E%2C.");
        });
    });

    describe('submit()', () => {
        let cancellable;
        const data = {a: 1, b: 2};
        const newUrl = 'newUrl';
        let response;

        beforeEach(() => {
            cancellable = new PseudoPromise();
            response = {
                headers: {get: sinon.stub()}
            };
            rest.http.postForm
                .withArgs(url, 'a=1&b=2', cancellable)
                .returns(new PseudoPromise(response));
            response.headers.get
                .withArgs('Location')
                .returns(newUrl);
        });

        it('Posts the form', () => {
            // When/Then
            form
                .submit(data, {cancellable: cancellable})
                .thenExpect(newUrl);
        });

        it('Posts the form and hydrates the result', () => {
            // Given
            const target = {links: undefined};
            rest.hydrate
                .withArgs(target, {reloadResource: true, cancellable: cancellable})
                .returns(new PseudoPromise(target));
            // When/Then
            form
                .submit(data, {loadTarget: target, cancellable: cancellable})
                .then(targetUrl => {
                    expect(targetUrl).toEqual(newUrl);
                    expect(target.links).toEqual(LinkedRepresentation.makeLinksFrom(newUrl));

                });
        });
    });

});
