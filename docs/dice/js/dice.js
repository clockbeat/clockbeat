
let svgImage;

let container;
let boxRect;
let dieRect;
let dieCount = 1;

let startIt = function () {

	container = document.getElementById('container');
	boxRect = container.getBoundingClientRect();
	dieRect = document.getElementById('diecount');
	document.getElementById("reload").onclick = e => {
		location.reload();
	};

	applyExtraPage("goicon", "Dice thrower", dieRect, "green", () => {
		document.documentElement.requestFullscreen().then(() => {
			boxRect = container.getBoundingClientRect();
		});
		navigator.wakeLock.request('screen');
		if(document.getElementById('count2').checked) {
			dieCount = 2;
		}
		setUpPage();
	});
}

function setUpPage() {
	window.onresize = (e) => {
		boxRect = container.getBoundingClientRect();
	}

	let dieWidth = 120;
	console.clear();

	results = "";

	window.addEventListener("devicemotion", (event) => {
		if (event.acceleration.x > 15 && (prog == 1 || prog < 0.5)) {
			console.log(`${event.acceleration.x} m/s2`);
			throwDice();
		}
	});

	container.onclick = e => {
		if (prog == 1 || prog < 0.5) {
			throwDice();
		}
	}

	let dice = [];

	for (let n = 0; n < dieCount; n++) {

		let dieBody = document.createElement("div");
		dieBody.className = "dieBody";

		let dieSpinner = document.createElement("div");

		dieSpinner.className = "dieSpinner";

		let faces = [
			{transform: "rotateY(0deg)"},
			{transform: "rotateY(90deg)"},
			{transform: "rotateX(-90deg)"},
			{transform: "rotateX(90deg)"},
			{transform: "rotateY(-90deg)"},
			{transform: "rotateY(180deg)"},
		];

		faces.forEach((face, ix) => {
			let dieFace = document.createElement("div");
			dieFace.style.transform = face.transform + " translateZ(80px)";
			dieFace.className = "dieFace " + "face" + (ix + 1);
			dieFace.innerHTML = document.getElementById("dice").outerHTML;
			dieSpinner.appendChild(dieFace);
		});

		let dimObjects = [];

		dieBody.appendChild(dieSpinner);
		container.appendChild(dieBody);

		dieSpinner.style.left = (boxRect.width / 2) + "px";
		dieSpinner.style.top = (boxRect.height / 2) + "px";
		dieSpinner.style.transform = "scale3d(0.5, 0.5, 0.5)";
		dice.push(dieSpinner);
	}

	let dimObjects;

	let targetRotates = [
		{rotate: [0, 0, 0], angle: 0},
		{rotate: [0, -1, 0], angle: 90},
		{rotate: [1, 0, 0], angle: 90},
		{rotate: [-1, 0, 0], angle: 90},
		{rotate: [0, 1, 0], angle: 90},
		{rotate: [0, 1, 0], angle: 180},
	];

	let prog = 1;
	let interval;

	function bumpAction() {
	}

	function applyScores() {
		let resLen = (dimObjects.length * 2) + 1;
		for (let dieDim of dimObjects) {
			results += (dieDim.targetValue + 1).toString() + " ";
			if (results.length > 10 * resLen) {
				results = results.substring(resLen);
			}
		}
		results += ",";
		console.log(results);
		document.getElementById("scores").innerHTML = results.split(",").join("<br>");
	}

	container.focus();

	function redraw() {
		prog += (0.01 * (1 - prog)) + 0.00001;
		for (let n = 0; n < dimObjects.length; n++) {
			let dieDim = dimObjects[n];
			let comb = [0, 0, 0];
			let dieSpinner = dice[n];
			for (let n = 0; n < 3; n++) {
				comb[n] = (dieDim.rotates[n] * (1 - prog)) + (targetRotates[dieDim.targetValue].rotate[n] * prog);
			}
			dieDim.step();
			dieDim.collisions.dimObjects.forEach(collDim => {
				if (dieDim.collisions.wait) {
					dieDim.collisions.wait--;
				} else if (
					Math.abs(dieDim.x.value - collDim.x.value) < 80 &&
					Math.abs(dieDim.y.value - collDim.y.value) < 80 &&
					Math.abs(dieDim.z.value - collDim.z.value) < 80
				) {
					let x = dieDim.x.velocity.value;
					dieDim.x.velocity.value = collDim.x.velocity.value;
					collDim.x.velocity.value = x;
					let y = dieDim.y.velocity.value;
					dieDim.y.velocity.value = collDim.y.velocity.value;
					collDim.y.velocity.value = y;
					let z = dieDim.z.velocity.value;
					dieDim.z.velocity.value = collDim.z.velocity.value;
					collDim.z.velocity.value = z;
					dieDim.collisions.wait = 50;
				}
			});
			let persp = 100 / (dieDim.z.value + 40);
			let angle = (dieDim.angle.value * (1 - prog)) + ((targetRotates[dieDim.targetValue].angle) * prog);
			dieSpinner.style.transform = `rotate3d(${comb.join(",")}, ${angle}deg) scale3d(${persp}, ${persp}, ${persp})`;
			//console.log(box.z.value);
			dieSpinner.style.left = (dieDim.x.value) + "px";
			dieSpinner.style.top = (dieDim.y.value) + "px";
		}
		interval = requestAnimationFrame(function (timestamp) {
			redraw();
		});
		if (prog > 0.93) {
			cancelAnimationFrame(interval);
			prog = 1;
			applyScores();
		}
	}

	function constrain() {
		return function () {
			if (this.parent.value > this.value.max) {
				this.parent.velocity.value *= this.value.damp;
				this.parent.value = this.value.max;
				bumpAction();
			}
			if (this.parent.value < this.value.min) {
				this.parent.velocity.value *= this.value.damp;
				this.parent.value = this.value.min;
				bumpAction();
			}
		};
	}

	function throwDice() {
		let die = {
			x: {
				value: 50,
				velocity: {value: 25},
				constraints: {
					value: {min: boxRect.left, max: boxRect.width - dieWidth, damp: -0.4},
					action: constrain()
				}
			},
			y: {
				value: 50,
				velocity: {value: 25},
				constraints: {
					value: {min: 0, max: boxRect.height - dieWidth, damp: -0.4},
					action: constrain()
				}
			},
			z: {
				value: 50,
				velocity: {
					value: 0,
					velocity: {value: 1}
				},
				constraints: {
					value: {min: 0, max: 200, damp: -0.9},
					action: constrain()
				}
			},
			angle: {
				value: 0,
				velocity: {
					value: 20,
				}
			}
		}
		dimObjects = [];
		cancelAnimationFrame(interval);
		for (let n = 0; n < dice.length; n++) {
			let dieDim = Dimension.buildObject(die);
			dieDim.x.velocity.value = (Math.random() * 100) - 50;
			dieDim.y.velocity.value = (Math.random() * 100) - 50;
			dieDim.z.velocity.value = 5;
			dieDim.angle.value = 20;
			dieDim.y.value += n * 200;

			dieDim.rotates = [Math.random(), Math.random(), Math.random()];
			bumpAction();
			dieDim.targetValue = Math.floor(Math.random() * 6);
			dieDim.collisions = {
				dimObjects: [...dimObjects], //Just earlier ones
				wait: 0
			}
			dimObjects.push(dieDim);
		}
		prog = 0;
		interval = requestAnimationFrame((timestamp) => {
			redraw();
		});
	}
}

window['startIt'] = startIt;