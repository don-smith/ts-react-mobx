import Promises from './Promises';
import DeferredPromise from './DeferredPromise';

export default class ES6Promises implements Promises {
    resolve<T>(value: T): Promise<T> {
        return Promise.resolve<T>(value);
    }

    reject<T>(value: T): Promise<T> {
        return Promise.reject<T>(value);
    }

    all(value: any): Promise<any> {
        return Promise.all(value);
    }

    defer(): DeferredPromise {
        return new DeferredPromise(); // There doesn't seem to be a way of creating a defer, as with $q in ng.
    }
}
