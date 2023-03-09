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
}