import Vue from 'vue'
import App from './App'
import store from '@/store.js'

Vue.config.productionTip = false

new Vue({ // eslint-disable-line
  el: '#app',
  components: { App },
  template: '<App/>',
  store
})
