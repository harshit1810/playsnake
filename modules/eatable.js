export default function (utils) {

    const config = utils.getConfig();

    function createEatableItem(arena, cx, cy, code) {

        if (!config.eatables[code]) {
            return utils.LOGGER.warn(`item ${code} is not configured`);
        }
        const { limits } = config.eatables;
        const {
            id,
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
            attributes: { id, cx, cy, r: size, fill: color },
            parent: utils.getGame().arena,
            beforeElement: utils.getGame().getSnake().head.element
        });
        const radius = size;
        // used if this eatable is interval based
        let intervalId, _isHidden = true;

        return {
            radius,
            get isIntervalBased() {
                return isIntervalBased;
            },
            get element() {
                return element;
            },
            get arena() {
                return arena;
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
            get x() {
                return this.getCenter().x - (radius - 1);
            },
            get y() {
                return this.getCenter().y - (radius - 1);
            },
            get x2() {
                return this.getCenter().x + (radius - 1);
            },
            get y2() {
                return this.getCenter().y + (radius - 1);
            },
            get points() {
                return parseInt(points);
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
            get isHidden() {
                return _isHidden;
            },
            set isHidden(b) {
                _isHidden = b;
            },
            getCode: function () {
                return code;
            },
            getCenter: function () {
                return {
                    x: parseInt(this.element.getAttribute('cx')),
                    y: parseInt(this.element.getAttribute('cy'))
                };
            },
            setCenter: function ({ x, y }) {
                this.element.setAttribute('cx', x);
                this.element.setAttribute('cy', y);
            },
            startInterval: function () {
                const self = this;
                if (!self.isIntervalBased) {
                    return;
                }
                // emit drop event to show interval based eatables
                self.intervalId = setInterval(
                    () => utils.getGameEvents().emit('DROP_EATABLE', self),
                    self.startAfter * 1000
                );
                return self.intervalId;
            },
            drop: function (invalidPositions = []) {
                const self = this;
                const { x, y } = getNextEatablePosition(limits, invalidPositions);
                self.setCenter({ x, y });
                self.isHidden = false;
                // if this eatable is configured to appear for some amount of time
                // schedule it's removal
                if (typeof self.appearDuration === 'number') {
                    setTimeout(self.hide.bind(self), self.appearDuration * 1000);
                }
            },
            hide: function () {
                this.setCenter({ x: -10, y: -10 });
                this.isHidden = true;
            }
        };
    }

    function getNextEatablePosition(limits, invalidPositions) {
        let x, y, x1, y1, x2, y2;
        invalidPositions = invalidPositions || [
            { x1: 0, x2: 0 },
            { y1: 0, y2: 0 }
        ];
        const radius = config.eatables.eatableRadius;
        do {
            [x, y] = [
                utils.getRandomInRange(limits.x1, limits.x2), 
                utils.getRandomInRange(limits.y1, limits.y2)
            ];
            [x1, y1, x2, y2] = [
                x - (radius - 1), y - (radius - 1),
                x + (radius - 1), y + (radius - 1)
            ];
        } while (
            invalidPositions.every(pos => {
                !utils.intersectingOnXAxis({ x1, x2 }, { x1: pos.x1, x2: pos.x2 }) &&
                !utils.intersectingOnYAxis({ y1, y2 }, { y1: pos.y1, y2: pos.y2 })
            })
        );
        return { x, y };
    }

    return {
        getNextEatablePosition,
        createEatableItem
    };
}