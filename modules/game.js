import InitUIModule from './init-ui';
import SnakeModule from './snake';
import Eatable from './eatable';

export default function (utils) {

    const { createEatableItem, getNextEatablePosition } = Eatable(utils);
    const { Snake } = SnakeModule(utils);
    const config = utils.getConfig();
    const { setupGame } = InitUIModule();

    function PlaySnake() {
        const { SNAKE_ARENA, PLAY_BUTTON, PAUSE_BUTTON, SCORE_BOARD } = setupGame(utils);
        if (!SNAKE_ARENA) {
            utils.windowAlert(utils.getErrorMessages().SETUP_GAME);
            throw new Error(utils.getErrorMessages().SETUP_GAME);
        }
        let _state = config.game.state.playing, 
            _snake, 
            _snakeFood, 
            _snakeBonusFood, 
            _speedBonus, 
            _snakeDirection,
            _inactivityTimeout;
        const gameControls = {
            playButton: PLAY_BUTTON,
            pauseButton: PAUSE_BUTTON,
            scoreBoard: SCORE_BOARD
        };

        return {
            get snake() {
                return _snake;
            },
            set snake(s) {
                _snake = s;
            },
            get snakeFood() {
                return _snakeFood;
            },
            set snakeFood(f) {
                _snakeFood = f;
            },
            get snakeBonusFood() {
                return _snakeBonusFood;
            },
            set snakeBonusFood(f) {
                _snakeBonusFood = f;
            },
            get speedBonus() {
                return _speedBonus;
            },
            set speedBonus(s) {
                _speedBonus = s;
            },
            get snakeDirection() {
                return _snakeDirection;
            },
            set snakeDirection(d) {
                _snakeDirection = d;
            },
            get arena() {
                return SNAKE_ARENA;
            },
            get state() {
                return _state;
            },
            set state(s) {
                _state = s;
            },
            showAlert: function(message) {
                utils.getWindow().alert(message);
            },
            getSnake: function () {
                const self = this;
                if (self.snake) {
                    return self.snake;
                }
                const { direction, position: { x, y } } = utils.getDirectionCommands().getFirst();
                self.snakeDirection = direction;
                self.snake = Snake(
                    self.arena,
                    x,
                    y,
                    self.snakeDirection,
                    config.snake.speed
                );
                return self.snake;
            },
            getSpeedBonusFood: function () {
                const self = this;
                if (self.speedBonus) {
                    return self.speedBonus;
                }
                self.speedBonus = createEatableItem(
                    self.arena,
                    -10,
                    -10,
                    config.eatables.speedBonus.code
                );
                return self.speedBonus;
            },
            getBasicFood: function () {
                const self = this;
                if (self.snakeFood) {
                    return self.snakeFood;
                }
                const { x, y } = getNextEatablePosition(
                    config.eatables.basicFood.limits,
                    config.eatables.basicFood.size
                );
                self.snakeFood = createEatableItem(
                    self.arena,
                    x,
                    y,
                    config.eatables.basicFood.code
                );
                return self.snakeFood;
            },
            getSnakeBonusFood: function () {
                const self = this;
                if (self.snakeBonusFood) {
                    return self.snakeBonusFood;
                }
                self.snakeBonusFood = createEatableItem(
                    self.arena,
                    -10,
                    -10,
                    config.eatables.bonusFood.code
                );
                return self.snakeBonusFood;
            },
            start: function () {
                const self = this;
                try {
                    self.getSnake().startSnake();
                    const food = self.getBasicFood();
                    setTimeout(config.eatables.basicFood.startAfter * 1000, food);
                    self.getSnakeBonusFood().startInterval();
                    self.getSpeedBonusFood().startInterval();
                    self.setButtonListeners();
                } catch (error) {
                    self.showAlert(utils.getErrorMessages().START_GAME);
                }
            },
            growSnake: function (eatable) {
                if (!eatable || !eatable.growSnakeIfConsumed || !this.snake) {
                    return;
                }
                this.getSnake().grow(eatable.growSnakeByLength);
            },
            pause: function () {
                const self = this;
                utils.getWindow().clearInterval(self.getSnake().intervalId);
                utils.getWindow().clearInterval(self.getSnakeBonusFood().intervalId);
                gameControls.pauseButton.setAttribute('disabled', 'true');
                if (gameControls.playButton.hasAttribute('disabled')) {
                    gameControls.playButton.removeAttribute('disabled');
                }
                self.state = config.game.state.paused;
            },
            resume: function () {
                const self = this;
                self.getSnake().startSnake();
                self.getSnakeBonusFood().startInterval();
                gameControls.playButton.setAttribute('disabled', 'true');
                if (gameControls.pauseButton.hasAttribute('disabled')) {
                    gameControls.pauseButton.removeAttribute('disabled');
                }
                self.state = config.game.state.playing;
            },
            stop: function () {
                const self = this;
                self.state = config.game.state.stopped;
                [
                    self.getSnake().intervalId,
                    self.getSnakeBonusFood().intervalId,
                    self.getSpeedBonusFood().intervalId
                ].forEach(utils.getWindow().clearInterval);
                [
                    self.getSnake().intervalId,
                    _inactivityTimeout
                ].forEach(utils.getWindow().clearTimeout);
                self.snake = null;
                self.snakeFood = null;
                self.snakeBonusFood = null;
                self.speedBonus = null;
                gameControls.pauseButton.setAttribute('disabled', true);
                gameControls.playButton.setAttribute('disabled', true);
                self.showAlert('GAME OVER\nYou Scored ' + self.getScore() + ' points.');
            },
            manageInactivity: function() {
                const self = this;
                if (typeof _inactivityTimeout !== 'undefined') {
                    utils.getWindow().clearTimeout(_inactivityTimeout);
                }
                _inactivityTimeout = setTimeout(
                    () => {
                        self.showAlert(utils.getErrorMessages().INACTIVITY_TIMEOUT);
                        self.stop();
                    }, 
                    Math.floor(config.game.inactivityTimeout) * 1000
                );
            },
            /**
             * 
             * @param {number} direction the new direction received
             */
            handleSnakeDirectionChange: function (direction) {
                const self = this;
                if (config.supportedKeys.indexOf(direction) === -1) {
                    return;
                }
                /**
                 * the new direction should not be the current direction 
                 * or the opposite direction.
                 */
                if (self.getSnake().currentDirection == direction ||
                    direction == config
                        .keyConfig[String(self.getSnake().currentDirection)].reverse) {
                    return;
                }
                self.snakeDirection = direction;
                self.getSnake().currentDirection = self.snakeDirection;
                utils.getDirectionCommands().add({
                    id: Date.now(),
                    direction,
                    position: self.getSnake().head.getCenter()
                });
                self.manageInactivity();
            },
            setButtonListeners: function () {
                utils.getWindow().addEventListener('unload', this.stop);
                utils.getDocument().addEventListener('keydown', event => {
                    event.preventDefault();
                    if (config.supportedKeys.indexOf(event.keyCode) === -1) {
                        return;
                    }
                    utils.getGameEvents().emit(
                        'SNAKE_DIRECTION_CHANGE', 
                        { direction: event.keyCode }
                    );
                });
            },
            getScore: function () {
                return parseInt(gameControls.scoreBoard.innerHTML);
            },
            updateScore: function (points) {
                gameControls.scoreBoard.innerHTML =
                    parseInt(gameControls.scoreBoard.innerHTML) + points;
                return parseInt(gameControls.scoreBoard.innerHTML);
            },
            increaseSnakeSpeed: function () {
                // stop current movement
                utils.getWindow().clearInterval(this.getSnake().intervalId);
                // start with new speed
                this.getSnake().startSnake(config.snake.turboSpeed);
                // revert to normal speed after some time
                setTimeout(() => {
                    utils.getWindow().clearInterval(this.getSnake().intervalId);
                    this.getSnake().startSnake(config.snake.speed);
                }, config.eatables.speedBonus.speedDuration * 1000);
            }
        };
    }

    return {
        PlaySnake
    };
}