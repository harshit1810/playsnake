import SnakeFoodModule from './modules/snake-food';
import SnakeBonusFoodModule from './modules/snake-bonus-food';
import SnakeModule from './modules/snake';

const PLAY_SNAKE = (ARENA_WIDTH = 500, ARENA_HEIGHT = 500) => {

    if (!window) {
        return;
    }
    const ERROR_MESSAGES = {
        DEFAULT: 'Sorry.',
        START_GAME: 'Sorry. Unable To Start The Game'
    };
    [
        ARENA_WIDTH,
        ARENA_HEIGHT
    ] = [
            parseInt(String(ARENA_WIDTH).trim()),
            parseInt(String(ARENA_HEIGHT).trim())
        ];

    const CONFIG_ARENA = {
        'id': 'play-snake-arena',
        'width': ARENA_WIDTH,
        'height': ARENA_HEIGHT,
        'borderColor': 'black',
        'borderWidth': 1,
        'limits': {
            'x': ARENA_WIDTH - 1,
            'y': ARENA_HEIGHT - 1
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
                game.stop();
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
                game.resume()
                PLAY_BUTTON.setAttribute('disabled', 'true');
                if (PAUSE_BUTTON.hasAttribute('disabled')) {
                    PAUSE_BUTTON.removeAttribute('disabled');
                }
            }
        }
    };



    class Subject {
        constructor(topic, observers = []) {
            this.observers = observers; // list of snake parts
            this.topic = topic;
        }
        addObserver(obsrv) {
            if (obsrv.element && obsrv.element.id) {
                this.observers.push(obsrv);
            }
        }
        removeObserver(obsrv) {
            this.observers.splice(
                this.observers.findIndex(obj => obj.element.id === obsrv.element.id), 1
            );
        }
        notify() {
            this.observers.forEach(obsrv => {
                obsrv[this.topic](); // call the topic for each snake part
            });
        }
    }
    class SnakeNotifier extends Subject {
        constructor() {
            super('nextXY');
        }
        notify(foodEaten) {
            super.notify();
            if (!foodEaten) {
                return;
            }
            const food = UTILS.getSnakeFood();
            UTILS.getSnake().grow(food.drop.bind(food));
        }
    }

    const SNAKE_PART_POSITION_UPDATER = new SnakeNotifier();

    const UTILS = {
        RENDER_UNIT: 'px',
        getSvgNamespace: function () {
            return 'http://www.w3.org/2000/svg';
        },
        getWindow: function () {
            return window;
        },
        getDocument: function () {
            return this.getWindow().document;
        },
        getDocumentBody: function () {
            return this.getDocument().body;
        },
        showAlert: function (message) {
            this.getWindow().alert(message);
        },
        getArena: function () {
            return SNAKE_ARENA;
        },
        getArenaConfig: function () {
            return CONFIG_ARENA;
        },
        getSnake: function () {
            return game.getSnake();
        },
        getSnakeFood: function () {
            return game.getSnakeFood();
        },
        getSnakeBonusFood: function () {
            return game.getSnakeBonusFood();
        },
        getDirectionCommands: function () {
            return COMMAND_STACK;
        },
        getSnakeDirectionMap: function () {
            return SNAKE_DIRECTION_MAP;
        },
        pixelify: function (number) {
            return String(number).trim().concat(this.RENDER_UNIT);
        },
        getPositionUpdater: function () {
            return SNAKE_PART_POSITION_UPDATER;
        },
        incrementScore: function (points) {
            SCORE_BOARD.innerHTML = +SCORE_BOARD.innerHTML + points;
        },
        getStyleString: function (obj = {}) {
            return Object.keys(obj).reduce((str, key) => {
                if (!key || !String(key).trim().length) {
                    return str;
                }
                key = String(key).trim();
                let value = obj[key];
                if (!String(value).trim().length) {
                    return str;
                }
                value = String(value).trim();
                return str.concat(` ${key}: ${value};`);
            }, '');
        },
        createHTMLElement: function ({ elementType, innerHTML, attributes = {}, eventListeners = {}, elementNamespace, parent, beforeElement }) {
            if (!parent) {
                parent = UTILS.getDocumentBody();
            }

            const element = elementNamespace ?
                this.getDocument().createElementNS(elementNamespace, elementType) :
                this.getDocument().createElement(elementType);

            if (typeof attributes === 'object') {
                Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
            }
            innerHTML ? element.innerHTML = String(innerHTML) : undefined;

            if (beforeElement) {
                parent.insertBefore(element, beforeElement);
            } else {
                parent.appendChild(element);
            }

            if (typeof eventListeners === 'object') {
                Object.keys(eventListeners).forEach(eventName => element.addEventListener(eventName, eventListeners[eventName]));
            }

            return element;
        },
        LOGGER: {
            log: console.log,
            error: console.error,
            warn: console.warn
        }
    };

    const { SNAKE_ARENA, PLAY_BUTTON, PAUSE_BUTTON, SCORE_BOARD } = (function init() {
        try {
            UTILS.getDocumentBody().style.fontFamily = 'Candara';
            const gameControlDiv = UTILS.createHTMLElement({
                elementType: 'div',
                attributes: {
                    style: UTILS.getStyleString({
                        display: 'flex',
                        'flex-direction': 'row',
                        'flex-wrap': 'nowrap',
                        width: UTILS.pixelify(CONFIG_ARENA.width),
                        padding: '1% 0%'
                    })
                }
            });

            const styleString = UTILS.getStyleString({
                padding: '2% 2%',
                'border-radius': '5px',
                flex: '0 1 20%',
                'text-align': 'center',
                'align-self': 'flex-end'
            });

            const pauseBtn = UTILS.createHTMLElement({
                elementType: 'button',
                parent: gameControlDiv,
                innerHTML: CONFIG_ARENA.pauseButton.text,
                attributes: {
                    id: CONFIG_ARENA.pauseButton.id,
                    style: `${styleString} order: ${CONFIG_ARENA.pauseButton.order}`
                },
                eventListeners: {
                    click: CONFIG_ARENA.pauseButton.clickHandler
                }
            });

            const playBtn = UTILS.createHTMLElement({
                elementType: 'button',
                parent: gameControlDiv,
                innerHTML: CONFIG_ARENA.resumeButton.text,
                attributes: {
                    id: CONFIG_ARENA.resumeButton.id,
                    style: `${styleString} margin-left: 2%; order: ${CONFIG_ARENA.resumeButton.order}`
                },
                eventListeners: {
                    click: CONFIG_ARENA.resumeButton.clickHandler
                }
            });

            const arenaContainer = UTILS.createHTMLElement({
                elementType: 'div',
                attributes: {
                    id: 'arena-container',
                    style: UTILS.getStyleString({
                        display: 'flex',
                        'flex-direction': 'cols',
                        'flex-wrap': 'wrap',
                    })
                }
            });
            const canvas = UTILS.createHTMLElement({
                elementNamespace: UTILS.getSvgNamespace(),
                elementType: 'svg',
                attributes: {
                    id: CONFIG_ARENA.id,
                    height: CONFIG_ARENA.height,
                    width: CONFIG_ARENA.width,
                    style: `border: ${UTILS.pixelify(CONFIG_ARENA.borderWidth)} solid ${CONFIG_ARENA.borderColor}`
                },
                parent: arenaContainer
            });

            const legendContainer = UTILS.createHTMLElement({
                elementType: 'div',
                parent: arenaContainer,
                attributes: {
                    id: 'legend-container',
                    style: UTILS.getStyleString({
                        padding: '2px 2px'
                    })
                }
            });
            UTILS.createHTMLElement({
                parent: legendContainer,
                elementType: 'div',
                innerHTML: 'Speed Powerup'
            });
            UTILS.createHTMLElement({
                parent: legendContainer,
                elementType: 'div',
                innerHTML: 'Bonus 10 points'
            });
            UTILS.createHTMLElement({
                parent: legendContainer,
                elementType: 'div',
                innerHTML: '5 points'
            });

            const scoreContainer = UTILS.createHTMLElement({
                elementType: 'div',
                innerHTML: 'Your Score: '
            });
            const scoreSpan = UTILS.createHTMLElement({
                elementType: 'span',
                parent: scoreContainer,
                attributes: {
                    id: 'score',
                    style: UTILS.getStyleString({
                        'font-weight': 'bold'
                    })
                },
                innerHTML: '0'
            });

            return {
                SNAKE_ARENA: canvas,
                PLAY_BUTTON: playBtn,
                PAUSE_BUTTON: pauseBtn,
                SCORE_BOARD: scoreSpan
            };
        } catch (e) {
            UTILS.LOGGER.error(e);
        }
    })();

    if (!SNAKE_ARENA) {
        return UTILS.showAlert('Sorry. Unable to start the game.');
    }

    let SNAKE_BONUS_FOOD;
    /**
     * configurations
     */
    const CONFIG = (function (arg) {
        return {
            SNAKE: {
                id: arg.snakeId,
                elemType: 'rect',
                width: arg.snakeSize,
                color: arg.primaryColor,
                length: arg.snakeLength,
                speed: arg.snakeSpeed,
                directionMap: {
                    '37': 'LEFT',
                    '38': 'UP',
                    '39': 'RIGHT',
                    '40': 'DOWN'
                },
                step: 1
            },
            SNAKE_PART: {
                'idPrefix': arg.snakeId + '-part'
            },
            SNAKE_FOOD: {
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
            SNAKE_BONUS_FOOD: {
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
            ARENA: {
                center: {
                    x: Math.floor(Math.floor(SNAKE_ARENA.getAttribute('width')) / 2),
                    y: Math.floor(Math.floor(SNAKE_ARENA.getAttribute('height')) / 2)
                }
            }
        };
    })({
        snakeId: 'the-snake',
        snakeFoodId: 'the-snake-food',
        snakeBonusFoodId: 'the-snake-bonus-food',
        snakeSpeed: 20,
        primaryColor: 'black',
        secondaryColor: 'grey',
        alertColor: 'red',
        snakeLength: 1,
        snakeSize: 15,
        foodPoints: 5,
        bonusFoodPoints: 10
    });
    let SNAKE_DIRECTION = 39;

    /**
     * store the directions given to the snake
     */
    const COMMAND_STACK = (initCommand => {
        const commands = [];
        if (initCommand) {
            commands.push(initCommand);
        }
        return {
            add: function (data) {
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
            getFirst: function () {
                return commands[0];
            },
            remove: function () {
                commands.shift();
                return;
            },
            clear: function () {
                commands.splice(0, commands.length);
                return;
            },
            hasCommands: function () {
                return commands.length > 0 ? true : false;
            },
            getNextTurn: function (snakePartId) {
                if (typeof SNAKE_DIRECTION_MAP[snakePartId] === 'undefined') {
                    return this.getFirst();
                }
                let turnMadeIndex = commands.findIndex(com => com.id === SNAKE_DIRECTION_MAP[snakePartId]);
                return (turnMadeIndex == commands.length - 1) ? undefined : commands[turnMadeIndex + 1];
            }
        };
    })({
        id: Date.now(),
        direction: SNAKE_DIRECTION,
        position: {
            x: CONFIG.ARENA.center.x,
            y: CONFIG.ARENA.center.y
        }
    });

    const SNAKE_DIRECTION_MAP = {};

    const { Snake } = SnakeModule(CONFIG, UTILS);
    const SnakeFoodClass = SnakeFoodModule(CONFIG, UTILS);
    const SnakeFoodBonusClass = SnakeBonusFoodModule(CONFIG, UTILS);

    class PlaySnakeGame {
        constructor(arena) {
            this.intervals = [];
            this.timers = [];
            this._snake;
            this._snakeFood;
            this._snakeBonusFood;
            this.snakeDirection;
            this.arena = arena;
            this.snakeSpeed = 20;
        }

        getSnake() {
            if (this._snake instanceof Snake) {
                return this._snake;
            }
            const { direction, position: { x, y } } = COMMAND_STACK.getFirst();
            this.snakeDirection = direction;
            this._snake = new Snake(
                this.arena,
                x,
                y,
                this.snakeDirection,
                this.snakeSpeed
            );
            return this._snake;
        }

        getSnakeFood() {
            if (this._snakeFood instanceof SnakeFoodClass) {
                return this._snakeFood;
            }
            const { x, y } = SnakeFoodClass.getNextFoodPosition();
            this._snakeFood = new SnakeFoodClass(this.arena, x, y);
            return this._snakeFood;
        }

        getSnakeBonusFood() {
            if (this._snakeBonusFood instanceof SnakeFoodBonusClass) {
                return this._snakeBonusFood;
            }
            const { x, y } = SnakeFoodBonusClass.getNextFoodPosition();
            this._snakeBonusFood = new SnakeFoodBonusClass(
                this.arena, x, y
            );
            return this._snakeBonusFood;
        }

        start() {
            try {
                this.getSnake();
                const food = this.getSnakeFood();
                setTimeout(CONFIG.SNAKE_FOOD.startAfter * 1000, food);
                const bonusFood = this.getSnakeBonusFood();
                this.intervals.push(bonusFood.startBonusFood());
                this.setButtonListeners();
                this.intervals.push(this.getSnake().startSnake());
            } catch (error) {
                UTILS.showAlert(ERROR_MESSAGES.START_GAME);
            }
        }

        pause() {

        }

        async stop() {
            this._snake = null;
            UTILS.getWindow().clearInterval(this.getSnake().intervalId);
            const { intervalId: bonusFoodInterval } = this.getSnakeBonusFood();
            UTILS.getWindow().clearInterval(bonusFoodInterval);
            this._snakeFood = null;
            this._snakeBonusFood = null;
            UTILS.getWindow().alert('GAME OVER\nYou Scored ' + SCORE_BOARD.innerHTML + ' points.');
        }

        async resume() {
            const bonusFoodIntervalId = this.getSnakeBonusFood().startBonusFood();
            this.intervals.push(bonusFoodIntervalId);
            this.intervals.push(this.getSnake().startSnake());
            LOGGER.log('game resumed');
        }

        setButtonListeners() {
            UTILS.getWindow().addEventListener('unload', this.stop);
            UTILS.getDocument().addEventListener('keydown', event => {
                /** listen only for direction keys */
                if (CONFIG_ARENA.supportedKeys.indexOf(event.keyCode) === -1) {
                    return;
                }
                /**
                 * the new direction should not be the current direction 
                 * or the opposite direction.
                 */
                if (SNAKE_DIRECTION == event.keyCode &&
                    event.keyCode == CONFIG_ARENA.keyConfig[String(SNAKE_DIRECTION)].reverse) {
                    return;
                }
                SNAKE_DIRECTION = event.keyCode;
                this.snakeDirection = event.keyCode;
                this.getSnake().currentDirection = this.snakeDirection;
                COMMAND_STACK.add({
                    id: Date.now(),
                    direction: event.keyCode,
                    position: {
                        x: UTILS.getSnake().head.x,
                        y: UTILS.getSnake().head.y
                    }
                });
            });
        }

        increaseSnakeSpeed() {
            UTILS.getWindow().clearInterval(this.getSnake().intervalId);
            startSnake(CONFIG.SNAKE.speed - UTILS.getSnake().length * 50);
        }
    }

    const game = new PlaySnakeGame(SNAKE_ARENA);

    game.start();
};

PLAY_SNAKE();