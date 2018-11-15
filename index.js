import SnakeFoodModule from './modules/snake-food';
import SnakeBonusFoodModule from './modules/snake-bonus-food';
import SnakePartModule from './modules/snake-part';
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
	class Subject {
		constructor(topic, observers = []) {
			this.observers = observers; // list of snake parts
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
				obsrv[this.topic]();	// call the topic for each snake part
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
	let SCORE_BOARD = DOCUMENT_BODY.querySelector('#score');
	let PAUSE_BUTTON = DOCUMENT_BODY.querySelector('#' + CONFIG_ARENA.pauseButton.id);
	let PLAY_BUTTON = DOCUMENT_BODY.querySelector('#' + CONFIG_ARENA.resumeButton.id);
	const SNAKE_PART_POSITION_UPDATER = new SnakeNotifier();
	const LOGGER = {
		'log': console.log,
		'error': console.error
	};
	let SNAKE;
	let SNAKE_FOOD;
	let SNAKE_BONUS_FOOD;
	let INTERVAL_SNAKE_MOVEMENT;
	let INTERVAL_BONUS_FOOD;
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
				},
				'points': arg.foodPoints
			},
			'SNAKE_BONUS_FOOD': {
				'id': arg.snakeBonusFoodId,
				'color': arg.alertColor,
				'elemType': 'circle',
				'size': arg.snakeSize,
				'startAfter': 30,
				'limits': {
					'x': CONFIG_ARENA.limits.x - (arg.snakeSize * 2),
					'y': CONFIG_ARENA.limits.y - (arg.snakeSize * 2)
				},
				'points': arg.bonusFoodPoints,
				'duration': 10
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
		'snakeBonusFoodId': 'the-snake-bonus-food',
		'snakeSpeed': 20,
		'primaryColor': 'black',
		'secondaryColor': 'grey',
		'alertColor': 'red',
		'snakeLength': 1,
		'snakeSize': 15,
		'foodPoints': 5,
		'bonusFoodPoints': 10
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
				if (typeof SNAKE_DIRECTION_MAP[snakePartId] === 'undefined') {
					return this.getFirst();
				}
				let turnMadeIndex = commands.findIndex(com => com.id === SNAKE_DIRECTION_MAP[snakePartId]);
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
	const SNAKE_DIRECTION_MAP = {};
	const UTILS = {
		getSvgNamespace: function () {
			return SVG_XML_NS;
		},
		getDocument: function () {
			return DOCUMENT;
		},
		getWindow: function () {
			return WINDOW;
		},
		getArena: function () {
			return SNAKE_ARENA;
		},
		getArenaConfig: function () {
			return CONFIG_ARENA;
		},
		getSnake: function () {
			return SNAKE;
		},
		getSnakeFood: function () {
			return SNAKE_FOOD;
		},
		getSnakeBonusFood: function () {
			return SNAKE_BONUS_FOOD;
		},
		getDirectionCommands: function () {
			return DIRECTION_COMMANDS;
		},
		getSnakeDirectionMap: function () {
			return SNAKE_DIRECTION_MAP;
		},
		pixelify: pixelify
	};
	const SnakeFoodClass = SnakeFoodModule(CONFIG, UTILS);
	const SnakeFoodBonusClass = SnakeBonusFoodModule(CONFIG, UTILS);
	const SnakePartClass = SnakePartModule(CONFIG, UTILS);
	/**
	 * start the game
	 */
	function startGame() {
		// render the snake
		SNAKE.get().then(
			function (snake) {
				SNAKE = snake;
				return SNAKE_FOOD.get();	// render snake food
			}, error => Promise.reject(error)
		).then(
			function (snakeFood) {
				SNAKE_FOOD = snakeFood;
				initSnakeBonusFood()	// start bonus food
				return prepareGameEnd();
			}, error => Promise.reject(error)
		).then(
			function (gameEndProcessed) {
				startTheSnake(CONFIG.SNAKE.speed);
			},
			function (error) {
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
		stopMovingTheSnake();
		stopBonusFood();
		LOGGER.log('game paused');
	}
	/** resume the game. 
	 * when play button is clicked.
	*/
	function resumeGame() {
		startTheSnake(CONFIG.SNAKE.speed);
		startBonusFood(CONFIG.SNAKE_BONUS_FOOD.startAfter);
		LOGGER.log('game resumed');
	}
	function processStopGame() {
		stopTheSnake();
		stopTheSnakeFood();
		stopBonusFood();
	}
	function initSnakeBonusFood() {
		SNAKE_BONUS_FOOD.get().then(
			function (food) {
				SNAKE_BONUS_FOOD = food;
				startBonusFood(CONFIG.SNAKE_BONUS_FOOD.startAfter);
			},
			function (errorInBonusFood) {

			}
		);
	}
	/**
	 * stop dropping the bonus food
	 */
	function stopBonusFood() {
		WINDOW.clearInterval(INTERVAL_BONUS_FOOD);
	}
	/**
	 * initialize dropping of bonus food
	 * @param {number} interval seconds
	 */
	function startBonusFood(interval) {
		INTERVAL_BONUS_FOOD = setInterval(SNAKE_BONUS_FOOD.drop, interval * 1000);
	}
	/**
	 * start moving the snake after specified interval.
	 * @param {number} interval.
	 */
	function startTheSnake(interval) {
		INTERVAL_SNAKE_MOVEMENT = setInterval(function () {
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
		SNAKE_BONUS_FOOD = null;
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
	function incrementScore(points) {
		SCORE_BOARD.innerHTML = +SCORE_BOARD.innerHTML + points;
	}
	class Snake {
		constructor(arena, startX, startY, direction, color = CONFIG.SNAKE.color) {
			this.head = new SnakePartClass(arena, startX, startY, direction, color);
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
		/**
		 * adds a snake part at the tail
		 * @param {function} next a callback
		 * @returns undefined
		 */
		grow(next) {
			let { x, y } = this.tail.getXYOfNextPart();
			let newPart = new SnakePartClass(SNAKE.arena, x, y, this.tail.direction, this.tail.color);
			this.tail.next = newPart;
			newPart.prev = this.tail;
			this.tail = newPart;
			this.length += 1;
			SNAKE_PART_POSITION_UPDATER.addObserver(this.tail);
			incrementScore(CONFIG.SNAKE_FOOD.points);
			// drop food pellet
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
		isEatingBonusFood() {
			let head = this.head;
			let x1 = SNAKE_BONUS_FOOD.x - CONFIG.SNAKE_BONUS_FOOD.size - 1;
			let x2 = SNAKE_BONUS_FOOD.x + CONFIG.SNAKE_BONUS_FOOD.size - 1;
			let y1 = SNAKE_BONUS_FOOD.y - CONFIG.SNAKE_BONUS_FOOD.size - 1;
			let y2 = SNAKE_BONUS_FOOD.y + CONFIG.SNAKE_BONUS_FOOD.size - 1;
			if (x1 < head.x && head.x < x2 && y1 < head.y && head.y < y2) {
				return true;
			}
			return false;
		}
		move(xvalue, yvalue) {
			let _part = this.head;
			let [_part_x_pos, _part_y_pos] = [_part.x, _part.y];
			let { x: nextX, y: nextY } = SnakePartClass.checkBoundaryPosition(_part.direction, {
				'x': _part_x_pos + xvalue, 'y': _part_y_pos + yvalue
			});
			let isGoingToEat = this.isEatingItself();
			if (isGoingToEat) {
				stopTheGame();
				return;
			}
			_part.x = nextX;
			_part.y = nextY;
			let isEatingFood = this.isEatingFood();
			if (this.isEatingBonusFood()) {
				SNAKE_BONUS_FOOD.hide();
				incrementScore(CONFIG.SNAKE_BONUS_FOOD.points);
			}
			this.moveAllParts(isEatingFood);
		}
		moveAllParts(foodEaten) {
			if (this.length === 1) {
				DIRECTION_COMMANDS.clear();
			}
			SNAKE_PART_POSITION_UPDATER.notify(foodEaten);
		}
		/**
		 * @returns {boolean} indicates wether the snake is going to eat itself
		 */
		isEatingItself() {
			let isGoingToEat = false;
			let nextPart = SNAKE.head.next;
			let snakeDirection = SNAKE.head.direction;
			while (nextPart !== null) {
				// check for tail node and nodes which are traveliing in different direction than the head
				if (nextPart.direction !== snakeDirection || nextPart.id === SNAKE.tail.id) {
					switch (snakeDirection) {
						case 37:
							if (SNAKE.head.y === nextPart.y && SNAKE.head.x > nextPart.x && SNAKE.head.x <= nextPart.x2) {
								isGoingToEat = true;
							}
							break;
						case 38:
							if (SNAKE.head.x === nextPart.x && SNAKE.head.y > nextPart.y && SNAKE.head.y <= nextPart.y2) {
								isGoingToEat = true;
							}
							break;
						case 39:
							if (SNAKE.head.y === nextPart.y && SNAKE.head.x2 < nextPart.x2 && SNAKE.head.x2 >= nextPart.x) {
								isGoingToEat = true;
							}
							break;
						case 40:
							if (SNAKE.head.x === nextPart.x && SNAKE.head.y2 < nextPart.y2 && SNAKE.head.y2 >= nextPart.y) {
								isGoingToEat = true;
							}
							break;
					}
					if (isGoingToEat) {
						break;
					}
				}
				nextPart = nextPart.next;
			}
			if (isGoingToEat) {
				return true;
			}
			return false;
		}
	}




	SNAKE = (function () {
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
	SNAKE_FOOD = (function () {
		let theFood;
		function initSnakeFood() {
			return new Promise(function (resolve, reject) {
				SnakeFoodClass.getNextFoodPosition()
					.then(
						function (foodPosition) {
							resolve(new SnakeFoodClass(
								SNAKE.arena,
								foodPosition.x,
								foodPosition.y,
								CONFIG.SNAKE_FOOD.color,
								CONFIG.SNAKE_FOOD.size
							));
						}, function (error) {
							reject(error);
						}
					);
			});
		}
		return {
			get: () => new Promise(function (resolve, reject) {
				try {
					if (theFood instanceof SnakeFoodClass) {
						return resolve(theFood);
					}
					initSnakeFood().then(
						function (snakeFood) {
							theFood = snakeFood;
							// set timer to drop food pellet
							setTimeout(resolve, CONFIG.SNAKE_FOOD.startAfter * 1000, theFood);
							resolve(theFood);
						},
						function (err) {
							LOGGER.error(err);
						}
					);
				} catch (e) {
					reject(e);
				}
			})
		};
	})();
	SNAKE_BONUS_FOOD = (function () {
		let theBonusFood;
		function initBonusFood() {
			return new Promise(function (resolve, reject) {
				SnakeFoodBonusClass.getNextFoodPosition().then(
					function (bonusFoodPosition) {
						resolve(new SnakeFoodBonusClass(SNAKE.arena, bonusFoodPosition.x, bonusFoodPosition.y));
					},
					function (error) { }
				);
			});
		}
		return {
			get: () => new Promise(function (resolve, reject) {
				try {
					if (theBonusFood instanceof SnakeFoodBonusClass) {
						return resolve(theBonusFood);
					}
					initBonusFood().then(
						function (food) {
							theBonusFood = food;
							resolve(theBonusFood);
						}
					);
				} catch (e) {
					reject(e);
				}
			})
		};
	})();
	startGame();
};

PLAY_SNAKE();