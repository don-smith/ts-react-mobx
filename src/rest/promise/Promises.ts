import DeferredPromise from './DeferredPromise';

interface Promises {
    resolve<T>(value: T): Promise<T>
    reject<T>(value: T): Promise<T>
    all(value: any): Promise<any>
    defer(): DeferredPromise
}

export default Promises