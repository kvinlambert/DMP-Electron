import Vue from 'vue';
import { ipcRenderer } from 'electron'; // eslint-disable-line

export default {
  namespaced: true,

  state: {
    isLoading: false,
    unknownSongs: [],
    rounds: []
  },

  getters: {
    getUnknownSongs(state) {
      return state.rounds
        .reduce((oldRound, newRound) => {
          const roundUnknownSongs = newRound.dances.filter(dance => dance.meta[0].type === 'unknown');
          return oldRound.concat(roundUnknownSongs.map(song => ({
            ...song,
            round: newRound,
            isRecognized: false
          })));
        }, []);
    }
  },

  mutations: {
    setIsLoading(state, payload) {
      state.isLoading = payload;
    },

    setRounds(state, payload) {
      state.rounds = payload;
    },

    setRoundIsDone(state, payload) {
      const { round, isDone } = payload;
      if (isDone) {
        const stateRound = state.rounds.find(el => el.id === round.id);
        const stateRoundsWithPrevious = [...state.rounds].splice(0, state.rounds.indexOf(stateRound) + 1);
        stateRoundsWithPrevious.forEach((el) => {
          el.isDone = true;
        });
        // stateRound.isDone = isDone;
      } else {
        const stateRound = state.rounds.find(el => el.id === round.id);
        stateRound.isDone = isDone;
      }
    },

    clearRounds(state) {
      state.rounds = [];
    },

    setSongType(state, payload) {
      const { type, song } = payload;
      const { round, path, name } = song;

      const roundState = state.rounds.find(_round => _round.id === round.id);
      const songState = roundState.dances.find(_song => _song.uuid === song.uuid);
      const nameArray = songState.name.split('.');
      const extension = nameArray[nameArray.length - 1];
      const newNameArray = nameArray.slice(0, nameArray.length - 1)
        .concat([` ${type}`]);

      Vue.set(songState, 'name', `${newNameArray.join('')}.${extension}`);
      Vue.set(songState, 'path', path.replace(name, songState.name));
      Vue.set(songState.meta[0], 'probability', 10);
      Vue.set(songState.meta[0], 'type', type);
    },

    setUnknownSongs(state, payload) {
      state.unknownSongs = payload;
    },

    resetTimetable(state) {
      state.rounds.forEach((round) => {
        round.isDone = false;
        round.dances.forEach((song) => {
          song.isDone = false;
        });
      });
    }
  },

  actions: {
    getTimetable({ commit }) {
      commit('clearRounds');
      ipcRenderer.send('get-rounds');
      ipcRenderer.on('get-rounds-response', (event, res) => {
        commit('setRounds', res);
        commit('setIsLoading', false);
      });
    },

    generateTimetable({ commit }) {
      commit('setIsLoading', true);
      ipcRenderer.send('generate');
      ipcRenderer.on('generate-response', (event, res) => {
        commit('setRounds', res);
        commit('setIsLoading', false);
      });
    }
  }
};
