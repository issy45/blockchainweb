import sha256 from 'crypto-js/sha256'

export default {
  namespaced: true,
  state: {
    previousHash: null,
    timestamp: null,
    data: null,
    nonce: null
  },
  getters: {
    blockHash (state) {
      return sha256(state.previousHash + state.timestamp + state.data + state.nonce).toString()
    }
  },
  mutations: {
    generateGenesisBlock (state) {
      state.previousHash = '0000000000000000000000000000000000000000000000000000000000000000'
      state.timestamp = 1500000000
      state.data = 'Genesis Block'
      state.nonce = 12
    },
    changePreviousHash (state, newHash) {
      state.previousHash = newHash
    },
    changeTimestamp (state, newTimestamp) {
      state.timestamp = parseInt(newTimestamp)
    },
    changeData (state, newData) {
      state.data = newData
    },
    changeNonce (state, newNonce) {
      state.nonce = newNonce
    },
    resetBlock (state) {
      state.previousHash = null
      state.timestamp = null
      state.data = null
      state.nonce = null
    }
  },
  actions: {
    generateGenesisBlock ({ commit }) {
      commit('generateGenesisBlock')
    },
    changePreviousHash ({ commit }, newPreviousHash) {
      commit('changePreviousHash', newPreviousHash)
    },
    changeTimestamp ({ commit }, newTimestamp) {
      commit('changeTimestamp', newTimestamp)
    },
    changeData ({ commit }, newData) {
      commit('changeData', newData)
    },
    changeNonce ({ commit }, newNonce) {
      commit('changeNonce', newNonce)
    },
    resetBlock ({ commit }) {
      commit('resetBlock')
    }
  }
}
