
function Dimension(config, parent, defaultAction, name) {
	if (parent instanceof Dimension) {
		this.parent = parent;
		this.object = parent.object;
	} else {
		this.object = parent;
	}
	this.name = name;
	this.value = config.value ?? 0;
	this.lastValue;
	if (config.velocity) {
		this.velocity = new Dimension(config.velocity, this, Dimension.defaultActions.velocity, this.name + ".velocity");
	}
	if (config.constraints) {
		this.constraints = new Dimension(config.constraints, this, Dimension.defaultActions.constraints, this.name + ".constraints");
	}
	this.action = config.action ?? defaultAction;
}

Dimension.actionTypes = {
	movement: {defaultAction: "add"},
	constraint: {defaultAction: "limit"}
}

Dimension.step = function () {
	this.lastValue = this.value;
	if (this.velocity) {
		Dimension.step.call(this.velocity);
	}
	if (this.action) {
		this.action();
	}
	if (this.constraints) {
		Dimension.step.call(this.constraints);
	}
}

Dimension.findAction = function (actionName, defaultOption) {
	if (actionName instanceof Function) {
		return actionName.bind(this);
	} else if (Dimension.defaultActions[actionName]) {
		return Dimension.defaultActions[actionName].bind(this);
	} else {
		return Dimension.defaultActions[defaultOption].bind(this);
	}
}

Dimension.defaultActions = {

	velocity: function () {if (this.parent) this.parent.value += this.value},

	constraints: function () {
		let parent = this.parent;
		if (parent.value < this.value.min) {
			parent.value = this.value.min;
		}
		if (parent.value > this.value.max) {
			parent.value = this.value.max;
		}
	}
};

Dimension.buildObject = function (config) {
	let dimObject = {};
	dimObject = {};
	for (let dprop in config) {
		dimObject[dprop] = new Dimension(config[dprop], dimObject, null, dprop);
	}
	dimObject.step = function () {
		for (let obkey of Object.keys(this)) {
			if (this[obkey] instanceof Dimension) {
				for (let key of Object.keys(this[obkey])) {
					Dimension.step.call(this[obkey][key]);
				}
			}
		}
	}
	return dimObject;
}


