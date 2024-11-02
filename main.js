// グローバル変数
const all_events = [];
let all_rounds = [];
let all_players = {};
let all_teams = {};
const current_select = {
  event: '',
  weeks: [true, true, true, true],
  rounds: [true, true, true, true, true],
  maps: { w: true, s: true },
  games: 1,
  target: '',
  target_teams: 'all'
};

const current_players = [];
const current_teams = [];

const current_players_sort = {
  target: 'kills',
  available: ['avg', 'kills', 'avgdamage', 'damage', 'count']
};
const current_teams_sort = {
  target: 'avgp',
  available: ['avgp', 'avgpp', 'avgk', 'avgpl', 'p', 'pp', 'k', 'c', '1c', '3c', '5c', '10c']
};

// ---------------------------------------------------------
// create_table_row
// ---------------------------------------------------------
const create_table_row = (classes) => {
  const tr = document.createElement('tr');
  const tds = [];
  for (const c of classes) {
    const td = document.createElement('td');
    td.classList.add('td_' + c);
    tds.push(td);
    tr.appendChild(td);
  }
  return [tr, tds];
};

// ---------------------------------------------------------
// create_players_node
// ---------------------------------------------------------
const create_players_node = () => {
  for (const v of current_players) {
    // 列を作成
    const [tr, tds] = create_table_row(['num', 'str', 'float', 'num', 'float', 'num', 'num', 'str', 'str', 'str', 'str']);

    // テキストの設定
    tds[0].innerText = '0';
    tds[1].innerText = v.name;
    tds[2].innerText = Number.parseFloat(v.kills / v.count).toFixed(2);
    tds[3].innerText = v.kills;
    tds[4].innerText = Number.parseFloat(v.damagecount > 0 ? v.damage / v.damagecount : 0).toFixed(1);
    tds[5].innerText = v.damage;
    tds[6].innerText = v.count;
    tds[7].innerText = v.teams[0];
    tds[8].innerText = v.teams[1];
    tds[9].innerText = v.teams[2];
    tds[10].innerText = v.teams[3];

    // 保存
    v.node = tr;
  }
};

// ---------------------------------------------------------
// create_teams_node
// ---------------------------------------------------------
const create_teams_node = () => {
  for (const v of current_teams) {
    // 列を作成
    const [tr, tds] = create_table_row(['num', 'str', 'float', 'float', 'float', 'float', 'num', 'num', 'num', 'num', 'float', 'float', 'float', 'float']);

    // テキストの設定
    tds[0].innerText = '0';
    tds[1].innerText = v.name;
    tds[2].innerText = Number.parseFloat(v.points / v.placements.length).toFixed(2);
    tds[3].innerText = Number.parseFloat((v.points - v.kills) / v.placements.length).toFixed(2);
    tds[4].innerText = Number.parseFloat(v.kills / v.placements.length).toFixed(2);
    tds[5].innerText = Number.parseFloat(v.placements.reduce((p, c) => p + c, 0) / v.placements.length).toFixed(2);
    tds[6].innerText = v.points;
    tds[7].innerText = v.points - v.kills;
    tds[8].innerText = v.kills;
    tds[9].innerText = v.placements.length;
    tds[10].innerText = Number.parseFloat(v.placements.reduce((p, c) => c == 1 ? p + 1 : p, 0) / v.placements.length * 100).toFixed(1);
    tds[11].innerText = Number.parseFloat(v.placements.reduce((p, c) => c <= 3 ? p + 1 : p, 0) / v.placements.length * 100).toFixed(1);
    tds[12].innerText = Number.parseFloat(v.placements.reduce((p, c) => c <= 5 ? p + 1 : p, 0) / v.placements.length * 100).toFixed(1);
    tds[13].innerText = Number.parseFloat(v.placements.reduce((p, c) => c <= 10 ? p + 1 : p, 0) / v.placements.length * 100).toFixed(1);

    // 保存
    v.node = tr;
  }
};

// ---------------------------------------------------------
// create_node
// ---------------------------------------------------------
const create_node = () => {
  create_players_node();
  create_teams_node();
};

// ---------------------------------------------------------
// change_players_sort_header
// ---------------------------------------------------------
const change_players_sort_header = () => {
  const t = current_players_sort.target;
  for (const a of current_players_sort.available) {
    const th = document.getElementById('players_th_' + a);
    if (t == a) {
      th.classList.add('sorted');
    } else {
      th.classList.remove('sorted');
    }
  }
};

// ---------------------------------------------------------
// change_teams_sort_header
// ---------------------------------------------------------
const change_teams_sort_header = () => {
  const t = current_teams_sort.target;
  for (const a of current_teams_sort.available) {
    const th = document.getElementById('teams_th_' + a);
    if (t == a) {
      th.classList.add('sorted');
    } else {
      th.classList.remove('sorted');
    }
  }
};

// ---------------------------------------------------------
// show_table_by_index
// ---------------------------------------------------------
const show_table_by_index = (target, id) => {
  const target_table = target + '_table';
  const target_id = target + '_body' + id;
  const target_index = target + '_table_index_' + id;
  // テーブルの表示
  document.querySelectorAll('table#' + target + '_table tbody').forEach((tbody) => {
    if (tbody.id == target_id) {
      tbody.classList.remove('hide');
    } else {
      tbody.classList.add('hide');
    }
  });

  // リンクの表示
  document.querySelectorAll('div#' + target + '_table_index a').forEach((a) => {
    console.log(target_index);
    if (a.id == target_index) {
      a.classList.add('selected');
    } else {
      a.classList.remove('selected');
    }
  });
};
// ---------------------------------------------------------
// sort_players
// ---------------------------------------------------------
const sort_players = () => {
  return current_players.sort((a, b) => {
    const a_avg = a.kills / a.count;
    const b_avg = b.kills / b.count;
    const a_avgdamage = a.damagecount > 0 ? a.damage / a.damagecount : 0.0;
    const b_avgdamage = b.damagecount > 0 ? b.damage / b.damagecount : 0.0;
    if (current_players_sort.target == 'avg') {
      if (a_avg > b_avg) return -1;
      if (a_avg < b_avg) return 1;
      if (a.count > b.count) return -1;
      if (a.count < b.count) return 1;
    } else if (current_players_sort.target == 'kills') {
      if (a.kills > b.kills) return -1;
      if (a.kills < b.kills) return 1;
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      if (a_avgdamage > b_avgdamage) return -1;
      if (a_avgdamage < b_avgdamage) return 1;
    } else if (current_players_sort.target == 'avgdamage') {
      if (a_avgdamage > b_avgdamage) return -1;
      if (a_avgdamage < b_avgdamage) return 1;
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      if (a.kills > b.kills) return -1;
      if (a.kills < b.kills) return 1;
    } else if (current_players_sort.target == 'damage') {
      if (a.damage > b.damage) return -1;
      if (a.damage < b.damage) return 1;
      if (a.count < b.count) return -1;
      if (a.count > b.count) return 1;
      if (a.kills > b.kills) return -1;
      if (a.kills < b.kills) return 1;
    } else if (current_players_sort.target == 'count') {
      if (a.count > b.count) return -1;
      if (a.count < b.count) return 1;
      if (a.kills > b.kills) return -1;
      if (a.kills < b.kills) return 1;
    }
    // 最終的には名前
    if (a.name > b.name) return 1;
    if (a.name < b.name) return -1;
    return 0;
  });
};

// ---------------------------------------------------------
// show_player_teams
// ---------------------------------------------------------
const show_player_teams = () => {
  const target = current_select.target_teams;
  for (const i of [0, 1, 2, 3]) {
    const target_no = 'no' + (i + 1);
    const s_tr = '#players_container tr th:nth-child(' + (i + 8) + ')';
    const s_td = '#players_container tr td:nth-child(' + (i + 8) + ')';
    const selector = s_tr + ',' + s_td;
    if (target == 'all' || target == target_no) {
      document.querySelectorAll(selector).forEach((item) => {
        item.classList.remove('hide');
      });
    } else {
      document.querySelectorAll(selector).forEach((item) => {
        item.classList.add('hide');
      });
    }
  }
};

// ---------------------------------------------------------
// show_players
// ---------------------------------------------------------
const show_players = () => {
  const pbody = document.getElementById('players_body');

  // ソート
  change_players_sort_header();
  const players = sort_players();

  // ソートした際の順番付け
  let prev_count = -1;
  let prev_value = -1;
  for (let i = 0; i < players.length; ++i) {
    const v = players[i];
    let target_value = 0;
    if (current_players_sort.target == 'avg') {
      target_value = v.kills / v.count;
    } else if (current_players_sort.target == 'kills') {
      target_value = v.kills;
    } else if (current_players_sort.target == 'avgdamage') {
      target_value = v.damagecount > 0 ? v.damage / v.damagecount : 0;
    } else if (current_players_sort.target == 'damage') {
      target_value = v.damage;
    } else if (current_players_sort.target == 'count') {
      target_value = v.count;
    }
    if (prev_value == target_value) {
      v.node.firstChild.innerText = prev_count;
    } else {
      v.node.firstChild.innerText = i + 1;
      prev_count = i + 1;
      prev_value = target_value;
    }

    // 共通のレンジIDを定義
    const range_id = Math.floor((parseInt(v.node.firstChild.innerText, 10) - 1) / 20);

    // 要素をターゲットのtbodyに追加
    append_to_tbody('players', range_id, v.node);

    // インデックスを追加
    add_table_index_range('players', range_id);
  }

  // 表示するチームを選ぶ
  show_player_teams();
};

// ---------------------------------------------------------
// sort_teams
// ---------------------------------------------------------
const sort_teams = () => {
  return current_teams.sort((a, b) => {
    const t = current_teams_sort.target;
    switch (t) {
      case 'avgp':
        const a_avgp = a.points / a.placements.length;
        const b_avgp = b.points / b.placements.length;
        if (a_avgp > b_avgp) return -1;
        if (a_avgp < b_avgp) return 1;
        break;
      case 'avgpp':
        const a_avgpp = (a.points - a.kills) / a.placements.length;
        const b_avgpp = (b.points - b.kills) / b.placements.length;
        if (a_avgpp > b_avgpp) return -1;
        if (a_avgpp < b_avgpp) return 1;
        break;
      case 'avgk':
        const a_avgk = a.kills / a.placements.length;
        const b_avgk = b.kills / b.placements.length;
        if (a_avgk > b_avgk) return -1;
        if (a_avgk < b_avgk) return 1;
        break;
      case 'avgpl':
        const a_avgpl = a.placements.reduce((p, c) => p + c, 0) / a.placements.length;
        const b_avgpl = b.placements.reduce((p, c) => p + c, 0) / b.placements.length;
        if (a_avgpl < b_avgpl) return -1;
        if (a_avgpl > b_avgpl) return 1;
        break;
      case 'p':
        const a_p = a.points;
        const b_p = b.points;
        if (a_p > b_p) return -1;
        if (a_p < b_p) return 1;
        break;
      case 'pp':
        const a_pp = a.points - a.kills;
        const b_pp = b.points - b.kills;
        if (a_pp > b_pp) return -1;
        if (a_pp < b_pp) return 1;
        break;
      case 'k':
        const a_k = a.kills;
        const b_k = b.kills;
        if (a_k > b_k) return -1;
        if (a_k < b_k) return 1;
        break;
      case 'c':
        const a_c = a.placements.length;
        const b_c = b.placements.length;
        if (a_c > b_c) return -1;
        if (a_c < b_c) return 1;
        break;
      case '1c':
        const a_1c = a.placements.reduce((p, c) => c == 1 ? p + 1 : p, 0) / a.placements.length;
        const b_1c = b.placements.reduce((p, c) => c == 1 ? p + 1 : p, 0) / b.placements.length;
        if (a_1c > b_1c) return -1;
        if (a_1c < b_1c) return 1;
        break;
      case '3c':
        const a_3c = a.placements.reduce((p, c) => c <= 3 ? p + 1 : p, 0) / a.placements.length;
        const b_3c = b.placements.reduce((p, c) => c <= 3 ? p + 1 : p, 0) / b.placements.length;
        if (a_3c > b_3c) return -1;
        if (a_3c < b_3c) return 1;
        break;
      case '5c':
        const a_5c = a.placements.reduce((p, c) => c <= 5 ? p + 1 : p, 0) / a.placements.length;
        const b_5c = b.placements.reduce((p, c) => c <= 5 ? p + 1 : p, 0) / b.placements.length;
        if (a_5c > b_5c) return -1;
        if (a_5c < b_5c) return 1;
        break;
      case '10c':
        const a_10c = a.placements.reduce((p, c) => c <= 10 ? p + 1 : p, 0) / a.placements.length;
        const b_10c = b.placements.reduce((p, c) => c <= 10 ? p + 1 : p, 0) / b.placements.length;
        if (a_10c > b_10c) return -1;
        if (a_10c < b_10c) return 1;
        break;
    }
    // 最終的には名前
    if (a.name > b.name) return 1;
    if (a.name < b.name) return -1;
    return 0;
  });
};
// ---------------------------------------------------------
// show_teams
// ---------------------------------------------------------
const show_teams = () => {
  // ソート
  change_teams_sort_header();
  const teams = sort_teams();

  // ソートした際の順番付け
  let prev_count = -1;
  let prev_value = -1;
  for (let i = 0; i < teams.length; ++i) {
    const v = teams[i];
    let target_value = 0;
    switch (current_teams_sort.target) {
      case 'avgp': target_value = v.points / v.placements.length; break;
      case 'avgpp': target_value = (v.points - v.kills) / v.placements.length; break;
      case 'avgk': target_value = v.kills / v.placements.length; break;
      case 'avgpl': target_value = v.placements.reduce((p, c) => p + c, 0) / v.placements.length; break;
      case 'p': target_value = v.points; break;
      case 'pp': target_value = v.points - v.kills; break;
      case 'k': target_value = v.kills; break;
      case 'c': target_value = v.placements.length; break;
      case '1c': target_value = v.placements.reduce((p, c) => c == 1 ? p + 1 : p, 0); break;
      case '3c': target_value = v.placements.reduce((p, c) => c <= 3 ? p + 1 : p, 0); break;
      case '5c': target_value = v.placements.reduce((p, c) => c <= 5 ? p + 1 : p, 0); break;
      case '10c': target_value = v.placements.reduce((p, c) => c <= 10 ? p + 1 : p, 0); break;
    }
    if (prev_value == target_value) {
      v.node.firstChild.innerText = prev_count;
    } else {
      v.node.firstChild.innerText = i + 1;
      prev_count = i + 1;
      prev_value = target_value;
    }

    // 共通のrange_idを定義
    const range_id = Math.floor((parseInt(v.node.firstChild.innerText, 10) - 1) / 20);

    // 要素をターゲットのtbodyに追加
    append_to_tbody('teams', range_id, v.node);

    // インデックスを追加
    add_table_index_range('teams', range_id);
  }
};

// ---------------------------------------------------------
// append_to_tbody
// ---------------------------------------------------------
const append_to_tbody = (target, range_id, node) => {
  const tbody_id = target + '_body' + range_id;
  if (document.getElementById(tbody_id) == null) {
    const tbody = document.createElement('tbody');
    tbody.id = tbody_id;
    document.getElementById(target + '_table').appendChild(tbody);
  }
  const tbody = document.getElementById(tbody_id);
  tbody.appendChild(node);
};

// ---------------------------------------------------------
// clear_table_tbody
// ---------------------------------------------------------
const clear_table_tbody = () => {
  for (const target of ['players', 'teams']) {
    const selector = 'div#' + target + '_container tbody';
    document.querySelectorAll(selector).forEach((tbody) => {
      // tbodyの中身をクリア
      while (tbody.firstChild) { tbody.removeChild(tbody.firstChild); }
    });
  }
};

// ---------------------------------------------------------
// show_table_tbody
// ---------------------------------------------------------
const show_table_tbody = () => {
  for (const target of ['players', 'teams']) {
    const selector = 'div#' + target + '_container tbody';
    document.querySelectorAll(selector).forEach((tbody) => {
      // tbodyを全て表示させる
      tbody.classList.remove('hide');
    });
  }
};

// ---------------------------------------------------------
// add_table_index_range
// ---------------------------------------------------------
const add_table_index_range = (target, range_id) => {
  const index_id = target + '_table_index_' + range_id;
  if (document.getElementById(index_id) == null) {
    const a = document.createElement('a');
    a.id = index_id;
    a.innerText = ((range_id * 20) + 1) + '～' + ((range_id + 1) * (20));
    a.addEventListener("click", (ev) => {
      show_table_by_index(target, range_id);
    });
    document.getElementById(target + '_table_index').appendChild(a);
  }
};

// ---------------------------------------------------------
// add_table_index_all
// ---------------------------------------------------------
const add_table_index_all = (target) => {
  // 全表示のインデックスリンクを追加
  const a = document.createElement('a');
  a.innerText = 'All';
  a.classList.add('selected'); // 選択済みにする
  a.addEventListener('click', () => {
    // tbodyを全部表示させる
    const tbody_selector = 'table#' + target + '_table tbody';
    document.querySelectorAll(tbody_selector).forEach((tbody) => {
      tbody.classList.remove('hide');
    });

    // 'All'のタグを選択済みにする
    const a_selector = 'div#' + target + '_table_index a';
    document.querySelectorAll(a_selector).forEach((a) => {
      if (a.innerText == 'All') {
        a.classList.add('selected');
      } else {
        a.classList.remove('selected');
      }
    });
  });
  document.getElementById(target + '_table_index').appendChild(a);
};

// ---------------------------------------------------------
// clear_table_index
// ---------------------------------------------------------
const clear_table_index = () => {
  for (const target of ['players', 'teams']) {
    // インデックスを削除
    const selector = 'div#' + target + '_table_index';
    document.querySelectorAll(selector).forEach((div) => {
      while (div.firstChild) { div.removeChild(div.firstChild); }
    });

    // Allのリンクを追加
    add_table_index_all(target);
  }
};

// ---------------------------------------------------------
// show_target_container
// ---------------------------------------------------------
const show_target_container = () => {
  const p_container = document.getElementById('players_container');
  const t_container = document.getElementById('teams_container');
  if (current_select.target == 'players') {
    p_container.classList.remove('hide');
    t_container.classList.add('hide');
  } else if (current_select.target == 'teams') {
    p_container.classList.add('hide');
    t_container.classList.remove('hide');
  }
};

// ---------------------------------------------------------
// show
// ---------------------------------------------------------
const show = (requeue) => {
  // 一旦全部隠す
  document.getElementById('players_container').classList.add('hide');
  document.getElementById('teams_container').classList.add('hide');

  // requeueがあったらいったん要素全部削除
  if (requeue) {
    clear_table_tbody();
  }
  show_table_tbody();

  // インデックスは毎回作り直し
  clear_table_index();

  if (current_select.target == 'players') {
    // プレイヤー表示
    show_players();
  } else if (current_select.target == 'teams') {
    // チーム表示
    show_teams();
  }

  // 表示非表示切り替え
  show_target_container();

  console.log(current_players);
  console.log(current_teams);
};

// ---------------------------------------------------------
// object_equal
// ---------------------------------------------------------
const object_equal = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a != "object" || typeof b != "object") return false;
  if (!arrays_equal(Object.keys(a), Object.keys(b))) return false;
  for (const [k, v] of Object.entries(a)) {
    if (v !== b[k]) return false;
  }
  return true;
};

// ---------------------------------------------------------
// arrays_equal
// ---------------------------------------------------------
const arrays_equal = (a, b) => {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
};

// ---------------------------------------------------------
// get_current_radio_event
// ---------------------------------------------------------
const get_current_radio_event = () => {
  let checked = '';
  document.querySelectorAll('input[name=events]').forEach((item) => {
    if (item.checked) {
      checked = item.id.substring(7);
    }
  });
  return checked;
};

// ---------------------------------------------------------
// get_current_weeks
// ---------------------------------------------------------
const get_current_weeks = () => {
  return [
    document.getElementById('week1').checked,
    document.getElementById('week2').checked,
    document.getElementById('week3').checked,
    document.getElementById('week4').checked
  ];
};


// ---------------------------------------------------------
// get_current_rounds
// ---------------------------------------------------------
const get_current_rounds = () => {
  return [
    document.getElementById('round_final').checked,
    document.getElementById('round_semifinals').checked,
    document.getElementById('round_80to40').checked,
    document.getElementById('round_160to80').checked,
    document.getElementById('round_320to160').checked
  ];
};

// ---------------------------------------------------------
// get_current_maps
// ---------------------------------------------------------
const get_current_maps = () => {
  return {
    w: document.getElementById('map_we').checked,
    s: document.getElementById('map_sp').checked,
    k: document.getElementById('map_kc').checked,
    e: document.getElementById('map_ed').checked,
    o: document.getElementById('map_ol').checked,
  };
};


// ---------------------------------------------------------
// get_current_games
// ---------------------------------------------------------
const get_current_games = () => {
  return parseInt(document.getElementById('games').value, 10);
};

// ---------------------------------------------------------
// get_current_target
// ---------------------------------------------------------
const get_current_target = () => {
  if (document.getElementById('target_players').checked) return 'players';
  if (document.getElementById('target_teams').checked) return 'teams';
  return '';
};

// ---------------------------------------------------------
// get_current_target_teams
// ---------------------------------------------------------
const get_current_target_teams = () => {
  if (document.getElementById('target_teams_no1').checked) return 'no1';
  if (document.getElementById('target_teams_no2').checked) return 'no2';
  if (document.getElementById('target_teams_no3').checked) return 'no3';
  if (document.getElementById('target_teams_no4').checked) return 'no4';
  return 'all';
};

// ---------------------------------------------------------
// update_select_events
// ---------------------------------------------------------
const check_and_show = async () => {
  let requeue = false;

  // データセットが違うか確認する
  const event = get_current_radio_event();
  if (current_select.event != event) {
    await fetch_event(event);
    current_select.event = event;
    requeue = true;
  }

  // 絞り込み＆対象が前回と同じか確認する
  const weeks = get_current_weeks();
  const rounds = get_current_rounds();
  const maps = get_current_maps();
  const games = get_current_games();
  if (!arrays_equal(current_select.weeks, weeks) ||
    !arrays_equal(current_select.rounds, rounds) ||
    current_select.games != games ||
    !object_equal(current_select.maps, maps)) {
    current_select.weeks = weeks;
    current_select.rounds = rounds;
    current_select.games = games;
    current_select.maps = maps;
    requeue = true;
  }

  current_select.target = get_current_target();
  current_select.target_teams = get_current_target_teams();

  if (requeue) {
    console.log("==event==");
    console.log(event);
    // 空にする
    current_players.splice(0);

    // データを絞り込む(プレイヤー)
    for (const [k, v] of Object.entries(all_players)) {
      if (k != v.id[0]) continue;
      let count = 0;
      let kills = 0;
      let damage = 0;
      let damagecount = 0;
      for (const game of v.games) {
        const cc = game.cc;
        const r = all_rounds[cc] - game.round - 1;
        if (!weeks[cc]) continue; // week確認
        if (!rounds[r]) continue; // ラウンド確認
        if (!maps[game.map]) continue; // マップ確認
        count++;
        kills += game.kills;
        if ('damage' in game) {
          if (game.damage != null) {
            damage += game.damage;
            damagecount++;
          }
        }
      }
      if (count < games) continue; // ゲーム数確認

      // チームID→チーム名
      const teams = [];
      console.log(all_teams);
      for (const id of v.teams) {
        teams.push(id != "" && (id in all_teams) ? all_teams[id].name : "");
      }

      // playersに追加
      current_players.push({
        name: v.name,
        teams: teams,
        count: count,
        kills: kills,
        damage: damage,
        damagecount: damagecount
      });
    }

    // データを絞り込む(チーム)
    current_teams.splice(0);
    for (const [k, v] of Object.entries(all_teams)) {
      let kills = 0;
      let points = 0;
      let placements = [];
      for (let i = 0; i < v.games.length; ++i) {
        if (!weeks[i]) continue; // week確認
        for (const game of v.games[i]) {
          const r = all_rounds[i] - game.round - 1;
          if (!rounds[r]) continue; // ラウンド確認
          if (!maps[game.map]) continue; // マップ確認
          kills += game.kills;
          points += game.points;
          placements.push(game.placement);
        }
      }
      if (placements.length == 0) continue; // 試合数0
      if (placements.length < games) continue; // 試合数確認

      // teamsに追加
      current_teams.push({
        name: v.name,
        kills: kills,
        points: points,
        placements: placements
      });
    }

    // 各ノードを作成する
    create_node();
  }
  show(requeue);
};

// ---------------------------------------------------------
// update_select_events
// ---------------------------------------------------------
const update_select_events = () => {
  const sl = document.getElementById('select_event');

  // 中身の設定
  for (const ev of all_events) {
    // radioボタン
    const input = document.createElement('input');
    const id = 'events_' + ev[0];
    input.id = id;
    input.type = 'radio';
    input.name = 'events';
    sl.appendChild(input);

    // ラベル
    const label = document.createElement('label');
    label.setAttribute('for', id);
    label.innerText = ev[1] + ' ';
    sl.appendChild(label);
  }

  // 最後の要素を選択する
  document.querySelectorAll('#select_event input:last-of-type').forEach((input) => {
    input.checked = true;
  });
};

// ---------------------------------------------------------
// set_event_listener
// ---------------------------------------------------------
const set_event_listener = () => {
  document.querySelectorAll("input").forEach((item) => {
    item.addEventListener('change', async (e) => {
      await check_and_show();
    });
  });

  for (const t of current_players_sort.available) {
    document.getElementById('players_th_' + t).addEventListener('click', async (e) => {
      current_players_sort.target = t;
      await check_and_show();
    });
  }

  for (const t of current_teams_sort.available) {
    document.getElementById('teams_th_' + t).addEventListener('click', async (e) => {
      current_teams_sort.target = t;
      await check_and_show();
    });
  }
};

// ---------------------------------------------------------
// fetch utility
// ---------------------------------------------------------
const get_json = async (url) => {
  return fetch(url)
    .catch(e => { return null; })
    .then(r => {
      if (r == null) return null;
      if (!r.ok) return null;
      return r.json();
    });
};

// ---------------------------------------------------------
// fetch_players
// ---------------------------------------------------------
const fetch_players = async (ev) => {
  let json = await get_json(ev + '-players.json');
  if (json == null) return;
  all_players = {};
  if (Array.isArray(json)) {
    for (const j of json) {
      if (typeof j == 'object') {
        if ('id' in j) {
          for (const id of j.id) {
            all_players[id] = j;
          }
        }
      }
    }
  }
};

// ---------------------------------------------------------
// fetch_teams
// ---------------------------------------------------------
const fetch_teams = async (ev) => {
  let json = await get_json(ev + '-teams.json');
  if (json == null) return;
  if (typeof json == 'object') {
    all_teams = json;
  }
};

// ---------------------------------------------------------
// fetch_rounds
// ---------------------------------------------------------
const fetch_rounds = async (ev) => {
  let json = await get_json(ev + '-rounds.json');
  if (json == null) return;
  all_rounds = [];
  if (Array.isArray(json)) {
    for (const j of json) {
      if (typeof j == 'number') {
        all_rounds.push(j);
      }
    }
  }
};

// ---------------------------------------------------------
// fetch_event
// ---------------------------------------------------------
const fetch_event = async (ev) => {
  await fetch_rounds(ev);
  await fetch_players(ev);
  await fetch_teams(ev);
};

// ---------------------------------------------------------
// fetch_events
// ---------------------------------------------------------
const fetch_events = async () => {
  let json = await get_json('events.json');
  if (json == null) return;
  if (Array.isArray(json)) {
    for (const j of json) {
      if (Array.isArray(j)) {
        if (j.length == 2) {
          all_events.push(j);
        }
      }
    }
  }
};

// ---------------------------------------------------------
// first run
// ---------------------------------------------------------
window.onload = async (event) => {

  // イベントリストの取得＆表示
  await fetch_events();
  update_select_events();

  // 初回表示
  await check_and_show();

  // 項目変更を監視する
  set_event_listener();

  console.log(all_events);
  console.log(all_players);
  console.log(all_teams);
};
