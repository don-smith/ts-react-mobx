import Http from './Http';
import HttpResponse from './HttpResponse';
//import 'whatwg-fetch';

declare type UriString = string
declare type Cancellable = Promise<boolean>|number;

export class HttpFetch implements Http {
    // We're not allowed to assign a native function (window.fetch) to a field of an object, so have to go indirect.
    constructor(public fetching: () => ((url: string|Request, init?: RequestInit) => Promise<Response>) = () => fetch) {
    }

    getText(uri: UriString, cancellable?: Cancellable): Promise<HttpResponse<string>> {
        return this.httpMethod(uri);
    }

    get(uri: UriString, cancellable?: Cancellable): Promise<HttpResponse<Object>> { // Could be 'any' returned from JSON
        return this
            .getText(uri)
            .then(httpResponse => ({data: JSON.parse(httpResponse.data), headers: httpResponse.headers}));
    }

    put(uri: UriString, body: string, cancellable?: Cancellable): Promise<HttpResponse<string>> {
        return this.httpMethod(uri, {method: 'PUT', body: body});
    }

    patch(uri: UriString, body: Object, cancellable?: Cancellable): Promise<HttpResponse<string>> {
        return this.httpMethod(uri, {method: 'PATCH', body: JSON.stringify(body)});
    }

    postFormHeaders(): Headers {
        return {'Content-Type': 'application/x-www-form-urlencoded'} as any as Headers; // todo consider switching to 'other' fetch
    }

    postForm(uri: UriString, body: string, cancellable?: Cancellable): Promise<HttpResponse<string>> {
        return this.httpMethod(uri, {method: 'POST', headers: this.postFormHeaders(), body: body});
    }

    httpMethod(uri: UriString, request?: RequestInit): Promise<HttpResponse<string>> {
        let responseHeaders: Headers;
        return this.fetching()(uri, request)// See the top of this file for an explanation of the indirect call.
            .then(response => {
                if (!response.ok) {
                    throw new Error(
                        `Failed to ${request && request.method || 'GET'} '${uri}' with status '${response.status}' and statusText '${response.statusText}'`);
                }
                responseHeaders = response.headers;
                return response.text();
            })
            .then(text => ({data: text, headers: responseHeaders}));
    }
}