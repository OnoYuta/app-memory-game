'use strict';

{
    // ゲームの設定
    const maxCardNum = 6;
    const suitVariation = ['club', 'diam', 'heart', 'spade'];
    const playerNameLabelMap = { 'you': 'あなた', 'rival': 'ライバル' };
    const selectableNum = 2;

    /**
     * ブラウザ表示画面
     */
    class Display {
        constructor(playerNameLabelMap) {
            this.stage = $("#stage");
            this.progressBars = {
                [playerNameLabelMap['you']]: new ProgressBar(playerNameLabelMap['you'], $('#you-progress-bar')),
                [playerNameLabelMap['rival']]: new ProgressBar(playerNameLabelMap['rival'], $('#rival-progress-bar')),
            };
            this.numOfCards = {
                [playerNameLabelMap['you']]: new NumOfCard(playerNameLabelMap['you'], $('#num-you-cards')),
                [playerNameLabelMap['rival']]: new NumOfCard(playerNameLabelMap['rival'], $('#num-rival-cards')),
            };
            this.rivalStrengthLevel = $('#rival-strength-level');
            this.startBtn = $('#btn-start-memory');
        }
        setCards(cards) {
            for (let i = 0; i < cards.length; i++) {
                this.stage.append(cards[i].element);
            }

            let display = this;

            $.each(this.progressBars, function (index) {
                display.progressBars[index].setMax(cards.length);
            });

            $.each(this.numOfCards, function (index) {
                display.numOfCards[index].setMax(cards.length);
            });
        }
        activateStartBtn(board) {
            let btn = this.startBtn;
            btn.click([board, btn], function () {
                board.start();
                btn.addClass('disabled');
            });
        }
        updateProgressBar(index, value) {
            this.progressBars[index].updateValue(value);
        }
        updateNumOfCard(index, value) {
            this.numOfCards[index].updateValue(value);
        }
    }

    /**
     * ゲーム進捗をグラフ化するプログレスバー
     */
    class ProgressBar {
        constructor(label, element) {
            this.label = label;
            this.value = 0;
            this.max = 0;
            this.element = element;
        }
        updateValue(value) {
            this.value = value;
            this.updateElement();
        }
        setMax(max) {
            this.max = max;
        }
        updateElement() {
            let progress = Math.round((this.value / this.max) * 100);
            this.element.html(this.label + ' ' + progress + '%').attr({
                'style': 'width: ' + progress + '%',
                'aria-valuenow': progress,
            });
        }
    }

    /**
     * プレイヤが獲得したカード枚数表示
     */
    class NumOfCard {
        constructor(label, element) {
            this.label = label;
            this.value = 0;
            this.max = 0;
            this.element = element;
        }
        updateValue(value) {
            this.value = value;
            this.updateElement();
        }
        setMax(max) {
            this.max = max;
        }
        updateElement() {
            this.element.html(
                this.value + '枚 <small class="text-muted">/' + this.max + '</small>'
            );
        }
    }

    /**
     * ゲームの進行を管理する
     */
    class Board {
        /**
         * @param Object display 
         */
        constructor(display) {
            this.players = [];
            this.cards = [];
            this.activePlayerIndex = null;
            this.selectedCards = [];
            this.display = display;
        }
        get activePlayer() {
            return this.players[this.activePlayerIndex];
        }
        /**
         * ゲームにプレイヤを参加させる
         * @param string name 
         * @param string label 
         */
        addPlayer(name, label) {
            this.players.push(new Player(name, label));
        }
        /**
         * ゲームの進捗をHTMLに反映させる
         */
        updateDisplay() {
            this.display.updateProgressBar(this.activePlayer.label, this.activePlayer.cards.length);
            this.display.updateNumOfCard(this.activePlayer.label, this.activePlayer.cards.length);
        }
        /**
         * 獲得カード枚数を更新する
         * @param int index 
         * @param Player player 
         */
        updateNumCards(index, player) {
            let numCardsElement = (index === 0) ? numYouCards : numRivalCards;
            let totalNumCards = maxCardNum * suitVariation.length;
            numCardsElement.html(
                player.numCards + '枚 <small class="text-muted">/' + totalNumCards + '</small>'
            );
        }
        /**
         * ボードにカードをセットする
         * @param Card card 
         */
        appendCard(card, display) {
            let board = this;
            card.body.click([card, board], function () {
                board.selectCard(card);
            });
            this.cards.push(card);
        }
        /**
         * カードを選択する
         * @param Card card 
         */
        selectCard(card) {

            if (this.activePlayerIndex === null) return;

            if ($.inArray(card, this.selectedCards) >= 0) return;

            if (this.selectedCards.length < selectableNum) {
                card.body.addClass('card-open');
                this.selectedCards.push(card);
            }

            if (this.selectedCards.length >= selectableNum) {
                this.tryGetCards();
                return;
            }
        }
        /**
         * 選んだ2枚の番号が一致すればカードを獲得する
         * 番号が一致しなければ次のプレイヤに操作を移す
         */
        tryGetCards() {
            console.log(this.activePlayerIndex);
            if (this.isNumOfCardsMatched()) {
                this.getCardsAsActivePlayer();
            } else {
                this.resetCards();
                this.moveOnNextTurn();
            }
            this.updateDisplay();
        }
        /**
         * 選んだカードの番号が一致していればtrueを返す
         */
        isNumOfCardsMatched() {
            let num;

            for (let i = 0; i < this.selectedCards.length; i++) {
                if (!num) {
                    num = this.selectedCards[i].num;
                    continue;
                }
                if (num !== this.selectedCards[i].num) {
                    return false;
                }
            }

            return true;
        }
        /**
         * 選んだカードをアクティブなプレイヤのものにする
         */
        getCardsAsActivePlayer() {
            while (this.selectedCards.length > 0) {
                let card = this.selectedCards.shift().body.off();
                this.activePlayer.cards.push(card);
            }
        }
        /**
         * 表にしたカードを裏に戻して
         */
        resetCards() {
            let lastCard = this.selectedCards[this.selectedCards.length - 1];

            // カードを表にしてから裏返すためにtransitionendイベントとして定義する
            lastCard.body.on('transitionend webkitTransitionEnd', { body: lastCard.body, board: this }, function (e) {
                // 1度だけ実行すればよいのでイベントを無効にする
                e.data.body.off('transitionend webkitTransitionEnd');

                while (e.data.board.selectedCards.length > 0) {
                    let card = e.data.board.selectedCards.shift();
                    card.body.removeClass('card-open');
                }
            });
        }
        /**
         * 次のプレイヤのターンに進む
         */
        moveOnNextTurn() {
            if (this.activePlayerIndex < this.players.length - 1) {
                this.activePlayerIndex++;
            } else {
                this.activePlayerIndex = 0;
            }
        }
        /**
         * プレイヤをアクティブにしてゲームを開始する
         */
        start() {
            this.activePlayerIndex = 0;
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
         */
        constructor(num, suit) {
            this.num = num;
            this.suit = suit;
            this.element = this.createCardElement(num, suit);
        }
        get body() {
            return this.element.find('.card-body');
        }
        /**
         * 
         * @param int num 
         * @param string suit 
         */
        createCardElement(num, suit) {
            let front = $("<div></div>").addClass("card-front suit-" + suit).append(num);
            let back = $("<div></div>").addClass("card-back").html('CARD');
            let body = $("<div></div>").addClass("card-body").append(front, back);
            let wrapper = $("<div></div>").addClass("card-wrapper").append(body);
            let element = $("<div></div>").addClass("col-3 col-md-2 py-1").append(wrapper);

            return element;
        }
    }

    /**
     * ゲームに参加するプレイヤ
     */
    class Player {
        /**
         * @param string name 
         * @param string label 
         */
        constructor(name, label) {
            this.name = name;
            this.label = label;
            this.cards = [];
        }
    }

    /**
     * ゲーム開始に必要な準備をする
     */
    function init() {
        let display = new Display(playerNameLabelMap);

        // ボードを作成する
        let board = new Board(display);

        // 参加プレイヤをボードにセットする
        $.each(playerNameLabelMap, function (name, label) {
            board.addPlayer(name, label);
        });

        // 使用するカードをボードにセットする
        for (let i = 1; i <= maxCardNum; i++) {
            suitVariation.forEach(suit => {
                let card = new Card(i, suit);
                board.appendCard(card, display);
            });
        }

        display.setCards(board.cards);

        $.each(playerNameLabelMap, function () {
            display.updateProgressBar(this, 0);
            display.updateNumOfCard(this, 0);
        });

        display.activateStartBtn(board);
    }

    init();
}