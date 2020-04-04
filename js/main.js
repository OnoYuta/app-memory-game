'use strict';

{
    // ゲームの設定
    const limitCardNum = 6;
    const suitVariation = ['club', 'diam', 'heart', 'spade'];
    const playerNameLabelMap = { 'you': 'あなた', 'rival': 'ライバル' };
    const selectableNum = 2;

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
         * @param Object stage 
         */
        constructor(stage) {
            this.stage = stage;
            this.players = [];
            this.cards = [];
            this.activePlayerIndex = null;
            this.selectedCards = [];
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
        updateHtml() {
            for (let i = 0; i < this.players.length; i++) {
                this.updateProgressBar(i, this.players[i]);
                this.updateNumCards(i, this.players[i]);
            }
        }
        /**
         * プログレスバーを更新する
         * @param int index 
         * @param Player player 
         */
        updateProgressBar(index, player) {
            let progressBar = (index === 0) ? youProgressBar : rivalProgressBar;
            let totalNumCards = limitCardNum * suitVariation.length;
            let progress = Math.round((player.numCards / totalNumCards) * 100);
            progressBar.html(player.label + ' ' + progress + '%').attr({
                'style': 'width: ' + progress + '%',
                'aria-valuenow': progress,
            });
            return;
        }
        /**
         * 獲得カード枚数を更新する
         * @param int index 
         * @param Player player 
         */
        updateNumCards(index, player) {
            let numCardsElement = (index === 0) ? numYouCards : numRivalCards;
            let totalNumCards = limitCardNum * suitVariation.length;
            numCardsElement.html(
                player.numCards + '枚 <small class="text-muted">/' + totalNumCards + '</small>'
            );
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
            this.stage.append(card.element);
        }
        /**
         * カードを選択する
         * @param Card card 
         */
        selectCard(card) {

            // ここにactivePlayerがマニュアル操作でないときはreturnの処理を実装予定

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
            this.updateHtml();
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
            let element = $("<div></div>").addClass("col-3 col-md-2 py-3").append(wrapper);

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
        /**
         * 獲得したカード枚数を取得する
         */
        get numCards() {
            return this.cards.length;
        }
    }

    /**
     * ゲーム開始に必要な準備をする
     */
    function init() {
        // ボードを作成する
        let board = new Board(stage);

        // 参加プレイヤをボードにセットする
        $.each(playerNameLabelMap, function (name, label) {
            board.addPlayer(name, label);
        });

        // 使用するカードをボードにセットする
        for (let i = 1; i <= limitCardNum; i++) {
            suitVariation.forEach(suit => {
                let card = new Card(i, suit);
                board.appendCard(card);
            });
        }

        board.start();

        board.updateHtml();
    }

    init();
}