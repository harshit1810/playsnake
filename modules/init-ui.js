export default function (utils) {
    try {
        utils.getDocumentBody().style.fontFamily = 'Candara';
        const gameControlDiv = utils.createHTMLElement({
            elementType: 'div',
            attributes: {
                style: utils.getStyleString({
                    display: 'flex',
                    'flex-direction': 'row',
                    'flex-wrap': 'nowrap',
                    width: utils.pixelify(utils.getArenaConfig().width),
                    padding: '1% 0%'
                })
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
                    style: utils.getStyleString({
                        display: 'flex',
                        'flex-direction': 'cols',
                        'flex-wrap': 'wrap',
                    })
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
                    // did not  swipe
                    return;
                }
                const xdistance = x2 - x1;
                const ydistance = y2 - y1;
                if (Math.abs(xdistance) === Math.abs(ydistance)) {
                    return; // swiped diagonal
                }
                if (xdistance === 0) {
                    if (ydistance > 0) {
                        // swiped down
                        return
                    }
                    // swiped up
                    return;

                } else if (ydistance === 0) {
                    if (xdistance > 0) {
                        //swiped right
                        return;
                    }
                    // swiped left
                    return;
                }

                if (xdistance > 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                    return; // swiped right
                }
                if (xdistance < 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                    return; // swiped left
                }
                if (ydistance > 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
                    return // swiped down
                }
                if (ydistance < 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
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

        const legendContainer = utils.createHTMLElement({
            elementType: 'div',
            parent: arenaContainer,
            attributes: {
                id: 'legend-container',
                style: utils.getStyleString({
                    padding: '2px 2px'
                })
            }
        });
        utils.createHTMLElement({
            parent: legendContainer,
            elementType: 'div',
            innerHTML: 'Speed Powerup'
        });
        utils.createHTMLElement({
            parent: legendContainer,
            elementType: 'div',
            innerHTML: 'Bonus 10 points'
        });
        utils.createHTMLElement({
            parent: legendContainer,
            elementType: 'div',
            innerHTML: '5 points'
        });

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
    } catch (e) {
        utils.LOGGER.error(e);
        throw e;
    }
}