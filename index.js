const PLAY_SNAKE = (config = { 'arenaHeight': 500, 'arenaWidth': 500, 'snakeSpeed': 5 }) => {


	if (!window) {
		return;
	}
	const ERROR_MESSAGES = {
		'default': 'Sorry.',
		'startGame': 'Sorry. Unable To Start The Game'
	};
	const WINDOW = window;
	const DOCUMENT = WINDOW.document;
	const DOCUMENT_BODY = DOCUMENT.body;
	const [SVG_XML_NS, RENDER_UNIT] = ['http://www.w3.org/2000/svg', 'px'];
	const pixelify = (function (number) {
		return String(number).trim().concat(this);
	}).bind(RENDER_UNIT);
	const CONFIG_ARENA = {
		'id': 'play-snake-arena',
		'width': config.arenaWidth,
		'height': config.arenaHeight,
		'borderColor': 'black',
		'borderWidth': 1,
		'limits': {
			'x': config.arenaWidth - 1,
			'y': config.arenaHeight - 1
		},
		'supportedKeys': [37, 38, 39, 40],
		'keyConfig': {
			'37': {
				'reverse': 39
			},
			'38': {
				'reverse': 40
			},
			'39': {
				'reverse': 37
			},
			'40': {
				'reverse': 38
			}
		}

	};
	const SNAKE_ARENA = (function () {
		try {
			let canvas = document.createElementNS(SVG_XML_NS, 'svg');
			canvas.setAttribute('id', CONFIG_ARENA.id);
			canvas.setAttribute('height', CONFIG_ARENA.height);
			canvas.setAttribute('width', CONFIG_ARENA.width);
			canvas.style.border = pixelify(CONFIG_ARENA.borderWidth) + ' solid ' + CONFIG_ARENA.borderColor;
			DOCUMENT_BODY.appendChild(canvas);
			return canvas;
		} catch (e) {
			return false;
		}
	})();

	if (!SNAKE_ARENA) {
		return showAlert('Sorry. Unable to start the game.');
	}


	class Subject {
		constructor(topic, observers = []) {
			this.observers = observers;
			this.topic = topic;
		}
		addObserver(obsrv) {
			if (obsrv.element && typeof obsrv.element.id !== 'undefined') {
				this.observers.push(obsrv);
			}
			console.log(this.observers);
		}
		removeObserver(obsrv) {
			this.observers.splice(this.observers.findIndex(obj => obj.element.id === obsrv.element.id), 1);
		}
		notify() {
			this.observers.forEach(obsrv => {
				obsrv[this.topic]();
			});
		}
	}
	class XYUpdater extends Subject {
		constructor() {
			super('nextXY');
		}
	}
	const SNAKE_PART_POSITION_UPDATER = new XYUpdater();

	const LOGGER = {
		log: console.log
	};
	let INTERVAL_ID;
	let SNAKE_FOOD_BONUS_INTERVAL_ID;
	function isXOverArenaLimits(value) {
		return value <= CONFIG_ARENA.limits.x ? false : true;
	}
	function isYOverArenaLimits(value) {
		return value <= CONFIG_ARENA.limits.y ? false : true;
	}
	function isUnderArenaLimits(value) {
		return value < CONFIG_ARENA.borderWidth ? true : false;
	}
	function showAlert(message = ERROR_MESSAGES.default) {
		return WINDOW.alert(String(message).trim());
	}

	/**
	 * configurations
	 */
	const CONFIG = (function (arg) {
		return {
			'SNAKE': {
				'id': arg.snakeId,
				'elemType': 'rect',
				'width': arg.snakeSize,
				'color': arg.primaryColor,
				'partGap': 0,
				'length': arg.snakeLength,
				'speed': 1000 - (config.snakeSpeed * 100),
				'directionMap': {
					'37': 'LEFT',
					'38': 'UP',
					'39': 'RIGHT',
					'40': 'DOWN'
				}
			},
			'SNAKE_PART': {
				'idPrefix': arg.snakeId + '-part'
			},
			'SNAKE_FOOD': {
				'id': arg.snakeFoodId,
				'elemType': 'circle',
				'color': arg.secondaryColor,
				'size': Math.floor(arg.snakeSize / 3),
				'startAfter': 2
			},
			'SNAKE_FOOD_BONUS': {
				'color': arg.alertColor,
				'size': pixelify(arg.snakeSize * 2)
			},
			'ARENA': {
				'center': {
					'x': Math.floor(Math.floor(SNAKE_ARENA.getAttribute('width')) / 2),
					'y': Math.floor(Math.floor(SNAKE_ARENA.getAttribute('height')) / 2)
				}
			}
		};
	})({
		'snakeId': 'the-snake',
		'snakeFoodId': 'the-snake-food',
		'primaryColor': 'black',
		'secondaryColor': 'grey',
		'alertColor': 'red',
		'snakeLength': 1,
		'snakeSize': 15
	});
	let SNAKE_DIRECTION = 39;
	function startGame() {
		function onError() {
			stopTheSnake();
			stopTheSnakeFood();
			showAlert(ERROR_MESSAGES.startGame);
		}
		SNAKE.get().then(
			snake => {
				SNAKE = snake;
				return SNAKE_FOOD.get();
			}, error => Promise.reject(error)
		).then(
			snakeFood => {
				SNAKE_FOOD = snakeFood;
				return prepareGameEnd();
			}, error => Promise.reject(error)
		).then(
			gameEndProcessed => {
				startTheSnake();
			},
			error => {
				onError();
			}
		);
	}
	function prepareGameEnd() {
		return new Promise(function (resolve, reject) {
			try {
				WINDOW.addEventListener('unload', () => {
					stopTheSnake();
					stopTheSnakeFood();
				});
				addButtonListeners();
				resolve(true);
			} catch (e) {
				reject(e);
			}
		});
	}
	function startTheSnake() {
		INTERVAL_ID = setInterval(() => {
			moveTheSnake();
		}, CONFIG.SNAKE.speed);
	}
	function moveTheSnake() {
		setTimeout(() => {
			SNAKE.start();
		}, 0);
	}
	function stopTheSnake() {
		SNAKE = null;
		WINDOW.clearInterval(INTERVAL_ID);
	}
	function stopTheSnakeFood() {
		SNAKE_FOOD = null;
	}
	function addButtonListeners() {
		DOCUMENT.addEventListener('keydown', function (event) {
			if (CONFIG_ARENA.supportedKeys.includes(event.keyCode)
				&& SNAKE_DIRECTION !== event.keyCode
				&& event.keyCode !== CONFIG_ARENA.keyConfig[String(SNAKE_DIRECTION)].reverse) {
				SNAKE_DIRECTION = event.keyCode;
				SNAKE.changeDirection(SNAKE_DIRECTION);
				//SNAKE[CONFIG.SNAKE.directionMap[String(SNAKE_DIRECTION)]]();
			}
		});
		return;
	}
	/**
	 * Snake
	 */
	class Snake {
		constructor(arena, startX, startY, color = CONFIG.SNAKE.color) {
			this.direction = SNAKE_DIRECTION;
			this.head = new SnakePart(arena, startX, startY, SNAKE_DIRECTION, color);
			this.tail = this.head;
			this.arena = arena;
			this.UP = function () {
				this.move(0, CONFIG.SNAKE.width * -1);
			};
			this.DOWN = function () {
				this.move(0, CONFIG.SNAKE.width);
			};
			this.RIGHT = function () {
				this.move(CONFIG.SNAKE.width, 0);
			};
			this.LEFT = function () {
				this.move(CONFIG.SNAKE.width * - 1, 0);
			};
		}
		get length() {
			let _part = this.head;
			let count = (_part !== null) ? 1 : 0;
			while (_part.next !== null) {
				_part = _part.next;
				count += 1;
			}
			return count;
		}
		changeDirection(directionCode) {
			this.direction = directionCode;
			this.head.direction = directionCode;
		}
		grow() {
			let { x, y } = this.tail.getXYOfNextPart();
			let newPart = new SnakePart(SNAKE.arena, x, y, this.tail.direction, this.tail.color);
			this.tail.next = newPart;
			newPart.prev = this.tail;
			this.tail = newPart;
			SNAKE_PART_POSITION_UPDATER.addObserver(this.tail);
			return this.tail;
		}
		changeColor(colour) {
			let _part = this.head;
			while (_part.next !== null) {
				change(_part, colour);
				_part = _part.next;
			}

			function change(_part, clr) {
				setTimeout(() => {
					_part.color = clr;
				}, 0);
			}
		}
		start() {
			this[CONFIG.SNAKE.directionMap[String(SNAKE_DIRECTION)]]();
		}
		isEatingFood() {
			let head = this.head;
			if (head.x < SNAKE_FOOD.x && SNAKE_FOOD.x < head.x2 && head.y < SNAKE_FOOD.y && SNAKE_FOOD.y < head.y2) {
				return true;
			}
			return false;
		}
		move(xvalue, yvalue) {
			let _part = this.head;
			let [_part_x_pos, _part_y_pos] = [_part.x, _part.y];
			let [nextX, nextY] = [_part_x_pos + xvalue, _part_y_pos + yvalue];

			if (isXOverArenaLimits(nextX)) {
				nextX = CONFIG_ARENA.borderWidth;
			}
			if (isYOverArenaLimits(nextY)) {
				nextY = CONFIG_ARENA.borderWidth;
			}
			if (isUnderArenaLimits(nextX)) {
				nextX = CONFIG_ARENA.limits.x;
			}
			if (isUnderArenaLimits(nextY)) {
				nextY = CONFIG_ARENA.limits.y;
			}
			_part.x = nextX;
			_part.y = nextY;

			if (this.isEatingFood()) {
				this.grow();
				SNAKE_FOOD.drop();
			}
			SNAKE_PART_POSITION_UPDATER.notify();
		}
	}
	class SnakePart {
		constructor(arena, x, y, dirx, color) {
			let snakeLen = SNAKE.length;
			this.id = (typeof snakeLen !== 'undefined' ? CONFIG.SNAKE.id + '-part' + (SNAKE.length + 1) : CONFIG.SNAKE.id);
			this.direction = SNAKE_DIRECTION;
			this.element = (() => {
				let _elem = DOCUMENT.createElementNS(SVG_XML_NS, CONFIG.SNAKE.elemType);
				_elem.setAttribute('id', this.id);
				_elem.setAttribute('x', x);
				_elem.setAttribute('y', y);
				_elem.setAttribute('fill', color);
				_elem.setAttribute('width', pixelify(CONFIG.SNAKE.width));
				_elem.setAttribute('height', pixelify(CONFIG.SNAKE.width));
				arena.appendChild(_elem);
				return _elem;
			})();
			this.color = color;
			this.next = null;
			this.prev = null;
			this.nextPosition = {};
		}
		isSnakeHead() {
			return this.id === CONFIG.SNAKE.id;
		}
		get x() {
			return parseInt(this.element.getAttribute('x'));
		}
		set x(value) {
			this.element.setAttribute('x', Math.floor(value));
		}
		get y() {
			return parseInt(this.element.getAttribute('y'));
		}
		set y(value) {
			this.element.setAttribute('y', Math.floor(value));
		}
		get x2() {
			return this.x + (CONFIG.SNAKE.width - 1);
		}
		get y2() {
			return this.y + (CONFIG.SNAKE.width - 1);
		}
		nextXY() {
			let nextPosition = {};
			if (this.direction === this.prev.direction) {
				nextPosition = this.prev.getXYOfNextPart();
			} else {
				nextPosition = {
					x: this.x, y: this.y
				}
				switch (this.prev.direction) {
					case 37:
						nextPosition.y = this.prev.y;
						break;
					case 38:
						nextPosition.x = this.prev.x;
						break;
					case 39:
						nextPosition.y = this.prev.y;
						break;
					case 40:
						nextPosition.x = this.prev.x;
						break;
				}
			}
			this.x = nextPosition.x;
			this.y = nextPosition.y;
			this.direction = this.prev.direction;
		}
		getXYOfNextPart() {
			let [_x, _y] = [this.x, this.y];
			switch (this.direction) {
				case 37:
					_x = this.x2;
					break;
				case 38:
					_y = this.y2;
					break;
				case 39:
					_x = this.x - (this.x2 - this.x);
					break;
				case 40:
					_y = this.y - (this.y2 - this.y);
					break;
			}
			return { x: _x, y: _y };
		}
	}
	class SnakeFood {
		constructor(arena, x, y, color = CONFIG.SNAKE_FOOD.color, size = CONFIG.SNAKE_FOOD.size) {
			if (!(SNAKE_FOOD instanceof SnakeFood)) {
				this.element = (() => {
					let _e = DOCUMENT.createElementNS(SVG_XML_NS, CONFIG.SNAKE_FOOD.elemType);
					_e.setAttribute('cx', x);
					_e.setAttribute('cy', y);
					_e.setAttribute('r', size);
					_e.setAttribute('fill', color);
					arena.appendChild(_e);
					return _e;
				})();
				this.arena = arena;
				[this.x2, this.y2] = [x + (CONFIG.SNAKE_FOOD.size - 1), y + (CONFIG.SNAKE_FOOD.size - 1)];
			}
		}
		get x() {
			return parseInt(this.element.getAttribute('cx'));
		}
		set x(value) {
			this.element.setAttribute('cx', Math.floor(value));
		}
		get y() {
			return parseInt(this.element.getAttribute('cy'));
		}
		set y(value) {
			this.element.setAttribute('cy', Math.floor(value));
		}
		static getNextFoodPosition() {
			let [multipleOf, _x, _y] = [CONFIG.SNAKE.width, getRandomX(), getRandomY()];
			while (_x % multipleOf !== 0 || _y % multipleOf !== 0) {
				[_x, _y] = [getRandomX(), getRandomY()];
			}
			function getRandomX() {
				return Math.floor(Math.random() * (CONFIG_ARENA.limits.x - CONFIG.SNAKE_FOOD.size)) + CONFIG_ARENA.borderWidth + 1;
			}
			function getRandomY() {
				return Math.floor(Math.random() * (CONFIG_ARENA.limits.y - CONFIG.SNAKE_FOOD.size)) + CONFIG_ARENA.borderWidth + 1;
			}
			return {
				x: _x, y: _y
			};
		}
		drop() {
			if (!(SNAKE_FOOD instanceof SnakeFood)) {
				return;
			}
			let newPosition = SnakeFood.getNextFoodPosition();
			SNAKE_FOOD.x = newPosition.x;
			SNAKE_FOOD.y = newPosition.y;
		}
	}
	class SnakeFoodBonus {
		constructor(x, y, color = CONFIG.SNAKE_FOOD_BONUS.color, size = CONFIG.SNAKE_FOOD_BONUS.size) {
			this.x = x;
			this.y = y;
			this.fill = color;
			this.radius = size;
		}
	}
	let SNAKE = (function () {
		let theSnake;
		function initSnake() {
			let _snake = new Snake(
				SNAKE_ARENA,
				CONFIG.ARENA.center.x,
				CONFIG.ARENA.center.y,
				CONFIG.SNAKE.color
			);
			return _snake;
		}
		return {
			get: () => new Promise(function (resolve, reject) {
				try {
					if (theSnake instanceof Snake) {
						return resolve(theSnake);
					}
					theSnake = initSnake();
					LOGGER.log('snake created');
					resolve(theSnake);
				} catch (e) {
					reject(e);
				}
			})
		}
	})();
	let SNAKE_FOOD = (function () {
		let theFood;
		function initSnakeFood() {
			let foodPosition = SnakeFood.getNextFoodPosition();
			let _food = new SnakeFood(
				SNAKE.arena,
				foodPosition.x,
				foodPosition.y,
				CONFIG.SNAKE_FOOD.color,
				CONFIG.SNAKE_FOOD.size
			);
			return _food;
		}
		return {
			get: () => new Promise(function (resolve, reject) {
				try {
					if (theFood instanceof SnakeFood) {
						return resolve(theFood);
					}
					theFood = initSnakeFood();
					LOGGER.log('snake food created');
					setTimeout(resolve, CONFIG.SNAKE_FOOD.startAfter * 1000, theFood);
				} catch (e) {
					reject(e);
				}
			})
		};
	})();
	startGame();
};

PLAY_SNAKE();