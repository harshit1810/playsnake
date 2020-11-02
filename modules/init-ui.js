export default function () {

    const onWindowLoad = function (arg) {
        const {
            arenaId,
            arenaContainerId
        } = arg;

        const unpixelify = str => Math.floor(String(str).trim().split('px')[0]);
        const arenaContainer = document.getElementById(arenaContainerId);
        const arena = document.getElementById(arenaId);

        const arenaMaxWidth = unpixelify(window.getComputedStyle(arenaContainer).maxWidth);
        const availableWidth = unpixelify(window.getComputedStyle(arenaContainer).width);

        const ARENA_WIDTH = availableWidth > arenaMaxWidth
            ? arenaMaxWidth
            : availableWidth;
        const ARENA_HEIGHT = ARENA_WIDTH;

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
        const getById = utils.getDocument().getElementById.bind(utils.getDocument());
        const {
            id: arenaId,
            arenaContainerId,
            directionMap,
            pauseButton,
            resumeButton,
            quitButton,
            game: {
                scoreBoard,
                infoContainerId,
                legendContainerId
            },
            eatables = {}
        } = utils.getConfig();
        const dirMap = Object.keys(directionMap)
            .reduce((acc, keyCode) => {
                const direction = directionMap[keyCode];
                acc[direction] = keyCode;
                return acc;
            }, {
                UP: null,
                DOWN: null,
                RIGHT: null,
                LEFT: null
            });
        const addClickHandler = (elem, cb, options = {}) => {
            elem.addEventListener('click', cb);
            elem.addEventListener('touchstart', cb, options);
        };
        const SNAKE_ARENA = getById(arenaId);

        const PAUSE_BUTTON = (btnId => {
            const btn = getById(btnId);
            addClickHandler(btn, () => {
                utils.getGameEvents().emit('PAUSE_BUTTON_CLICKED');
            });
            return btn;
        })(pauseButton.id);

        const PLAY_BUTTON = (btnId => {
            const btn = getById(btnId);
            addClickHandler(btn, () => {
                utils.getGameEvents().emit('RESUME_BUTTON_CLICKED');
            });
            return btn;
        })(resumeButton.id);

        // eslint-disable-next-line no-unused-vars
        const QUIT_BUTTON = (btnId => {
            const btn = getById(btnId);
            addClickHandler(btn, () => {
                utils.getGameEvents().emit('STOP_GAME');
            });
            return btn;
        })(quitButton.id);

        // Create lengends about the game
        (containerId => {
            const _legend_container = getById(containerId);
            // create legend keys
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
                        class: 'cols universal-padding',
                        style: utils.getStyleString(Object.assign({}, {
                            'align-items': 'center'
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
            return _legend_container;
        })(legendContainerId);

        // eslint-disable-next-line no-unused-vars
        const arenaContainer = (sectionId => {
            let initialTouchPos = {};
            const clearTouchMemory = () => {
                initialTouchPos = {};
            };
            const elem = getById(sectionId);
            const emit = direction => {
                utils.getGameEvents().emit(
                    'SNAKE_DIRECTION_CHANGE',
                    { direction }
                );
                clearTouchMemory();
            }
            // Handle swipe actions
            elem.addEventListener('touchstart', event => {
                event.preventDefault();
                if (event.targetTouches && event.targetTouches.length > 0) {
                    initialTouchPos.x = parseInt(event.targetTouches[0].clientX);
                    initialTouchPos.y = parseInt(event.targetTouches[0].clientY);
                }
            });
            elem.addEventListener('touchmove', () => {});
            elem.addEventListener('touchend', event => {
                const { x: x1, y: y1 } = initialTouchPos;
                const { clientX, clientY } = event.changedTouches[0];
                const [x2, y2] = [parseInt(clientX), parseInt(clientY)];
                const [xdistance, ydistance] = [x2 - x1, y2 - y1];
                // Do nothing if did not swipe or swiped diagonal
                if ((x1 === x2 && y1 === y2) ||
                    (Math.abs(xdistance) === Math.abs(ydistance))) {
                    return;
                }
                if (xdistance === 0) {
                    return (ydistance > 0)
                        ? emit(dirMap.DOWN)
                        : emit(dirMap.UP);
                }
                if (ydistance === 0) {
                    return (xdistance > 0)
                        ? emit(dirMap.RIGHT)
                        : emit(dirMap.LEFT);
                }
                if (xdistance > 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                    return emit(dirMap.RIGHT);
                }
                if (xdistance < 0 && Math.abs(xdistance) > Math.abs(ydistance)) {
                    return emit(dirMap.LEFT);
                }
                if (ydistance > 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
                    return emit(dirMap.DOWN);
                }
                if (ydistance < 0 && Math.abs(ydistance) > Math.abs(xdistance)) {
                    return emit(dirMap.UP);
                }
            });
            elem.addEventListener('touchcancel', clearTouchMemory);
            return elem;
        })(arenaContainerId);

        const SCORE_BOARD = getById(scoreBoard.id);

        const MODAL = ((sectionId, modalContentId, btn1Id, btn2Id, btnsContainerId) => {
            const [section, button1, button2, modalContentSpace, btnsContainer] = [
                sectionId, btn1Id, btn2Id, modalContentId, btnsContainerId
            ].map(getById);
            const createdElements = [];
            const hideModal = () => {
                section.style.display = 'none';
                createdElements.forEach(e => e.remove());
                button1.innerHTML = 'no';
                button2.innerHTML = 'yes';
                button1.style.display = 'block';
                button2.style.display = 'block';
            };
            /**
             * 
             * @param {Object} config 
             * @param {string[]=} config.elementIds
             * @param {string|string[]=} config.texts
             * @param {Object} config.btn1
             * @param {string=} config.btn1.label
             * @param {Function=} config.btn1.clickHandler
             * @param {boolean} config.btn1.show
             * @param {Object} config.btn2
             * @param {string=} config.btn2.label
             * @param {Function=} config.btn2.clickHandler
             * @param {boolean} config.btn2.show
             */
            const showModal = config => {
                let {
                    elementIds = [],
                    texts = [],
                    btn1,
                    btn2
                } = config;
                btn1 = btn1 || {};
                btn2 = btn2 || {};
                elementIds = Array.isArray(elementIds)
                    ? elementIds
                    : [elementIds];
                texts = Array.isArray(texts)
                    ? texts
                    : [texts];
                elementIds.forEach(id => {
                    if (!id) {
                        return;
                    }
                    const _clone = getById(id).cloneNode(true);
                    createdElements.push(_clone);
                    modalContentSpace.insertBefore(_clone, btnsContainer);
                });
                texts.forEach(t => createdElements.push(utils.createHTMLElement({
                    elementType: 'p',
                    parent: modalContentSpace,
                    innerHTML: t,
                    beforeElement: btnsContainer,
                    attributes: {
                        class: 'text-center'
                    }
                })));
                button1.innerHTML = btn1.label
                    ? btn1.label
                    : button1.innerHTML;
                button2.innerHTML = btn2.label
                    ? btn2.label
                    : button2.innerHTML;
                button1.style.display = typeof btn1.show === 'boolean'
                    ? btn1.show
                        ? 'block'
                        : 'none'
                    : button1.style.display;
                button2.style.display = typeof btn2.show === 'boolean'
                    ? btn2.show
                        ? 'block'
                        : 'none'
                    : button2.style.display;
                if (typeof btn1.clickHandler === 'function') {
                    addClickHandler(button1, btn1.clickHandler, { once: true });
                }
                if (typeof btn2.clickHandler === 'function') {
                    addClickHandler(button2, btn2.clickHandler, { once: true });
                }
                addClickHandler(button1, hideModal, { once: true });
                addClickHandler(button2, hideModal, { once: true });
                section.style.display = 'block';
            };
            return {
                show: showModal,
                hide: hideModal
            };
        })(
            'modal-container',
            'modal-content',
            'modal-content-btn-1',
            'modal-content-btn-2',
            'modal-content-btns-container'
        );

        addClickHandler(
            getById(infoContainerId), 
            () => utils.getGameEvents().emit('SHOW_GAME_INFO')
        );

        return {
            SNAKE_ARENA,
            PLAY_BUTTON,
            PAUSE_BUTTON,
            SCORE_BOARD,
            MODAL
        };

    };

    return {
        setupGame,
        onWindowLoad
    };
}