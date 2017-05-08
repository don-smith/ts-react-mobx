// A synchronous and simplified version of a combined promise/deferred for testing:
// todo Consider using ES6 promise here instead
export default class PseudoPromise<T> implements Promise<T> {
    aPseudoPromise = true;
    error: boolean;

    constructor(public value: any = undefined) {
    }

    then(f) {
        if (this.error) {
            return this;
        }
        const v = f(this.value);
        if (v && v.aPseudoPromise) {
            return v;
        }
        else {
            return new PseudoPromise(v);
        }
    }

    thenExpect(expected) {
        return this.then(v => expect(v).toEqual(expected));
    }

    thenExpectObservableArray(expected) {
        return this.then(v => expect(v.slice()).toEqual(expected));
    }

    catch(f) {
        if (this.error) {
            return f(this.value);
        }
    }

    finally(f) { // Special form, given it's a keyword
        return f(this.value);
    }

    wasInError() {
        return this.error;
    }

    [Symbol.toStringTag]: "Promise";

    static inError(value) {
        const promise = new PseudoPromise(value);
        promise.error = true;
        return promise;
    }
}