import 'babel-polyfill'
import Vuex from 'vuex'
import Vue from 'vue'
import block from '@/store/block.js'
import blocks from '@/store/blocks.js'

Vue.use(Vuex)

const store = new Vuex.Store({
  modules: {
    block,
    blocks
  }
})

export default store
