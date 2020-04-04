'use strict';

{
    // ゲームの設定
    const limitCardNum = 6;
    const suitVariation = ['club', 'diam', 'heart', 'spade'];

    // HTML要素
    const stage = $("#stage");
    const youProgressBar = $('#you-progress-bar');
    const rivalProgressBar = $('#rival-progress-bar');
    const numYouCards = $('#num-you-cards');
    const numRivalCards = $('#num-rival-cards');
    const rivalStrengthLevel = $('#rival-strength-level');

    /**
     * ゲームの進行を管理する
     */
    class Board {
        /**
         * コンストラクタ
         * @param int limitCardNum 
         * @param array suitVariation 
         * @param Object element 
         */
        constructor() {
            this._players = [];
            this.isYourTurn = true;
            this.firstCard = null;
            this.secondCard = null;
        }
        get players() {
            return this._players;
        }
        set players(playerNames) {
            this._players['you'] = new Player(playerNames['you']);
            this._players['rival'] = new Player(playerNames['rival']);
        }
        updateHtml() {
            this.updateProgressBar(youProgressBar, 'you');
            this.updateProgressBar(rivalProgressBar, 'rival');
            this.updateNumCards(numYouCards, 'you');
            this.updateNumCards(numRivalCards, 'rival');
        }
        getNumCards(playerName) {
            let player = this._players[playerName];
            return player.cards.length;
        }
        updateProgressBar(progressBar, playerName) {
            let totalNumCards = limitCardNum * suitVariation.length;
            let numPlayerCards = this.getNumCards(playerName);
            let progress = Math.round((numPlayerCards / totalNumCards) * 100);
            let label = playerName === 'you' ? 'あなた' : 'ライバル';
            progressBar.html(label + ' ' + progress + '%').attr({
                'style': 'width: ' + progress + '%',
                'aria-valuenow': progress,
            });
            return;
        }
        updateNumCards(numCardsElement, playerName) {
            let totalNumCards = limitCardNum * suitVariation.length;
            let numPlayerCards = this.getNumCards(playerName);
            numCardsElement.html(
                numPlayerCards + '枚 <small class="text-muted">/' + totalNumCards + '</small>'
            );
        }
    }

    /**
     * ゲームに使用するカード
     */
    class Card {
        /**
         * コンストラクタ
         * @param int num 
         * @param string suit 
         * @param Board board 
         */
        constructor(num, suit, board) {
            this.num = num;
            this.suit = suit;
            this.element = createCardElement(this, board);
            this.body = this.element.find('.card-body');
        }
    }

    /**
     * ゲームに参加するプレイヤ
     */
    class Player {
        /**
         * 
         * @param string name 
         */
        constructor(name) {
            this.name = name;
            this.cards = [];
        }
    }

    /**
     * ゲーム開始に必要な準備をする
     */
    function init() {
        // ボードを作成する
        let board = new Board();

        // 参加プレイヤをボードにセットする
        board.players = { 'you': 'you', 'rival': 'rival' };

        // 使用するカードをボードにセットする
        for (let i = 1; i <= limitCardNum; i++) {
            suitVariation.forEach(suit => {
                let card = new Card(i, suit, board);
                stage.append(card.element);
            });
        }

        board.updateHtml();
    }

    /**
     * カードのHTML要素を生成する
     * @param Card card 
     * @param Board board 
     */
    function createCardElement(card, board) {
        let front = $("<div></div>").addClass("card-front suit-" + card.suit).append(card.num);
        let back = $("<div></div>").addClass("card-back").html('CARD');
        let body = $("<div></div>").addClass("card-body card-close").append(front, back);
        body.click([card, board], function () {
            openCard(card, board);
        });
        let wrapper = $("<div></div>").addClass("card-wrapper").append(body);
        let element = $("<div></div>").addClass("col-3 col-md-2 py-3").append(wrapper);

        return element;
    }

    /**
     * 引数のカードの表裏を反転する
     * @param Card card 
     */
    function flipCard(card) {
        card.body.toggleClass('card-open');
    }

    /**
     * 裏向きのカードを1枚めくる
     * @param Card card 
     * @param Board board 
     */
    function openCard(card, board) {
        if (card.body.hasClass('card-open')) return;

        if (board.firstCard && board.secondCard) return;

        if (board.firstCard === null) {
            board.firstCard = card;
        } else {
            board.secondCard = card;
            tryGetCards(board);
        }

        flipCard(card);
    }

    /**
     * プレイヤが選んだ2枚のカードが一致すればプレイヤがカードを獲得する
     * @param Board board 
     */
    function tryGetCards(board) {
        if (board.firstCard.num !== board.secondCard.num) {
            resetCards(board);
            board.isYourTurn = !board.isYourTurn;
        } else {
            getCards(board);
        }
        board.updateHtml();
    }

    /**
     * カードのフリップ動作を無効にしてプレイヤに渡す
     * @param Board board 
     */
    function getCards(board) {
        board.firstCard.body.off();
        board.secondCard.body.off();

        let player = board.isYourTurn ? board.players['you'] : board.players['rival'];
        player.cards.push(board.firstCard, board.secondCard);

        board.firstCard = null;
        board.secondCard = null;
    }

    /**
     * カードを裏返して次のカードを選べるようにする
     * @param Board board 
     */
    function resetCards(board) {
        board.secondCard.body.on('transitionend webkitTransitionEnd', function () {
            // フリップ動作を無限ループしないようにイベントを無効にする
            board.secondCard.body.off('transitionend webkitTransitionEnd');

            flipCard(board.firstCard);
            flipCard(board.secondCard);

            board.firstCard = null;
            board.secondCard = null;
        });
    }

    init();

    let cardtest = $('#cards-rival-got');
    cardtest.html('9枚');
}