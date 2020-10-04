export default function (config, utils) {
    return class SnakeFoodBonus {
        constructor(arena, cx, cy, color = config.SNAKE_BONUS_FOOD.color, size = config.SNAKE_BONUS_FOOD.size) {
            this.element = utils.createHTMLElement({
                elementNamespace: utils.getSvgNamespace(),
                elementType: config.SNAKE_BONUS_FOOD.elemType,
                beforeElement: utils.getSnake().head.element,
                parent: utils.getArena(),
                attributes: {
                    id: config.SNAKE_BONUS_FOOD.id,
                    cx,
                    cy,
                    r: size,
                    fill: color
                }
            });
            this.arena = arena;
            [this.x2, this.y2] = [cx + (config.SNAKE_BONUS_FOOD.size - 1), cy + (config.SNAKE_BONUS_FOOD.size - 1)];
            this.intervalId;
        }
        startBonusFood() {
            this.intervalId = setInterval(
                () => { this.drop(); },
                config.SNAKE_BONUS_FOOD.startAfter * 1000
            );
            return this.intervalId;
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
                return Math.floor(Math.random() * (config.SNAKE_BONUS_FOOD.limits.x - config.SNAKE_BONUS_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
            }
            function getRandomY() {
                return Math.floor(Math.random() * (config.SNAKE_BONUS_FOOD.limits.y - config.SNAKE_BONUS_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
            }
            // return new Promise(function (resolve, reject) {
            let _x, _y;
            const snakeWidth = config.SNAKE.width;
            // let interval;
            do {
                [_x, _y] = [getRandomX(), getRandomY()];
            } while (_x % snakeWidth !== 0 && _y % snakeWidth !== 0);
            return { x: _x + 2, y: _y + 2 };
            // interval = setInterval(function (multipleOf, res, rej) {
            //     try {
            //         if (_x % multipleOf === 0 && _y % multipleOf === 0) {
            //             utils.getWindow().clearInterval(interval);
            //             res({
            //                 x: _x + 2, y: _y + 2
            //             });
            //         } else {
            //             [_x, _y] = [getRandomX(), getRandomY()];
            //         }
            //     } catch (e) {
            //         reject(e);
            //     }

            // }, 0, config.SNAKE.width, resolve, reject);
            // });
        }
        async drop() {
            const { x, y } = await SnakeFoodBonus.getNextFoodPosition();
            this.x = x;
            this.y = y;
            // start timer to hide bonus food
            setTimeout(() => { this.hide(); }, config.SNAKE_BONUS_FOOD.duration * 1000);
        }
        hide() {
            this.x = -100;
            this.y = -100;
        }
    }
};