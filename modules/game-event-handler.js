export default function () {
    let gameInstance;
    let events = {
        PAUSE_BUTTON_CLICKED: [
            () => gameInstance.pause()
        ],
        RESUME_BUTTON_CLICKED: [
            () => gameInstance.resume()
        ],
        STOP_GAME: [
            () => gameInstance.stop()
        ],
        EATABLE_CONSUMED: [
            eatable => eatable.hide(),
            eatable => emitEvent('UPDATE_SCORE', eatable.points),
            eatable => gameInstance.growSnake(eatable),
            eatable => !eatable.isIntervalBased 
                ? emitEvent('DROP_EATABLE', eatable)
                : undefined
        ],
        UPDATE_SCORE: [
            points => gameInstance.updateScore(points)
        ],
        USE_SPEED_BONUS: [
            () => gameInstance.increaseSnakeSpeed()
        ],
        DEVOURED_SELF: [
            () => emitEvent('STOP_GAME')
        ],
        SNAKE_DIRECTION_CHANGE: [
            ({ direction }) => gameInstance.handleSnakeDirectionChange(parseInt(direction))
        ],
        SHOW_GAME_INFO: [
            () => gameInstance.showGameInfo()
        ],
        SCORE_CHECKPOINT: [
            checkpointIndex => gameInstance.processScoreCheckpoint(checkpointIndex)
        ],
        DROP_EATABLE: [
            eatable => gameInstance.dropEatable(eatable)
        ]
    };

    function emitEvent(eventName, data) {
        if (!events.hasOwnProperty(eventName)) {
            // eslint-disable-next-line no-console
            console.warn(`Invalid event triggered : ${eventName}`);
            return;
        }
        events[eventName].forEach(cb => cb(data));
    }

    return {
        init: game => gameInstance = game,
        emit: emitEvent,
        listen: function (eventName, cb) {
            if (Array.isArray(events[eventName])) {
                events[eventName].push(cb);
            } else {
                events[eventName] = [cb];
            }
        },
        destruct: () => events = {}
    };
};