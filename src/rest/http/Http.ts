import HttpResponse from './HttpResponse';

declare type UriString = string
declare type Cancellable = Promise<boolean>|number;

interface Http {
    getText(uri: string, cancellable?: Cancellable): Promise<HttpResponse<string>>
    get(uri: string, cancellable?: Cancellable): Promise<HttpResponse<Object>>
    put(uri: UriString, body: string, cancellable?: Cancellable): Promise<HttpResponse<string>>
    patch(uri: UriString, body: Object, cancellable?: Cancellable): Promise<HttpResponse<string>>
    postForm(uri: UriString, body: string, cancellable?: Cancellable): Promise<HttpResponse<string>>
}

export default Http