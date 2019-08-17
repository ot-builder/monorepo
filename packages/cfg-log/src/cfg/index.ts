export interface ConfigMethods<T> {
    with<R>(co: R): Config<T & R>;
}

export type Config<T> = T & ConfigMethods<T>;
export namespace Config {
    export function create<T>(co: T): Config<T> {
        return (new ConfigImpl<T>(co) as any) as Config<T>;
    }

    ///////////////////////////////////////////////////////////////////////////////////////////////
    // DO NOT TOUCH THE CODE BELOW! THEY ARE VERY FRAGILE!
    ///////////////////////////////////////////////////////////////////////////////////////////////

    const STORE = Symbol();

    class ConfigImpl<T> {
        private readonly [STORE]: T;
        constructor(store: T) {
            Object.defineProperty(this, STORE, {
                value: store,
                enumerable: false,
                configurable: false,
                writable: false
            });
            unsafeCopyStorePropsToExport(store, this);
        }
        public with<R>(co: R): Config<T & R> {
            const store1 = { ...this[STORE], ...co };
            return (new ConfigImpl<T & R>(store1) as any) as (Config<T & R>);
        }
    }

    function unsafeCopyStorePropsToExport(store: any, implObj: any) {
        for (const property in store) {
            implObj[property] = store[property];
        }
    }
}
