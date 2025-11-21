// -------------------- 連絡先・個人情報設定 (ここを書き換えてください) --------------------
const STUDY_CONTACT = {
  name: '樋口　洋子', // 研究責任者の氏名
  affiliation: '千葉工業大学 情報変革科学部 認知情報科学科',
  address: '千葉県習志野市津田沼2-17-1',
  phone: '047-478-0107', // 電話番号
  email: 'higuchi.yoko@p.chibakoudai.jp' // メールアドレス
};

// -------------------- HELPER FUNCTIONS FOR ID GENERATION --------------------

// ★★★ 999, 998, 997, 996, 995 を除外するための定数リスト ★★★
const EXCLUDED_NUMS = [999, 998, 997, 996, 995];

// ★★★ 新しいID生成ロジック ★★★
// 000〜999の中から、EXCLUDED_NUMS に含まれない安全な3桁の数字をランダムに生成
function generateSafe3Digit() {
    let num;
    do {
        // 0から999までのランダムな整数を生成
        num = Math.floor(Math.random() * 1000);
    // 生成された数が EXCLUDED_NUMS に含まれる間、ループを継続
    } while (EXCLUDED_NUMS.includes(num));

    // 数字を文字列に変換し、先頭を '0' で埋めて3桁にする (例: 5 -> "005")
    return String(num).padStart(3, '0');
}

// -------------------- ADDED STUDY DESCRIPTION / CONSENT / WITHDRAWAL BLOCK --------------------

// 1) 説明文書（目を通したら J キー）
const study_description_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    return `
    <div style="max-width: 900px; margin: 0 auto; line-height: 1.6; text-align: left; font-size: 16px;">
      <h2 style="text-align:center;">実験説明書</h2>
      <div style="display:flex; gap:20px; align-items:flex-start; margin-bottom: 20px;">
        <div style="flex:0 0 250px;">
             <img src="scenes/Illustration.png" alt="Illustration" style="width:100%; height:auto; border:1px solid #ddd; padding:5px;"/>
        </div>
        <div style="flex:1;">
          <p><strong>研究課題：</strong>見たり聞いたりすることでヒトが学ぶ仕組みの研究</p>
          <p><strong>研究実施場所：</strong>${STUDY_CONTACT.affiliation}</p>
          <p><strong>研究責任者：</strong>${STUDY_CONTACT.affiliation}<br>助教 ${STUDY_CONTACT.name}</p>
          <hr>
          <p><strong>【研究目的】</strong></p>
          <p>本研究では、ヒトが何度も見たり聞いたりする訓練を通じて、見え方や聞こえ方、感じ方、考え方がどのように変わり、その変化には脳のどのような仕組みが関わるか明らかにすることを目的として行われています。また、この実験は、個人の能力を検査するものではありません。本実験への参加により予想される利益・不利益はありません。</p>
          <p><strong>【研究方法】</strong></p>
          <p>実験室内の椅子に座り、ディスプレイに向かって課題を行っていただきます。行っていただく課題は、ディスプレイやスピーカー、イヤホンなどから提示される視聴覚刺激の種類の判別です（左図参照）。マウスやキーボード等の操作、またはマイクへの発話による回答を行っていただきます。</p>
          <p>課題は5〜10分ごとに小休止します。ご自身の判断で休憩を取りながら課題を行います。全ての測定に要する時間は、1回あたり最大2時間です。</p>
        </div>
      </div>
      <hr>
      <p style="text-align:center; font-size:1.1em; font-weight:bold;">この説明を読み終えたら、<span style="color:red;">J キー</span> を押して次へ進んでください。</p>
    </div>
    `;
  },
  choices: ['j'],
  data: { task_phase: 'study_description' }
};

// 2) 同意書フォーム（チェックボックス・入力必須、次へボタンで遷移）
const consent_form_html = `
  <div style="max-width:800px; margin:0 auto; line-height:1.6; text-align:left; font-size:15px;">
    <h2 style="text-align:center;">研究参加同意書</h2>
    <p><strong>${STUDY_CONTACT.affiliation}<br>助教 ${STUDY_CONTACT.name} 殿</strong></p>
    <p>私は以下の項目について確認し、本研究の参加に同意します。</p>
    
    <form id="consent-form" style="border:1px solid #ccc; padding:20px; border-radius:5px; background-color:#fff;">
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check1" required> 研究目的・研究方法</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check2" required> 参加条件（視力0.8以上、18歳以上等）</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check3" required> いつでも実験の中断や参加の同意を撤回できること</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check4" required> 個人情報の保護</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check5" required> 特定の個人を識別できない状態で測定データが公的データベースで公開される可能性があること</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check6" required> 謝礼・交通費</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check7" required> 知的財産の権利が自分にないこと</label></div>
      <div style="margin-bottom: 10px;"><label><input type="checkbox" name="check8" required> その他について</label></div>
      <hr>
      <div style="display:flex; gap:20px; margin-bottom:10px;">
        <div style="flex:1;">
          <label>フリガナ（必須）<br><input type="text" name="kana" required style="width:100%; padding:5px;"></label>
        </div>
        <div style="flex:1;">
          <label>年齢（必須）<br><input type="number" name="age" min="18" required style="width:50%; padding:5px;"> 歳</label>
        </div>
        <div style="flex:1;">
          <label>性別（必須）<br>
            <select name="gender" required style="padding:5px;">
              <option value="">選択してください</option>
              <option value="male">男</option>
              <option value="female">女</option>
              <option value="other">その他/回答しない</option>
            </select>
          </label>
        </div>
      </div>
      <div style="margin-bottom:10px;">
        <label>署名（必須：お名前を入力してください）<br><input type="text" name="signature" required style="width:100%; padding:5px;"></label>
      </div>
      <div style="margin-bottom:10px;">
        <label>Email（必須）<br><input type="email" name="email" required style="width:100%; padding:5px;"></label>
      </div>
      <p style="font-size:0.9em; text-align:right;">署名日：${new Date().toLocaleDateString()}</p>
      
      <div style="text-align:center; margin-top:20px;">
        <button type="button" id="btn-consent" disabled style="padding:10px 30px; font-size:1.2em; cursor:pointer;">次へ</button>
      </div>
    </form>
  </div>
`;

const consent_form_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: consent_form_html,
  choices: "NO_KEYS", // キーボードでの進行を無効化
  data: { task_phase: 'consent_form' },
  on_load: function() {
    const form = document.getElementById('consent-form');
    const btn = document.getElementById('btn-consent');
    
    // 入力状態を監視してボタンの有効/無効を切り替え
    const checkValidity = () => {
      const isValid = form.checkValidity(); // 全てのrequiredが満たされているか
      btn.disabled = !isValid;
    };

    form.addEventListener('change', checkValidity);
    form.addEventListener('input', checkValidity);

    // ボタンクリック時の処理
    btn.addEventListener('click', function() {
      if (!allRequiredFilled()) {
        btn.disabled = true; return;
      }
      // collect form data
      const formData = new FormData(form);
      const obj = {};
      for (const [k,v] of formData.entries()) { obj[k] = v; }
      // record the consent data into jsPsych data
      jsPsych.data.write({ task_phase: 'consent_form', consent: true, consent_data: obj });
      jsPsych.finishTrial();
    });

    // initial validation check
    checkValidity(); // 関数名修正
  }
};

// 3) 同意撤回連絡先画面（同様に J キーで進む）
const withdrawal_info_trial = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() {
    return `
      <div style="max-width: 800px; margin: 0 auto; line-height: 1.6; text-align: left;">
        <h2 style="text-align:center;">実験の中断・同意の撤回について</h2>
        <p>実験への参加は任意です。いつでも実験への参加を中断できます。また実験途中や実験後であっても同意を撤回することができます。同意撤回や実験の中断によって不利な扱いを受けることはありません。</p>
        <p>同意撤回の意思が示されたときは、学会等の発表前であれば計測データ等は破棄します。</p>
        <hr>
        <p>もし実験結果の使用などに同意の撤回をしたい場合は、下記アドレスまで連絡してください。</p>
        <div style="background-color:#f9f9f9; padding:20px; border-radius:5px; text-align:center;">
          <p><strong>研究責任者：${STUDY_CONTACT.name}</strong></p>
          <p>${STUDY_CONTACT.affiliation}</p>
          <p>${STUDY_CONTACT.address}</p>
          <p>電話：${STUDY_CONTACT.phone}</p>
          <p>Email: <a href="mailto:${STUDY_CONTACT.email}">${STUDY_CONTACT.email}</a></p>
        </div>
        <hr>
        <p style="text-align:center; font-size:1.1em; font-weight:bold;">内容を確認しましたら、<span style="color:red;">J キー</span> を押して実験を開始してください。</p>
      </div>
    `;
  },
  choices: ['j'],
  data: { task_phase: 'withdrawal_info' }
};

// -------------------- HELPER FUNCTIONS FOR ID GENERATION --------------------

// ファイル名に使えない文字を置換・削除する
function sanitizeFileNamePart(s) {
  if (!s) return 'unknown';
  return String(s).trim().replace(/[,\/\\()?%#:*"|<>]/g, '_').replace(/\s+/g, '_').slice(0, 50);
}

// ★★★ 999, 998, 997, 996, 995 を除外するための定数リスト ★★★
const EXCLUDED_NUMS = [999, 998, 997, 996, 995];

// ★★★ 新しいID生成ロジック ★★★
// 000〜999の中から、EXCLUDED_NUMS に含まれない安全な3桁の数字をランダムに生成
function generateSafe3Digit() {
    let num;
    do {
        // 0から999までのランダムな整数を生成
        num = Math.floor(Math.random() * 1000);
    // 生成された数が EXCLUDED_NUMS に含まれる間、ループを継続
    } while (EXCLUDED_NUMS.includes(num));

    // 数字を文字列に変換し、先頭を '0' で埋めて3桁にする (例: 5 -> "005")
    return String(num).padStart(3, '0');
}

// -------------------- サーバー送信関数 --------------------
async function saveCsvToServer(filename, csvText) {
  try {
    const response = await fetch('/api/saveToDrive', { // Vercel APIのエンドポイント
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: filename, csv: csvText })
    });
    if (!response.ok) {
      let errorText = await response.text();
      let errorJson = {};
      try {
        errorJson = JSON.parse(errorText);
      } catch (e) {
        console.warn("Server error response was not valid JSON:", errorText);
      }
      throw new Error(`Server error: ${response.status} - ${errorJson.error || errorText}`);
    }
    const result = await response.json();
    console.log('サーバーからの応答:', result);
    return result;
  } catch (error) {
    console.error('結果の保存に失敗しました:', error);
    throw error;
  }
}

// -------------------- jsPsychの初期化 --------------------
let participantInitials = 'unknown';

const jsPsych = initJsPsych({
  on_finish: async function() {
    jsPsych.getDisplayElement().innerHTML = '<p style="font-size: 20px;">結果を集計・保存しています。しばらくお待ちください...</p>';

    try {
        // --- Step 1: 共通の変数と全データを取得 ---
        const safeInitials = participantInitials || 'unknown_id';
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        const learning_trials = jsPsych.data.get().filter({ task_phase: 'learning' }).values();
        const image_rec_trials = jsPsych.data.get().filter({ task_phase: 'image_recognition' }).values();
        const sound_rec_trials = jsPsych.data.get().filter({ task_phase: 'sound_recognition' }).values();

        if (!learning_trials || learning_trials.length === 0) console.warn('Learning trials data not found or empty.');
        if (!image_rec_trials || image_rec_trials.length === 0) console.warn('Image recognition trials data not found or empty.');
        if (!sound_rec_trials || sound_rec_trials.length === 0) console.warn('Sound recognition trials data not found or empty.');

        // --- Step 2: [ファイル1] 学習フェーズのデータを作成・保存 ---
        const learning_header = [
            'participant_initials', 'trial_index', 'image_category_correct', 'sound_pattern', 'image_filename', 'response_key', 'response_category', 'correct', 'rt'
        ].join(',') + '\n';

        let learning_data_rows = [];
        learning_trials.forEach((trial, index) => {
            const trial_index = index + 1;
            const image_category_correct = trial.image_filename.includes('INDOOR') ? 'indoor' : (trial.image_filename.includes('OUTDOOR') ? 'outdoor' : 'N/A');
            const sound_pattern = trial.sound_pattern || 'N/A';
            const image_filename = trial.image_filename || 'N/A';
            const response_key = trial.response || 'N/A';
            const response_category = trial.response === 'j' ? 'indoor' : (trial.response === 'k' ? 'outdoor' : 'N/A');
            const correct = trial.correct;
            const rt = trial.rt || 'N/A';

            const row = [
                safeInitials,
                trial_index,
                image_category_correct,
                sound_pattern,
                image_filename,
                response_key,
                response_category,
                correct,
                rt
            ].join(',');
            learning_data_rows.push(row);
        });

        const learning_csvData = learning_header + learning_data_rows.join('\n');
        const learning_filename = `learning_${safeInitials}_${timestamp}.csv`;

        // --- Step 3: [ファイル2] テストフェーズのデータを作成・保存 ---
        const image_to_sound_map = new Map();
        learning_trials.forEach(trial => {
            if (trial && trial.image_filename && trial.sound_pattern) {
                 image_to_sound_map.set(trial.image_filename, trial.sound_pattern);
            }
        });

        const image_rec_stats = {
        'パターンA': { correct: 0, total: 0 },
        'パターンB': { correct: 0, total: 0 },
        'パターンX': { correct: 0, total: 0 }
        };
        image_rec_trials.forEach(trial => {
            if (!trial) { return; }
            if (trial.status === 'old') {
                const filename = trial.image_filename;
                if (!filename) { return; }
                const sound_pattern = image_to_sound_map.get(filename);
                if (sound_pattern && image_rec_stats[sound_pattern]) {
                    image_rec_stats[sound_pattern].total++;
                    if (trial.correct === true) { image_rec_stats[sound_pattern].correct++; }
                }
            }
        });

        function calculate_percentage(correct, total) {
            if (total === 0) return 0;
            const percentage = (correct / total) * 100;
            if (isNaN(percentage)) { return 0; }
            return parseFloat(percentage.toPrecision(2));
        }
        
        const image_accuracy_A = calculate_percentage(image_rec_stats['パターンA'].correct, image_rec_stats['パターンA'].total);
        const image_accuracy_B = calculate_percentage(image_rec_stats['パターンB'].correct, image_rec_stats['パターンB'].total);
        const image_accuracy_X = calculate_percentage(image_rec_stats['パターンX'].correct, image_rec_stats['パターンX'].total);
        const sound_correct_count = sound_rec_trials.filter(trial => trial && trial.correct === true).length;
        const sound_total_count = sound_rec_trials.length > 0 ? sound_rec_trials.length : 0;
        const sound_accuracy = calculate_percentage(sound_correct_count, sound_total_count);
        
        const summary_data_string = `${safeInitials},${image_accuracy_A},${image_accuracy_B},${image_accuracy_X},${sound_accuracy}`;

        const test_header = [
            'participant_initials', 'image_accuracy_A', 'image_accuracy_B', 'image_accuracy_X', 'sound_accuracy',
            'trial_index', 'task_phase', 'stimulus', 'response_key', 'correct', 'rt', 'image_status_or_sound_order'
        ].join(',') + '\n';

        let test_data_rows = [];
        let test_trial_index = 0;

        image_rec_trials.forEach(trial => {
            test_trial_index++;
            const row = [
                summary_data_string,
                test_trial_index,
                trial.task_phase || 'image_recognition',
                trial.image_filename || 'N/A',
                trial.response || 'N/A',
                trial.correct,
                trial.rt || 'N/A',
                trial.status || 'N/A'
            ].join(',');
            test_data_rows.push(row);
        });

        sound_rec_trials.forEach(trial => {
            test_trial_index++;
            const stimulus_str = (trial.old_pair ? trial.old_pair[0]+'+'+trial.old_pair[1] : 'N/A');
            const order_str = (trial.presentation_order ? trial.presentation_order.join('/') : 'N/A');
            
            const row = [
                summary_data_string,
                test_trial_index,
                trial.task_phase || 'sound_recognition',
                stimulus_str,
                trial.response || 'N/A',
                trial.correct,
                trial.rt || 'N/A',
                order_str
            ].join(',');
            test_data_rows.push(row);
        });

        const test_csvData = test_header + test_data_rows.join('\n');
        const test_filename = `test_${safeInitials}_${timestamp}.csv`;

        await Promise.all([
            saveCsvToServer(learning_filename, learning_csvData),
            saveCsvToServer(test_filename, test_csvData)
        ]);

        jsPsych.getDisplayElement().innerHTML = `
            <div style="max-width: 800px; text-align: center; line-height: 1.6; font-size: 20px;">
                <h2>実験終了</h2>
                <p>これで実験は終了です。</p>
                <p>本実験の本当の目的は画像と音の記憶の関係を調べることでした。</p>
                <p>音の連続の記憶がいいときに、画像の連続の記憶も良くなるという仮説を実験で検証しています。</p>
                <p>ありがとうございました！</p>
                <p>データが確認でき次第、謝礼のお支払いをいたします。</p>
                <br>
                <p>このウィンドウを閉じて終了してください。</p>
            </div>`;
            
    } catch (dataProcessingError) {
        console.error('Data processing or saving failed:', dataProcessingError);
        jsPsych.getDisplayElement().innerHTML = `
          <div style="text-align: center; max-width: 800px; font-size: 20px;">
            <h2>エラー</h2>
            <p>結果の処理または保存中にエラーが発生しました。</p>
            <p>お手数ですが、実験実施者にお知らせください。</p>
            <p>エラー詳細: ${dataProcessingError.message}</p>
          </div>`;
    }
  }
});

// -------------------- 各種試行の定義 --------------------

const initials_trial = {
  type: jsPsychSurveyText,
  questions: [
    {
      prompt: `
        <div style="max-width: 800px; text-align: left; line-height: 1.6; margin-bottom: 20px;">
            <p>本実験は、画像の認識の速さを測ることが目的です。</p>
            <p>実験時間は個人差がありますが20分程度です。</p>
            <p>実験参加に同意していただける場合はあらかじめ配布されたIDを入力してください。</p>
            <hr>
            <p style="color: red; font-weight: bold;"><br>実験中（特に課題フェーズ）で画像がうまく表示されない（枠だけ表示されるなど）場合は、お手数ですがページを再読み込み（リロード）し、IDの入力からやり直してください。</p>
            <hr>
        </div>
        <p>あなたのイニシャル (例: YT) を入力してください。このイニシャルに、実験IDとして重複なしの3桁の数字を割り当てます。</p>
      `,
      name: "initialsInput", // Change name to capture initials
      required: true,
      placeholder: "例: YT"
    }
  ],
  button_label: "IDを生成して開始",
  on_finish: function(data) {
    const initials = data.response.initialsInput.toUpperCase(); // 入力されたイニシャルを取得し大文字に
    const randomNumber = generateSafe3Digit(); // 999-995を除いたランダムな3桁を生成
    const generatedID = initials + randomNumber; // イニシャルと数字を結合

    // Set the global variable and add to data
    participantInitials = generatedID;
    jsPsych.data.write({ participant_initials: generatedID, task_phase: 'ID_collection' }); // 記録
    jsPsych.data.addProperties({ participant_initials: generatedID }); // 後続のデータに追加
  }
};

let sound_check_sound = null;
const sound_check_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>この実験では音が重要です。</p><p>これから短い音声が流れます。音声が聞こえることを確認してください。</p><br><p style="font-size: 1.2em;"><b>J</b> = 確認した / <b>K</b> = 確認できなかった</p></div>`,
    choices: ['j', 'k'],
    on_start: function(trial) {
        if (all_sounds && all_sounds.length > 0) {
            sound_check_sound = jsPsych.randomization.sampleWithoutReplacement(all_sounds, 1)[0];
            const audio = new Audio(sound_check_sound);
            setTimeout(() => { audio.play().catch(e => console.error("Audio play failed:", e)); }, 500);
        } else { console.error("Error: all_sounds is not defined or empty for sound check."); jsPsych.endExperiment("音声ファイルの読み込みに失敗しました。実験を中止します。"); }
    },
    data: { task_phase: 'sound_check' }
};
const sound_check_loop_node = {
    timeline: [sound_check_trial],
    loop_function: function(data){ return data.values()[0].response === 'k'; }
};

const task_explanation_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これから、画面に風景画像が表示され、同時に短い音声が再生されます。</p><p>あなたの課題は、表示された画像が<strong style="color: red;">「屋内」</strong>のものか<strong style="color: red;">「屋外」</strong>のものかを判断し、</br>できるだけ速く、正確にキーを押して回答することです。</p><br><div style="width: 200px; height: 200px; border: 1px solid black; display: flex; align-items: center; justify-content: center; margin: 20px auto; background-color: #eee;"><span style="font-size: 1.2em; color: #555;">風景画</span></div><br><p style="font-size: 1.2em;"><b>J</b> = 屋内画像の場合</p><p style="font-size: 1.2em;"><b>K</b> = 屋外画像の場合</p><br><p>準備ができたら、スペースキーを押して練習を開始してください。</p></div>`,
    choices: [' '],
    post_trial_gap: 500
};

const instructions_start = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: left; line-height: 1.6;">
<p><strong>【課題の内容】</strong></p><p>画面に風景画像（屋内または屋外）が1枚ずつ表示され、それと同時に短い音声が再生されます。あなたの課題は、表示された画像が<strong style="color: red;">「屋内」</strong>のものか<strong style="color: red;">「屋外」</strong>のものかを判断し、できるだけ速く、正確にキーを押して回答することです。</p>
<p><strong>・屋内の場合：「J」キー</strong><br><strong>・屋外の場合：「K」キー</strong></p>
<p>この課題では、合計120枚の画像と音声が同時に提示されます。画像の「屋内」「屋外」の判断に集中してください。</p>
<p><strong>【注意点】</strong></p>
<p>静かで集中できる環境でご参加ください。<strong style="color: red;">PCのスピーカーまたはイヤホンから音声が聞こえる状態にしてください。</strong></p>
<p>準備ができましたら、<strong>スペースキー</strong>を押して音声確認を開始してください。</p></div>`,
    choices: [' '],
    post_trial_gap: 500
};

const practice_instructions_start = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>まず、本番の実験と同じ形式で練習を行います。</p><p>画面に画像が一瞬だけ表示され、同時に音声が流れます。</p><p>画像が屋内か屋外かを判断し、<strong>「J」キー（屋内）</strong>または<strong>「K」キー（屋外）</strong>を押してください。</p><p>準備ができたら、<strong>スペースキー</strong>を押して練習を開始してください。</p></div>`,
  choices: [' '],
  post_trial_gap: 500
};
const practice_procedure = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() { return `<div style="width: 800px; min-height: 600px; display: flex; align-items: center; justify-content: center;"><img id="practice_image" src="${jsPsych.timelineVariable('image')}" style="max-width: 100%; max-height: 600px; height: auto;"></div>`; },
  choices: ['j', 'k'],
  stimulus_duration: 1000,
  prompt: '<p style="font-size: 1.2em; text-align: center;"><b>J</b> = 屋内 / <b>K</b> = 屋外</p>',
  data: { task_phase: 'practice', image_filename: jsPsych.timelineVariable('image') },
  on_start: function(trial) {
    if (all_sounds && all_sounds.length > 0) { const random_sound = jsPsych.randomization.sampleWithoutReplacement(all_sounds, 1)[0]; const audio = new Audio(random_sound); audio.play().catch(e => console.error("Practice audio play failed:", e)); }
    else { console.error("Error: all_sounds is not defined or empty for practice trial."); }
  }
};
const practice_instructions_end = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これで練習は終了です。</p><p>スペースを押して本番を始めてください。</p></div>`,
  choices: [' '],
  post_trial_gap: 500
};

const learning_break_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これで前半の課題は終了です。</p><br><p>準備ができましたら、<strong>スペースキー</strong>を押して後半を開始してください。</p></div>`,
    choices: [' '],
    post_trial_gap: 500
};

const image_rec_break_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>ここで一度休憩を取ります。</p><br><p>準備ができましたら、<strong>スペースキー</strong>を押してテストの続きを開始してください。</p></div>`,
    choices: [' '],
    post_trial_gap: 500
};

const instructions_image_rec = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これから画像の記憶テストを行います。</p><p>画面に一枚ずつ画像が表示されます。</p><p>その画像を先ほどの課題で見たかどうかを回答していただきます。</p><br><p style="font-size: 1.2em;">見た画像の場合：「J」キー</p><p style="font-size: 1.2em;">見ていない（初めて見る）画像の場合：「K」キー</p><br><p>できるだけ正確に回答するよう心がけてください。</p><p>準備ができましたら、<strong>スペースキー</strong>を押してテストを開始してください。</p></div>`,
    choices: [' '],
    post_trial_gap: 500
};

const instructions_sound_rec = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `<div style="max-width: 800px; text-align: center; line-height: 1.6;"><p>これから音の記憶テストを行います。</p><p>実は前半の課題では、いくつかの音の連続（イ→カなど）が繰り返されていました。</p><p>音の記憶テストでは音の連続が2つ提示されます。</p><p>1つ目の連続と、2つ目の連続、どちらを先ほどの課題フェーズの中で聞いたかを回答していただきます。</p><br><p style="font-size: 1.2em;">「1つ目を聞いた」と思った場合：「J」キー</p><p style="font-size: 1.2em;">「2つ目を聞いた」と思った場合：「K」キー</p><br><p>できるだけ正確に回答するよう心がけてください。</p><p>準備ができましたら、<strong>スペースキー</strong>を押してテストを開始してください。</p></div>`,
    choices: [' '],
    post_trial_gap: 500
};

// --- 練習用画像ファイルリスト ---
const practice_image_files = [
  'practice/scenes/amusementpark.jpg', 'practice/scenes/bar.jpg', 'practice/scenes/barm.jpg',
  'practice/scenes/bedroom.jpg', 'practice/scenes/bridge.jpg', 'practice/scenes/campsite.jpg',
  'practice/scenes/coast.jpg', 'practice/scenes/conferenceroom.jpg', 'practice/scenes/empty.jpg',
  'practice/scenes/studio.jpg'
];

// --- 本番用画像・音声ファイルリスト (省略なし) ---
// ▼▼▼ 画像リスト (省略なし) ▼▼▼
const raw_image_files = {
  INDOOR: {
    grocerystore: [ '056_2.jpg', 'idd_supermarche.jpg', '08082003_aisle.jpg', 'int89.jpg', '100-0067_IMG.jpg', 'intDSCF0784_PhotoRedukto.jpg', '1798025006_f8c475b3fd.jpg', 'integral-color4_detail.jpg', '20070831draguenewyorkOK.jpg', 'japanese-food-fruit-stand.jpg', '22184680.jpg', 'kays-1.jpg', '44l.jpg', 'main.jpg', '9d37cca1-088e-4812-a319-9f8d3fcf37a1.jpg', 'market.jpg', 'APRIL242002FakeGroceryStore.jpg', 'mod16b.jpg', 'Grocery Store 1.jpg', 'papas2.jpg', 'Grocery Store 2.jpg', 'safeway_fireworks.jpg', 'Grocery-store-Moscow.jpg', 'shop04.jpg', 'IMG_0104-Takashimaya-fruit.jpg', 'shop12.jpg', 'IMG_0637.jpg', 'shop13.jpg', 'Inside the supermarket.jpg', 'shop14.jpg', 'MG_56_belo grocery 2.jpg', 'shop15.jpg', 'MainFoodStoreProduce1.jpg', 'shop16.jpg', 'Market5.jpg', 'shop17.jpg', 'Modi-in-Ilit-Colonie-Supermarche-1-2.jpg', 'shop18.jpg', 'Picture_22.jpg', 'shop30.jpg', 'ahpf.supermarche02.jpg', 'store.counter.jpg', 'ahpf.supermarche4.jpg', 'super_market.jpg', 'big-Grocery-Store.jpg', 'supermarch_.jpg', 'cbra3.jpg', 'supermarche-1.jpg', 'coffee_sold_supermarket_1.jpg', 'supermarche3-1.jpg', 'courses01.jpg', 'supermarche33-1.jpg', 'duroseshopDM1710_468x527.jpg', 'supermarket.jpg', 'grocery-store-740716-1.jpg', 'supermarket5.jpg', 'grocery.jpg', 'supermarket66.jpg', 'gs-image-Grocery_LEED-09-10.jpg', 'supermarket_rear_case_isles.jpg', ],
    library: [ '130309783_f194f43f71.jpg', '207157437_14c21369e9.jpg', '28-06-06 Biblioth_que Municipale (19).jpg', '34_AvH_014_library_stacks.jpg', '43407107_204b8504b5.jpg', '470618728_18b5550006.jpg', '473767793_d3cafc4eff.jpg', '57048683_74701f9fa9.jpg', '763634302_e25f44402d.jpg', 'BM_Frejus Bibliotheque 1.jpg', 'Bibliotheque6.jpg', 'Bibliotheque_01.jpg', 'Concord_Free_Public_Library_Renovation_122.jpg', 'DSC02518.jpg', 'Day100006web.jpg', 'Dsc00613-3.jpg', 'Fairfield_Pub_Library_A.jpg', 'Homework2.jpg', 'JPB_Library.jpg', 'Library Pictures (3).jpg', 'Library Pictures.jpg', 'Library98.jpg', 'Library_P2150016.jpg', 'New York Public Library5.jpg', 'association_bibliotheque.jpg', 'biblio01.jpg', 'bibliotheque55.jpg', 'bibliotheque_0908.jpg', 'bibliotheque_photo.jpg', 'bookstore_more_books.jpg', 'ccls-img-buildingbos.jpg', 'danielkimberlylibrarycl1.jpg', 'fibiba1.jpg', 'fine_arts.jpg', 'gallerie-1130426509812-81.80.90.133.jpg', 'howland.jpg', 'image bibliotheque.jpg', 'image_preview.jpg', 'ins18.jpg', 'ins19.jpg', 'ins21.jpg', 'inside01.jpg', 'int91.jpg', 'la_bibliotheque_de_la_tour_du_valat.jpg', 'librairie-16.jpg', 'librairie.jpg', 'library bookshelves large.jpg', 'library01.jpg', 'library02.jpg', 'library03.jpg', 'library04.jpg', 'library05.jpg', 'library2.jpg', 'library4.jpg', 'library466.jpg', 'library5.jpg', 'library_journals_books.jpg', 'mainLibrary.jpg', 'meura1.jpg', 'neilson-hays-library02.jpg', ],
    restaurant: [ '19165-298-298-1-0.jpg', 'int576.jpg', 'restau.04.jpg', '2006_11_tastingroom.jpg', 'int577.jpg', 'restau.08.jpg', 'Bertucci_01_lg.jpg', 'int578.jpg', 'restau.12.jpg', 'Gaststatte_kl.jpg', 'int579.jpg', 'restau.14.jpg', 'INT236.jpg', 'int60.jpg', 'restau.15.jpg', 'Kulturhaus_kneipe.jpg', 'int603.jpg', 'restau.17.jpg', 'N190036.jpg', 'int604.jpg', 'restau.18.jpg', 'N190059.jpg', 'int606.jpg', 'restau.19.jpg', 'OriginalSteakhouse.jpg', 'int607.jpg', 'restau79c.l.jpg', 'Restau30C.L.jpg', 'int608.jpg', 'room106.jpg', 'Restau33C.L.jpg', 'int783.jpg', 'room143.jpg', 'Restau52C.L.jpg', 'int803.jpg', 'room149.jpg', 'RestauC.L.jpg', 'int862.jpg', 'room171.jpg', 'food2_450.jpg', 'int863.jpg', 'room172.jpg', 'food4_450.jpg', 'int867.jpg', 'room176.jpg', 'gaststaette1.jpg', 'int90.jpg', 'room230.jpg', 'gaststaette15.jpg', 'mortonsdr.jpg', 'room246.jpg', 'gaststaette5.jpg', 'olis.small.jpg', 'room250.jpg', 'int112.jpg', 'restau.01.jpg', 'room251.jpg', 'int131.jpg', 'restau.02.jpg', 'room252.jpg', ],
    kitchen: [ 'aa014484.jpg', 'cdmc1167.jpg', 'int360.jpg', 'k5.jpg', 'aa041720.jpg', 'cdmc1170.jpg', 'int362.jpg', 'k6.jpg', 'cdMC1148.jpg', 'cdmc1172.jpg', 'int365.jpg', 'k7.jpg', 'cdmc1119.jpg', 'cdmc1178.jpg', 'int422.jpg', 'k9.jpg', 'cdmc1120.jpg', 'cdmc1194.jpg', 'int423.jpg', 'kitchen003.jpg', 'cdmc1123.jpg', 'cdmc1289.jpg', 'int437.jpg', 'kitchen004.jpg', 'cdmc1126.jpg', 'cdmc1299.jpg', 'int474.jpg', 'kitchen031.jpg', 'cdmc1128.jpg', 'dining047.jpg', 'k1.jpg', 'kitchen032.jpg', 'cdmc1143.jpg', 'iclock.jpg', 'k10.jpg', 'kitchen054.jpg', 'cdmc1144.jpg', 'int166.jpg', 'k11.jpg', 'kitchen077.jpg', 'cdmc1145.jpg', 'int34.jpg', 'k12.jpg', 'kitchen081.jpg', 'cdmc1146.jpg', 'int347.jpg', 'k2.jpg', 'kitchen083.jpg', 'cdmc1151.jpg', 'int35.jpg', 'k3.jpg', 'kitchen086.jpg', 'cdmc1164.jpg', 'int357.jpg', 'k4.jpg', 'kitchen5.jpg', ],
    gym: [ 'Gym-Equipment.jpg', 'gym3.jpg', 'Gym05.jpg', 'gym45.jpg', 'Gym2_000.jpg', 'gym65.jpg', 'Gym432.jpg', 'gym_b.jpg', 'GymInt1.jpg', 'gym_b4.jpg', 'HO-00-01-5186-23_l.jpg', 'gym_left.jpg', 'HO-00-02-5304-28A_l.jpg', 'herade_inside.jpg', 'Image_Grande72.jpg', 'hotel-megeve-11.jpg', 'MSAC_Gym_-_20061515.jpg', 'int525.jpg', 'Photo-008.jpg', 'int838.jpg', 'Proflex gym lagos nigeria 4.jpg', 'junglegym-60.jpg', 'SALLE3.jpg', 'media39989.jpg', 'SalleMuscu.jpg', 'media40037.jpg', 'VA-02-01-6306-21_l.jpg', 'montreal_octo 030.jpg', 'bg-gym2.jpg', 'necker_salle_de_gym_reference.jpg', 'biosite-gym.jpg', 'p1a.jpg', 'csu6.jpg', 'refurbished-gym-equipment.jpg', 'fieldhouse-weightroom.jpg', 'room398.jpg', 'fitness_center3.jpg', 'room399.jpg', 'guyane_muscul.jpg', 'room424.jpg', 'gym001.jpg', 's1.jpg', 'gym03.jpg', 'saledemuscu11.jpg', 'gym04.jpg', 'salle-cardio-grand.jpg', 'gym06.jpg', 'salle_1.jpg', 'gym07.jpg', 'salle_9.jpg', 'gym08.jpg', 'southglade_gym-2.jpg', 'gym09.jpg', 'ucc_gym_photos_bg.jpg', 'gym13.jpg', 'uploads-images-photos_images-fullsize-gym.jpg', 'gym14.jpg', 'url.jpg', 'gym2.jpg', 'web-cardio-theatre-gym.jpg', ],
  },
  OUTDOOR: {
    castle: [ '087 Chateau Laurier.jpg', 'FreeFoto_castle_1_32.jpg', '38588-Chateau-De-Cruix-0.jpg', 'FreeFoto_castle_1_36.jpg', '7_12_chateau_de_chauvac-1.jpg', 'FreeFoto_castle_1_38.jpg', 'Chateau 1-1.jpg', 'FreeFoto_castle_1_40.jpg', "Chateau D'Usse.jpg", 'FreeFoto_castle_1_5.jpg', 'FreeFoto_castle_14_31.jpg', 'FreeFoto_castle_1_9.jpg', 'FreeFoto_castle_14_34.jpg', 'FreeFoto_castle_20_49.jpg', 'FreeFoto_castle_15_11.jpg', 'FreeFoto_castle_22_40.jpg', 'FreeFoto_castle_16_1.jpg', 'FreeFoto_castle_3_27.jpg', 'FreeFoto_castle_16_14.jpg', 'FreeFoto_castle_3_9.jpg', 'FreeFoto_castle_16_21.jpg', 'FreeFoto_castle_5_41.jpg', 'FreeFoto_castle_16_48.jpg', 'FreeFoto_castle_5_49.jpg', 'FreeFoto_castle_16_49.jpg', 'FreeFoto_castle_8_10.jpg', 'FreeFoto_castle_16_7.jpg', 'FreeFoto_castle_8_2.jpg', 'FreeFoto_castle_17_2.jpg', 'FreeFoto_castle_8_29.jpg', 'FreeFoto_castle_17_39.jpg', 'FreeFoto_castle_8_37.jpg', 'FreeFoto_castle_17_48.jpg', 'FreeFoto_castle_8_7.jpg', 'FreeFoto_castle_1_1.jpg', 'FreeFoto_castle_9_36.jpg', 'FreeFoto_castle_1_10.jpg', 'arques_chateau_3.jpg', 'FreeFoto_castle_1_12.jpg', 'build124.jpg', 'FreeFoto_castle_1_13.jpg', 'build155.jpg', 'FreeFoto_castle_1_15.jpg', 'build680.jpg', 'FreeFoto_castle_1_17.jpg', 'carcassonebridge.jpg', 'FreeFoto_castle_1_21.jpg', 'chateau-chillon-1.jpg', 'FreeFoto_castle_1_22.jpg', 'chateau-de-losse.jpg', 'FreeFoto_castle_1_24.jpg', 'chateau_barrail1.jpg', 'FreeFoto_castle_1_25.jpg', 'chateau_de_bran_chateau_de_dracula.jpg', 'FreeFoto_castle_1_26.jpg', 'chateau_frontenac.jpg', 'FreeFoto_castle_1_29.jpg', 'chateau_v.jpg', 'FreeFoto_castle_1_3.jpg', 'chenonceaux-chateau-de-chenonceau-chenony1-1.jpg', ],
    beach: [ '1147453287.jpg', 'beach_11_02_ask.jpg', '2006-02-13-15-28-07sml.jpg', 'beach_121_12_flickr.jpg', 'AYP0779018_P.jpg', 'beach_127_15_flickr.jpg', 'AYP0779641_P.jpg', 'beach_13_11_flickr.jpg', 'BLP0018661_P.jpg', 'beach_143_14_flickr.jpg', 'CCP0012536_P.jpg', 'beach_144_05_flickr.jpg', 'CCP0013242_P.jpg', 'beach_161_11_flickr.jpg', 'CCP0013911_P.jpg', 'beach_163_18_flickr.jpg', 'Cancun.jpg', 'beach_163_23_flickr.jpg', 'DVP1915541_P.jpg', 'beach_166_09_flickr.jpg', 'bambouseraie_45_05_google.jpg', 'beach_167_08_flickr.jpg', 'bea10.jpg', 'beach_167_15_flickr.jpg', 'bea2.jpg', 'beach_18_22_flickr.jpg', 'bea3.jpg', 'beach_19_07_altavista.jpg', 'bea4.jpg', 'beach_26_07_flickr.jpg', 'bea5.jpg', 'beach_28_18_flickr.jpg', 'beach.jpg', 'beach_30_16_flickr.jpg', 'beach_01_01_ask.jpg', 'beach_34_12_flickr.jpg', 'beach_01_02_google.jpg', 'beach_35_16_altavista.jpg', 'beach_01_03_altavista.jpg', 'beach_37_22_flickr.jpg', 'beach_01_03_google.jpg', 'beach_39_09_flickr.jpg', 'beach_01_05_askl.jpg', 'beach_45_01_altavista.jpg', 'beach_01_05_google.jpg', 'beach_47_02_altavista.jpg', 'beach_01_08_google.jpg', 'beach_51_15_altavista.jpg', 'beach_01_12_flickr.jpg', 'beach_55_21_flickr.jpg', 'beach_02_06_ask.jpg', 'beach_91_17_flickr.jpg', 'beach_04_06_ask.jpg', 'beach_95_03_flickr.jpg', 'beach_04_11_google.jpg', 'beach_dsc00550.jpg', 'beach_08_04_ask.jpg', 'cdMC839.jpg', 'beach_08_07_google.jpg', 'cdMC862.jpg', ],
    forest: [ '08Trees.jpg', 'cdMC349.jpg', '36021.jpg', 'cdMC398.jpg', '36032.jpg', 'cdMC413.jpg', '482063.jpg', 'cdMC617.jpg', 'AGP0027965_P.jpg', 'desktop.ini', 'AYP0783202_P-1.jpg', 'filenames.txt', 'AYP0783229_P.jpg', 'forest05.jpg', 'CBP1014811_P.jpg', 'forest10.jpg', 'CCP0014018_P-1.jpg', 'forest13.jpg', 'CYP0800679_P.jpg', 'forest20.jpg', 'CYP0801743_P.jpg', 'forest24.jpg', 'DVP4907648_P.jpg', 'forest25.jpg', 'DVP4962393_P.jpg', 'forest_01_01_ask.jpg', 'DVP4966497_P.jpg', 'forest_01_01_google.jpg', 'DVP4967677_P.jpg', 'forest_01_02_altavista.jpg', 'FAN1006576_P.jpg', 'forest_01_02_ask.jpg', 'FAN2016942_P.jpg', 'forest_02_11_altavista.jpg', 'FreeFoto_forest_11_32.jpg', 'forest_05_06_askl.jpg', 'FreeFoto_forest_11_36.jpg', 'forest_09_05_askl.jpg', 'FreeFoto_forest_2_47.jpg', 'forest_11_02_altavista.jpg', 'FreeFoto_forest_2_48.jpg', 'forest_11_06_askl.jpg', 'FreeFoto_forest_3_19.jpg', 'forest_11_20_yahoo.jpg', 'FreeFoto_forest_3_20.jpg', 'forest_14_16_yahoo.jpg', 'FreeFoto_forest_3_26.jpg', 'forest_17_01_askl.jpg', 'FreeFoto_forest_3_32.jpg', 'forest_18_04_askl.jpg', 'FreeFoto_forest_3_43.jpg', 'forest_30_02_yahoo.jpg', 'FreeFoto_forest_3_44.jpg', 'forest_31_02_altavista.jpg', 'FreeFoto_forest_9_7.jpg', 'forest_32_08_altavista.jpg', 'FreeFoto_national park_10_1.jpg', 'forest_36_05_altavista.jpg', 'bambouseraie_02_05_altavista.jpg', 'nat234.jpg', 'bambouseraie_12_10_altavista.jpg', 'nat408.jpg', ],
    desert: [ '034medanos.jpg', 'beach_115_11_flickr.jpg', '255055.jpg', 'beach_138_10_flickr.jpg', '480075.jpg', 'beach_165_20_flickr.jpg', '50092.jpg', 'beach_26_19_altavista.jpg', '611sahara.jpg', 'beach_34_01_flickr.jpg', '800px-Towering_Sand_Dunes.jpg', 'beach_40_21_flickr.jpg', 'AA005940.jpg', 'beach_91_12_flickr.jpg', 'AA005954.jpg', 'cdmc795.jpg', 'AA019096.jpg', 'des13.jpg', 'AA020480.jpg', 'des14.jpg', 'AIP0005723_P.jpg', 'des15.jpg', 'BXP0035855_P.jpg', 'des16.jpg', 'BXP0035856_P.jpg', 'des17.jpg', 'DVP4967429_P.jpg', 'des18.jpg', 'Desert_de_Gobi.jpg', 'des21.jpg', 'G02 Gobi Desert Sand Dunes.jpg', 'des22.jpg', 'Lone Palm, Sahara Desert-1.jpg', 'forest_34_08_altavista.jpg', 'MWP0020668_P.jpg', 'land514.jpg', 'NA000915.jpg', 'land526.jpg', 'NA001302.jpg', 'land564.jpg', 'NA004090.jpg', 'land616.jpg', 'NA004783.jpg', 'land645.jpg', 'NA006111.jpg', 'land656.jpg', 'NA006122.jpg', 'land657.jpg', 'NA006361.jpg', 'land658.jpg', 'NA006526.jpg', 'land701.jpg', 'NA007446.jpg', 'mountain_10_04_askl.jpg', 'NA008867.jpg', 'n251011.jpg', 'bambouseraie_42_12_google.jpg', 'natu539.jpg', 'beach_02_10_yahoo.jpg', 'natu89.jpg', ],
    mountain: [ 'BXP0029825_P.jpg', 'land143.jpg', 'CMP0003645_P.jpg', 'land145.jpg', 'DVP4967994_P.jpg', 'land16.jpg', 'DVP4969295_P.jpg', 'land161.jpg', 'FAN2009894_P.jpg', 'land165.jpg', 'FreeFoto_mountain_1_10.jpg', 'land179.jpg', 'FreeFoto_mountain_1_15.jpg', 'land18.jpg', 'FreeFoto_mountain_1_19.jpg', 'land188.jpg', 'FreeFoto_mountain_1_2.jpg', 'land210.jpg', 'FreeFoto_mountain_1_31.jpg', 'land387.jpg', 'FreeFoto_mountain_1_36.jpg', 'land680.jpg', 'FreeFoto_mountain_1_37.jpg', 'mountain05.jpg', 'FreeFoto_mountain_1_44.jpg', 'mountain06.jpg', 'FreeFoto_mountain_1_5.jpg', 'mountain08.jpg', 'FreeFoto_mountain_3_29.jpg', 'mountain09.jpg', 'FreeFoto_mountain_3_34.jpg', 'mountain19.jpg', 'FreeFoto_mountain_4_18.jpg', 'mountain50.jpg', 'FreeFoto_mountain_4_21.jpg', 'mountain52.jpg', 'FreeFoto_mountain_4_28.jpg', 'mountain54.jpg', 'FreeFoto_mountain_4_36.jpg', 'mountain59.jpg', 'FreeFoto_mountain_4_45.jpg', 'mountain62.jpg', 'FreeFoto_mountain_4_47.jpg', 'mountain64.jpg', 'FreeFoto_mountain_4_8.jpg', 'mountain76.jpg', 'FreeFoto_mountain_6_42.jpg', 'mountain77.jpg', 'FreeFoto_mountain_7_1.jpg', 'mountain80.jpg', 'FreeFoto_mountain_8_5.jpg', 'mountain86.jpg', 'cdmc181.jpg', 'mountain93.jpg', 'crique_13_08_google.jpg', 'mountain94.jpg', 'land130.jpg', 'mountain_03_02_askl.jpg', 'land132.jpg', 'n44002.jpg', ],
  },
};
// ▼▼▼ 音声リスト (省略なし) ▼▼▼
const raw_sound_files = [
  'hu.wav', 'ri.wav', 'go.wav', 'ta.wav', 'no.wav', 'zu.wav', 'wa.wav', 'ku.wav', 'mu.wav', 'na.wav', 'zi.wav', 'do.wav', 'ze.wav', 'pe.wav', 'za.wav', 'pu.wav', 'se.wav', 'ko.wav', 'ga.wav', 'zo.wav', 'gu.wav', 'me.wav', 'po.wav', 'te.wav', 'bi.wav', 're.wav', 'ya.wav', 'ba.wav', 'da.wav', 'ra.wav', 'mo.wav', 'bo.wav', 'so.wav', 'ha.wav', 'hi.wav', 'si.wav', 'ru.wav', 'sa.wav', 'nu.wav', 'ke.wav', 'mi.wav', 'gi.wav', 'su.wav', 'de.wav', 'ro.wav', 'to.wav', 'bu.wav', 'ma.wav', 'pa.wav', 'ki.wav', 'ti.wav', 'pi.wav', 'yu.wav', 'ho.wav', 'he.wav', 'ni.wav', 'be.wav', 'tu.wav',
];

// --- ファイルパスの自動生成 ---
const image_files = { indoor: {}, outdoor: {} };
for (const main_cat_key in raw_image_files) {
  image_files[main_cat_key.toLowerCase()] = {};
  for (const sub_cat_key in raw_image_files[main_cat_key]) {
    const path_prefix = `scenes/${main_cat_key}/${sub_cat_key}/`;
    image_files[main_cat_key.toLowerCase()][sub_cat_key] = raw_image_files[main_cat_key][sub_cat_key].map(filename => path_prefix + filename);
  }
}
const all_sounds = raw_sound_files.map(filename => `sounds/${filename}`);

// =========================================================================
// 刺激生成ロジック
// (変更なし)
const NUM_AB_PAIRS = 3;
const NUM_X_TRIALS = 3;
let shuffled_sounds = jsPsych.randomization.shuffle(all_sounds);
const sounds_for_A = shuffled_sounds.slice(0, NUM_AB_PAIRS);
const sounds_for_B = shuffled_sounds.slice(NUM_AB_PAIRS, NUM_AB_PAIRS * 2);
const sounds_for_X = shuffled_sounds.slice(NUM_AB_PAIRS * 2, NUM_AB_PAIRS * 2 + NUM_X_TRIALS);
const learned_sound_pairs = [];
for (let i = 0; i < NUM_AB_PAIRS; i++) { learned_sound_pairs.push([sounds_for_A[i], sounds_for_B[i]]); }
const NUM_IMAGES_PER_CATEGORY = 12;
let learning_images = [];
const categories = ['grocerystore', 'library', 'restaurant', 'kitchen', 'gym', 'castle', 'beach', 'forest', 'desert', 'mountain'];
const main_cats = ['indoor', 'outdoor'];
main_cats.forEach(main_cat => {
    categories.forEach(sub_cat => {
        if (image_files[main_cat] && image_files[main_cat][sub_cat]) {
            const sampled = jsPsych.randomization.sampleWithoutReplacement(image_files[main_cat][sub_cat], NUM_IMAGES_PER_CATEGORY);
            learning_images.push(...sampled);
        } else { console.warn(`Category not found or empty: ${main_cat}/${sub_cat}`); }
    });
});
console.log("Total learning images selected:", learning_images.length);
learning_images = jsPsych.randomization.shuffle(learning_images);
let base_trial_blocks = [];
for (let i = 0; i < NUM_AB_PAIRS; i++) { base_trial_blocks.push({ type: 'AB_PAIR', sound_A: sounds_for_A[i], sound_B: sounds_for_B[i] }); }
for (let i = 0; i < NUM_X_TRIALS; i++) { base_trial_blocks.push({ type: 'X_TRIAL', sound_X: sounds_for_X[i] }); }
let repeated_blocks = [];
const images_per_block = base_trial_blocks.reduce((count, block) => count + (block.type === 'AB_PAIR' ? 2 : 1), 0);
const repeats_needed = Math.ceil(learning_images.length / images_per_block);
console.log("Number of block repetitions needed:", repeats_needed)
for(let i = 0; i < repeats_needed; i++){ repeated_blocks.push(...base_trial_blocks); }
let shuffled_blocks = jsPsych.randomization.shuffle(repeated_blocks);
let block_idx = 0;
const learning_stimuli = [];
learning_images.forEach((img, idx) => {
    const current_block = shuffled_blocks[block_idx];
    let sound, pattern;
    if (current_block.type === 'AB_PAIR') {
        if (idx % 2 === 0) { sound = current_block.sound_A; pattern = 'パターンA'; }
        else { sound = current_block.sound_B; pattern = 'パターンB'; block_idx++; }
    } else { sound = current_block.sound_X; pattern = 'パターンX'; block_idx++; }
     if (block_idx >= shuffled_blocks.length) { block_idx = 0; console.warn("Block index wrapped around."); }
    learning_stimuli.push({ image: img, sound: sound, sound_pattern: pattern });
});
console.log("Generated learning stimuli count:", learning_stimuli.length);
const all_image_paths_flat = [];
main_cats.forEach(main_cat => { Object.values(image_files[main_cat]).forEach(arr => all_image_paths_flat.push(...arr)); });
const unused_images = all_image_paths_flat.filter(img => !learning_images.includes(img));
const num_new_images = 30;
const new_images_for_test = jsPsych.randomization.sampleWithoutReplacement(unused_images, num_new_images);
console.log("Number of 'old' images for test:", learning_images.length);
console.log("Number of 'new' images for test:", new_images_for_test.length);
const image_recognition_stimuli = [
  ...learning_images.map(img => ({ image: img, status: 'old', correct_response: 'j' })),
  ...new_images_for_test.map(img => ({ image: img, status: 'new', correct_response: 'k' }))
];
const TOTAL_SOUNDS_USED = (NUM_AB_PAIRS * 2) + NUM_X_TRIALS;
const unused_sounds_for_test = shuffled_sounds.slice(TOTAL_SOUNDS_USED);
const new_sound_pairs = [];
if (unused_sounds_for_test.length < NUM_AB_PAIRS * 2) { console.error("Not enough unused sounds for sound recognition test."); }
else { for (let i = 0; i < NUM_AB_PAIRS; i++) { new_sound_pairs.push([unused_sounds_for_test[i*2], unused_sounds_for_test[i*2 + 1]]); } }
const sound_2afc_stimuli = [];
const shuffled_old_pairs = jsPsych.randomization.shuffle(learned_sound_pairs);
const shuffled_new_pairs = jsPsych.randomization.shuffle(new_sound_pairs);
const num_sound_test_trials = Math.min(shuffled_old_pairs.length, shuffled_new_pairs.length);
for (let i = 0; i < num_sound_test_trials; i++) {
  const presentation_order = jsPsych.randomization.shuffle(['old', 'new']);
  sound_2afc_stimuli.push({ old_pair: shuffled_old_pairs[i], new_pair: shuffled_new_pairs[i], presentation_order: presentation_order, correct_response: presentation_order[0] === 'old' ? 'j' : 'k' });
}

// =========================================================================
// タイムラインの構築と実行
// =========================================================================

// ▼▼▼ preload を分割するための準備 ▼▼▼
// 1. 全音声と練習画像を ID入力直後に読み込む
const preload_initial = {
  type: jsPsychPreload,
  images: practice_image_files,
  audio: all_sounds,
  message: '実験の準備をしています (1/4)...'
};

// 2. 学習用画像 (120枚) を分割して読み込む
// learning_stimuli はオブジェクトの配列なので、画像パスだけ抽出する必要がある
// ただし、learning_images はパスの配列なのでそのまま使える
const learning_images_part1 = learning_images.slice(0, 60); // 前半60枚
const learning_images_part2 = learning_images.slice(60);    // 後半60枚

const preload_learning_1 = {
  type: jsPsychPreload,
  images: learning_images_part1,
  message: '実験の準備をしています (2/4)...'
};

const preload_learning_2 = {
  type: jsPsychPreload,
  images: learning_images_part2,
  message: '実験の準備をしています (3/4)...'
};

// 3. テスト用画像 (30枚) をテスト前に読み込む
const preload_test = {
    type: jsPsychPreload,
    images: new_images_for_test,
    message: '実験の準備をしています (4/4)...'
};
// ▲▲▲ 分割準備ここまで ▲▲▲

const practice_selection = jsPsych.randomization.sampleWithoutReplacement(practice_image_files, 3);
const practice_timeline_variables = practice_selection.map(img_path => { return { image: img_path }; });
const practice_block = {
  timeline: [practice_procedure],
  timeline_variables: practice_timeline_variables,
  randomize_order: true
};

const learning_procedure = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() { return `<div style="width: 800px; min-height: 600px; display: flex; align-items: center; justify-content: center;"><img id="learning_image" src="${jsPsych.timelineVariable('image')}" style="max-width: 100%; max-height: 600px; height: auto;"></div>`; },
  choices: ['j', 'k'],
  prompt: '<p style="font-size: 1.2em; text-align: center;"><b>J</b> = 屋内 / <b>K</b> = 屋外</p>',
  stimulus_duration: 1000, // 画像は1秒（1000ms）で消える
  // trial_duration: 1500,    // コメントアウトのまま（キー入力で試行終了）
  data: { image_filename: jsPsych.timelineVariable('image'), sound_pattern: jsPsych.timelineVariable('sound_pattern'), task_phase: 'learning' },
  on_start: function(trial) {
    const sound_path = jsPsych.timelineVariable('sound');
    if (sound_path) { const audio = new Audio(sound_path); audio.play().catch(e => console.error("Learning audio play failed:", e, "Sound path:", sound_path)); }
    else { console.error("Error: Sound path is undefined for learning trial:", trial.data); }
  },
  on_finish: function(data) {
    let correct_response;
    if (data.image_filename.includes('INDOOR')) {
        correct_response = 'j';
    } else if (data.image_filename.includes('OUTDOOR')) {
        correct_response = 'k';
    } else {
        correct_response = null;
    }
    if (correct_response) {
        data.correct = (data.response === correct_response);
    } else {
        data.correct = null;
    }
  }
};

const learning_stimuli_part1 = learning_stimuli.slice(0, Math.ceil(learning_stimuli.length / 2));
const learning_stimuli_part2 = learning_stimuli.slice(Math.ceil(learning_stimuli.length / 2));
const learning_block_1 = { timeline: [learning_procedure], timeline_variables: learning_stimuli_part1, randomize_order: true };
const learning_block_2 = { timeline: [learning_procedure], timeline_variables: learning_stimuli_part2, randomize_order: true };

const image_recognition_procedure = {
  type: jsPsychHtmlKeyboardResponse,
  stimulus: function() { const image_path = jsPsych.timelineVariable('image'); return `<div style="width: 800px; min-height: 600px; display: flex; align-items: center; justify-content: center;"><img src="${image_path}" style="max-width: 100%; max-height: 600px; height: auto;"></div>`; },
  choices: ['j', 'k'],
  prompt: `<p style="text-align: center;">この画像は、先ほどの課題フェーズで見ましたか？</p><p style="font-size: 1.2em; text-align: center;"><b>J</b> = はい、見ました / <b>K</b> = いいえ、見ていません</p>`,
  data: { image_filename: jsPsych.timelineVariable('image'), status: jsPsych.timelineVariable('status'), correct_response: jsPsych.timelineVariable('correct_response'), task_phase: 'image_recognition' },
  on_finish: function(data) { data.correct = data.response === data.correct_response; }
};
const num_img_rec_trials = image_recognition_stimuli.length;
const img_rec_part_size = Math.ceil(num_img_rec_trials / 3);
const image_recognition_stimuli_part1 = image_recognition_stimuli.slice(0, img_rec_part_size);
const image_recognition_stimuli_part2 = image_recognition_stimuli.slice(img_rec_part_size, img_rec_part_size * 2);
const image_recognition_stimuli_part3 = image_recognition_stimuli.slice(img_rec_part_size * 2);
const image_recognition_block_1 = { timeline: [image_recognition_procedure], timeline_variables: image_recognition_stimuli_part1, randomize_order: true };
const image_recognition_block_2 = { timeline: [image_recognition_procedure], timeline_variables: image_recognition_stimuli_part2, randomize_order: true };
const image_recognition_block_3 = { timeline: [image_recognition_procedure], timeline_variables: image_recognition_stimuli_part3, randomize_order: true };

// --- 音声ペア再認テスト (修正済み) ---
const sound_recognition_trial = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: '<p style="font-size: 1.5em; text-align: center;">音声を再生します...</p>',
    choices: "NO_KEYS",
    prompt: `<p style="font-size: 1.2em; text-align: center;"><b>1つ目のパターンの場合は「J」キー</b></p><p style="font-size: 1.2em; text-align: center;"><b>2つ目のパターンの場合は「K」キー</b></p>`,
    trial_duration: null,
    response_ends_trial: true,
    data: function(){
        return {
            old_pair: jsPsych.timelineVariable('old_pair'),
            new_pair: jsPsych.timelineVariable('new_pair'),
            presentation_order: jsPsych.timelineVariable('presentation_order'),
            correct_response: jsPsych.timelineVariable('correct_response'),
            task_phase: 'sound_recognition'
        };
    },
    on_load: function() {
        jsPsych.pluginAPI.cancelAllKeyboardResponses();
        const old_pair = jsPsych.timelineVariable('old_pair');
        const new_pair = jsPsych.timelineVariable('new_pair');
        const presentation_order = jsPsych.timelineVariable('presentation_order');

        if (!old_pair || !new_pair || !presentation_order) { console.error("Error: Missing timeline variables in sound_recognition_trial on_load"); jsPsych.finishTrial(); return; }
        const first_pair_sounds = presentation_order[0] === 'old' ? old_pair : new_pair;
        const second_pair_sounds = presentation_order[1] === 'old' ? old_pair : new_pair;
        if (!first_pair_sounds || first_pair_sounds.length < 2 || !second_pair_sounds || second_pair_sounds.length < 2) { console.error("Error: Invalid sound pairs", {old_pair, new_pair, presentation_order}); jsPsych.finishTrial(); return; }
        const audio1 = new Audio(first_pair_sounds[0]);
        const audio2 = new Audio(first_pair_sounds[1]);
        const audio3 = new Audio(second_pair_sounds[0]);
        const audio4 = new Audio(second_pair_sounds[1]);
        const display_element = jsPsych.getDisplayElement();
        const stimulus_div = display_element.querySelector('.jspsych-html-keyboard-response-stimulus');
        
        let soundsPlayed = 0;
        const totalSounds = 4;
        const enableResponse = () => {
            if (stimulus_div) stimulus_div.innerHTML = `<p style="text-align: center;">どちらのペアが課題フェーズで聞いたペアでしたか？</p>`;
             jsPsych.pluginAPI.getKeyboardResponse({
                 callback_function: (info) => { jsPsych.finishTrial({ rt: info.rt, response: info.key }); },
                 valid_responses: ['j', 'k'], rt_method: 'performance', persist: false, allow_held_key: false
             });
        };
        const soundEnded = () => {
            soundsPlayed++;
            if (soundsPlayed >= totalSounds) { setTimeout(enableResponse, 500); }
        };
        audio1.addEventListener('ended', soundEnded); audio2.addEventListener('ended', soundEnded);
        audio3.addEventListener('ended', soundEnded); audio4.addEventListener('ended', soundEnded);
        audio1.addEventListener('error', (e) => { console.error("Audio 1 error:", e); soundEnded(); });
        audio2.addEventListener('error', (e) => { console.error("Audio 2 error:", e); soundEnded(); });
        audio3.addEventListener('error', (e) => { console.error("Audio 3 error:", e); soundEnded(); });
        audio4.addEventListener('error', (e) => { console.error("Audio 4 error:", e); soundEnded(); });
        
        const play_second_pair = () => {
            if(stimulus_div) stimulus_div.innerHTML = '<p style="font-size: 1.5em; text-align: center;">2組目...</p>';
            setTimeout(() => { audio3.play().catch(e => { console.error("Audio 3 play failed:", e); soundEnded(); }); }, 700);
        };
        audio1.addEventListener('ended', () => setTimeout(() => audio2.play().catch(e => { console.error("Audio 2 play failed:", e); soundEnded(); }), 100));
        audio2.addEventListener('ended', play_second_pair);
        audio3.addEventListener('ended', () => setTimeout(() => audio4.play().catch(e => { console.error("Audio 3 play failed:", e); soundEnded(); }), 100));
        
        setTimeout(() => {
            if(stimulus_div) stimulus_div.innerHTML = '<p style="font-size: 1.5em; text-align: center;">1組目...</p>';
            audio1.play().catch(e => { console.error("Audio 1 play failed:", e); soundEnded(); });
        }, 500);
    },
    on_finish: function(data) { data.correct = data.response === data.correct_response; }
};
const sound_recognition_block = {
  timeline: [sound_recognition_trial],
  timeline_variables: sound_2afc_stimuli,
  randomize_order: true
};

// --- タイムライン全体の定義 ---
const timeline = [];
timeline.push(study_description_trial);
timeline.push(consent_form_trial);
timeline.push(withdrawal_info_trial);
timeline.push(initials_trial);

// ▼ 1. ID入力の直後に音と練習画像を読み込む
timeline.push(preload_initial);

timeline.push(instructions_start);
timeline.push(sound_check_loop_node);
timeline.push(task_explanation_trial);

// ▼ 2. 練習の前に、学習用画像の前半を読み込んでおく (説明を読んでいる間に完了するかも)
timeline.push(preload_learning_1);

timeline.push(practice_block);
timeline.push(practice_instructions_end);

// (ここにあった巨大な preload_trial は削除しました)

timeline.push(learning_block_1);

// ▼ 3. 休憩中に、学習用画像の後半を読み込む
timeline.push(learning_break_trial);
timeline.push(preload_learning_2);

timeline.push(learning_block_2);

// ▼ 4. テストの前に、テスト用画像を読み込む
timeline.push(instructions_image_rec); // 教示の前に置くか後に置くかはお好みですが、教示後の方が安全
timeline.push(preload_test);

timeline.push(image_recognition_block_1);
timeline.push(image_rec_break_trial);
timeline.push(image_recognition_block_2);
timeline.push(image_rec_break_trial);
timeline.push(image_recognition_block_3);
timeline.push(instructions_sound_rec);
timeline.push(sound_recognition_block);

// --- 実験の実行 ---
jsPsych.run(timeline);