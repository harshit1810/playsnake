export default function (config, utils) {
    return class SnakePart {
        constructor(arena, x, y, dirx, color) {
            let snakeLen = utils.getSnake().length;
            this.id = (typeof snakeLen !== 'undefined' ? config.SNAKE.id + '-part' + (utils.getSnake().length + 1) : config.SNAKE.id);
            this.direction = dirx;
            this.element = (() => {
                let _elem = utils.getDocument().createElementNS(utils.getSvgNamespace(), config.SNAKE.elemType);
                _elem.setAttribute('id', this.id);
                _elem.setAttribute('tabIndex', snakeLen);
                _elem.setAttribute('x', x);
                _elem.setAttribute('y', y);
                _elem.setAttribute('rx', config.SNAKE.width);
                _elem.setAttribute('ry', config.SNAKE.width);
                _elem.setAttribute('fill', color);
                _elem.setAttribute('width', utils.pixelify(config.SNAKE.width));
                _elem.setAttribute('height', utils.pixelify(config.SNAKE.width));
                arena.appendChild(_elem);
                return _elem;
            })();
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
};