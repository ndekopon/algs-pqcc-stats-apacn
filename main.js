// グローバル変数
const worker = new Worker('worker.js', { type: 'module' });

const all_players = {};
const all_teams = {};

const current_select = {
  event: '',
  weeks: [true, true, true, true],
  rounds: [true, true, true, true, true],
  maps: { w: true, s: true, k: true, e: true, b: true, o: true },
  games: 1,
  target: '',
  target_teams: 'all',
  displaycount: 10
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
const create_table_row = (tr, classes) => {
  for (const c of classes) {
    const td = document.createElement('td');
    td.classList.add('td_' + c);
    tr.appendChild(td);
  }
};

// ---------------------------------------------------------
// PlayersTable
// ---------------------------------------------------------
class PlayersTable {
  #basenode = null;
  #players = new Map();
  #tbody = document.getElementById('players_body');
  constructor() {
    this.#basenode = document.createElement('tr');
    create_table_row(this.#basenode, ['num', 'str', 'float', 'num', 'float', 'num', 'num', 'str', 'str', 'str', 'str']);
  }

  #updateNode(id, player) {
    // 空の場合は作成
    if (!this.#players.has(id)) {
      this.#players.set(id, this.#basenode.cloneNode(true));
    }
    const node = this.#players.get(id);

    // テキストの設定
    node.children[0].innerText = player.rank;
    node.children[1].innerText = player.name;
    node.children[2].innerText = Number.parseFloat(player.kavg).toFixed(2);
    node.children[3].innerText = player.kills;
    node.children[4].innerText = Number.parseFloat(player.davg).toFixed(1);
    node.children[5].innerText = player.damage;
    if (player.count == player.damagecount) {
      node.children[6].innerText = player.count;
    } else {
      node.children[6].innerHTML = `${player.count}<span class=damagecount>[${player.damagecount}]</span>`;
    }
    node.children[7].innerText = player.teams[0];
    node.children[8].innerText = player.teams[1];
    node.children[9].innerText = player.teams[2];
    node.children[10].innerText = player.teams[3];

    return node;
  }

  updateShowTeams() {
    const table = document.getElementById('players_table');
    switch (current_select.target_teams) {
      case 'no1':
        table.classList.remove('hide_no1');
        table.classList.add('hide_no2');
        table.classList.add('hide_no3');
        table.classList.add('hide_no4');
        break;
      case 'no2':
        table.classList.add('hide_no1');
        table.classList.remove('hide_no2');
        table.classList.add('hide_no3');
        table.classList.add('hide_no4');
        break;
      case 'no3':
        table.classList.add('hide_no1');
        table.classList.add('hide_no2');
        table.classList.remove('hide_no3');
        table.classList.add('hide_no4');
        break;
      case 'no4':
        table.classList.add('hide_no1');
        table.classList.add('hide_no2');
        table.classList.add('hide_no3');
        table.classList.remove('hide_no4');
        break;
      default:
        table.classList.remove('hide_no1');
        table.classList.remove('hide_no2');
        table.classList.remove('hide_no3');
        table.classList.remove('hide_no4');
    }
  }

  show(players) {
    this.#tbody.classList.add('updating');

    // 一旦クリア
    while (this.#tbody.firstChild) {
      this.#tbody.removeChild(this.#tbody.firstChild);
    }

    for (const player of players) {
      this.#tbody.appendChild(this.#updateNode(player.id, player));
    }

    this.updateShowTeams();

    this.#tbody.classList.remove('updating');
  }
}


// ---------------------------------------------------------
// TeamsTable
// ---------------------------------------------------------
class TeamsTable {
  #basenode = null;
  #teams = new Map();
  #tbody = document.getElementById('teams_body');
  constructor() {
    this.#basenode = document.createElement('tr');
    create_table_row(this.#basenode, ['num', 'str', 'float', 'float', 'float', 'float', 'num', 'num', 'num', 'num', 'float', 'float', 'float', 'float']);
  }

  #updateNode(id, team) {
    // 空の場合は作成
    if (!this.#teams.has(id)) {
      this.#teams.set(id, this.#basenode.cloneNode(true));
    }
    const node = this.#teams.get(id);

    // テキストの設定
    node.children[0].innerText = team.rank;
    node.children[1].innerText = team.name;
    node.children[2].innerText = Number.parseFloat(team.averagepoints).toFixed(2);
    node.children[3].innerText = Number.parseFloat(team.averageplacementpoints).toFixed(2);
    node.children[4].innerText = Number.parseFloat(team.averagekills).toFixed(2);
    node.children[5].innerText = Number.parseFloat(team.averageplacement).toFixed(2);
    node.children[6].innerText = team.points;
    node.children[7].innerText = team.placementpoints;
    node.children[8].innerText = team.kills;
    node.children[9].innerText = team.count;
    node.children[10].innerText = Number.parseFloat(team.top1rate * 100).toFixed(1);
    node.children[11].innerText = Number.parseFloat(team.top3rate * 100).toFixed(1);
    node.children[12].innerText = Number.parseFloat(team.top5rate * 100).toFixed(1);
    node.children[13].innerText = Number.parseFloat(team.top10rate * 100).toFixed(1);

    return node;
  }

  show(teams) {
    this.#tbody.classList.add('updating');

    // 一旦クリア
    while (this.#tbody.firstChild) {
      this.#tbody.removeChild(this.#tbody.firstChild);
    }

    for (const team of teams) {
      this.#tbody.appendChild(this.#updateNode(team.id, team));
    }

    this.#tbody.classList.remove('updating');
  }
}

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
    b: document.getElementById('map_bm').checked,
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
// get_current_displaycount
// ---------------------------------------------------------
const get_current_displaycount = () => {
  if (document.getElementById('displaycount_10').checked) return 10;
  if (document.getElementById('displaycount_20').checked) return 20;
  if (document.getElementById('displaycount_50').checked) return 50;
  if (document.getElementById('displaycount_all').checked) return 0;
  return 10;
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
const check_and_show = async (force = false) => {
  let refilter = false;

  // データセットが違うか確認する
  const event = get_current_radio_event();
  if (current_select.event != event) {
    current_select.event = event;
    worker.postMessage({ type: 'event', data: event });
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
    refilter = true;
  }

  if (current_select.target != get_current_target()) {
    current_select.target = get_current_target();
    refilter = true;
  }
  current_select.target_teams = get_current_target_teams();

  if (current_select.displaycount != get_current_displaycount()) {
    current_select.displaycount = get_current_displaycount();
    refilter = true;
  }

  if (refilter || force) {
    worker.postMessage({
      type: 'filter',
      data: {
        weeks: current_select.weeks,
        rounds: current_select.rounds,
        maps: current_select.maps,
        games: current_select.games,
        target: current_select.target,
        displaycount: current_select.displaycount,
        playersortkey: current_players_sort.target,
        teamsortkey: current_teams_sort.target,
      }
    });
  }
};

// ---------------------------------------------------------
// show_events
// ---------------------------------------------------------
const show_events = (events) => {
  const sl = document.getElementById('select_event');

  // 中身の設定
  for (const [id, name] of events) {
    // radioボタン
    const input = document.createElement('input');
    input.id = 'events_' + id;
    input.type = 'radio';
    input.name = 'events';
    sl.appendChild(input);

    // ラベル
    const label = document.createElement('label');
    label.setAttribute('for', input.id);
    label.innerText = name + ' ';
    sl.appendChild(label);
  }

  // 最後の要素を選択する
  document.querySelectorAll('#select_event input:last-of-type').forEach((input) => {
    input.checked = true;
  });

  // 初回表示
  check_and_show();
};

// ---------------------------------------------------------
// first run
// ---------------------------------------------------------
window.onload = (_) => {
  const pt = new PlayersTable();
  const tt = new TeamsTable();
  worker.addEventListener('message', (e) => {
    switch (e.data.type) {
      case 'events': {
        show_events(e.data.events);
        document.querySelectorAll("input").forEach((item) => {
          item.addEventListener('change', async (e) => {
            check_and_show();
            pt.updateShowTeams();
          });
        });

        for (const t of current_players_sort.available) {
          document.getElementById('players_th_' + t).addEventListener('click', async (e) => {
            if (current_players_sort.target == t) return;
            current_players_sort.target = t;
            check_and_show(true);
          });
        }

        for (const t of current_teams_sort.available) {
          document.getElementById('teams_th_' + t).addEventListener('click', async (e) => {
            if (current_teams_sort.target == t) return;
            current_teams_sort.target = t;
            check_and_show(true);
          });
        }
        break;
      }
      case 'players': {
        change_players_sort_header();
        pt.show(e.data.players);
        show_target_container();
        break;
      }
      case 'teams': {
        change_teams_sort_header();
        tt.show(e.data.teams);
        show_target_container();
        break;
      }
    }
  });
};
