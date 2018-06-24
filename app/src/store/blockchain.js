export default {
  namespaced: true,
  state: {
    blocks: []
  },
  getters: {
    latestBlock (state) { return state.blocks[state.blocks.length - 1] }
  },
  mutations: {
    pushBlock (state, newBlock) {
      state.blocks.push({
        previousHash: newBlock.previousHash,
        timestamp: newBlock.timestamp,
        data: newBlock.data,
        nonce: newBlock.nonce
      })
    }
  },
  actions: {
    pushBlock ({ commit }, newBlock) {
      commit('pushBlock', newBlock)
    }
  }
}
