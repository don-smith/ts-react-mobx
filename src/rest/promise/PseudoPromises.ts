import PseudoPromise from './PseudoPromise';
import Promises from './Promises';
import DeferredPromise from './DeferredPromise';

export default class PseudoPromises implements Promises {
    resolve<T>(value: T): Promise<T> {
        return new PseudoPromise<T>(value);
    }

    reject<T>(value: T): Promise<T> {
        return PseudoPromise.inError(value);
    }

    all(value: any): Promise<any> {
        return new PseudoPromise(value);
    }

    defer(): DeferredPromise {
        return new DeferredPromise();
    }
}