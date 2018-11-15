export default function (config, utils) {
    return class SnakeFoodBonus {
        constructor(arena, x, y, color = config.SNAKE_BONUS_FOOD.color, size = config.SNAKE_BONUS_FOOD.size) {
            if (!(utils.getSnakeBonusFood() instanceof SnakeFoodBonus)) {
                this.element = (() => {
                    let _e = utils.getDocument().createElementNS(utils.getSvgNamespace(), config.SNAKE_BONUS_FOOD.elemType);
                    _e.setAttribute('id', config.SNAKE_BONUS_FOOD.id);
                    _e.setAttribute('cx', x);
                    _e.setAttribute('cy', y);
                    _e.setAttribute('r', size);
                    _e.setAttribute('fill', color);
                    utils.getArena().insertBefore(_e, utils.getSnake().head.element);
                    return _e;
                })();
                this.arena = arena;
                [this.x2, this.y2] = [x + (config.SNAKE_BONUS_FOOD.size - 1), y + (config.SNAKE_BONUS_FOOD.size - 1)];
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
		/**
		 * @returns {Promise} resolved with an object containing x & y co-ordinates of the next bonus food 
		 */
        static getNextFoodPosition() {
            function getRandomX() {
                return Math.floor(Math.random() * (config.SNAKE_BONUS_FOOD.limits.x - config.SNAKE_BONUS_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
            }
            function getRandomY() {
                return Math.floor(Math.random() * (config.SNAKE_BONUS_FOOD.limits.y - config.SNAKE_BONUS_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
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
            if (!(utils.getSnakeBonusFood() instanceof SnakeFoodBonus)) {
                return;
            }
            SnakeFoodBonus.getNextFoodPosition().then(
                function (newPosition) {
                    utils.getSnakeBonusFood().x = newPosition.x;
                    utils.getSnakeBonusFood().y = newPosition.y;
                    // start timer to hide bonus food
                    setTimeout(utils.getSnakeBonusFood().hide, config.SNAKE_BONUS_FOOD.duration * 1000);
                }
            );
        }
        hide() {
            utils.getSnakeBonusFood().x = -100;
            utils.getSnakeBonusFood().y = -100;
        }
    }
};