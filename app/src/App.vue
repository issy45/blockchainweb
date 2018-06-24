<template>
  <div id="app" class="container">
    <div v-if="blocks.length > 0" class="row">
      <div class="col-md-6">
        <ul class="list-group">
          <li v-for="(block, index) in blocks" :key="index" class="list-group-item">
            previousHash: {{ block.previousHash }}<br>
            timestamp: {{ block.timestamp }}<br>
            data: {{ block.data }}<br>
            nonce: {{ block.nonce }}<br>
            hash: {{ block.previousHash + block.timestamp + block.data + block.nonce | hash }}
          </li>
        </ul>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Mining
          </div>
          <div class="card-body">
            <table class="table table-bordered">
              <tbody>
                <tr>
                  <th width="120">previousHash</th>
                  <td><input type="text" v-model="previousHash" class="form-control"></td>
                </tr>
                <tr>
                  <th>timestamp</th>
                  <td><input type="text" v-model="timestamp" class="form-control"></td>
                </tr>
                <tr>
                  <th>data</th>
                  <td><input type="text" v-model="data" class="form-control"></td>
                </tr>
                <tr>
                  <th>nonce</th>
                  <td><input type="text" v-model="nonce" class="form-control"></td>
                </tr>
                <tr>
                  <td colspan="2">
                    {{ previousHash + timestamp + data + nonce | hash }}
                  </td>
                </tr>
              </tbody>
            </table>
            <p v-show="error" class="alert alert-danger">{{ error }}</p>
            <button v-on:click="pushBlock" class="btn btn-warning">Blockchainに追加</button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="row">
      <button v-on:click="startBlockchain" class="btn btn-warning">start Blockchain</button>
    </div>
  </div>
</template>

<script>

import sha256 from 'crypto-js/sha256'

export default {
  name: 'App',
  data: function () {
    return {
      blocks: this.$store.state.blockchain.blocks,
      error: ''
    }
  },
  methods: {
    startBlockchain: function () {
      this.$store.dispatch('block/generateGenesisBlock')
      this.$store.dispatch('blockchain/pushBlock', {
        previousHash: this.previousHash,
        timestamp: this.timestamp,
        data: this.data,
        nonce: this.nonce
      })
      this.$store.dispatch('block/resetBlock')
    },
    verifyBlock: function () {
      const previousBlock = this.$store.getters['blockchain/latestBlock']
      if (previousBlock) {
        const previousHash = sha256(previousBlock.previousHash + previousBlock.timestamp + previousBlock.data + previousBlock.nonce).toString()
        if (this.previousHash !== previousHash) {
          this.error = 'previousHashには前ブロックのハッシュ値を入れてください。'
          return
        }

        if (!this.timestamp || !this.timestamp.match(/^\d+/)) {
          this.error = 'timestampは数値で入力してください。'
          return
        } else if (this.timestamp <= previousBlock.timestamp) {
          this.error = 'timestampには前ブロックのtimestampより大きい値を入れてください。'
          return
        }
      }

      const newHash = sha256(this.previousHash + this.timestamp + this.data + this.nonce).toString()
      if (!newHash.match(/^0/)) {
        this.error = 'ハッシュ値の先頭１文字が「0」になるようにnonceを調整してください。'
        return
      }

      this.error = ''
    },
    pushBlock: function () {
      this.verifyBlock()
      if (this.error === '') {
        this.$store.dispatch('blockchain/pushBlock', {
          previousHash: this.previousHash,
          timestamp: this.timestamp,
          data: this.data,
          nonce: this.nonce
        })
        this.$store.dispatch('block/resetBlock')
      }
    }
  },
  computed: {
    previousHash: {
      get () { return this.$store.state.block.previousHash },
      set (value) { this.$store.dispatch('block/changePreviousHash', value) }
    },
    timestamp: {
      get () { return this.$store.state.block.timestamp },
      set (value) { this.$store.dispatch('block/changeTimestamp', value) }
    },
    data: {
      get () { return this.$store.state.block.data },
      set (value) { this.$store.dispatch('block/changeData', value) }
    },
    nonce: {
      get () { return this.$store.state.block.nonce },
      set (value) { this.$store.dispatch('block/changeNonce', value) }
    }
  },
  filters: {
    hash: function (value) {
      return sha256(value).toString()
    }
  }
}
</script>

<style>
.container {
  width: auto;
  max-width: 100%;
}
</style>
