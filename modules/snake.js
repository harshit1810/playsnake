export default function (utils) {
    const config = utils.getArenaConfig();
    
    const {
        elemType: snakeElementType,
        color: snakeColor,
        width: snakeWidth,
        step: snakeStep,
        id: snakeId,
    } = config.snake;

    const {
        size: bonusFoodSize,
    } = config.eatables.bonusFood;

    const directionMap = config.directionMap;

    function Snake(arena, startX, startY, direction, speed) {
        let length = 1;
        let color = snakeColor;
        let currentDirection = direction;
        let head = createSnakePart(arena, startX, startY, currentDirection, length);
        let tail = head;
        let intervalId;
        const bodyParts = [ head ];

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
                tail = t;
                this.length += 1;
                return tail;
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
            get bodyParts() {
                return bodyParts;
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
                newSpeed = typeof newSpeed === 'number'
                    ? newSpeed
                    : this.speed;
                self.intervalId = setInterval(function () {
                    self.changeDirection(self.currentDirection);
                    self.start();
                }, newSpeed);
                return self.intervalId;
            },
            changeDirection: function (newDirection) {
                this.head.direction = typeof newDirection === 'number'
                    ? newDirection
                    : this.currentDirection;
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
            grow: function (growLength = 1) {
                const self = this;
                for (let count = 1; count <= growLength; count++) {
                    const { x, y } = self.getPositionOfNewPart();
                    self.bodyParts.push(
                        createSnakePart(
                            self.arena, x, y, self.tail.direction, self.length + 1
                        )
                    );
                    const newPart = self.bodyParts[self.bodyParts.length - 1];
                    self.tail.next = newPart;
                    newPart.prev = self.tail;
                    self.tail = newPart;
                }
                utils.getGame().getBasicFood().drop();
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
                const food = utils.getGame().getBasicFood();
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
                const { x: bonusFoodX, y: bonusFoodY } = utils.getGame().getSnakeBonusFood();
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
                const _speed_bonus = utils.getGame().getSpeedBonusFood();
                const { x, y } = _speed_bonus;
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
                    x: _part.x + xvalue,
                    y: _part.y + yvalue
                });
                _part.x = nextX;
                _part.y = nextY;
                const isEatingBasicFood = this.isEatingFood();
                const isEatingBonusFood = this.isEatingBonusFood();
                const isEatingSpeedBonus = this.isEatingSpeedBonus();
                this.moveAllParts();
                if (isEatingBasicFood) {
                    utils.getGameEvents().emit('EATABLE_CONSUMED', utils.getGame().getBasicFood());
                } else if (isEatingSpeedBonus) {
                    utils.getGameEvents().emit(
                        'EATABLE_CONSUMED',
                        utils.getGame().getSpeedBonusFood()
                    );
                    utils.getGameEvents().emit(
                        'USE_SPEED_BONUS',
                        utils.getGame().getSpeedBonusFood()
                    );
                } else if (isEatingBonusFood) {
                    utils.getGameEvents().emit(
                        'EATABLE_CONSUMED',
                        utils.getGame().getSnakeBonusFood()
                    );
                }
            },
            moveAllParts: function () {
                if (this.length === 1) {
                    utils.getDirectionCommands().clear();
                }
                const parts = this.bodyParts;
                for (let i = 0 ; i < parts.length ; i++) {
                    if (!parts[i].isHead) {
                        parts[i].nextXY();
                    }
                }
            },
            /**
             * @returns {boolean} indicates wether the snake is going to eat itself
             */
            isDevouringSelf: function () {
                let isDevouring = false;
                let nextPart = this.head.next;
                let snakeDirection = this.head.direction;
                while (nextPart !== null) {
                    // check for tail node and nodes which are 
                    // travelling in different direction than the head
                    if (nextPart.direction !== snakeDirection || nextPart.id === this.tail.id) {
                        switch (snakeDirection) {
                        case 37:
                            if (this.head.y === nextPart.y &&
                                    this.head.x > nextPart.x &&
                                    this.head.x <= nextPart.x2) {
                                isDevouring = true;
                            }
                            break;
                        case 38:
                            if (this.head.x === nextPart.x &&
                                    this.head.y > nextPart.y &&
                                    this.head.y <= nextPart.y2) {
                                isDevouring = true;
                            }
                            break;
                        case 39:
                            if (this.head.y === nextPart.y &&
                                    this.head.x2 < nextPart.x2 &&
                                    this.head.x2 >= nextPart.x) {
                                isDevouring = true;
                            }
                            break;
                        case 40:
                            if (this.head.x === nextPart.x &&
                                    this.head.y2 < nextPart.y2 &&
                                    this.head.y2 >= nextPart.y) {
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

    function createSnakePart(arena, x, y, dirx, partNumber, color = snakeColor) {

        const isHead = partNumber === 1;
        const id = `${snakeId}-part${partNumber}`;
        const radius = snakeWidth / 2;
        let direction = dirx;
        const [cx, cy] = [x + (radius - 1), y + (radius - 1)];
        const element = utils.createHTMLElement({
            elementNamespace: utils.getSvgNamespace(),
            elementType: snakeElementType,
            attributes: {
                id,
                cx,
                cy,
                r: radius,
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
            get x() {
                return this.getCenter().x - (radius - 1);
            },
            set x(value) {
                element.setAttribute('cx', value + (radius-1));
            },
            get y() {
                return this.getCenter().y - (radius - 1);
            },
            set y(value) {
                element.setAttribute('cy', value + (radius - 1));
            },
            get x2() {
                return this.getCenter().x + (radius - 1);
            },
            get y2() {
                return this.getCenter().y + (radius - 1);
            },
            get isHead() {
                return isHead;
            },
            isTail: function () {
                return id === utils.getGame().getSnake().tail.id;
            },
            getCenter: function() {
                return {
                    x: parseInt(this.element.getAttribute('cx')),
                    y: parseInt(this.element.getAttribute('cy'))
                };
            },
            /**
             * calculate the next coordinates for a part on each step.
             * is triggered for all parts
             */
            nextXY: function () {
                const self = this;
                let nextPosition = {
                    x: self.x, y: self.y
                };
                // get coordinates for next step in the same direction
                switch (self.direction) {
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
                utils.checkBoundaryPosition(self.direction, nextPosition);
                // change current position to the calculated next position
                self.x = nextPosition.x;
                self.y = nextPosition.y;
                const commandStack = utils.getDirectionCommands();
                // check if player game any direction commands
                if (commandStack.hasCommands()) {
                    const _command = commandStack.getNextTurn(id);
                    const currentCenter = self.getCenter();
                    // change direction of this part when it reaches the position 
                    // at which the direction command was given
                    if (_command && _command.position.x == currentCenter.x &&
                        _command.position.y == currentCenter.y) {
                        // set new direction
                        self.direction = _command.direction;
                        (utils.getSnakeDirectionMap())[id] = _command.id;
                        // remove the recorded command 
                        // if the last part has followed the direction command
                        if (self.isTail()) {
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