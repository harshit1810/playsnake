const PLAY_SNAKE = (config = { 'arenaHeight': 500, 'arenaWidth': 500 }) => {


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
	DOCUMENT_BODY.style.fontFamily = 'Candara';
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
		},
		'pauseButton': {
			'id': 'pause-play-snake',
			'text': 'Pause',
			'order': '0',
			'clickHandler': function (event) {
				pauseGame();
				PAUSE_BUTTON.setAttribute('disabled', 'true');
				if (PLAY_BUTTON.hasAttribute('disabled')) {
					PLAY_BUTTON.removeAttribute('disabled');
				}
			}
		},
		'resumeButton': {
			'id': 'resume-play-snake',
			'text': 'Resume',
			'order': '1',
			'clickHandler': function (event) {
				resumeGame();
				PLAY_BUTTON.setAttribute('disabled', 'true');
				if (PAUSE_BUTTON.hasAttribute('disabled')) {
					PAUSE_BUTTON.removeAttribute('disabled');
				}
			}
		}
	};
	const SNAKE_ARENA = (function () {
		try {
			let gameControlDiv = DOCUMENT.createElement('div');
			gameControlDiv.setAttribute('style', 'display:flex ; flex-direction:row ; flex-wrap:nowrap; width:' + pixelify(CONFIG_ARENA.width) + '; padding:1% 0%;');
			DOCUMENT_BODY.appendChild(gameControlDiv);

			let styleString = 'padding:2% 2%; border-radius:5px; flex:0 1 20%; text-align:center; align-self:flex-end;';
			let pauseBtn = DOCUMENT.createElement('button');
			pauseBtn.setAttribute('id', CONFIG_ARENA.pauseButton.id);
			pauseBtn.setAttribute('style', styleString);
			pauseBtn.style.order = CONFIG_ARENA.pauseButton.order;
			pauseBtn.innerHTML = CONFIG_ARENA.pauseButton.text;
			gameControlDiv.appendChild(pauseBtn);
			pauseBtn.addEventListener('click', CONFIG_ARENA.pauseButton.clickHandler);

			let playBtn = DOCUMENT.createElement('button');
			playBtn.setAttribute('style', styleString + ' margin-left:2%;');
			playBtn.setAttribute('id', CONFIG_ARENA.resumeButton.id);
			playBtn.style.order = CONFIG_ARENA.resumeButton.order;
			playBtn.innerHTML = CONFIG_ARENA.resumeButton.text;
			gameControlDiv.appendChild(playBtn);
			playBtn.addEventListener('click', CONFIG_ARENA.resumeButton.clickHandler);

			let canvas = DOCUMENT.createElementNS(SVG_XML_NS, 'svg');
			canvas.setAttribute('id', CONFIG_ARENA.id);
			canvas.setAttribute('height', CONFIG_ARENA.height);
			canvas.setAttribute('width', CONFIG_ARENA.width);
			canvas.style.border = pixelify(CONFIG_ARENA.borderWidth) + ' solid ' + CONFIG_ARENA.borderColor;
			DOCUMENT_BODY.appendChild(canvas);

			let scoreDiv = DOCUMENT.createElement('div');
			scoreDiv.innerHTML = 'Your Score: <span id="score" style="font-weight: bold;">0</span>';
			DOCUMENT_BODY.appendChild(scoreDiv);
			return canvas;
		} catch (e) {
			return false;
		}
	})();

	if (!SNAKE_ARENA) {
		return showAlert('Sorry. Unable to start the game.');
	}

	let SCORE_BOARD = DOCUMENT_BODY.querySelector('#score');
	let PAUSE_BUTTON = DOCUMENT_BODY.querySelector('#' + CONFIG_ARENA.pauseButton.id);
	let PLAY_BUTTON = DOCUMENT_BODY.querySelector('#' + CONFIG_ARENA.resumeButton.id);
	class Subject {
		constructor(topic, observers = []) {
			this.observers = observers;
			this.topic = topic;
		}
		addObserver(obsrv) {
			if (obsrv.element && typeof obsrv.element.id !== 'undefined') {
				this.observers.push(obsrv);
			}
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
	class SnakeNotifier extends Subject {
		constructor() {
			super('nextXY');
		}
		notify(foodEaten) {
			super.notify();
			if (foodEaten && foodEaten == true) {
				SNAKE.grow(SNAKE_FOOD.drop);
			}
			return;
		}
	}

	const SNAKE_PART_POSITION_UPDATER = new SnakeNotifier();

	const LOGGER = {
		'log': console.log,
		'error': console.error
	};
	let INTERVAL_SNAKE_MOVEMENT;
	let SNAKE_FOOD_BONUS_INTERVAL_ID;
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
				'length': arg.snakeLength,
				'speed': arg.snakeSpeed,
				'directionMap': {
					'37': 'LEFT',
					'38': 'UP',
					'39': 'RIGHT',
					'40': 'DOWN'
				},
				'step': 1
			},
			'SNAKE_PART': {
				'idPrefix': arg.snakeId + '-part'
			},
			'SNAKE_FOOD': {
				'id': arg.snakeFoodId,
				'elemType': 'circle',
				'color': arg.secondaryColor,
				'size': Math.floor(arg.snakeSize / 3),
				'startAfter': 2,
				'limits': {
					'x': CONFIG_ARENA.limits.x - arg.snakeSize,
					'y': CONFIG_ARENA.limits.y - arg.snakeSize
				}
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
		'snakeSpeed': 20,
		'primaryColor': 'black',
		'secondaryColor': 'grey',
		'alertColor': 'red',
		'snakeLength': 1,
		'snakeSize': 15
	});
	let SNAKE_DIRECTION = 39;
	/**
	 * store the directions given to the snake
	 */
	const DIRECTION_COMMANDS = (function (initCommand) {
		let commands = [];
		if (initCommand) {
			commands.push(initCommand);
		}
		return {
			'add': function (data) {
				let last = commands[commands.length - 1];
				if (!last) {
					commands.push(data);
					return;
				}
				if (last.position.x == data.position.x && last.position.y == data.position.y) {
					last.direction = data.direction;
				} else {
					commands.push(data);
				}
			},
			'getFirst': function () {
				return commands[0];
			},
			'remove': function () {
				commands.shift();
				return;
			},
			'clear': function () {
				commands.splice(0, commands.length);
				return;
			},
			'hasCommands': function () {
				return commands.length > 0 ? true : false;
			},
			'getNextTurn': function (snakePartId) {
				if (typeof DIRECTION_MAP_SNAKE_PART_LAST_TURN[snakePartId] === 'undefined') {
					return this.getFirst();
				}
				let turnMadeIndex = commands.findIndex(com => com.id === DIRECTION_MAP_SNAKE_PART_LAST_TURN[snakePartId]);
				return (turnMadeIndex == commands.length - 1) ? undefined : commands[turnMadeIndex + 1];
			}
		};
	})({
		'id': Date.now(),
		'direction': SNAKE_DIRECTION,
		'position': {
			'x': CONFIG.ARENA.center.x,
			'y': CONFIG.ARENA.center.y
		}
	});
	const DIRECTION_MAP_SNAKE_PART_LAST_TURN = {};
	function startGame() {
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
				startTheSnake(CONFIG.SNAKE.speed);
			},
			error => {
				processStopGame();
				showAlert(ERROR_MESSAGES.startGame);
			}
		);
	}
	function showAlert(message) {
		WINDOW.alert(message);
	}
	function prepareGameEnd() {
		return new Promise(function (resolve, reject) {
			try {
				WINDOW.addEventListener('unload', () => {
					processStopGame();
				});
				addButtonListeners();
				resolve(true);
			} catch (e) {
				reject(e);
			}
		});
	}
	/** pause the game. 
	 * when pause button is clicked.
	*/
	function pauseGame() {
		stopMovingTheSnake()
		LOGGER.log('game paused');
	}
	/** resume the game. 
	 * when play button is clicked.
	*/
	function resumeGame() {
		startTheSnake(CONFIG.SNAKE.speed);
		LOGGER.log('game resumed');
	}
	function processStopGame() {
		stopTheSnake();
		stopTheSnakeFood();
	}
	/**
	 * start moving the snake after specified interval.
	 * @param {number} interval.
	 */
	function startTheSnake(interval) {
		INTERVAL_SNAKE_MOVEMENT = setInterval(() => {
			// let command = DIRECTION_COMMANDS.getFirst();
			let newDirection = SNAKE_DIRECTION;
			// if (command) {
			// 	newDirection = command.direction;
			// 	SNAKE_DIRECTION = command.direction;
			// }
			SNAKE.changeDirection(newDirection);
			SNAKE.start();
		}, interval);
	}
	function increaseSnakeSpeed() {
		WINDOW.clearInterval(INTERVAL_SNAKE_MOVEMENT);
		startTheSnake(CONFIG.SNAKE.speed - SNAKE.length * 50);
	}
	function stopTheSnake() {
		SNAKE = null;
		stopMovingTheSnake();
	}
	function stopMovingTheSnake() {
		WINDOW.clearInterval(INTERVAL_SNAKE_MOVEMENT);
	}
	function stopTheSnakeFood() {
		SNAKE_FOOD = null;
	}
	function stopTheGame() {
		WINDOW.alert('GAME OVER\nYou Scored ' + SCORE_BOARD.innerHTML + ' points.');
		processStopGame();
	}
	function addButtonListeners() {
		DOCUMENT.addEventListener('keydown', function (event) {
			/** listen only for direction keys */
			if (CONFIG_ARENA.supportedKeys.indexOf(event.keyCode) === -1) {
				return;
			}
			/**
			 * the new direction should not be the current direction 
			 * or the opposite direction.
			 */
			if (SNAKE_DIRECTION != event.keyCode &&
				event.keyCode != CONFIG_ARENA.keyConfig[String(SNAKE_DIRECTION)].reverse) {
				SNAKE_DIRECTION = event.keyCode;
				DIRECTION_COMMANDS.add({
					'id': Date.now(),
					'direction': event.keyCode,
					'position': {
						'x': SNAKE.head.x,
						'y': SNAKE.head.y
					}
				});
			}
		});
		return;
	}
	function incrementScore() {
		SCORE_BOARD.innerHTML = +SCORE_BOARD.innerHTML + 10
	}
	/**
	 * Snake
	 */
	class Snake {
		constructor(arena, startX, startY, direction, color = CONFIG.SNAKE.color) {
			this.head = new SnakePart(arena, startX, startY, direction, color);
			this.tail = this.head;
			this.arena = arena;
			this.UP = function () {
				this.move(0, CONFIG.SNAKE.step * -1);
			};
			this.DOWN = function () {
				this.move(0, CONFIG.SNAKE.step);
			};
			this.RIGHT = function () {
				this.move(CONFIG.SNAKE.step, 0);
			};
			this.LEFT = function () {
				this.move(CONFIG.SNAKE.step * - 1, 0);
			};
			this.turningPoints = [];
			this.length = 1;
		}
		changeDirection(newDirection) {
			this.head.direction = newDirection;
		}
		grow(next) {
			let { x, y } = this.tail.getXYOfNextPart();
			let newPart = new SnakePart(SNAKE.arena, x, y, this.tail.direction, this.tail.color);
			this.tail.next = newPart;
			newPart.prev = this.tail;
			this.tail = newPart;
			this.length += 1;
			SNAKE_PART_POSITION_UPDATER.addObserver(this.tail);
			incrementScore();
			if (typeof next === 'function') {
				next();
			}
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
			this[CONFIG.SNAKE.directionMap[String(this.head.direction)]]();
		}
		isEatingFood() {
			let head = this.head;
			if (head.x < SNAKE_FOOD.x && SNAKE_FOOD.x < head.x2 && head.y < SNAKE_FOOD.y && SNAKE_FOOD.y < head.y2) {
				SNAKE_FOOD.hide();
				return true;
			}
			return false;
		}
		move(xvalue, yvalue) {
			let _part = this.head;
			let [_part_x_pos, _part_y_pos] = [_part.x, _part.y];
			let { x: nextX, y: nextY } = SnakePart.checkBoundaryPosition(_part.direction, {
				'x': _part_x_pos + xvalue, 'y': _part_y_pos + yvalue
			});
			let isGoingToEat = this.isEatingItself(nextX, nextY);
			if (isGoingToEat) {
				stopTheGame();
				return;
			}
			_part.x = nextX;
			_part.y = nextY;
			let isEatingFood = this.isEatingFood();
			this.moveAllParts(isEatingFood);
		}
		moveAllParts(foodEaten) {
			if (this.length === 1) {
				DIRECTION_COMMANDS.clear();
			}
			SNAKE_PART_POSITION_UPDATER.notify(foodEaten);
		}
		isEatingItself(nextX, nextY) {
			let partInFront;
			let matcherFunction = function (part) {
				if (part.x === nextX && part.y === nextY) {
					partInFront = part;
					return true;
				}
				return false;
			}
			let head = SNAKE.head.next;
			while (head !== null) {
				let isGoingToEat = matcherFunction(head);
				if (isGoingToEat) {
					break;
				}
				head = head.next;
			}
			if (typeof partInFront === 'undefined') {
				return false;
			} else {
				return true;
			}
		}
	}
	class SnakePart {
		constructor(arena, x, y, dirx, color) {
			let snakeLen = SNAKE.length;
			this.id = (typeof snakeLen !== 'undefined' ? CONFIG.SNAKE.id + '-part' + (SNAKE.length + 1) : CONFIG.SNAKE.id);
			this.direction = dirx;
			this.element = (() => {
				let _elem = DOCUMENT.createElementNS(SVG_XML_NS, CONFIG.SNAKE.elemType);
				_elem.setAttribute('id', this.id);
				_elem.setAttribute('tabIndex', snakeLen);
				_elem.setAttribute('x', x);
				_elem.setAttribute('y', y);
				_elem.setAttribute('rx', CONFIG.SNAKE.width);
				_elem.setAttribute('ry', CONFIG.SNAKE.width);
				_elem.setAttribute('fill', color);
				_elem.setAttribute('width', pixelify(CONFIG.SNAKE.width));
				_elem.setAttribute('height', pixelify(CONFIG.SNAKE.width));
				//_elem.style.transition = CONFIG.SNAKE.transition;
				arena.appendChild(_elem);
				return _elem;
			})();
			this.color = color;
			this.next = null;
			this.prev = null;
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
		isTail() {
			return this.id === SNAKE.tail.id;
		}
		nextXY() {
			let nextPosition = {
				'x': this.x, 'y': this.y
			}
			switch (this.direction) {
				case 37:
					nextPosition.x -= CONFIG.SNAKE.step;
					break;
				case 38:
					nextPosition.y -= CONFIG.SNAKE.step;
					break;
				case 39:
					nextPosition.x += CONFIG.SNAKE.step;
					break;
				case 40:
					nextPosition.y += CONFIG.SNAKE.step;
					break;
			}
			nextPosition = SnakePart.checkBoundaryPosition(this.direction, nextPosition);
			this.x = nextPosition.x;
			this.y = nextPosition.y;
			if (DIRECTION_COMMANDS.hasCommands()) {
				let _command = DIRECTION_COMMANDS.getNextTurn(this.id);
				if (_command && _command.position.x == this.x && _command.position.y == this.y) {
					this.direction = _command.direction;
					DIRECTION_MAP_SNAKE_PART_LAST_TURN[this.id] = _command.id;
					if (this.isTail()) {
						DIRECTION_COMMANDS.remove();
					}
				}
			}
		}
		getXYOfNextPart() {
			let [_x, _y] = [this.x, this.y];
			switch (this.direction) {
				case 37:
					_x += CONFIG.SNAKE.width;
					break;
				case 38:
					_y += CONFIG.SNAKE.width;
					break;
				case 39:
					_x -= CONFIG.SNAKE.width;
					break;
				case 40:
					_y -= CONFIG.SNAKE.width;
					break;
			}
			return { x: _x, y: _y };
		}
		/**
		 * returns new coordinates if the snake part is going out of bounds.
		 * 
		 * @param {number} direction the current direction of the snake part.
		 * @param {object} position coordinates of the next step.
		 */
		static checkBoundaryPosition(direction, position) {
			switch (direction) {
				case 37:
					if (position.x < CONFIG_ARENA.borderWidth) {
						position.x = CONFIG_ARENA.limits.x - CONFIG.SNAKE.width;
					}
					break;
				case 38:
					if (position.y < CONFIG_ARENA.borderWidth) {
						position.y = CONFIG_ARENA.limits.y - CONFIG.SNAKE.width;
					}
					break;
				case 39:
					if (position.x + CONFIG.SNAKE.width > CONFIG_ARENA.limits.x) {
						position.x = CONFIG_ARENA.borderWidth;
					}
					break;
				case 40:
					if (position.y + CONFIG.SNAKE.width > CONFIG_ARENA.limits.y) {
						position.y = CONFIG_ARENA.borderWidth;
					}
					break;
			}
			return position;
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
					SNAKE_ARENA.insertBefore(_e, SNAKE.head.element);
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
			function getRandomX() {
				return Math.floor(Math.random() * (CONFIG.SNAKE_FOOD.limits.x - CONFIG.SNAKE_FOOD.size)) + CONFIG_ARENA.borderWidth + 1;
			}
			function getRandomY() {
				return Math.floor(Math.random() * (CONFIG.SNAKE_FOOD.limits.y - CONFIG.SNAKE_FOOD.size)) + CONFIG_ARENA.borderWidth + 1;
			}
			return new Promise(function (resolve, reject) {
				let [_x, _y] = [getRandomX(), getRandomY()];
				let interval;
				interval = setInterval(function (multipleOf, res, rej) {
					try {
						if (_x % multipleOf === 0 && _y % multipleOf === 0) {
							WINDOW.clearInterval(interval);
							res({
								x: _x + 2, y: _y + 2
							});
						} else {
							[_x, _y] = [getRandomX(), getRandomY()];
						}
					} catch (e) {
						reject(e);
					}

				}, 0, CONFIG.SNAKE.width, resolve, reject);
			});
		}
		drop() {
			if (!(SNAKE_FOOD instanceof SnakeFood)) {
				return;
			}
			SnakeFood.getNextFoodPosition().then(
				newPosition => {
					SNAKE_FOOD.x = newPosition.x;
					SNAKE_FOOD.y = newPosition.y;
				}
			);
		}
		hide() {
			this.x = -1;
			this.y = -1;
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
			let firstCommand = DIRECTION_COMMANDS.getFirst();
			let _snake = new Snake(
				SNAKE_ARENA,
				firstCommand.position.x,
				firstCommand.position.y,
				firstCommand.direction,
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
			return new Promise(function (resolve, reject) {
				SnakeFood.getNextFoodPosition()
					.then(
						foodPosition => {
							resolve(new SnakeFood(
								SNAKE.arena,
								foodPosition.x,
								foodPosition.y,
								CONFIG.SNAKE_FOOD.color,
								CONFIG.SNAKE_FOOD.size
							));
						}, error => {
							reject(error);
						}
					);
			});
		}
		return {
			get: () => new Promise(function (resolve, reject) {
				try {
					if (theFood instanceof SnakeFood) {
						return resolve(theFood);
					}
					initSnakeFood()
						.then(
							snakeFood => {
								theFood = snakeFood;
								LOGGER.log('snake food created');
								setTimeout(resolve, CONFIG.SNAKE_FOOD.startAfter * 1000, theFood);
								resolve(theFood);
							},
							err => {
								LOGGER.error(err);
							}
						);
				} catch (e) {
					reject(e);
				}
			})
		};
	})();
	let SNAKE_FOOD_BONUS = (function () {
		let theBonusFood;
		function initBonusFood() {
			return new Promise(function name(params) {

			});
		}
		return {
			get: () => new Promise(function (resolve, reject) {

			})
		};
	})();
	startGame();
};

PLAY_SNAKE();