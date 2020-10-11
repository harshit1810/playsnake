export default function (utils) {

    const Styles = {
        FlexRows: {
            display: 'flex',
            'flex-direction': 'column'
        },
        FlexCols: {
            display: 'flex',
            'flex-direction': 'row'
        },
        CapitalizeText: {
            'text-transform': 'capitalize'
        }
    };
    const directionMap = Object.keys(utils.getArenaConfig().directionMap)
        .reduce((acc, keyCode) => {
            const direction = utils.getArenaConfig().directionMap[keyCode];
            acc[direction] = keyCode;
            return acc;
        }, {
            UP: null,
            DOWN: null,
            RIGHT: null,
            LEFT: null
        });

    utils.getDocumentBody().style.fontFamily = 'Candara';
    try {
        const gameControlDiv = utils.createHTMLElement({
            elementType: 'div',
            attributes: {
                style: utils.getStyleString(Object.assign({}, Styles.FlexCols, {
                    'flex-wrap': 'wrap',
                    'justify-content': 'flex-start',
                    width: utils.pixelify(utils.getArenaConfig().width),
                    padding: '1% 0%'
                }))
            }
        });

        const styleString = utils.getStyleString({
            padding: '2% 2%',
            'border-radius': '5px',
            flex: '0 1 20%',
            'text-align': 'center',
            'align-self': 'flex-end'
        });

        const PAUSE_BUTTON = (() => {
            const btn = utils.createHTMLElement({
                elementType: 'button',
                parent: gameControlDiv,
                innerHTML: utils.getArenaConfig().pauseButton.text,
                attributes: {
                    id: utils.getArenaConfig().pauseButton.id,
                    style: `${styleString} order: ${utils.getArenaConfig().pauseButton.order}`
                }
            });
            btn.addEventListener('click', () => {
                utils.getGameEvents().emit('PAUSE_BUTTON_CLICKED');
            });
            return btn;
        })();

        const PLAY_BUTTON = (() => {
            const btn = utils.createHTMLElement({
                elementType: 'button',
                parent: gameControlDiv,
                innerHTML: utils.getArenaConfig().resumeButton.text,
                attributes: {
                    id: utils.getArenaConfig().resumeButton.id,
                    style: `${styleString} margin-left: 2%; order: ${utils.getArenaConfig().resumeButton.order}`
                },
                eventListeners: {
                    click: utils.getArenaConfig().resumeButton.clickHandler
                }
            });
            btn.addEventListener('click', () => {
                utils.getGameEvents().emit('RESUME_BUTTON_CLICKED');
            });
            return btn;
        })();

        const arenaContainer = (() => {
            let initialTouchPos;
            const elem = utils.createHTMLElement({
                elementType: 'div',
                attributes: {
                    id: 'arena-container',
                    style: utils.getStyleString(Object.assign({}, Styles.FlexCols, {
                        'flex-wrap': 'wrap',
                    }))
                }
            });
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
                    return; // did not swipe
                }
                const xdistance = x2 - x1;
                const ydistance = y2 - y1;
                if (Math.abs(xdistance) === Math.abs(ydistance)) {
                    return; // swiped diagonal
                }
                if (xdistance === 0) {
                    if (ydistance > 0) {
                        // swiped down
                        utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.DOWN });
                        return;
                    }
                    // swiped up
                    utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.UP });
                    return;

                } else if (ydistance === 0) {
                    if (xdistance > 0) {
                        //swiped right
                        utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.RIGHT });
                        return;
                    }
                    // swiped left
                    utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.LEFT });
                    return;
                }

                if (xdistance > 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                    utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.RIGHT });
                    return; // swiped right
                }
                if (xdistance < 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                    utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.LEFT });
                    return; // swiped left
                }
                if (ydistance > 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
                    utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.DOWN });
                    return // swiped down
                }
                if (ydistance < 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
                    utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: directionMap.UP });
                    return; // swiped up
                }
            }, true);
            elem.addEventListener('touchcancel', event => {
                event.preventDefault();
                initialTouchPos = null;
            }, true);
            return elem;
        })();

        const SNAKE_ARENA = utils.createHTMLElement({
            elementNamespace: utils.getSvgNamespace(),
            elementType: 'svg',
            attributes: {
                id: utils.getArenaConfig().id,
                height: utils.getArenaConfig().height,
                width: utils.getArenaConfig().width,
                style: `border: ${utils.pixelify(utils.getArenaConfig().borderWidth)} solid ${utils.getArenaConfig().borderColor}`
            },
            parent: arenaContainer
        });

        (() => {
            const _legend_container = utils.createHTMLElement({
                elementType: 'div',
                parent: arenaContainer,
                attributes: {
                    id: 'legend-container',
                    style: utils.getStyleString(Object.assign({}, Styles.FlexRows, {
                        padding: '2px 2px',
                        'justify-content': 'flex-start'
                    }))
                }
            });
            // create legend keys
            try {
                const {
                    eatables = {}
                } = utils.getArenaConfig();
                Object.keys(eatables).forEach(eatableName => {
                    const { description, showInLegend, color = 'white' } = eatables[eatableName];
                    if (!showInLegend || !description) {
                        return; 
                    }
                    const legend = utils.createHTMLElement({
                        parent: _legend_container,
                        elementType: 'div',
                        attributes: {
                            style: utils.getStyleString(Object.assign({}, Styles.FlexCols, {
                                'margin-bottom': '5px',
                                'align-items': 'center'
                            }))
                        }
                    });
                    utils.createHTMLElement({
                        parent: legend,
                        elementType: 'div',
                        attributes: {
                            style: utils.getStyleString({
                                height: '10px',
                                width: '10px',
                                'background-color': color,
                                'border-radius': '5px'
                            })
                        }
                    });
                    utils.createHTMLElement({
                        parent: legend,
                        elementType: 'span',
                        innerHTML: description,
                        attributes: {
                            style: utils.getStyleString(Object.assign({}, Styles.CapitalizeText, {
                                padding: '0px 2px'
                            }))
                        }
                    });

                });
            } catch (e) {
                utils.LOGGER.warn(`Failed while drawing legend: ${e}`);
            }
            return _legend_container;
        })();

        const scoreContainer = utils.createHTMLElement({
            elementType: 'div',
            innerHTML: 'Your Score: '
        });
        const SCORE_BOARD = utils.createHTMLElement({
            elementType: 'span',
            parent: scoreContainer,
            attributes: {
                id: 'score',
                style: utils.getStyleString({
                    'font-weight': 'bold'
                })
            },
            innerHTML: '0'
        });

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
}