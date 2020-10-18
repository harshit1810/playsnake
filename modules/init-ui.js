export default function () {

    const onWindowLoad = function (arg) {
        const {
            arenaMaxSize,
            arenaId
        } = arg;

        const arena = document.getElementById(arenaId);
        const ARENA_WIDTH = Math.floor(arena.clientWidth) < arenaMaxSize
            ? Math.floor(arena.clientWidth)
            : arenaMaxSize;
        const ARENA_HEIGHT = ARENA_WIDTH + Math.floor(0.25 * ARENA_WIDTH);

        arena.setAttribute('width', ARENA_WIDTH);
        arena.setAttribute('height', ARENA_HEIGHT);

        return {
            ARENA_WIDTH,
            ARENA_HEIGHT
        };
    };

    const setupGame = function (utils) {
        const Styles = {
            FlexCols: {
                display: 'flex',
                'flex-direction': 'row'
            },
            CapitalizeText: {
                'text-transform': 'capitalize'
            },
            ZeroPixels: utils.pixelify(0),
            Padding: utils.pixelify(5)
        };
        const arenaConfig = utils.getConfig();
        const directionMap = Object.keys(arenaConfig.directionMap)
            .reduce((acc, keyCode) => {
                const direction = arenaConfig.directionMap[keyCode];
                acc[direction] = keyCode;
                return acc;
            }, {
                UP: null,
                DOWN: null,
                RIGHT: null,
                LEFT: null
            });

        try {

            const PAUSE_BUTTON = (() => {
                const btn = document.getElementById(arenaConfig.pauseButton.id);
                btn.addEventListener('click', () => {
                    utils.getGameEvents().emit('PAUSE_BUTTON_CLICKED');
                });
                return btn;
            })();

            const PLAY_BUTTON = (() => {
                const btn = document.getElementById(arenaConfig.resumeButton.id);
                btn.addEventListener('click', () => {
                    utils.getGameEvents().emit('RESUME_BUTTON_CLICKED');
                });
                return btn;
            })();

            (() => {
                const _legend_container = document.getElementById('legend-container');
                // create legend keys
                try {
                    const {
                        eatables = {}
                    } = arenaConfig;
                    Object.keys(eatables).forEach(eatableName => {
                        const {
                            description,
                            showInLegend,
                            color = 'white'
                        } = eatables[eatableName];
                        if (!showInLegend || !description) {
                            return;
                        }
                        const legend = utils.createHTMLElement({
                            parent: _legend_container,
                            elementType: 'div',
                            attributes: {
                                style: utils.getStyleString(Object.assign({}, Styles.FlexCols, {
                                    'margin-bottom': utils.pixelify(5),
                                    'align-items': 'center',
                                    border: `${utils.pixelify(1)} solid grey`,
                                    padding: Styles.Padding + ' ' + Styles.Padding
                                }))
                            }
                        });
                        utils.createHTMLElement({
                            parent: legend,
                            elementType: 'div',
                            attributes: {
                                style: utils.getStyleString({
                                    height: utils.pixelify(10),
                                    width: utils.pixelify(10),
                                    'background-color': color,
                                    'border-radius': utils.pixelify(5)
                                })
                            }
                        });
                        utils.createHTMLElement({
                            parent: legend,
                            elementType: 'span',
                            innerHTML: description,
                            attributes: {
                                style: utils.getStyleString(Object.assign(
                                    {},
                                    Styles.CapitalizeText,
                                    {
                                        padding: `${Styles.ZeroPixels} ${utils.pixelify(2)}`
                                    })
                                )
                            }
                        });

                    });
                } catch (e) {
                    utils.LOGGER.warn(`Failed while drawing legend: ${e}`);
                }
                return _legend_container;
            })();

            const SCORE_BOARD = document.getElementById('score');

            // eslint-disable-next-line no-unused-vars
            const arenaContainer = (() => {
                let initialTouchPos;
                const elem = document.getElementById('arena-section');
                elem.addEventListener('touchstart', event => {
                    event.preventDefault();
                    if (event.touches && event.touches.length > 1) {
                        return;
                    }
                    const point = {};
                    if (event.targetTouches) {
                        point.x = event.targetTouches[0].clientX;
                        point.y = event.targetTouches[0].clientY;
                    }
                    initialTouchPos = point;
                }, true);
                elem.addEventListener('touchmove', event => {
                    event.preventDefault();
                }, true);
                elem.addEventListener('touchend', event => {
                    event.preventDefault();
                    const [x1, y1] = [parseInt(initialTouchPos.x), parseInt(initialTouchPos.y)];
                    initialTouchPos = null;
                    const touchList = event.changedTouches;
                    const lastTouch = touchList[0];
                    const [x2, y2] = [parseInt(lastTouch.clientX), parseInt(lastTouch.clientY)];
                    if (x1 === x2 && y1 === y2) {
                        // did not swipe
                        return;
                    }
                    const xdistance = x2 - x1;
                    const ydistance = y2 - y1;
                    if (Math.abs(xdistance) === Math.abs(ydistance)) {
                        // swiped diagonal
                        return;
                    }
                    if (xdistance === 0) {
                        if (ydistance > 0) {
                            // swiped down
                            utils.getGameEvents().emit(
                                'SNAKE_DIRECTION_CHANGE',
                                { direction: directionMap.DOWN }
                            );
                            return;
                        }
                        // swiped up
                        utils.getGameEvents().emit(
                            'SNAKE_DIRECTION_CHANGE',
                            { direction: directionMap.UP }
                        );
                        return;

                    } else if (ydistance === 0) {
                        if (xdistance > 0) {
                            //swiped right
                            utils.getGameEvents().emit(
                                'SNAKE_DIRECTION_CHANGE',
                                { direction: directionMap.RIGHT }
                            );
                            return;
                        }
                        // swiped left
                        utils.getGameEvents().emit(
                            'SNAKE_DIRECTION_CHANGE',
                            { direction: directionMap.LEFT }
                        );
                        return;
                    }

                    if (xdistance > 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                        utils.getGameEvents().emit(
                            'SNAKE_DIRECTION_CHANGE',
                            { direction: directionMap.RIGHT }
                        );
                        // swiped right
                        return;
                    }
                    if (xdistance < 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                        utils.getGameEvents().emit(
                            'SNAKE_DIRECTION_CHANGE',
                            { direction: directionMap.LEFT }
                        );
                        // swiped left
                        return;
                    }
                    if (ydistance > 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
                        utils.getGameEvents().emit(
                            'SNAKE_DIRECTION_CHANGE',
                            { direction: directionMap.DOWN }
                        );
                        // swiped down
                        return
                    }
                    if (ydistance < 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
                        utils.getGameEvents().emit(
                            'SNAKE_DIRECTION_CHANGE',
                            { direction: directionMap.UP }
                        );
                        // swiped up
                        return;
                    }
                }, true);
                elem.addEventListener('touchcancel', event => {
                    event.preventDefault();
                    initialTouchPos = null;
                }, true);
                return elem;
            })();

            const SNAKE_ARENA = document.getElementById(arenaConfig.id);

            return {
                SNAKE_ARENA,
                PLAY_BUTTON,
                PAUSE_BUTTON,
                SCORE_BOARD
            };
        } catch (error) {
            utils.LOGGER.error(`Failed to setup the page: ${error}`);
            throw error;
        }
    };

    return {
        setupGame,
        onWindowLoad
    };
}