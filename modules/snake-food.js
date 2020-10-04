export default function (config, utils) {
    return class SnakeFood {
        constructor(arena, cx, cy, color = config.SNAKE_FOOD.color, size = config.SNAKE_FOOD.size) {

            this.element = utils.createHTMLElement({
                elementType: config.SNAKE_FOOD.elemType,
                elementNamespace: utils.getSvgNamespace(),
                attributes: {
                    id: config.SNAKE_FOOD.id,
                    cx,
                    cy,
                    r: size,
                    fill: color
                },
                parent: utils.getArena(),
                beforeElement: utils.getSnake().head.element
            });
            this.arena = arena;
            [this.x2, this.y2] = [cx + (config.SNAKE_FOOD.size - 1), cy + (config.SNAKE_FOOD.size - 1)];
        }
        static getNextFoodPosition() {
            function getRandomX() {
                return Math.floor(Math.random() * (config.SNAKE_FOOD.limits.x - config.SNAKE_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
            }
            function getRandomY() {
                return Math.floor(Math.random() * (config.SNAKE_FOOD.limits.y - config.SNAKE_FOOD.size)) + utils.getArenaConfig().borderWidth + 1;
            }
            let _x, _y;
            const snakeWidth = config.SNAKE.width;
            do {
                [_x, _y] = [getRandomX(), getRandomY()];
            } while (_x % snakeWidth !== 0 && _y % snakeWidth !== 0);
            return {
                x: _x + 2,
                y: _y + 2
            };
            // return new Promise((resolve, reject) => {
            //     let [_x, _y] = [getRandomX(), getRandomY()];
            //     let interval;
            //     interval = setInterval(function (multipleOf, res, rej) {
            //         try {
            //             if (_x % multipleOf === 0 && _y % multipleOf === 0) {
            //                 utils.getWindow().clearInterval(interval);
            //                 res({
            //                     x: _x + 2,
            //                     y: _y + 2
            //                 });
            //             } else {
            //                 [_x, _y] = [getRandomX(), getRandomY()];
            //             }
            //         } catch (e) {
            //             reject(e);
            //         }

            //     }, 0, config.SNAKE.width, resolve, reject);
            // });
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
        drop() {
            const { x, y } = SnakeFood.getNextFoodPosition();
            this.x = x;
            this.y = y;
        }
        hide() {
            this.x = -10;
            this.y = -10;
        }
    }
};