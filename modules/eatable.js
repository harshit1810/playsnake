export default function (utils) {

    const config = utils.getConfig();

    const {
        width: snakeWidth
    } = config.snake;

    function createEatableItem(arena, cx, cy, code) {

        if (!config.eatables[code]) {
            return utils.LOGGER.warn(`item ${code} is not configured`);
        }
        const {
            id,
            limits,
            elemType,
            color,
            size,
            isIntervalBased,
            startAfter,
            points,
            appearDuration,
            growSnakeIfConsumed,
            growSnakeByLength
        } = config.eatables[code];

        const element = utils.createHTMLElement({
            elementType: elemType,
            elementNamespace: utils.getSvgNamespace(),
            attributes: {
                id,
                cx,
                cy,
                r: size,
                fill: color
            },
            parent: utils.getGame().arena,
            beforeElement: utils.getGame().getSnake().head.element
        });
        let [x2, y2] = [cx + (size - 1), cy + (size - 1)];
        // used if this eatable is interval based
        let intervalId;

        return {
            get isIntervalBased() {
                return isIntervalBased;
            },
            get element() {
                return element;
            },
            get arena() {
                return arena;
            },
            get limits() {
                return limits;
            },
            get intervalId() {
                return intervalId;
            },
            set intervalId(i) {
                intervalId = i;
            },
            get startAfter() {
                return startAfter;
            },
            get size() {
                return size;
            },
            get x2() {
                return x2;
            },
            set x2(v) {
                x2 = v;
            },
            get y2() {
                return y2;
            },
            set y2(v) {
                y2 = v;
            },
            get points() {
                return parseInt(points);
            },
            get x() {
                return parseInt(this.element.getAttribute('cx'));
            },
            set x(value) {
                this.element.setAttribute('cx', Math.floor(value));
            },
            get y() {
                return parseInt(this.element.getAttribute('cy'));
            },
            set y(value) {
                this.element.setAttribute('cy', Math.floor(value));
            },
            get appearDuration() {
                return appearDuration;
            },
            get growSnakeIfConsumed() {
                return growSnakeIfConsumed;
            },
            get growSnakeByLength() {
                return growSnakeByLength;
            },
            startInterval: function () {
                const self = this;
                if (!self.isIntervalBased) {
                    return;
                }
                self.intervalId = setInterval(
                    self.drop.bind(self),
                    self.startAfter * 1000
                );
                return self.intervalId;
            },
            drop: function () {
                const { x, y } = getNextEatablePosition(this.limits, this.size);
                this.x = x;
                this.y = y;
                // if this eatable is configured to appear for some amount of time
                // schedule it's removal
                if (typeof this.appearDuration === 'number') {
                    setTimeout(this.hide.bind(this), this.appearDuration * 1000);
                }
            },
            hide: function () {
                this.x = -10;
                this.y = -10;
            }
        };
    }

    /**
     * 
     * @param {Object} limits 
     * @param {number} limits.x
     * @param {number} limits.y
     * @param {number} foodSize
     */
    function getNextEatablePosition(limits, foodSize) {
        function getRandomX() {
            return Math.floor(Math.random() * (limits.x - foodSize)) +
                config.borderWidth + 1;
        }
        function getRandomY() {
            return Math.floor(Math.random() * (limits.y - foodSize)) +
                config.borderWidth + 1;
        }
        let _x, _y;
        do {
            [_x, _y] = [getRandomX(), getRandomY()];
        } while (_x % snakeWidth !== 0 && _y % snakeWidth !== 0);
        return {
            x: _x + 2,
            y: _y + 2
        };
    }

    return {
        getNextEatablePosition,
        createEatableItem
    };
}