import GameEventHandlerModule from './modules/game-event-handler';
import SnakeModule from './modules/snake';
import InitUIModule from './modules/init-ui';
import Eatable from './modules/eatable';

const PLAY_SNAKE = function () {
    if (!window) {
        return;
    }
    const MAX_HEIGHT_WIDTH = 500;
    const ARENA_WIDTH = Math.floor(window.innerWidth) < MAX_HEIGHT_WIDTH
        ? Math.floor(window.innerWidth)
        : MAX_HEIGHT_WIDTH;
    const ARENA_HEIGHT = Math.floor(window.innerHeight) < MAX_HEIGHT_WIDTH
        ? Math.floor(window.innerHeight)
        : MAX_HEIGHT_WIDTH;
    const ERROR_MESSAGES = {
        DEFAULT: 'Sorry.',
        START_GAME: 'Unable To Start The Game'
    };

    const gameEvents = GameEventHandlerModule();

    const borderWidth = 1;

    const snakeWidth = 15;

    const limits = {
        x: ARENA_WIDTH - borderWidth,
        y: ARENA_HEIGHT - borderWidth
    };

    const CONFIG_ARENA = {
        id: 'play-snake-arena',
        width: ARENA_WIDTH,
        height: ARENA_HEIGHT,
        borderColor: 'black',
        borderWidth,
        limits,
        supportedKeys: [37, 38, 39, 40],
        arena: {
            center: {
                x: Math.floor(ARENA_WIDTH / 2),
                y: Math.floor(ARENA_HEIGHT / 2)
            }
        },
        directionMap: {
            37: 'LEFT',
            38: 'UP',
            39: 'RIGHT',
            40: 'DOWN'
        },
        keyConfig: {
            37: {
                reverse: 39
            },
            38: {
                reverse: 40
            },
            39: {
                reverse: 37
            },
            40: {
                reverse: 38
            }
        },
        pauseButton: {
            id: 'pause-play-snake',
            text: 'Pause',
            order: '0'
        },
        resumeButton: {
            id: 'resume-play-snake',
            text: 'Resume',
            order: '1'
        },
        snake: {
            id: 'the-snake',
            elemType: 'rect',
            width: snakeWidth,
            color: 'black',
            length: 1,
            speed: 20,
            step: 1
        },
        eatables: {
            basicFood: {
                id: 'the-snake-food',
                color: '#aba99f',
                description: 'Basic food',
                showInLegend: true,
                points: 5,
                appearDuration: null,
                startAfter: 0,
                elemType: 'circle',
                size: 5,
                limits: {
                    x: limits.x - snakeWidth,
                    y: limits.y - snakeWidth
                }
            },
            bonusFood: {
                id: 'the-snake-bonus-food',
                color: '#d12308',
                description: 'Bonus point',
                showInLegend: true,
                points: 10,
                appearDuration: 10,
                startAfter: 30,
                elemType: 'circle',
                size: 15
            },
            speedBonus: {
                id: 'the-speed-bonus',
                color: '#ffe205',
                description: 'Extra speed',
                showInLegend: true,
                points: 0,
                appearDuration: 10,
                startAfter: 30,
                elemType: 'circle',
                size: 5,
                speedDuration: 10
            }
        }
    };

    class Subject {
        constructor(topic, observers = []) {
            // list of snake parts
            this.observers = observers;
            this.topic = topic;
        }
        addObserver(obsrv) {
            if (!obsrv || !obsrv.element || !obsrv.element.id) {
                return;
            }
            this.observers.push(obsrv);
        }
        removeObserver(obsrv) {
            this.observers.splice(
                this.observers.findIndex(obj => obj.element.id === obsrv.element.id), 1
            );
        }
        notify() {
            this.observers.forEach(obsrv => {
                // call the topic for each snake part
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
            if (!foodEaten) {
                return;
            }
            const food = UTILS.getSnakeFood();
            UTILS.getSnake().grow(food.drop.bind(food));
        }
    }

    const SNAKE_PART_POSITION_UPDATER = new SnakeNotifier();

    const SNAKE_DIRECTION_MAP = {};

    let game;

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
        getGame: function () {
            return game;
        },
        getSnake: function () {
            return this.getGame().getSnake();
        },
        getSnakeFood: function () {
            return this.getGame().getSnakeFood();
        },
        getSnakeBonusFood: function () {
            return this.getGame().getSnakeBonusFood();
        },
        getSpeedBonus: function () {
            return this.getGame().getSpeedBonusFood();
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
        createHTMLElement: function ({
            elementType,
            innerHTML,
            attributes = {},
            eventListeners = {},
            elementNamespace,
            parent,
            beforeElement }) {
            if (!parent) {
                parent = UTILS.getDocumentBody();
            }

            const element = elementNamespace ?
                this.getDocument().createElementNS(elementNamespace, elementType) :
                this.getDocument().createElement(elementType);

            if (typeof attributes === 'object') {
                Object.keys(attributes).forEach(key => element.setAttribute(key, attributes[key]));
            }
            innerHTML
                ? element.innerHTML = String(innerHTML)
                : undefined;

            if (beforeElement) {
                parent.insertBefore(element, beforeElement);
            } else {
                parent.appendChild(element);
            }

            if (typeof eventListeners === 'object') {
                Object.keys(eventListeners).forEach(
                    eventName => element.addEventListener(eventName, eventListeners[eventName])
                );
            }

            return element;
        },
        getGameEvents: function () {
            return gameEvents;
        },
        /**
         * returns new coordinates if the snake part is going out of bounds.
         * 
         * @param {number} direction the current direction of the snake part.
         * @param {object} position coordinates of the next step.
         */
        checkBoundaryPosition(direction, position) {
            const { borderWidth, limits } = this.getArenaConfig();
            const snakeWidth = this.getArenaConfig().snake.width;
            switch (direction) {
            case 37:
                if (position.x < borderWidth) {
                    position.x = limits.x - snakeWidth;
                }
                break;
            case 38:
                if (position.y < borderWidth) {
                    position.y = limits.y - snakeWidth;
                }
                break;
            case 39:
                if (position.x + snakeWidth > limits.x) {
                    position.x = borderWidth;
                }
                break;
            case 40:
                if (position.y + snakeWidth > limits.y) {
                    position.y = borderWidth;
                }
                break;
            }
            return position;
        },
        LOGGER: {
            // eslint-disable-next-line no-console
            log: console.log,
            // eslint-disable-next-line no-console
            error: console.error,
            // eslint-disable-next-line no-console
            warn: console.warn
        }
    };

    const { SNAKE_ARENA, PLAY_BUTTON, PAUSE_BUTTON, SCORE_BOARD } = InitUIModule(UTILS);
    if (!SNAKE_ARENA) {
        return UTILS.showAlert(ERROR_MESSAGES.START_GAME);
    }

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
                return commands.length > 0
                    ? true
                    : false;
            },
            getNextTurn: function (snakePartId) {
                const directionMap = UTILS.getSnakeDirectionMap();
                if (typeof directionMap[snakePartId] === 'undefined') {
                    return this.getFirst();
                }
                let turnMadeIndex = commands.findIndex(com => com.id === directionMap[snakePartId]);
                return (turnMadeIndex == commands.length - 1)
                    ? undefined
                    : commands[turnMadeIndex + 1];
            }
        };
    })({
        id: Date.now(),
        direction: UTILS.getArenaConfig().supportedKeys[2],
        position: {
            x: UTILS.getArenaConfig().arena.center.x,
            y: UTILS.getArenaConfig().arena.center.y
        }
    });

    const { createEatableItem, getNextEatablePosition } = Eatable(UTILS);
    const { Snake } = SnakeModule(UTILS);

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
            this._speedBonus;
        }

        getSnake() {
            if (this._snake) {
                return this._snake;
            }
            const { direction, position: { x, y } } = COMMAND_STACK.getFirst();
            this.snakeDirection = direction;
            this._snake = Snake(
                this.arena,
                x,
                y,
                this.snakeDirection,
                this.snakeSpeed
            );
            return this._snake;
        }

        getSpeedBonusFood() {
            if (this._speedBonus) {
                return this._speedBonus;
            }
            this._speedBonus = createEatableItem(this.arena, -10, -10, 'speedBonus');
            return this._speedBonus;
        }

        getSnakeFood() {
            if (this._snakeFood) {
                return this._snakeFood;
            }
            const { x, y } = getNextEatablePosition(
                UTILS.getArenaConfig().eatables.basicFood.limits,
                UTILS.getArenaConfig().eatables.basicFood.size
            );
            this._snakeFood = createEatableItem(this.arena, x, y, 'basicFood');
            return this._snakeFood;
        }

        getSnakeBonusFood() {
            if (this._snakeBonusFood) {
                return this._snakeBonusFood;
            }
            this._snakeBonusFood = createEatableItem(this.arena, -10, -10, 'bonusFood');
            return this._snakeBonusFood;
        }

        start() {
            try {
                this.getSnake();

                const food = this.getSnakeFood();
                setTimeout(UTILS.getArenaConfig().eatables.basicFood.startAfter * 1000, food);

                const bonusFood = this.getSnakeBonusFood();
                this.intervals.push(bonusFood.startInterval());

                const speedBonusFood = this.getSpeedBonusFood();
                this.intervals.push(speedBonusFood.startInterval());

                this.setButtonListeners();

                this.intervals.push(this.getSnake().startSnake());
            } catch (error) {
                UTILS.showAlert(ERROR_MESSAGES.START_GAME);
            }
        }

        pause() {
            UTILS.getWindow().clearInterval(this.getSnake().intervalId);
            UTILS.getWindow().clearInterval(this.getSnakeBonusFood().intervalId);
            PAUSE_BUTTON.setAttribute('disabled', 'true');
            if (PLAY_BUTTON.hasAttribute('disabled')) {
                PLAY_BUTTON.removeAttribute('disabled');
            }
        }

        resume() {
            this.getSnake().startSnake();
            this.getSnakeBonusFood().startInterval();
            PLAY_BUTTON.setAttribute('disabled', 'true');
            if (PAUSE_BUTTON.hasAttribute('disabled')) {
                PAUSE_BUTTON.removeAttribute('disabled');
            }
        }

        stop() {
            UTILS.getWindow().clearInterval(this.getSnake().intervalId);
            UTILS.getWindow().clearInterval(this.getSnakeBonusFood().intervalId);
            UTILS.getWindow().clearInterval(this.getSpeedBonusFood().intervalId);
            this._snake = null;
            this._snakeFood = null;
            this._snakeBonusFood = null;
            this._speedBonus = null;
            this._speedBonus = null;
            UTILS.getWindow().alert('GAME OVER\nYou Scored ' + this.getScore() + ' points.');
        }

        /**
         * 
         * @param {number} direction the new direction received
         */
        handleSnakeDirectionChange(direction) {
            if (UTILS.getArenaConfig().supportedKeys.indexOf(direction) === -1) {
                return;
            }
            /**
             * the new direction should not be the current direction 
             * or the opposite direction.
             */
            if (this.getSnake().currentDirection == direction ||
                direction == UTILS.getArenaConfig()
                    .keyConfig[String(this.getSnake().currentDirection)].reverse) {
                return;
            }
            this.snakeDirection = direction;
            this.getSnake().currentDirection = this.snakeDirection;
            COMMAND_STACK.add({
                id: Date.now(),
                direction,
                position: {
                    x: this.getSnake().head.x,
                    y: this.getSnake().head.y
                }
            });
        }

        setButtonListeners() {
            UTILS.getWindow().addEventListener('unload', this.stop);
            UTILS.getDocument().addEventListener('keydown', event => {
                if (UTILS.getArenaConfig().supportedKeys.indexOf(event.keyCode) === -1) {
                    return;
                }
                UTILS.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: event.keyCode });
            });
        }

        getScore() {
            return parseInt(SCORE_BOARD.innerHTML);
        }

        updateScore(points) {
            SCORE_BOARD.innerHTML = +SCORE_BOARD.innerHTML + points;
            return parseInt(SCORE_BOARD.innerHTML);
        }

        increaseSnakeSpeed() {
            // stop current movement
            UTILS.getWindow().clearInterval(this.getSnake().intervalId);

            // start with new speed
            this.intervals.push(
                this.getSnake().startSnake(
                    this.getSnake().speed / 4
                )
            );

            // revert to normal speed after some time
            setTimeout(() => {
                UTILS.getWindow().clearInterval(this.getSnake().intervalId);
                this.intervals.push(
                    this.getSnake().startSnake()
                );
            }, UTILS.getArenaConfig().eatables.speedBonus.speedDuration * 1000);
        }
    }

    game = new PlaySnakeGame(SNAKE_ARENA);
    gameEvents.init(game);
    game.start();
};

PLAY_SNAKE();