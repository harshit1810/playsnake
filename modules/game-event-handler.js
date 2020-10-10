import game from "./game";

export default function () {
    let gameInstance;
    let events = {
        PAUSE_BUTTON_CLICKED: [
            () => {
                gameInstance.pause();
            }
        ],
        RESUME_BUTTON_CLICKED: [
            () => {
                gameInstance.resume();
            }
        ],
        EATABLE_CONSUMED: [
            eatable => {
                eatable.hide();
                if (typeof eatable.points === 'number') {
                    emitEvent('UPDATE_SCORE', eatable.points);
                }
            }
        ],
        UPDATE_SCORE: [
            points => {
                gameInstance.updateScore(points);
            }
        ]
    };

    function emitEvent(eventName, data) {
        if (!events.hasOwnProperty(eventName)) {
            return console.warn(`Invalid event triggered : ${eventName}`);
        }
        events[eventName].forEach(cb => cb(data));
    }

    return {
        init: function (game) {
            gameInstance = game;
            return game;
        },
        emit: emitEvent,
        listen: function (eventName, cb) {
            if (Array.isArray(events[eventName])) {
                events[eventName].push(cb);
            } else {
                events[eventName] = [cb];
            }
        },
        destruct: function () {
            events = {};
        }
    };
};