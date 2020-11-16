export default function (utils) {
    const config = utils.getConfig();

    const {
        elemType: snakeElementType,
        color: snakeColor,
        width: snakeWidth,
        step: snakeStep,
        id: snakeId,
    } = config.snake;

    function Snake(arena, startX, startY, direction, speed) {
        let length = 1;
        let color = snakeColor;
        let currentDirection = direction;
        let head = createSnakePart(arena, startX, startY, currentDirection, length);
        let tail = head;
        let intervalId;
        const bodyParts = [head];

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
                const direction = config.directionMap[this.head.direction];
                switch (direction) {
                case 'UP':
                    this.move(0, snakeStep * -1);
                    break;
                case 'DOWN':
                    this.move(0, snakeStep);
                    break;
                case 'RIGHT':
                    this.move(snakeStep, 0);
                    break;
                case 'LEFT':
                    this.move(snakeStep * -1, 0);
                    break;
                }
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
            },
            changeColor: function (colour) {
                let _part = this.head;
                const change = (_part, clr) => {
                    setTimeout(() => _part.color = clr, 0);
                };

                while (_part.next !== null) {
                    change(_part, colour);
                    _part = _part.next;
                }
            },
            isEatingEatable: function (food) {
                return utils.intersectingOnXAxis(
                    { x1: this.head.x, x2: this.head.x2 }, 
                    { x1: food.x, x2: food.x2 }
                ) && utils.intersectingOnYAxis(
                    { y1: this.head.y, y2: this.head.y2 }, 
                    { y1: food.y, y2: food.y2 }
                );
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

                [
                    utils.getGame().getBasicFood(), 
                    utils.getGame().getSnakeBonusFood(),
                    utils.getGame().getSpeedBonusFood()
                ].map(eatable => {
                    if(!this.isEatingEatable(eatable)) {
                        return; 
                    }
                    utils.getGameEvents().emit('EATABLE_CONSUMED', eatable);    
                    if (eatable.getCode() === config.eatables.speedBonus.code) {
                        utils.getGameEvents().emit(
                            'USE_SPEED_BONUS',
                            utils.getGame().getSpeedBonusFood()
                        );
                    }
                });

                this.moveAllParts();
            },
            moveAllParts: function () {
                if (this.length === 1) {
                    utils.getDirectionCommands().clear();
                }
                const parts = this.bodyParts;
                for (let i = 0; i < parts.length; i++) {
                    if (!parts[i].isHead) {
                        parts[i].nextXY();
                    }
                }
            },
            /**
             * check whether the snake is eating itself or not
             * @returns {boolean}
             */
            isDevouringSelf: function () {
                let isDevouring = false;
                // snake's head cannot eat the next part
                if (this.length <= 2) {
                    return isDevouring;
                }
                let nextPart = this.head.next.next;
                const { x: hx, y: hy } = this.head.getCenter();
                
                while (nextPart !== null && !isDevouring) {
                    const { x: cx, y: cy } = nextPart.getCenter();
                    // get the coordinates for the medians of the circle
                    const [cx1, cx2, cy1, cy2] = [
                        cx - (nextPart.radius - 1),
                        cx + (nextPart.radius - 1),
                        cy - (nextPart.radius - 1),
                        cy + (nextPart.radius - 1)
                    ];
                    const isEatingHorizontally = cx1 <= hx && hx <= cx2;
                    const isEatingVertically = cy1 <= hy && hy <= cy2;
                    isDevouring = isEatingHorizontally && isEatingVertically;
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
        const [cx, cy] = [x + (radius - 1), y + (radius - 1)];
        const element = utils.createHTMLElement({
            elementNamespace: utils.getSvgNamespace(),
            elementType: snakeElementType,
            attributes: { id, cx, cy, r: radius, fill: color },
            parent: arena
        });
        let direction = dirx,
            next = null,
            prev = null;

        return {
            id,
            element,
            color,
            radius,
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
                element.setAttribute('cx', value + (radius - 1));
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
            getCenter: function () {
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
                    x: self.x,
                    y: self.y
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