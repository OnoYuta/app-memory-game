'use strict';

{
    /**
     * 設定情報
     */
    class Config {
        constructor() {
            this.selectableNum = 2;
            this.maxCardNum = 6;
            this.rivalStrengthLevel = 2;
            this.suitVariation = ['club', 'diam', 'heart', 'spade'];
            this.playerNameLabelMap = { 'you': 'あなた', 'rival': 'ライバル' };
        }
        getRequest() {
            if (getParam('suit')) {
                this.updateSuit(getParam('suit'));
            }

            if (getParam('max-card-num')) {
                this.updateMaxCardNum(Number(getParam('max-card-num')));
            }

            if (getParam('rival-strength-level')) {
                this.updateRivalStrengthLevel(Number(getParam('rival-strength-level')));
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
            this.startBtn = $('#btn-start-memory');
            this.applyBtn = $('#btn-apply-setting');
            this.rivalStrengthLevel = $('#rival-strength-level');
            this.progressBars = {};
            this.numOfCards = {};
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
            let display = this;

            // スタートボタンをクリックするとゲームが開始する
            this.startBtn.click([board, display], function () {
                display.callBoardStartAction(board);
            });

            // カードが配置された領域をクリックした場合もゲームが開始する
            this.stage.click([board, display], function () {
                display.callBoardStartAction(board);
            });
        }
        callBoardStartAction(board) {
            board.start();

            // ゲーム開始のモーダルを表示する
            $('#modal-start').modal({
                backdrop: true,
                keyboard: true,
                show: true
            });

            $('#modal-start').click(function () {
                $(this).modal('hide');
            });

            this.stage.off();
            this.startBtn.off();
            this.startBtn.addClass('disabled');
            this.applyBtn.addClass('disabled');
            this.applyBtn.attr('disabled', true);
        }
        activateSettings() {
            this.activateInputSuit();
            this.activateInputMaxCardNum();
            this.activateInputRivalStrengthLevel();
        }
        activateInputMenu(menus, input, label) {
            for (let i = 0; i < menus.length; i++) {
                let menu = $(menus[i]['selector']);
                let value = menus[i]['value'];
                menu.click([input, label, menu, value], function () {
                    input.removeAttr('disabled');
                    input.attr('value', value);
                    label.html(menu.html());
                });
            }
        }
        reflectParameterToMenu(menus, input, label, key) {

            if (!getParam(key)) return false;

            let menu = $.grep(menus, function (menu, index) {
                let param = $.isNumeric(getParam(key)) ? Number(getParam(key)) : getParam(key);
                return (menu.value === param);
            }).shift();

            if (!menu) return false;

            let text = $(menu.selector).html();
            input.removeAttr('disabled');
            input.attr('value', menu.value);
            label.html(text);

            return true;
        }
        activateInputSuit() {
            let input = $('#input-suit');
            let label = $('#label-input-suit');

            let menus = [
                {
                    'selector': '#dropdown-item-suit-limited',
                    'value': 'limited'
                },
                {
                    'selector': '#dropdown-item-suit-all',
                    'value': 'all'
                }
            ];

            this.reflectParameterToMenu(menus, input, label, 'suit');
            this.activateInputMenu(menus, input, label);
        }
        activateInputMaxCardNum() {
            let input = $('#input-max-card-num');
            let label = $('#label-input-max-card-num');

            let menus = [
                {
                    'selector': '#dropdown-item-max-card-num-3',
                    'value': 3
                },
                {
                    'selector': '#dropdown-item-max-card-num-6',
                    'value': 6
                },
                {
                    'selector': '#dropdown-item-max-card-num-9',
                    'value': 9
                }
            ];

            this.reflectParameterToMenu(menus, input, label, 'max-card-num');
            this.activateInputMenu(menus, input, label);
        }
        activateInputRivalStrengthLevel() {
            let input = $('#input-rival-strength-level');
            let label = $('#label-input-rival-strength-level');

            let menus = [
                {
                    'selector': '#dropdown-item-rival-strength-1',
                    'value': 1
                },
                {
                    'selector': '#dropdown-item-rival-strength-2',
                    'value': 2
                },
                {
                    'selector': '#dropdown-item-rival-strength-3',
                    'value': 3
                },
                {
                    'selector': '#dropdown-item-rival-strength-0',
                    'value': 0
                },
            ];

            this.reflectParameterToMenu(menus, input, label, 'rival-strength-level');
            this.activateInputMenu(menus, input, label);
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
         * ゲームにNPCを参加させる
         * @param string name 
         * @param string label 
         * @param int strength 
         */
        addNpc(name, label, strength) {
            this.players.push(new Npc(name, label, strength));
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
                if (board.activePlayerIndex !== null && board.activePlayer.constructor !== Npc) {
                    board.selectCard(card);
                }
            });
            this.cards.push(card);
        }
        setPalyers(playerNameLabelMap, strength) {
            let playerNames = Object.keys(playerNameLabelMap);
            for (let i = 0; i < playerNames.length; i++) {
                let label = playerNameLabelMap[playerNames[i]];
                if (i === 1 && strength > 0) {
                    this.addNpc(playerNames[i], label, strength);
                    continue;
                }

                this.addPlayer(playerNames[i], label);
            }
        }
        /**
         * カードを選択する
         * @param Card card 
         */
        selectCard(card) {
            // 選択済みのカードはクリックしても何も起こらない
            if ($.inArray(card, this.selectedCards) >= 0) return false;

            if (!this.isSelectable()) return;

            // カードをめくった上でカード情報をボードに保存する
            card.body.addClass('card-open');
            this.selectedCards.push(card);

            // NPCにカードを記憶させる
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].constructor === Npc) {
                    this.players[i].memoryCard(card);
                }
            }

            // 2枚選んだら数字の比較を実行する
            if (this.selectedCards.length >= this.config.selectableNum) {
                this.tryGetCards();
                return;
            }
        }
        /**
         * ユーザがカードを選択可能な状態であればtrueを返す
         */
        isSelectable() {
            // 誰のターンでもないときはクリックしても何も起こらない
            if (this.activePlayerIndex === null) return false;

            // 既に2枚選んでいるときはクリックしても何も起こらない
            if (this.selectedCards.length >= this.config.selectableNum) return false;

            return true;
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
                let card = this.selectedCards.shift();

                // 選んだカードをボードから削除する
                this.cards = this.cards.filter(function (card) {
                    return !(card.num === this.num && card.suit === this.suit);
                }, card);

                // 選んだカードをNPCの記憶から削除する
                for (let i = 0; i < this.players.length; i++) {
                    if (this.players[i].constructor !== Npc) continue;
                    this.players[i].removeCardFromMemory(card);
                }

                card.body.off();
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

            // ターン表示を更新する
            $('#toast-turn-who').text(this.players[this.activePlayerIndex].label);
            for (let i = 0; i < this.players.length; i++) {
                $('#toast-turn-num' + (i + 1)).text(this.players[i].cards.length);
            }
            $('#toast-turn').toast('show');

            // 次がNPCのターンならカードを選択する処理を呼び出す
            if (this.activePlayer.constructor === Npc) {
                let board = this;
                setTimeout(function () {
                    board.repeatAutoCardSelectionAsNpc(board);
                }, 2000);
            }
        }
        /**
         * NPCが自動でカードを選択する処理を繰り返す
         * @param Board board 
         */
        repeatAutoCardSelectionAsNpc(board) {
            board.selectCard(board.activePlayer.selectCardAtRandom(board.cards));

            // NPCがカードを獲得したときはアクションが完了するように2秒待つ
            if (board.selectedCards.length === 0) {
                setTimeout(function () {
                    board.repeatAutoCardSelectionAsNpc(board);
                }, 2000);
            } else if (board.selectedCards.length < board.config.selectableNum) {
                setTimeout(function () {
                    board.repeatAutoCardSelectionAsNpc(board);
                }, 1000);
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
     * プログラムによる自動操作のプレイヤ
     */
    class Npc extends Player {
        /**
         * コンストラクタ
         * @param string name 
         * @param string label 
         * @param int strength 
         */
        constructor(name, label, strength) {
            super(name, label);
            this.memorizedCards = [];
            this.memoryCapacity = this.getMemoryCapacity(strength);
        }
        /**
         * 設定した強さに応じて記憶容量を定める
         * @param int strength 
         */
        getMemoryCapacity(strength) {
            switch (strength) {
                case 1:
                    return 3;
                case 2:
                    return 5;
                case 3:
                    return 7;
            }

            return 5;
        }
        /**
         * 表になったカードを記憶する
         * @param Card card 
         */
        memoryCard(card) {
            this.memorizedCards.push(card);
        }
        /**
         * 指定したカードを記憶から削除する
         * @param Card card 
         */
        removeCardFromMemory(card) {
            this.memorizedCards = this.memorizedCards.filter(function (card) {
                return !(card.num === this.num && card.suit === this.suit);
            }, card);
        }
        /**
         * 記憶したカードの中に同じ数字のペアがあれば返す
         */
        findSameNumberCardsInMemory() {
            let memorizedCardNums = [];

            for (let i = 0; i < this.memorizedCards.length; i++) {
                let sameNumberCardIndex = $.inArray(this.memorizedCards[i].num, memorizedCardNums);

                if (sameNumberCardIndex !== -1) {
                    return [this.memorizedCards[sameNumberCardIndex], this.memorizedCards[i]];
                }

                memorizedCardNums.push(this.memorizedCards[i].num);
            }

            return -1;
        }
        /**
         * 記憶容量を超えた分のカードを忘れる
         * @param array memorizedCards 
         * @param int memoryCapacity 
         */
        forgetMemorizedCards(memorizedCards, memoryCapacity) {

            let forget;

            // 覚えるべきカードが記憶容量を超えた場合に忘れる
            while (memorizedCards.length > memoryCapacity) {
                let forgetMemorizedCardsIndex = getForgetMemorizedCardsIndex(memorizedCards);
                forget = memorizedCards.splice(forgetMemorizedCardsIndex, 1);
            }

            return forget ? forget[0] : -1;
        }
        /**
         * 忘れるカードのインデックスを取得する
         * @param array memorizedCards 
         */
        getForgetMemorizedCardsIndex(memorizedCards) {

            let weightedMemorizedCards = [];

            for (let i = 0; i < memorizedCards.length; i++) {
                for (let j = memorizedCards.length - i; j > 0; j--) {
                    weightedMemorizedCards.push(memorizedCards[i]);
                }
            }

            return weightedMemorizedCards[Math.floor(Math.random() * weightedMemorizedCards.length)];
        }
        /**
         * ランダムにカードを選択する
         * @param Array cards 
         */
        selectCardAtRandom(cards) {
            return cards[Math.floor(Math.random() * cards.length)];
        }
    }

    /**
     * ゲーム開始に必要な準備をする
     */
    function init() {
        let config = new Config();
        config.getRequest();

        let display = new Display();
        display.setPalyerNames(config.playerNameLabelMap);
        display.activateSettings();

        let board = new Board(config, display);
        board.setPalyers(config.playerNameLabelMap, config.rivalStrengthLevel);

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