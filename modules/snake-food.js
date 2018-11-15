export default function (config, utils) {
    return class SnakeFood {
        constructor(arena, x, y, color = config.SNAKE_FOOD.color, size = config.SNAKE_FOOD.size) {
            if (!(utils.getSnakeFood() instanceof SnakeFood)) {
                this.element = (() => {
                    let _e = utils.getDocument().createElementNS(utils.getSvgNamespace(), config.SNAKE_FOOD.elemType);
                    _e.setAttribute('id', config.SNAKE_FOOD.id);
                    _e.setAttribute('cx', x);
                    _e.setAttribute('cy', y);
                    _e.setAttribute('r', size);
                    _e.setAttribute('fill', color);
                    utils.getArena().insertBefore(_e, utils.getSnake().head.element);
                    return _e;
                })();
                this.arena = arena;
                [this.x2, this.y2] = [x + (config.SNAKE_FOOD.size - 1), y + (config.SNAKE_FOOD.size - 1)];
            }
        }
        get x() {
            return parseInt(this.element.getAttribute('cx'));
        }
        set x(value) {
            this.element.setAttribute('cx', Math.floor(value));
        }
        get y() {
            return parseInt(this.element.getAttribute('cy'));
        }
        set y(value) {
            this.element.setAttribute('cy', Math.floor(value));
        }
        static getNextFoodPosition() {
            function getRandomX() {
                return Math.floor(Math.random() * (config.SNAKE_FOOD.limits.x - config.SNAKE_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
            }
            function getRandomY() {
                return Math.floor(Math.random() * (config.SNAKE_FOOD.limits.y - config.SNAKE_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
            }
            return new Promise(function (resolve, reject) {
                let [_x, _y] = [getRandomX(), getRandomY()];
                let interval;
                interval = setInterval(function (multipleOf, res, rej) {
                    try {
                        if (_x % multipleOf === 0 && _y % multipleOf === 0) {
                            utils.getWindow().clearInterval(interval);
                            res({
                                x: _x + 2, y: _y + 2
                            });
                        } else {
                            [_x, _y] = [getRandomX(), getRandomY()];
                        }
                    } catch (e) {
                        reject(e);
                    }

                }, 0, config.SNAKE.width, resolve, reject);
            });
        }
        drop() {
            let food = utils.getSnakeFood();
            if (!(food instanceof SnakeFood)) {
                return;
            }
            SnakeFood.getNextFoodPosition().then(
                newPosition => {
                    food.x = newPosition.x;
                    food.y = newPosition.y;
                }
            );
        }
        hide() {
            this.x = -10;
            this.y = -10;
        }
    }
};