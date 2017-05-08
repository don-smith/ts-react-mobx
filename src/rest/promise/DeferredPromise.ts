// A simple implementation of a Defer, which ES6 Promises don't provide. It's similar to $q.defer().
// It saves the two arguments to the function supplied to the new Promise,
// so that they can be called by another party in the future.
export default class DeferredPromise {
    private resolving: (any) => void;
    private rejecting: (any) => void;
    public promise = new Promise((resolving, rejecting) => {
        this.resolving = resolving;
        this.rejecting = rejecting;
    });

    resolve(value: any) {
        this.resolving(value);
    }

    reject(value: any) {
        this.rejecting(value);
    }
}