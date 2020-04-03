'use strict';

{
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
        constructor(limitCardNum, suitVariation, element) {
            this.players = [];
            this.isYourTurn = true;
            this.firstCard = null;
            this.secondCard = null;
            this.limitCardNum = limitCardNum;
            this.suitVariation = suitVariation;
            this.element = element;
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
        let board = new Board(6, ['club', 'diam', 'heart', 'spade'], $("#board"));

        // 参加プレイヤをボードにセットする
        let you = new Player('you');
        let rival = new Player('rival');
        board.players[you.name] = you;
        board.players[rival.name] = rival;

        // 使用するカードをボードにセットする
        for (let i = 1; i <= board.limitCardNum; i++) {
            board.suitVariation.forEach(suit => {
                let card = new Card(i, suit, board);
                board.element.append(card.element);
            });
        }
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
            flipCard(board.firstCard);
            flipCard(board.secondCard);
            board.isYourTurn = !board.isYourTurn;
        } else {
            board.firstCard.body.off();
            board.secondCard.body.off();

            let player = board.isYourTurn ? board.players['you'] : board.players['rival'];
            player.cards.push(board.firstCard, board.secondCard);
        }
        board.firstCard = null;
        board.secondCard = null;
    }

    init();
}