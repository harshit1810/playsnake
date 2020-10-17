import InitUIModule from './init-ui';
import SnakeModule from './snake';
import Eatable from './eatable';

export default function(utils) {
    
    const { createEatableItem, getNextEatablePosition } = Eatable(utils);
    const { Snake } = SnakeModule(utils);
    
    class PlaySnake {
        constructor() {

            const { SNAKE_ARENA, PLAY_BUTTON, PAUSE_BUTTON, SCORE_BOARD } = InitUIModule(utils);

            if (!SNAKE_ARENA) {
                utils.showAlert(utils.getErrorMessages().SETUP_GAME);
                throw new Error(utils.getErrorMessages().SETUP_GAME);
            }

            this.intervals = [];
            this.timers = [];
            this._snake;
            this._snakeFood;
            this._snakeBonusFood;
            this.snakeDirection;
            this.arena = SNAKE_ARENA;
            this.snakeSpeed = 20;
            this._speedBonus;
            this.gameControls = {
                playButton: PLAY_BUTTON,
                pauseButton: PAUSE_BUTTON,
                scoreBoard: SCORE_BOARD
            };
        }

        getSnake() {
            if (this._snake) {
                return this._snake;
            }
            const { direction, position: { x, y } } = utils.getDirectionCommands().getFirst();
            this.snakeDirection = direction;
            this._snake = Snake(
                this.arena,
                x,
                y,
                this.snakeDirection,
                this.snakeSpeed
            );
            return this._snake;
        }

        getSpeedBonusFood() {
            if (this._speedBonus) {
                return this._speedBonus;
            }
            this._speedBonus = createEatableItem(
                this.arena, 
                -10, 
                -10, 
                utils.getArenaConfig().eatables.speedBonus.code
            );
            return this._speedBonus;
        }

        getSnakeFood() {
            if (this._snakeFood) {
                return this._snakeFood;
            }
            const { x, y } = getNextEatablePosition(
                utils.getArenaConfig().eatables.basicFood.limits,
                utils.getArenaConfig().eatables.basicFood.size
            );
            this._snakeFood = createEatableItem(
                this.arena,
                x,
                y,
                utils.getArenaConfig().eatables.basicFood.code
            );
            return this._snakeFood;
        }

        getSnakeBonusFood() {
            if (this._snakeBonusFood) {
                return this._snakeBonusFood;
            }
            this._snakeBonusFood = createEatableItem(
                this.arena,
                -10, 
                -10, 
                utils.getArenaConfig().eatables.bonusFood.code
            );
            return this._snakeBonusFood;
        }

        start() {
            try {
                this.getSnake();

                const food = this.getSnakeFood();
                setTimeout(utils.getArenaConfig().eatables.basicFood.startAfter * 1000, food);

                const bonusFood = this.getSnakeBonusFood();
                this.intervals.push(bonusFood.startInterval());

                const speedBonusFood = this.getSpeedBonusFood();
                this.intervals.push(speedBonusFood.startInterval());

                this.setButtonListeners();

                this.intervals.push(this.getSnake().startSnake());
            } catch (error) {
                utils.showAlert(utils.getErrorMessages().START_GAME);
            }
        }

        pause() {
            utils.getWindow().clearInterval(this.getSnake().intervalId);
            utils.getWindow().clearInterval(this.getSnakeBonusFood().intervalId);
            this.gameControls.pauseButton.setAttribute('disabled', 'true');
            if (this.gameControls.playButton.hasAttribute('disabled')) {
                this.gameControls.playButton.removeAttribute('disabled');
            }
        }

        resume() {
            this.getSnake().startSnake();
            this.getSnakeBonusFood().startInterval();
            this.gameControls.playButton.setAttribute('disabled', 'true');
            if (this.gameControls.pauseButton.hasAttribute('disabled')) {
                this.gameControls.pauseButton.removeAttribute('disabled');
            }
        }

        stop() {
            utils.getWindow().clearInterval(this.getSnake().intervalId);
            utils.getWindow().clearInterval(this.getSnakeBonusFood().intervalId);
            utils.getWindow().clearInterval(this.getSpeedBonusFood().intervalId);
            this._snake = null;
            this._snakeFood = null;
            this._snakeBonusFood = null;
            this._speedBonus = null;
            this._speedBonus = null;
            utils.getWindow().alert('GAME OVER\nYou Scored ' + this.getScore() + ' points.');
        }

        /**
         * 
         * @param {number} direction the new direction received
         */
        handleSnakeDirectionChange(direction) {
            if (utils.getArenaConfig().supportedKeys.indexOf(direction) === -1) {
                return;
            }
            /**
             * the new direction should not be the current direction 
             * or the opposite direction.
             */
            if (this.getSnake().currentDirection == direction ||
                direction == utils.getArenaConfig()
                    .keyConfig[String(this.getSnake().currentDirection)].reverse) {
                return;
            }
            this.snakeDirection = direction;
            this.getSnake().currentDirection = this.snakeDirection;
            utils.getDirectionCommands().add({
                id: Date.now(),
                direction,
                position: this.getSnake().head.getCenter()
            });
        }

        setButtonListeners() {
            utils.getWindow().addEventListener('unload', this.stop);
            utils.getDocument().addEventListener('keydown', event => {
                if (utils.getArenaConfig().supportedKeys.indexOf(event.keyCode) === -1) {
                    return;
                }
                utils.getGameEvents().emit('SNAKE_DIRECTION_CHANGE', { direction: event.keyCode });
            });
        }

        getScore() {
            return parseInt(this.gameControls.scoreBoard.innerHTML);
        }

        updateScore(points) {
            this.gameControls.scoreBoard.innerHTML =
                parseInt(this.gameControls.scoreBoard.innerHTML) + points;
            return parseInt(this.gameControls.scoreBoard.innerHTML);
        }

        increaseSnakeSpeed() {
            // stop current movement
            utils.getWindow().clearInterval(this.getSnake().intervalId);

            // start with new speed
            this.intervals.push(
                this.getSnake().startSnake(
                    this.getSnake().speed / 4
                )
            );

            // revert to normal speed after some time
            setTimeout(() => {
                utils.getWindow().clearInterval(this.getSnake().intervalId);
                this.intervals.push(
                    this.getSnake().startSnake()
                );
            }, utils.getArenaConfig().eatables.speedBonus.speedDuration * 1000);
        }
    }

    return {
        PlaySnake
    };
}