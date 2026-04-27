let CbStorage = function(storageName) {
    let storage = JSON.parse(localStorage.getItem(storageName) ?? "{}");

    this.keys = function() {
        return Object.keys(storage);
    }

    this.getItem = function(key) {
        return storage[key];
    }

    this.setItem = function(key, value) {
        storage[key] = value;
        this.save();
    }

    this.removeItem = function(key) {
        delete storage[key];
        this.save();
    }

    this.clear = function() {
        storage = {};
        this.save();
    }

    this.save = function() {
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
    
    this.toString = function() {
        return JSON.stringify(storage);
    }

    this.setStorage = function(obj) {
        storage = Object.assign({}, obj);
        this.save();
    }
}