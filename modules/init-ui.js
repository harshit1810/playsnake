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

        const arenaContainer = utils.createHTMLElement({
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