import Vue from 'vue'
import App from './App'
import store from '@/store.js'
import VueSocketio from 'vue-socket.io'

Vue.use(VueSocketio, 'http://blockchainweb.landau.jp/socket.io/')

Vue.config.productionTip = false

new Vue({ // eslint-disable-line
  el: '#app',
  components: { App },
  template: '<App/>',
  store
})
