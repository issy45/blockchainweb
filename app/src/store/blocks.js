export default {
  namespaced: true,
  state: {
    blocks: {},
    orphans: [],
    blockchain: []
  },
  getters: {
    bestBlockHeight (state) {
      return state.blockchain.length
    },
    bestBlockHash (state) {
      return state.blockchain[state.blockchain.length - 1]
    }
  },
  mutations: {
    generateGenesisBLock (state, newBlock) {
      state.blocks[newBlock.hash] = {
        block: {
          previousHash: newBlock.previousHash,
          timestamp: newBlock.timestamp,
          data: newBlock.data,
          nonce: newBlock.nonce
        },
        index: 1
      }
      state.blockchain.push(newBlock.hash)
    },
    addBlock (state, newBlock) {
      const previousBlock = state.blocks[newBlock.previousHash]
      if (previousBlock) {
        const newIndex = previousBlock.index + 1
        state.blocks[newBlock.hash] = {
          block: {
            previousHash: newBlock.previousHash,
            timestamp: newBlock.timestamp,
            data: newBlock.data,
            nonce: newBlock.nonce
          },
          index: newIndex
        }
        if (newIndex > state.blockchain.length) {
          let newHashs = [newBlock.hash]
          let previousHash = newBlock.previousHash
          while (!state.blockchain.includes(previousHash)) {
            newHashs.unshift(previousHash)
            previousHash = state.blocks[previousHash].block.previousHash
          }
          newHashs.unshift(previousHash)
          while (state.blockchain.pop() !== previousHash) {
          }
          newHashs.forEach(function (hash) {
            state.blockchain.push(hash)
          })
        }

        state.orphans.forEach(function (hash) {
          const orphan = this[hash]
          const previousBlock = state.blocks[orphan.previousHash]
          if (previousBlock) {
            state.blocks[hash] = {
              block: {
                previousHash: orphan.previousHash,
                timestamp: orphan.timestamp,
                data: orphan.data,
                nonce: orphan.nonce
              },
              index: previousBlock.index + 1
            }
          }
        }, state.orphans)
      } else {
        state.orphans[newBlock.hash] = {
          previousHash: newBlock.previousHash,
          timestamp: newBlock.timestamp,
          data: newBlock.data,
          nonce: newBlock.nonce
        }
      }
    },
    pushBlockchain (state, blockHash) {
      const targetBlock = state.blocks[blockHash].block
      if (!targetBlock) {
        return
      }

      const bestBlockHash = state.blockchain[state.blockchain.length - 1]
      if (targetBlock.previousHash === bestBlockHash) {
        state.blockchain.push(blockHash)
      }
    }
  },
  actions: {
    generateGenesisBLock ({ commit }, newBlock) {
      commit('generateGenesisBLock', newBlock)
    },
    addBlock ({ commit }, newBlock) {
      commit('addBlock', newBlock)
    },
    pushBlockchain ({ commit }, blockHash) {
      commit('pushBlockchain', blockHash)
    }
  }
}
