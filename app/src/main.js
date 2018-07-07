import Vue from 'vue'
import App from './App'
import store from '@/store.js'
import BootstrapVue from 'bootstrap-vue'
import VueSocketio from 'vue-socket.io'

Vue.use(BootstrapVue)
Vue.use(VueSocketio, process.env.SOCKET_HOST)

Vue.config.productionTip = process.env.NODE_ENV === 'production'

new Vue({ // eslint-disable-line
  el: '#app',
  components: { App },
  template: '<App/>',
  store
})
