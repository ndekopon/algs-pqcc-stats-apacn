class CCData {
	#events = new Map();
	#events_loaded = false;
	#fetchqueue = [];
	#filterqueue = [];
	#current_event_id = '';
	#processingstatus = '';
	#players = new Map();
	#teams = new Map();
	#rounds = [];
	#filters = {
		target: 'players',
		weeks: [true, true, true, true],
		rounds: [true, true, true, true, true],
		maps: { w: true, s: true, k: true, e: true, b: true, o: true },
		games: 1,
		displaycount: 10,
		playersortkey: 'avg',
		teamsortkey: 'avgp',
	};

	#procFilter() {
		if (this.#filters.target == 'players') {
			this.#procPlayers();
		} else if (this.#filters.target == 'teams') {
			this.#procTeams();
		}
	}

	#procPlayers() {
		const players = [];
		for (const [id, player] of this.#players) {
			const stats = {
				count: 0,
				kills: 0,
				damage: 0,
				damagecount: 0,
				kavg: 0,
				davg: 0
			};
			for (const game of player.games) {
				if (!this.#filters.weeks[game.cc]) continue;
				if (!this.#filters.rounds[this.#filters.rounds.length - game.round - 1]) continue;
				if (!this.#filters.maps[game.map]) continue;
				if ('kills' in game) {
					stats.count++;
					stats.kills += game.kills;
				}
				if ('damage' in game && game.damage !== null) {
					stats.damagecount++;
					stats.damage += game.damage;
				}
			}

			// 試合数フィルター
			if (stats.count < this.#filters.games) {
				continue;
			}
			// 平均計算
			if (stats.count > 0) {
				stats.kavg = stats.kills / stats.count;
			}
			if (stats.damagecount > 0) {
				stats.davg = stats.damage / stats.damagecount;
			}

			// 参加しているプレイヤーのみ抜粋
			if (stats.count > 0 || stats.damagecount > 0) {
				players.push({
					id: id,
					name: player.name,
					count: stats.count,
					kills: stats.kills,
					damage: stats.damage,
					damagecount: stats.damagecount,
					kavg: stats.kavg,
					davg: stats.davg,
					teams: player.teams.map((teamid) => {
						const team = this.#teams.get(teamid);
						return team ? team.name.split('/')[0] : '';
					}),
				});
			}
		};

		// ソート
		players.sort((a, b) => {
			if (this.#filters.playersortkey == 'avg') {
				if (a.kavg > b.kavg) return -1;
				if (a.kavg < b.kavg) return 1;
				if (a.count > b.count) return -1;
				if (a.count < b.count) return 1;
				if (a.davg > b.davg) return -1;
				if (a.davg < b.davg) return 1;
			} else if (this.#filters.playersortkey == 'kills') {
				if (a.kills > b.kills) return -1;
				if (a.kills < b.kills) return 1;
				if (a.count > b.count) return -1;
				if (a.count < b.count) return 1;
				if (a.davg > b.davg) return -1;
				if (a.davg < b.davg) return 1;
			} else if (this.#filters.playersortkey == 'avgdamage') {
				if (a.davg > b.davg) return -1;
				if (a.davg < b.davg) return 1;
				if (a.count > b.count) return -1;
				if (a.count < b.count) return 1;
				if (a.kills > b.kills) return -1;
				if (a.kills < b.kills) return 1;
			} else if (this.#filters.playersortkey == 'damage') {
				if (a.damage > b.damage) return -1;
				if (a.damage < b.damage) return 1;
				if (a.count > b.count) return -1;
				if (a.count < b.count) return 1;
				if (a.kills > b.kills) return -1;
				if (a.kills < b.kills) return 1;
			} else if (this.#filters.playersortkey == 'count') {
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

		// 順位をつける(同率は同順位)
		for (let i = 0; i < players.length; ++i) {
			const a = players[i];
			if (i > 0) {
				const b = players[i - 1];
				if (this.#filters.playersortkey == 'avg') {
					if (a.kavg === b.kavg) {
						a.rank = b.rank;
					}
				} else if (this.#filters.playersortkey == 'kills') {
					if (a.kills === b.kills) {
						a.rank = b.rank;
					}
				} else if (this.#filters.playersortkey == 'avgdamage') {
					if (a.davg === b.davg) {
						a.rank = b.rank;
					}
				} else if (this.#filters.playersortkey == 'damage') {
					if (a.damage === b.damage) {
						a.rank = b.rank;
					}
				} else if (this.#filters.playersortkey == 'count') {
					if (a.count === b.count) {
						a.rank = b.rank;
					}
				}
			}
			if (!('rank' in a)) {
				a.rank = i + 1;
			}
		}
		// 順位で上位displaycount人を抜粋
		if (this.#filters.displaycount == 0) {
			self.postMessage({ type: 'players', players: players });
		} else {
			self.postMessage({ type: 'players', players: players.filter((x) => x.rank <= this.#filters.displaycount) });
		}
	}

	#procTeams() {
		const teams = [];
		for (const [teamid, team] of this.#teams) {
			const stats = {
				count: 0,
				kills: 0,
				placements: 0,
				points: 0,
				count1: 0,
				count3: 0,
				count5: 0,
				count10: 0,
			};

			// 抜き出すCCの番号をArrayにしておく
			const ccs = [];
			this.#filters.weeks.forEach((include, cc) => {
				if (include) ccs.push(cc);
			});

			for (const cc of ccs) {
				for (const game of team.games[cc]) {
					if (!this.#filters.rounds[this.#filters.rounds.length - game.round - 1]) continue;
					if (!this.#filters.maps[game.map]) continue;
					stats.count++;
					stats.kills += game.kills;
					stats.placements += game.placement;
					stats.points += game.points;
					if (game.placement == 1) stats.count1++;
					if (game.placement <= 3) stats.count3++;
					if (game.placement <= 5) stats.count5++;
					if (game.placement <= 10) stats.count10++;
				}
			}

			// 試合数フィルター
			if (stats.count < this.#filters.games) {
				continue;
			}

			if (stats.count > 0) {
				teams.push({
					id: teamid,
					name: team.name,
					count: stats.count,
					kills: stats.kills,
					points: stats.points,
					placementpoints: stats.points - stats.kills,
					averagepoints: stats.points / stats.count,
					averagekills: stats.kills / stats.count,
					averageplacementpoints: (stats.points - stats.kills) / stats.count,
					averageplacement: stats.placements / stats.count,
					top1rate: stats.count1 / stats.count,
					top3rate: stats.count3 / stats.count,
					top5rate: stats.count5 / stats.count,
					top10rate: stats.count10 / stats.count,
				});
			}
		}

		// ソート
		teams.sort((a, b) => {
			switch (this.#filters.teamsortkey) {
				case 'avgp':
					if (a.averagepoints > b.averagepoints) return -1;
					if (a.averagepoints < b.averagepoints) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case 'avgpp':
					if (a.averageplacementpoints > b.averageplacementpoints) return -1;
					if (a.averageplacementpoints < b.averageplacementpoints) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case 'avgk':
					if (a.averagekills > b.averagekills) return -1;
					if (a.averagekills < b.averagekills) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case 'avgpl':
					if (a.averageplacement < b.averageplacement) return -1;
					if (a.averageplacement > b.averageplacement) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case 'p':
					if (a.points > b.points) return -1;
					if (a.points < b.points) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case 'pp':
					if (a.placementpoints > b.placementpoints) return -1;
					if (a.placementpoints < b.placementpoints) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case 'k':
					if (a.kills > b.kills) return -1;
					if (a.kills < b.kills) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case 'c':
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case '1c':
					if (a.top1rate > b.top1rate) return -1;
					if (a.top1rate < b.top1rate) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case '3c':
					if (a.top3rate > b.top3rate) return -1;
					if (a.top3rate < b.top3rate) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case '5c':
					if (a.top5rate > b.top5rate) return -1;
					if (a.top5rate < b.top5rate) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
				case '10c':
					if (a.top10rate > b.top10rate) return -1;
					if (a.top10rate < b.top10rate) return 1;
					if (a.count > b.count) return -1;
					if (a.count < b.count) return 1;
					break;
			}
			// 最終的には名前
			if (a.name > b.name) return 1;
			if (a.name < b.name) return -1;
			return 0;
		});

		// 順位をつける(同率は同順位)
		for (let i = 0; i < teams.length; ++i) {
			const a = teams[i];
			if (i > 0) {
				const b = teams[i - 1];
				switch (this.#filters.teamsortkey) {
					case 'avgp':
						if (a.averagepoints === b.averagepoints) {
							a.rank = b.rank;
						}
						break;
					case 'avgpp':
						if (a.averageplacementpoints === b.averageplacementpoints) {
							a.rank = b.rank;
						}
						break;
					case 'avgk':
						if (a.averagekills === b.averagekills) {
							a.rank = b.rank;
						}
						break;
					case 'avgpl':
						if (a.averageplacement === b.averageplacement) {
							a.rank = b.rank;
						}
						break;
					case 'p':
						if (a.points === b.points) {
							a.rank = b.rank;
						}
						break;
					case 'pp':
						if (a.averageplacementpoints === b.averageplacementpoints) {
							a.rank = b.rank;
						}
						break;
					case 'k':
						if (a.kills === b.kills) {
							a.rank = b.rank;
						}
						break;
					case 'c':
						if (a.count === b.count) {
							a.rank = b.rank;
						}
						break;
					case '1c':
						if (a.top1rate === b.top1rate) {
							a.rank = b.rank;
						}
						break;
					case '3c':
						if (a.top3rate === b.top3rate) {
							a.rank = b.rank;
						}
						break;
					case '5c':
						if (a.top5rate === b.top5rate) {
							a.rank = b.rank;
						}
						break;
					case '10c':
						if (a.top10rate === b.top10rate) {
							a.rank = b.rank;
						}
						break;
				}
			}
			if (!('rank' in a)) {
				a.rank = i + 1;
			}
		}

		// 順位で上位displaycountチームを抜粋
		if (this.#filters.displaycount == 0) {
			self.postMessage({ type: 'teams', teams: teams });
		} else {
			self.postMessage({ type: 'teams', teams: teams.filter((x) => x.rank <= this.#filters.displaycount) });
		}
	}

	fetchEvents() {
		fetch('events.json').then((response) => {
			if (response.ok) {
				return response.json();
			}
		}).then((json) => {
			if (Array.isArray(json)) {
				for (const j of json) {
					if (Array.isArray(j) && j.length >= 2) {
						this.#events.set(j[0], j[1]);
					}
				}
			}
			this.#events_loaded = true;
			this.#eventLoaded();
		});
	}

	#postEvents() {
		// メインスレッドにイベントリストを送信
		self.postMessage({ type: 'events', events: this.#events });
	}

	#eventLoaded() {
		this.#postEvents();
		this.#checkFetchQueue();
	}

	#checkFetchQueue() {
		if (!this.#events_loaded) return;
		if (this.#processingstatus === 'fetching') return;
		while (this.#fetchqueue.length > 0) {
			const event_id = this.#fetchqueue.pop();
			if (typeof event_id === 'string' && this.#events.has(event_id)) {
				if (event_id !== this.#current_event_id) {
					// キューを削除
					this.#fetchqueue.splice(0, this.#fetchqueue.length);
					this.#current_event_id = event_id;
					this.#processingstatus = 'fetching';
					this.#fetchEvent(event_id);
				} else if (this.#processingstatus === 'fetched') {
					// 同じイベントで、ロードが完了している場合はキューを削除
					this.#fetchqueue.splice(0, this.#fetchqueue.length);
					this.#fetchCompleted(event_id);
				}
			}
		}
	}

	#checkFilterQueue() {
		if (this.#processingstatus !== 'fetched') return;
		while (this.#filterqueue.length > 0) {
			this.#filterqueue.splice(0, this.#filterqueue.length);
			this.#procFilter();
		}
	}

	#fetchEvent(event_id) {
		// clear data
		this.#players.clear();
		this.#teams.clear();
		this.#rounds.length = 0;
		const fetches = ['fetching', 'fetching', 'fetching'];

		fetch(event_id + '-players.json').then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				fetches[0] = 'cancelled';
			}
		}).then((json) => {
			if (event_id !== this.#current_event_id) {
				fetches[0] = 'cancelled';
				return;
			}
			if (Array.isArray(json)) {
				for (const j of json) {
					if (typeof j == 'object') {
						if ('id' in j) {
							for (const id of j.id) {
								this.#players.set(id, j);
							}
						}
					}
				}
			}
			// 全部取得したか確認
			fetches[0] = 'fetched';
			if (fetches.every((status) => status === 'fetched')) {
				this.#fetchCompleted(event_id);
			} else if (fetches.every((status) => status !== 'fetching')) {
				this.#fetchCancelled();
			}
		});

		fetch(event_id + '-teams.json').then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				fetches[1] = 'cancelled';
				return;
			}
		}).then((json) => {
			if (event_id !== this.#current_event_id) {
				fetches[1] = 'cancelled';
				return;
			}
			if (typeof json == 'object') {
				Object.entries(json).forEach(([teamid, team]) => {
					this.#teams.set(teamid, team);
				});
			}
			// 全部取得したか確認
			fetches[1] = 'fetched';
			if (fetches.every((status) => status === 'fetched')) {
				this.#fetchCompleted(event_id);
			} else if (fetches.every((status) => status !== 'fetching')) {
				this.#fetchCancelled();
			}
		});

		fetch(event_id + '-rounds.json').then((response) => {
			if (response.ok) {
				return response.json();
			} else {
				fetches[2] = 'cancelled';
			}
		}).then((json) => {
			if (event_id !== this.#current_event_id) {
				fetches[2] = 'cancelled';
				return;
			}
			if (Array.isArray(json)) {
				for (const j of json) {
					if (typeof j == 'number') {
						this.#rounds.push(j);
					}
				}
			}
			// 全部取得したか確認
			fetches[2] = 'fetched';
			if (fetches.every((status) => status === 'fetched')) {
				this.#fetchCompleted(event_id);
			} else if (fetches.every((status) => status !== 'fetching')) {
				this.#fetchCancelled();
			}
		});
	}

	enqueueFetchEvent(event_id) {
		this.#fetchqueue.push(event_id);
		this.#filterqueue.push(0);
		this.#checkFetchQueue();
	}

	enqueueFilterEvent() {
		this.#filterqueue.push(0);
		this.#checkFilterQueue();
	}

	#fetchCompleted(event_id) {
		this.#processingstatus = 'fetched';
		this.#checkFetchQueue();
		this.#checkFilterQueue();
	}

	#fetchCancelled() {
		this.#processingstatus = 'cancelled';
		this.#checkFetchQueue();
	}

	setFilters(filters) {
		// filtersを更新
		this.#filters = filters;
		this.enqueueFilterEvent();
	}
};


const ccdata = new CCData();

ccdata.fetchEvents();

self.addEventListener('message', (ev) => {
	const type = ev.data.type;
	const data = ev.data.data;
	switch (type) {
		case 'event':
			if (typeof data === 'string') {
				ccdata.enqueueFetchEvent(data);
			}
			break;
		case 'filter':
			if (typeof data === 'object' && data !== null) {
				ccdata.setFilters(data);
			}
			break;
	}

});
