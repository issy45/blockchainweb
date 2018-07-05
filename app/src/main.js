import Vue from 'vue'
import App from './App'
import store from '@/store.js'
import BootstrapVue from 'bootstrap-vue'
import VueSocketio from 'vue-socket.io'

Vue.use(BootstrapVue)
Vue.use(VueSocketio, 'http://blockchainweb.landau.jp/')

Vue.config.productionTip = false

new Vue({ // eslint-disable-line
  el: '#app',
  components: { App },
  template: '<App/>',
  store
})
