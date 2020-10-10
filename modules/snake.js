export default function (config, utils, gameInstance) {

    const {
        color: snakeColor,
        width: snakeWidth,
        step: snakeStep,
        id: snakeId,
        directionMap,
    } = config.SNAKE;

    const {
        points: snakeFoodValue
    } = config.SNAKE_FOOD;

    const {
        size: bonusFoodSize,
        points: bonusFoodPoints,
    } = config.SNAKE_BONUS_FOOD;

    class Snake {
        constructor(arena, startX, startY, direction, speed, color = snakeColor) {
            this.length = 1;
            // this.head = new SnakePart(arena, startX, startY, direction, this.length, color);
            this.head = createSnakePart(arena, startX, startY, direction, this.length, color, this);
            this.tail = this.head;
            this.arena = arena;
            this.speed = speed;
            this.turningPoints = [];
            this.intervalId;
            this.currentDirection = direction;
        }
        UP() {
            this.move(0, snakeStep * -1);
        }
        DOWN() {
            this.move(0, snakeStep);
        }
        RIGHT() {
            this.move(snakeStep, 0);
        }
        LEFT() {
            this.move(snakeStep * -1, 0);
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
        start() {
            this[directionMap[String(this.head.direction)]]();
        }
        /**
         * adds a snake part at the tail
         * @param {function} next a callback
         * @returns undefined
         */
        grow(next) {
            const { x, y } = this.getPositionOfNewPart();
            // const newPart = new SnakePart(this.arena, x, y, this.tail.direction, this.length + 1, this.tail.color);
            const newPart = createSnakePart(this.arena, x, y, this.tail.direction, this.length + 1, this.tail.color);
            this.length += 1;
            this.tail.next = newPart;
            newPart.prev = this.tail;
            this.tail = newPart;
            utils.getPositionUpdater().addObserver(this.tail);
            utils.incrementScore(snakeFoodValue);
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
        isEatingSpeedBonus() {
            const speedBonus = utils.getSpeedBonus();
            const { x, y } = speedBonus;
            if (this.head.x < x
                && x < this.head.x2
                && this.head.y < y
                && y < this.head.y2) {
                speedBonus.hide();
                return true;
            }
            return false;
        }
        move(xvalue, yvalue) {
            const isGoingToEatSelf = this.isDevouringSelf();
            if (isGoingToEatSelf) {
                utils.LOGGER.warn('You ate yourself');
                gameInstance.stop();
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
            if (isEatingSpeedBonus) {
                utils.LOGGER.log('What a rush!');
            }
            if (isEatingBonusFood) {
                utils.getSnakeBonusFood().hide();
                utils.incrementScore(bonusFoodPoints);
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
        isDevouringSelf() {
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
        getPositionOfNewPart() {
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
        }
    };

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
            get direction() { return direction; },
            set direction(d) { direction = d; },
            get next() { return next; },
            get prev() { return prev; },
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

    // class SnakePart {
    //     constructor(arena, x, y, dirx, partNumber, color) {
    //         this.id = `${snakeId}-part${partNumber}`;
    //         this.direction = dirx;
    //         this.element = utils.createHTMLElement({
    //             elementNamespace: utils.getSvgNamespace(),
    //             elementType: config.SNAKE.elemType,
    //             attributes: {
    //                 id: this.id,
    //                 tabIndex: partNumber,
    //                 x,
    //                 y,
    //                 rx: snakeWidth,
    //                 ry: snakeWidth,
    //                 fill: color,
    //                 width: utils.pixelify(snakeWidth),
    //                 height: utils.pixelify(snakeWidth)
    //             },
    //             parent: arena
    //         });
    //         this.color = color;
    //         this.next = null;
    //         this.prev = null;
    //     }
    //     isSnakeHead() {
    //         return this.id === snakeId;
    //     }
    //     get x() {
    //         return parseInt(this.element.getAttribute('x'));
    //     }
    //     set x(value) {
    //         this.element.setAttribute('x', Math.floor(value));
    //     }
    //     get y() {
    //         return parseInt(this.element.getAttribute('y'));
    //     }
    //     set y(value) {
    //         this.element.setAttribute('y', Math.floor(value));
    //     }
    //     get x2() {
    //         return this.x + (snakeWidth - 1);
    //     }
    //     get y2() {
    //         return this.y + (snakeWidth - 1);
    //     }
    //     isTail() {
    //         return this.id === utils.getSnake().tail.id;
    //     }
    //     /**
    //      * method calculates the next coordinates for a part on each step
    //      */
    //     nextXY() {
    //         let nextPosition = {
    //             'x': this.x, 'y': this.y
    //         }
    //         switch (this.direction) {
    //             case 37:
    //                 nextPosition.x -= snakeStep;
    //                 break;
    //             case 38:
    //                 nextPosition.y -= snakeStep;
    //                 break;
    //             case 39:
    //                 nextPosition.x += snakeStep;
    //                 break;
    //             case 40:
    //                 nextPosition.y += snakeStep;
    //                 break;
    //         }
    //         nextPosition = utils.checkBoundaryPosition(this.direction, nextPosition);
    //         this.x = nextPosition.x;
    //         this.y = nextPosition.y;
    //         if (utils.getDirectionCommands().hasCommands()) {
    //             let _command = utils.getDirectionCommands().getNextTurn(this.id);
    //             if (_command && _command.position.x == this.x && _command.position.y == this.y) {
    //                 this.direction = _command.direction;
    //                 (utils.getSnakeDirectionMap())[this.id] = _command.id;
    //                 if (this.isTail()) {
    //                     utils.getDirectionCommands().remove();
    //                 }
    //             }
    //         }
    //     }
    //     getPositionOfNewPart() {
    //         let [_x, _y] = [this.x, this.y];
    //         switch (this.direction) {
    //             case 37:
    //                 _x += snakeWidth;
    //                 break;
    //             case 38:
    //                 _y += snakeWidth;
    //                 break;
    //             case 39:
    //                 _x -= snakeWidth;
    //                 break;
    //             case 40:
    //                 _y -= snakeWidth;
    //                 break;
    //         }
    //         return { x: _x, y: _y };
    //     }
    // }

    return {
        Snake
    };
};