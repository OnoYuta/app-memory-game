'use strict';

{
    let board = {
        'firstCard': null,
        'secondCard': null,
    }

    function init() {
        let num = 6;
        let suits = [
            'club',
            'diam',
            'heart',
            'spade'
        ];

        for (let i = 1; i <= num; i++) {
            suits.forEach(suit => {
                $("#board").append(createCard(i, suit));
            });
        }
    }

    function createCard(num, suit) {
        let front = $("<div></div>").addClass("card-front suit-" + suit).append(num);
        let back = $("<div></div>").addClass("card-back").html('CARD');
        let card = $("<div></div>").addClass("my-card card-close").append(front, back);
        card.click(function () {
            flipCard(board, card);
        });
        let wrapper = $("<div></div>").addClass("card-wrapper").append(card);
        let result = $("<div></div>").addClass("col-3 col-md-2 py-3").append(wrapper);

        return result;
    }

    function flipCard(board, card) {
        if (board['firstCard'] && board['secondCard']) return;
        if (card.hasClass('open')) return;

        card.toggleClass('card-close');
        card.toggleClass('card-open');
    }

    init();
}