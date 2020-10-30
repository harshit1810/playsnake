import GameModule from './modules/game';
import GameEventHandlerModule from './modules/game-event-handler';
import InitUIModule from './modules/init-ui';

const PLAY_SNAKE = function () {

    const { onWindowLoad } = InitUIModule();
    const arenaContainerId = 'arena-section';
    const ARENA_ID = 'play-snake-arena';
    const DISPLAY_MESSAGES = {
        DEFAULT: 'Sorry.',
        SETUP_GAME: 'Failed to setup',
        START_GAME: 'Unable To Start The Game',
        INACTIVITY_TIMEOUT: 'It seems you are not playing',
        GAME_OVER: 'Game Over',
        Q_CONTINUE: 'Continue?'
    };

    const CONFIG = (obj => {
        const {
            ARENA_WIDTH,
            ARENA_HEIGHT
        } = obj;
        const borderWidth = 1;
        const snakeWidth = 14;
        const snakeSpeed = 12;
        const eatableRadius = snakeWidth / 2;
        const defaultSnakeGrowLength = 1;
        const limits = {
            x: ARENA_WIDTH - (borderWidth * 2),
            y: ARENA_HEIGHT - (borderWidth * 2)
        };
        const eatablePositionLimits = {
            x: limits.x - (snakeWidth * 2),
            y: limits.y - (snakeWidth * 2)
        };

        return {
            id: ARENA_ID,
            arenaContainerId,
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
            game: {
                legendContainerId: 'legend-container',
                infoContainerId: 'game-info',
                inactivityTimeout: 300,
                state: {
                    paused: 0,
                    stopped: 1,
                    playing: 2
                },
                scoreBoard: {
                    id: 'score'
                },
                scoreCheckpointMultipleOf: 50
            },
            pauseButton: {
                id: 'pause-play-snake',
            },
            resumeButton: {
                id: 'resume-play-snake',
            },
            quitButton: {
                id: 'quit-play-snake'
            },
            snake: {
                id: 'the-snake',
                elemType: 'circle',
                width: snakeWidth,
                color: 'black',
                length: 1,
                speed: snakeSpeed,
                step: 1,
                turboSpeed: snakeSpeed / 4
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
                    size: eatableRadius,
                    limits: eatablePositionLimits,
                    isIntervalBased: false,
                    code: 'basicFood',
                    growSnakeIfConsumed: true,
                    growSnakeByLength: defaultSnakeGrowLength
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
                    size: eatableRadius,
                    limits: eatablePositionLimits,
                    isIntervalBased: true,
                    code: 'bonusFood',
                    growSnakeIfConsumed: false,
                    growSnakeByLength: defaultSnakeGrowLength + 1
                },
                speedBonus: {
                    id: 'the-speed-bonus',
                    color: '#ffe205',
                    description: 'Turbo boost',
                    showInLegend: true,
                    points: 0,
                    appearDuration: 10,
                    startAfter: 30,
                    elemType: 'circle',
                    size: eatableRadius,
                    speedDuration: 10,
                    limits: eatablePositionLimits,
                    isIntervalBased: true,
                    code: 'speedBonus',
                    growSnakeIfConsumed: false,
                    growSnakeByLength: 0
                }
            }
        };
    })(onWindowLoad({
        arenaId: ARENA_ID,
        arenaContainerId
    }));
    Object.freeze(CONFIG);

    const SNAKE_DIRECTION_MAP = {};

    let game, COMMAND_STACK;

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
        getConfig: function () {
            return CONFIG;
        },
        getGame: function () {
            return game;
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
        getStyleString: function (obj) {
            return Object.keys(obj || {}).reduce((str, key) => {
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
         * @param {number} direction the current direction of the object.
         * @param {object} position coordinates of the next step.
         * @param {number} position.x
         * @param {number} position.y
         * @returns {Object} new coordinates if an object is going out of bounds.
         */
        checkBoundaryPosition(direction, position) {
            const { borderWidth, limits } = this.getConfig();
            const snakeWidth = this.getConfig().snake.width;
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
        getDisplayMessages: function () {
            return DISPLAY_MESSAGES;
        },
        intersectingOnXAxis: function (obj1, obj2) {
            return (obj2.x1 < obj1.x1 && obj1.x1 < obj2.x2) ||
                (obj2.x1 < obj1.x2 && obj1.x2 < obj2.x2) ||
                (obj1.x1 < obj2.x1 && obj2.x1 < obj1.x2) ||
                (obj1.x1 < obj2.x2 && obj2.x2 < obj1.x2);
        },
        intersectingOnYAxis: function (obj1, obj2) {
            return (obj2.y1 < obj1.y1 && obj1.y1 < obj2.y2) ||
                (obj2.y1 < obj1.y2 && obj1.y2 < obj2.y2) ||
                (obj1.y1 < obj2.y1 && obj2.y1 < obj1.y2) ||
                (obj1.y1 < obj2.y2 && obj2.y2 < obj1.y2);
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

    /**
     * store the directions given to the snake
     */
    COMMAND_STACK = (initCommand => {
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
        direction: UTILS.getConfig().supportedKeys[2],
        position: {
            x: UTILS.getConfig().arena.center.x,
            y: UTILS.getConfig().arena.center.y
        }
    });

    const gameEvents = GameEventHandlerModule();
    const { PlaySnake } = GameModule(UTILS);

    game = PlaySnake();
    gameEvents.init(game);
    game.start();
};

window.onload = function () {
    PLAY_SNAKE();
}