'use strict';

{
    class Board {
        constructor(maxCardNum, suits, element) {
            this.firstCard = null;
            this.secondCard = null;
            this.maxCardNum = maxCardNum;
            this.suits = suits;
            this.element = element;
            this.got = [];
        }
    }

    class Card {
        constructor(num, suit, board) {
            this.num = num;
            this.suit = suit;
            this.element = createCardElement(this, board);
            this.body = this.element.find('.card-body');
        }
    }

    function init() {
        let board = new Board(6, ['club', 'diam', 'heart', 'spade'], $("#board"));

        for (let i = 1; i <= board.maxCardNum; i++) {
            board.suits.forEach(suit => {
                let card = new Card(i, suit, board);
                board.element.append(card.element);
            });
        }
    }

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

    function flipCard(card) {
        card.body.toggleClass('card-open');
    }

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

    function tryGetCards(board) {
        if (board.firstCard.num === board.secondCard.num) {
            board.firstCard.body.off();
            board.secondCard.body.off();
            board.got.push(board.firstCard, board.secondCard);
        }
        board.firstCard = null;
        board.secondCard = null;
    }

    init();
}