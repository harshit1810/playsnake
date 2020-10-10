export default function (config, utils) {

    const {
        color: snakeColor,
        width: snakeWidth,
        step: snakeStep,
        id: snakeId,
    } = config.SNAKE;

    const {
        size: bonusFoodSize,
    } = config.SNAKE_BONUS_FOOD;

    const {
        directionMap
    } = utils.getArenaConfig();

    function Snake(arena, startX, startY, direction, speed) {
        let length = 1;
        let color = snakeColor;
        let currentDirection = direction;
        let head = createSnakePart(arena, startX, startY, currentDirection, length, color);
        let tail = head;
        let intervalId;

        return {
            get arena() {
                return arena;
            },
            set arena(a) {
                arena = a;
            },
            get length() {
                return length;
            },
            set length(l) {
                return length = l;
            },
            get head() {
                return head;
            },
            set head(h) {
                return head = h;
            },
            get tail() {
                return tail;
            },
            set tail(t) {
                return tail = t;
            },
            get intervalId() {
                return intervalId;
            },
            set intervalId(id) {
                intervalId = id;
            },
            get currentDirection() {
                return currentDirection;
            },
            set currentDirection(dir) {
                currentDirection = dir;
            },
            get speed() {
                return speed;
            },
            set speed(s) {
                speed = s;
            },
            get color() {
                return color;
            },
            set color(c) {
                color = c;
            },
            UP: function () {
                this.move(0, snakeStep * -1);
            },
            DOWN: function () {
                this.move(0, snakeStep);
            },
            RIGHT: function () {
                this.move(snakeStep, 0);
            },
            LEFT: function () {
                this.move(snakeStep * -1, 0);
            },
            startSnake: function (newSpeed) {
                const self = this;
                newSpeed = typeof newSpeed === 'number' ? newSpeed : this.speed;
                self.intervalId = setInterval(function () {
                    self.changeDirection(self.currentDirection);
                    self.start();
                }, newSpeed);
                return self.intervalId;
            },
            changeDirection: function (newDirection) {
                typeof newDirection === 'number' ? newDirection : this.currentDirection;
                this.head.direction = newDirection;
            },
            start: function () {
                const direction = directionMap[this.head.direction];
                this[direction]();
            },
            getPositionOfNewPart: function () {
                const { x, y, direction } = this.tail;
                let [_x, _y] = [Number(x), Number(y)];
                switch (direction) {
                case 37:
                    _x = x + snakeWidth;
                    break;
                case 38:
                    _y = y + snakeWidth;
                    break;
                case 39:
                    _x = x - snakeWidth;
                    break;
                case 40:
                    _y = y - snakeWidth;
                    break;
                }
                return { x: _x, y: _y };
            },
            /**
             * adds a snake part at the tail
             * @param {function} next a callback
             * @returns undefined
             */
            grow: function (next) {
                const { x, y } = this.getPositionOfNewPart();
                // const newPart = new SnakePart(this.arena, x, y, this.tail.direction, this.length + 1, this.tail.color);
                const newPart = createSnakePart(this.arena, x, y, this.tail.direction, this.length + 1, this.tail.color);
                this.length += 1;
                this.tail.next = newPart;
                newPart.prev = this.tail;
                this.tail = newPart;
                utils.getPositionUpdater().addObserver(this.tail);
                // drop food pellet
                if (typeof next === 'function') {
                    next();
                }
            },
            changeColor: function (colour) {
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
            },
            isEatingFood: function () {
                const food = utils.getSnakeFood();
                const { x: foodX, y: foodY } = food;
                if (this.head.x < foodX
                    && foodX < this.head.x2
                    && this.head.y < foodY
                    && foodY < this.head.y2) {
                    return true;
                }
                return false;
            },
            isEatingBonusFood: function () {
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
            },
            isEatingSpeedBonus: function () {
                const speedBonus = utils.getSpeedBonus();
                const { x, y } = speedBonus;
                if (this.head.x < x
                    && x < this.head.x2
                    && this.head.y < y
                    && y < this.head.y2) {
                    return true;
                }
                return false;
            },
            move: function (xvalue, yvalue) {
                const isGoingToEatSelf = this.isDevouringSelf();
                if (isGoingToEatSelf) {
                    utils.getGameEvents().emit('DEVOURED_SELF');
                    return;
                }
                const _part = this.head;
                let { x: nextX, y: nextY } = utils.checkBoundaryPosition(_part.direction, {
                    'x': _part.x + xvalue,
                    'y': _part.y + yvalue
                });
                _part.x = nextX;
                _part.y = nextY;
                const isEatingFood = this.isEatingFood();
                const isEatingBonusFood = this.isEatingBonusFood();
                const isEatingSpeedBonus = this.isEatingSpeedBonus();
                if (isEatingFood) {
                    utils.getGameEvents().emit('EATABLE_CONSUMED', utils.getSnakeFood());
                }
                if (isEatingSpeedBonus) {
                    utils.LOGGER.log('What a rush!');
                    utils.getGameEvents().emit('EATABLE_CONSUMED', utils.getSpeedBonus());
                    utils.getGameEvents().emit('USE_SPEED_BONUS', utils.getSpeedBonus());
                }
                if (isEatingBonusFood) {
                    utils.getGameEvents().emit('EATABLE_CONSUMED', utils.getSnakeBonusFood());
                }
                this.moveAllParts(isEatingFood);
            },
            moveAllParts: function (foodEaten) {
                if (this.length === 1) {
                    utils.getDirectionCommands().clear();
                }
                utils.getPositionUpdater().notify(foodEaten);
            },
            /**
             * @returns {boolean} indicates wether the snake is going to eat itself
             */
            isDevouringSelf: function () {
                let isDevouring = false;
                let nextPart = this.head.next;
                let snakeDirection = this.head.direction;
                while (nextPart !== null) {
                    // check for tail node and nodes which are traveliing in different direction than the head
                    if (nextPart.direction !== snakeDirection || nextPart.id === this.tail.id) {
                        switch (snakeDirection) {
                        case 37:
                            if (this.head.y === nextPart.y && this.head.x > nextPart.x && this.head.x <= nextPart.x2) {
                                isDevouring = true;
                            }
                            break;
                        case 38:
                            if (this.head.x === nextPart.x && this.head.y > nextPart.y && this.head.y <= nextPart.y2) {
                                isDevouring = true;
                            }
                            break;
                        case 39:
                            if (this.head.y === nextPart.y && this.head.x2 < nextPart.x2 && this.head.x2 >= nextPart.x) {
                                isDevouring = true;
                            }
                            break;
                        case 40:
                            if (this.head.x === nextPart.x && this.head.y2 < nextPart.y2 && this.head.y2 >= nextPart.y) {
                                isDevouring = true;
                            }
                            break;
                        }
                        if (isDevouring) {
                            break;
                        }
                    }
                    nextPart = nextPart.next;
                }
                return isDevouring;
            }
        };
    }

    function createSnakePart(arena, x, y, dirx, partNumber, color) {

        const id = `${snakeId}-part${partNumber}`;
        let direction = dirx;
        const element = utils.createHTMLElement({
            elementNamespace: utils.getSvgNamespace(),
            elementType: config.SNAKE.elemType,
            attributes: {
                id,
                tabIndex: partNumber,
                x,
                y,
                rx: snakeWidth,
                ry: snakeWidth,
                fill: color,
                width: utils.pixelify(snakeWidth),
                height: utils.pixelify(snakeWidth)
            },
            parent: arena
        });
        let next = null;
        let prev = null;

        return {
            id,
            element,
            color,
            get direction() {
                return direction;
            },
            set direction(d) {
                direction = d;
            },
            get next() {
                return next;
            },
            get prev() {
                return prev;
            },
            set next(element) {
                next = element;
            },
            set prev(element) {
                prev = element;
            },
            isSnakeHead: function () {
                return id === snakeId;
            },
            get x() {
                return parseInt(element.getAttribute('x'));
            },
            set x(value) {
                element.setAttribute('x', Math.floor(value));
            },
            get y() {
                return parseInt(element.getAttribute('y'));
            },
            set y(value) {
                element.setAttribute('y', Math.floor(value));
            },
            get x2() {
                return this.x + (snakeWidth - 1);
            },
            get y2() {
                return this.y + (snakeWidth - 1);
            },
            isTail: function () {
                return id === utils.getSnake().tail.id;
            },
            /**
             * method calculates the next coordinates for a part on each step
             * triggered for all new parts
             */
            nextXY: function () {
                let nextPosition = {
                    'x': this.x, 'y': this.y
                };
                // get coordinates for next step in the same direction
                switch (this.direction) {
                case 37:
                    nextPosition.x -= snakeStep;
                    break;
                case 38:
                    nextPosition.y -= snakeStep;
                    break;
                case 39:
                    nextPosition.x += snakeStep;
                    break;
                case 40:
                    nextPosition.y += snakeStep;
                    break;
                }
                nextPosition = utils.checkBoundaryPosition(this.direction, nextPosition);
                // change current position to the calculated next position
                this.x = nextPosition.x;
                this.y = nextPosition.y;
                const commandStack = utils.getDirectionCommands();
                // check if player game any direction commands
                if (commandStack.hasCommands()) {
                    const _command = commandStack.getNextTurn(id);
                    // change direction of this part when it reaches the position 
                    // at which the direction command was given
                    if (_command && _command.position.x == this.x && _command.position.y == this.y) {
                        this.direction = _command.direction; // set new direction
                        (utils.getSnakeDirectionMap())[id] = _command.id;
                        // remove the recorded command if the last part has followed the direction command
                        if (this.isTail()) {
                            commandStack.remove();
                        }
                    }
                }
            }
        };
    }

    return {
        Snake
    };
};