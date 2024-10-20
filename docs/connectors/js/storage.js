
let CbStorage = function (storageName, options = {}) {
    //options
    //  dbStores: ["name", "name"]
    //  arraySets: ["key", key]

    let dbStores = options.dbStores;

    let jsonReviver = null;
    if (options.arraySets) {
        jsonReviver = ArraySet.jsonReviver(options.arraySets)
    }

    let storage = JSON.parse(localStorage.getItem(storageName) ?? "{}", jsonReviver);

    this.keys = function () {
        return Object.keys(storage);
    }

    this.getItem = function (key) {
        return storage[key];
    }

    this.setItem = function (key, value) {
        storage[key] = value;
        this.save();
    }

    this.removeItem = function (key) {
        delete storage[key];
        this.save();
    }

    this.clear = function () {
        storage = {};
        this.save();
    }

    this.save = function () {
        localStorage.setItem(storageName, JSON.stringify(storage));
    }

    this.require = function (key, defaultValue) {
        if (!storage[key]) {
            storage[key] = defaultValue;
            this.save();
        } else if (typeof defaultValue == "object") {
            Object.keys(defaultValue).forEach(intKey => {
                if (storage[key][intKey] === undefined) {
                    storage[key][intKey] = defaultValue[intKey];
                }
            });
            this.save();
        }
        return storage[key];
    }

    this.toString = function () {
        return JSON.stringify(storage);
    }

    this.setStorage = function (obj) {
        storage = Object.assign({}, obj);
        this.save();
    }

    this.getStorage = function () {
        return storage;
    }

    let DbStore = function (name, db) {
        this.name = name;
        let promises = [];

        const transaction = db.transaction([name], 'readwrite');
        const store = transaction.objectStore(name);

        let DbStorePromise = function(req) {
            let prom = new Promise((resolve, reject) => {
                req.onsuccess = e => {
                    resolve(req.result);
                }
                req.onerror = e => {
                    reject(e);
                }
            });
            promises.push(prom);
            return prom;
        }

        this.promiseAll = function() {
            return PromiseAll(promises);
        }

        this.keys = function () {
            return DbStorePromise(store.getAllKeys());
        }

        this.getItem = function (key) {
            return DbStorePromise(store.get(key));
        }

        this.setItem = function (key, value) {
            return DbStorePromise(store.put(value, key));
        }

        this.removeItem = function (key) {
            return DbStorePromise(store.delete(key));
        }

        this.clear = function () {
            return DbStorePromise(store.clear());
        }
    }

    this.getStore = function(name) {
        return new DbStore(name, this.db);
    }

    this.dbReady = () => {}

    if (dbStores) {
        let dbRequest = window.indexedDB.open(storageName);
        dbRequest.onsuccess = e => {
            this.db = dbRequest.result;
            let version = this.db.version;
            let stores = this.db.objectStoreNames;
            let missingStores = [];
            dbStores.forEach(store => {
                if (!stores.contains(store)) {
                    missingStores.push(store)
                }
            });
            if (missingStores.length) {
                version++;
                this.db.close();
                dbRequest = window.indexedDB.open(storageName, version);
                dbRequest.onupgradeneeded = e => {
                    let db = dbRequest.result;
                    missingStores.forEach(st => {
                        try {
                            db.createObjectStore(st)
                        } catch { }
                    })
                }
                dbRequest.success = e => {
                    this.dbReady();
                }
            } else {
                this.dbReady(); 
            }
        }
    }
}

class ArraySet extends Set {
    constructor(array) {
        super(array);
    }

    static jsonReviver(arraySets) {
        return function (key, value, context) {
            if (arraySets.indexOf(key) !== -1) {
                return new ArraySet(value);
            }
            return value;
        };
    }

    toJSON() {
        return [...this.values()];
    } 
}

