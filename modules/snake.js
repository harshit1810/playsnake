export default function (config, utils) {

    class Snake {
        constructor(arena, startX, startY, direction, speed, color = config.SNAKE.color) {
            this.length = 1;
            this.head = new SnakePart(arena, startX, startY, direction, this.length, color);
            this.tail = this.head;
            this.arena = arena;
            this.speed = speed;
            this.UP = function () {
                this.move(0, config.SNAKE.step * -1);
            };
            this.DOWN = function () {
                this.move(0, config.SNAKE.step);
            };
            this.RIGHT = function () {
                this.move(config.SNAKE.step, 0);
            };
            this.LEFT = function () {
                this.move(config.SNAKE.step * -1, 0);
            };
            this.turningPoints = [];
            this.intervalId;
            this.currentDirection = direction;
        }
        startSnake() {
            this.intervalId = setInterval(() => {
                this.changeDirection(this.currentDirection);
                this.start();
            }, this.speed);
            return this.intervalId;
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
            const { x, y } = this.tail.getXYOfNextPart();
            this.length += 1;
            const newPart = new SnakePart(this.arena, x, y, this.tail.direction, this.length, this.tail.color);
            this.tail.next = newPart;
            newPart.prev = this.tail;
            this.tail = newPart;
            utils.getPositionUpdater().addObserver(this.tail);
            utils.incrementScore(config.SNAKE_FOOD.points);
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
            this[config.SNAKE.directionMap[String(this.head.direction)]]();
        }
        isEatingFood() {
            const food = utils.getSnakeFood();
            const { x: foodX, y: foodY } = food;
            if (this.head.x < foodX
                && foodX < this.head.x2
                && this.head.y < foodY
                && foodY < this.head.y2) {
                food.hide();
                return true;
            }
            return false;
        }
        isEatingBonusFood() {
            const bonusFoodSize = config.SNAKE_BONUS_FOOD.size;
            const head = this.head;
            const { x: bonusFoodX, y: bonusFoodY } = utils.getSnakeBonusFood();
            let x1 = bonusFoodX - bonusFoodSize - 1;
            let x2 = bonusFoodX + bonusFoodSize - 1;
            let y1 = bonusFoodY - bonusFoodSize - 1;
            let y2 = bonusFoodY + bonusFoodSize - 1;
            if (x1 < head.x && head.x < x2 && y1 < head.y && head.y < y2) {
                return true;
            }
            return false;
        }
        move(xvalue, yvalue) {
            let _part = this.head;
            let [_part_x_pos, _part_y_pos] = [_part.x, _part.y];
            let { x: nextX, y: nextY } = SnakePart.checkBoundaryPosition(_part.direction, {
                'x': _part_x_pos + xvalue,
                'y': _part_y_pos + yvalue
            });
            const isGoingToEatSelf = this.isEatingItself();
            if (isGoingToEatSelf) {
                utils.LOGGER.warn('You ate yourself');
                stopTheGame();
                return;
            }
            _part.x = nextX;
            _part.y = nextY;
            const isEatingFood = this.isEatingFood();
            const isEatingBonusFood = this.isEatingBonusFood();
            if (isEatingBonusFood) {
                utils.getSnakeBonusFood().hide();
                utils.incrementScore(config.SNAKE_BONUS_FOOD.points);
            }
            this.moveAllParts(isEatingFood);
        }
        moveAllParts(foodEaten) {
            if (this.length === 1) {
                utils.getDirectionCommands().clear();
            }
            utils.getPositionUpdater().notify(foodEaten);
        }
        /**
         * @returns {boolean} indicates wether the snake is going to eat itself
         */
        isEatingItself() {
            let isGoingToEat = false;
            let nextPart = this.head.next;
            let snakeDirection = this.head.direction;
            while (nextPart !== null) {
                // check for tail node and nodes which are traveliing in different direction than the head
                if (nextPart.direction !== snakeDirection || nextPart.id === this.tail.id) {
                    switch (snakeDirection) {
                        case 37:
                            if (this.head.y === nextPart.y && this.head.x > nextPart.x && this.head.x <= nextPart.x2) {
                                isGoingToEat = true;
                            }
                            break;
                        case 38:
                            if (this.head.x === nextPart.x && this.head.y > nextPart.y && this.head.y <= nextPart.y2) {
                                isGoingToEat = true;
                            }
                            break;
                        case 39:
                            if (this.head.y === nextPart.y && this.head.x2 < nextPart.x2 && this.head.x2 >= nextPart.x) {
                                isGoingToEat = true;
                            }
                            break;
                        case 40:
                            if (this.head.x === nextPart.x && this.head.y2 < nextPart.y2 && this.head.y2 >= nextPart.y) {
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
    };

    class SnakePart {
        constructor(arena, x, y, dirx, partNumber, color) {
            this.id = `${config.SNAKE.id}-part${partNumber}`;
            this.direction = dirx;
            this.element = utils.createHTMLElement({
                elementNamespace: utils.getSvgNamespace(),
                elementType: config.SNAKE.elemType,
                attributes: {
                    id: this.id,
                    tabIndex: partNumber,
                    x,
                    y,
                    rx: config.SNAKE.width,
                    ry: config.SNAKE.width,
                    fill: color,
                    width: utils.pixelify(config.SNAKE.width),
                    height: utils.pixelify(config.SNAKE.width)
                },
                parent: arena
            });
            this.color = color;
            this.next = null;
            this.prev = null;
        }
        isSnakeHead() {
            return this.id === config.SNAKE.id;
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
            return this.x + (config.SNAKE.width - 1);
        }
        get y2() {
            return this.y + (config.SNAKE.width - 1);
        }
        isTail() {
            return this.id === utils.getSnake().tail.id;
        }
		/**
		 * method calculates the next coordinates for a part on each step
		 */
        nextXY() {
            let nextPosition = {
                'x': this.x, 'y': this.y
            }
            switch (this.direction) {
                case 37:
                    nextPosition.x -= config.SNAKE.step;
                    break;
                case 38:
                    nextPosition.y -= config.SNAKE.step;
                    break;
                case 39:
                    nextPosition.x += config.SNAKE.step;
                    break;
                case 40:
                    nextPosition.y += config.SNAKE.step;
                    break;
            }
            nextPosition = SnakePart.checkBoundaryPosition(this.direction, nextPosition);
            this.x = nextPosition.x;
            this.y = nextPosition.y;
            if (utils.getDirectionCommands().hasCommands()) {
                let _command = utils.getDirectionCommands().getNextTurn(this.id);
                if (_command && _command.position.x == this.x && _command.position.y == this.y) {
                    this.direction = _command.direction;
                    (utils.getSnakeDirectionMap())[this.id] = _command.id;
                    if (this.isTail()) {
                        utils.getDirectionCommands().remove();
                    }
                }
            }
        }
        getXYOfNextPart() {
            let [_x, _y] = [this.x, this.y];
            switch (this.direction) {
                case 37:
                    _x += config.SNAKE.width;
                    break;
                case 38:
                    _y += config.SNAKE.width;
                    break;
                case 39:
                    _x -= config.SNAKE.width;
                    break;
                case 40:
                    _y -= config.SNAKE.width;
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
                    if (position.x < utils.getArenaConfig().borderWidth) {
                        position.x = utils.getArenaConfig().limits.x - config.SNAKE.width;
                    }
                    break;
                case 38:
                    if (position.y < utils.getArenaConfig().borderWidth) {
                        position.y = utils.getArenaConfig().limits.y - config.SNAKE.width;
                    }
                    break;
                case 39:
                    if (position.x + config.SNAKE.width > utils.getArenaConfig().limits.x) {
                        position.x = utils.getArenaConfig().borderWidth;
                    }
                    break;
                case 40:
                    if (position.y + config.SNAKE.width > utils.getArenaConfig().limits.y) {
                        position.y = utils.getArenaConfig().borderWidth;
                    }
                    break;
            }
            return position;
        }
    }

    return {
        SnakePart,
        Snake
    };
};