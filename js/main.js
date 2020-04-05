'use strict';

{
    /**
     * 設定情報
     */
    class Config {
        constructor() {
            this.suitVariation = ['club', 'diam', 'heart', 'spade'];
            this.maxCardNum = 6;
            this.rivalStrengthLevel = 2;
            this.playerNameLabelMap = { 'you': 'あなた', 'rival': 'ライバル' };
            this.selectableNum = 2;
        }
        getRequest() {
            if (getParam('suit')) {
                this.updateSuit(getParam('suit'));
            }

            if (getParam('max-card-num')) {
                this.updateMaxCardNum(getParam('max-card-num'));
            }

            if (getParam('rival-strength-level')) {
                this.updateRivalStrengthLevel(getParam('rival-strength-level'));
            }
        }
        updateSuit(suit) {
            if (suit === 'limited') {
                this.suitVariation = ['spade', 'heart'];
                return;
            }
            this.suitVariation = ['spade', 'heart', 'club', 'diam'];
        }
        updateMaxCardNum(maxCardNum) {
            if (maxCardNum === 3 || maxCardNum === 6 || maxCardNum === 9) {
                this.maxCardNum = maxCardNum;
            }
        }
        updateRivalStrengthLevel(rivalStrengthLevel) {
            if ($.isNumeric(rivalStrengthLevel) && rivalStrengthLevel <= 3 && rivalStrengthLevel >= 0) {
                this.rivalStrengthLevel = rivalStrengthLevel;
            }
        }
    }

    /**
     * HTML要素
     */
    class Display {
        constructor() {
            this.stage = $("#stage");
            this.progressBars = {};
            this.numOfCards = {};
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
        setPalyerNames(playerNameLabelMap) {
            let playerNames = Object.keys(playerNameLabelMap);
            for (let i = 0; i < playerNames.length; i++) {
                let label = playerNameLabelMap[playerNames[i]];
                this.progressBars[label] = new ProgressBar(label, $('#progress-bar' + (i + 1)));
                this.numOfCards[label] = new NumOfCard(label, $('#num-of-cards' + (i + 1)));
            }
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
         * コンストラクタ
         * @param Config config 
         * @param Display display 
         */
        constructor(config, display) {
            this.players = [];
            this.cards = [];
            this.activePlayerIndex = null;
            this.selectedCards = [];
            this.config = config
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
         * ボードにカードをセットする
         * @param Card card 
         */
        appendCard(card) {
            let board = this;
            card.body.click([card, board], function () {
                board.selectCard(card);
            });
            this.cards.push(card);
        }
        setPalyers(playerNameLabelMap) {
            let board = this;
            $.each(playerNameLabelMap, function (name, label) {
                board.addPlayer(name, label);
            });
        }
        /**
         * カードを選択する
         * @param Card card 
         */
        selectCard(card) {

            if (this.activePlayerIndex === null) return;

            if ($.inArray(card, this.config.selectedCards) >= 0) return;

            if (this.selectedCards.length < this.config.selectableNum) {
                card.body.addClass('card-open');
                this.selectedCards.push(card);
            }

            if (this.selectedCards.length >= this.config.selectableNum) {
                this.tryGetCards();
                return;
            }
        }
        /**
         * 選んだ2枚の番号が一致すればカードを獲得する
         * 番号が一致しなければ次のプレイヤに操作を移す
         */
        tryGetCards() {
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
        let config = new Config();
        config.getRequest();
        console.log(config);

        let display = new Display();
        display.setPalyerNames(config.playerNameLabelMap);

        let board = new Board(config, display);
        board.setPalyers(config.playerNameLabelMap);

        // 使用するカードをボードにセットする
        for (let i = 1; i <= config.maxCardNum; i++) {
            config.suitVariation.forEach(suit => {
                let card = new Card(i, suit);
                board.appendCard(card, display);
            });
        }

        display.setCards(board.cards);

        $.each(config.playerNameLabelMap, function () {
            display.updateProgressBar(this, 0);
            display.updateNumOfCard(this, 0);
        });

        display.activateStartBtn(board);
    }

    /**
     * キーを指定してクエリパラメータを取得する
     * @param string name 
     * @param string url 
     */
    function getParam(name, url) {
        if (!url) url = window.location.href;
        name = name.replace(/[\[\]]/g, "\\$&");
        var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
            results = regex.exec(url);
        if (!results) return null;
        if (!results[2]) return '';
        return decodeURIComponent(results[2].replace(/\+/g, " "));
    }

    init();
}