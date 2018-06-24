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
            <p v-show="error" class="alert alert-danger">{{ error }}</p>
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
              </tbody>
            </table>
            <p class="text-center">
            ↓
            </p>
            <p class="text-center">
              <span class="pr-3 pl-3 pt-2 pb-2 border border-dark rounded">sha256</span>
            </p>
            <p class="text-center">
            ↓
            </p>
            <p class="alert alert-primary">{{ previousHash + timestamp + data + nonce | hash }}</p>
            <button v-on:click="pushBlock" class="btn btn-warning">Blockchainに追加</button>
            <button v-on:click="broadcast" class="btn btn-danger">Broadcast</button>
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
  sockets: {
    connect: function () {
    },
    customEmit: function (newBlock) {
      this.verifyBlock(newBlock)
      if (this.error === '') {
        this.$store.dispatch('blockchain/pushBlock', newBlock)
        this.$store.dispatch('block/resetBlock')
        this.error = 'だれかがマイニングに成功したのでブロックチェーンが更新されました。'
      }
    }
  },
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
    verifyBlock: function (newBlock) {
      const previousBlock = this.$store.getters['blockchain/latestBlock']
      if (previousBlock) {
        const previousHash = sha256(previousBlock.previousHash + previousBlock.timestamp + previousBlock.data + previousBlock.nonce).toString()
        if (newBlock.previousHash !== previousHash) {
          this.error = 'previousHashには前ブロックのハッシュ値を入れてください。'
          return
        }

        if (!newBlock.timestamp || !newBlock.timestamp.match(/^\d+/)) {
          this.error = 'timestampは数値で入力してください。'
          return
        } else if (newBlock.timestamp <= previousBlock.timestamp) {
          this.error = 'timestampには前ブロックのtimestampより大きい値を入れてください。'
          return
        }
      }

      const newHash = sha256(newBlock.previousHash + newBlock.timestamp + newBlock.data + newBlock.nonce).toString()
      if (!newHash.match(/^0/)) {
        this.error = 'ハッシュ値の先頭１文字が「0」になるようにnonceを調整してください。'
        return
      }

      this.error = ''
    },
    pushBlock: function () {
      const newBlock = {
        previousHash: this.previousHash,
        timestamp: this.timestamp,
        data: this.data,
        nonce: this.nonce
      }
      this.verifyBlock(newBlock)
      if (this.error === '') {
        this.$store.dispatch('blockchain/pushBlock', newBlock)
        this.$store.dispatch('block/resetBlock')
      }
    },
    broadcast: function () {
      this.$socket.emit('broadcast', this.$store.getters['blockchain/latestBlock'])
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