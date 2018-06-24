import 'babel-polyfill'
import Vuex from 'vuex'
import Vue from 'vue'
import block from '@/store/block.js'
import blockchain from '@/store/blockchain.js'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    block,
    blockchain
  }
})

export default store
