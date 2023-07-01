const misskey_token = PropertiesService.getScriptProperties().getProperty("MISSKEY_TOKEN");
const playId = PropertiesService.getScriptProperties().getProperty("MISSKEY_PLAY_ID");
const domain = PropertiesService.getScriptProperties().getProperty("MISSKEY_DOMAIN");

function getWordleScript(wordleData) {
  const wordleObject = JSON.stringify(wordleData, null, 4).replaceAll(/^[\s]+\"/gm, "    ").replaceAll(/\":/g, ":");
  return `/// @ 0.13.2

/**
 * Misskey Wordle v0.1.2
 * Code itself is (c) Osaka Prefectural Tondabayashi Junior and Senior High School
 * "Misskey Wordle" is not affiliated with "Wordle" by NYTimes in any way.
 * Original Author: @natureofmad@misskey.io
 * 
 * Licensed under CC BY-NC-SA 4.0. Learn more at https://creativecommons.org/licenses/by-nc-sa/4.0/
 * 
 * この下には解答が記載されています。注意！
 * 
 * 
 * この下には解答が記載されています。注意！
 * 
 * 
 * この下には解答が記載されています。注意！
 * （大事なことなので3回言いました）
 **/

/** Wordleの情報（自動アップデート） */
let wordleData = ${wordleObject}

/** 挑戦限度回数 */
let attemptLimit = 6

/** 現在のフォーム入力内容 */
var currentInput = ""

/** 入力内容保持（単語は小文字） */
let trials = []

/**
 * 入力内容のヒント（以下の文字を「ncnwc」のように記述する）
 * n ... not in any spot
 * w ... used, but in another spot
 * c ... used and in correct spot
 */
let trialOutcomes = []

/**
 * アルファベット表（入力検証用）
 */
let alphabetLowerCase = "abcdefghijklmnopqrstuvwxyz"
let alphabetUpperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

// ヒント画面描画
@renderHintModule() {
    var mfm = []
    for let i, attemptLimit {
        if (i < trials.len) {
            let trialA = trials[i].split()
            let outA = []
            for let j, trialA.len {
                var char = alphabetUpperCase.pick(alphabetLowerCase.index_of(trialA[j]))
                if (trialOutcomes[i].pick(j) == 'n') {
                    outA.push(\`$[bg.color=787c7e $[fg.color=fff  {char} ]]\`)
                } else if (trialOutcomes[i].pick(j) == 'w') {
                    outA.push(\`$[bg.color=c9b458 $[fg.color=fff  {char} ]]\`)
                } else if (trialOutcomes[i].pick(j) == 'c') {
                    outA.push(\`$[bg.color=6aaa64 $[fg.color=fff  {char} ]]\`)
                }
            }
            mfm.push(outA.join(" "))
        } else {
            mfm.push("$[bg.color=d3d6da  _ ] $[bg.color=d3d6da  _ ] $[bg.color=d3d6da  _ ] $[bg.color=d3d6da  _ ] $[bg.color=d3d6da  _ ]")
        }
    }
    mfm = \`**{mfm.join(\`{Str:lf}{Str:lf}\`)}**\`
    Ui:get('hintModule').update({
        children: [
            Ui:C:mfm({
                text: \`<center>{mfm}</center>\`
                font: "monospace"
            })
        ]
    })
}

// シェア用テキスト生成
@createShareText() {
    var result = ""
    if (trialOutcomes[trialOutcomes.len - 1] != "ccccc") {
        result = \`X/{attemptLimit}\`
    } else {
        result = \`{trialOutcomes.len}/{attemptLimit}\`
    }

    let header =\`Wordle {wordleData.quizNo} {result}{Str:lf}\`
    
    var tiles = []
    for let i, trialOutcomes.len {
        let outA = []
        let tileA = trialOutcomes[i].split()
        for let j, tileA.len {
            if (tileA[j] == 'n') {
                outA.push('⬜')
            } else if (tileA[j] == 'w') {
                outA.push('🟨')
            } else if (tileA[j] == 'c') {
                outA.push('🟩')
            }
        }
        tiles.push(outA.join(" "))
    }
    tiles = tiles.join(Str:lf)

    return \`{header}{Str:lf}{tiles}{Str:lf}#MisskeyWordle {THIS_URL}\`
}

// 回答検証
@sendTrial() {
    if (currentInput == "") {
        print("currentInput is empty")
        return null
    }

    // 文字数
    if (currentInput.len != 5) {
        Mk:dialog(
            "単語の文字数が足りません"
            "5文字の単語を入力してください"
            "warn"
        )
        return null
    }

    var currentInputArray = currentInput.split()
    var currentInputFeedback = []

    for let i, currentInputArray.len {
        var char = currentInputArray[i]

        // アルファベット 検証
        if (Core:and(!alphabetLowerCase.incl(char), !alphabetUpperCase.incl(char))) {
            Mk:dialog(
                "使用できない文字が含まれています"
                "5文字の英単語を入力してください"
                "warn"
            )
            return null
        }

        // 小文字に強制
        if (alphabetUpperCase.incl(char)) {
            currentInputArray[i] = alphabetLowerCase.pick(alphabetUpperCase.index_of(char))
            char = alphabetLowerCase.pick(alphabetUpperCase.index_of(char))
        }

        let answerArray = wordleData.answer.split()

        if (answerArray[i] == char) {
            // 回答検証（C）
            currentInputFeedback[i] = "c"
        } else if (answerArray.incl(char)) {
            // 回答検証（W）
            currentInputFeedback[i] = "w"
        } else {
            // 回答検証（N）
            currentInputFeedback[i] = "n"
        }
    }

    // データ保存
    trials.push(currentInputArray.join())
    trialOutcomes.push(currentInputFeedback.join())

    // 再描画
    renderHintModule()

    // フォームクリア
    Ui:get('textModule').update({
        children: [
            Ui:C:textInput({
                onInput: @(value) {
                    currentInput = value
                }
                label: '5文字の単語を入力'
            })
            Ui:C:button({
                text: 'たしかめる'
                primary: true
                onClick: @() {
                    sendTrial()
                }
            })
        ]
    })

    if (currentInputFeedback.join() == 'ccccc') {
        // 正解
        Ui:get('textModule').update({
            children: [
                Ui:C:mfm({
                    text: "<center>$[x2 $[fg.color=f00 **正解！**]]</center>"
                })
                Ui:C:postFormButton({
                    text: "投稿する"
                    primary: true
                    rounded: true
                    form: {
                        text: createShareText()
                    }
                })
            ]
        })
    } else if (trialOutcomes.len >= attemptLimit) {
        // 挑戦限度超過
        Ui:get('textModule').update({
            children: [
                Ui:C:mfm({
                    text: "<center>$[x2 $[fg.color=00f **挑戦失敗…**]]</center>"
                })
                Ui:C:postFormButton({
                    text: "投稿する"
                    primary: true
                    rounded: true
                    form: {
                        text: createShareText()
                    }
                })
            ]
        })
    }
}

// 初回レンダリング
Ui:render([
    Ui:C:mfm({ text: \`<center>***Wordle***{Str:lf}No.{wordleData.quizNo} / {wordleData.date}</center>\` })
    Ui:C:container({
        borderWidth: 4
        padding: 18
        rounded: true
        bgColor: 'var(--bg, #884)'
    } 'hintModule')
    Ui:C:container({
        children: [
            Ui:C:textInput({
                onInput: @(value) {
                    currentInput = value
                }
                label: '5文字の単語を入力'
            })
            Ui:C:button({
                text: 'たしかめる'
                primary: true
                onClick: @() {
                    sendTrial()
                }
            })
        ]
        borderWidth: 4
        padding: 18
        rounded: true
        bgColor: 'var(--bg, #884)'
        align: 'center'
    } 'textModule')
])
renderHintModule()`;
}

function fixedTimeExecution() {
  var d = new Date();
  
  if (d.getHours() == 0 && d.getMinutes() == 2) {
    updateFlash();
  } else {
    console.log("実行なし");
  }
}

function updateFlash() {
  var d = new Date();

  const wordleRaw = UrlFetchApp.fetch(`https://www.nytimes.com/svc/wordle/v2/${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, "0")}-${d.getDate().toString().padStart(2, "0")}.json`);

  const wordleRawJSON = JSON.parse(wordleRaw);

  const wordleData = {
    answer: wordleRawJSON.solution,
    quizNo: wordleRawJSON.days_since_launch,
    date: wordleRawJSON.print_date
  };

  console.log(wordleData);

  var data = {
    i: misskey_token,
    flashId: playId,
    script: getWordleScript(wordleData),
    title: "【毎日更新】Misskey Wordle",
    summary: `英単語当てゲームのMisskey移植版。本家と同じ問題に挑戦できます。日本時間毎日午前0時ごろに問題を更新します（${(d.getMonth() + 1).toString().padStart(2, "0")}月${d.getDate().toString().padStart(2, "0")}日 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}更新）`,
    permissions: [],
  };

  var options = {
    contentType: "application/json",
    method: "POST",
    payload: JSON.stringify(data)
  };

  UrlFetchApp.fetch(domain.replace(/\/$/, "") + "/api/flash/update", options).getContentText();
}