<template>
  <div id="app" class="container">
    <div class="row mb-4">
      <div v-if="status === 1" class="col-md-12">
        <button v-on:click="connectNodes" class="btn btn-primary">①ノードを探す</button>
      </div>
      <div v-else class="col-md-12">
        稼働中の他ノード：
        <span v-if="nodes != null && nodes.length == 0">なし</span>
        <button v-for="(node, index) in nodes" :key="index" v-on:click="selectNode(node)" class="btn btn-primary" v-bind:class="{ disabled: node == selectedNode }">Node: {{ node | nodeName }}</button>
      </div>
    </div>
    <div class="row">
      <div class="col-md-6">
        <div class="mb-4">
          <button v-on:click="requestBlocks" class="btn btn-warning">選択したノードからブロックをもらう</button>
          <button v-on:click="broadcast" class="btn btn-danger">全ノードにブロックを送る</button>
        </div>
        <div>
          <b-card v-for="(block, index) in blocks.slice().reverse()" :key="index" no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-btn block href="#" v-b-toggle="'accordion' + index" variant="info" class="text-left">{{ block.timestamp }}: {{ block.data }}</b-btn>
            </b-card-header>
            <b-collapse :id="'accordion' + index" accordion="my-accordion" role="tabpanel">
              <b-card-body>
                <p class="card-text">
                  <b>hash:</b> {{ block.previousHash + block.timestamp + block.data + block.nonce | hash }}<br>
                  <b>previousHash:</b> {{ block.previousHash }}<br>
                  <b>timestamp:</b> {{ block.timestamp }}<br>
                  <b>data:</b> {{ block.data }}<br>
                  <b>nonce:</b> {{ block.nonce }}<br>
                </p>
              </b-card-body>
            </b-collapse>
          </b-card>
        </div>
      </div>
      <div class="col-md-6">
        <div class="card">
          <div class="card-header">
            Mining（sha256ハッシュの先頭１文字が０になるnonceを探しましょう。）
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
              <span class="pr-3 pl-3 pt-2 pb-2 border border-dark rounded">sha256( previousHash + timestamp + data + nonce )</span>
            </p>
            <p class="text-center">
            ↓
            </p>
            <p class="alert alert-primary">{{ previousHash + timestamp + data + nonce | hash }}</p>
            <button v-on:click="pushBlock" class="btn btn-warning">Blockchainに追加</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

import sha256 from 'crypto-js/sha256'

export default {
  name: 'App',
  data: function () {
    return {
      status: 1,
      socketId: null,
      nodes: [],
      selectedNode: null,
      blocks: this.$store.state.blockchain.blocks,
      error: ''
    }
  },
  sockets: {
    connect: function () {
    },
    disconnectNode: function (socketId) {
      for (let i = 0; i < this.nodes.length; i++) {
        if (this.nodes[i] === socketId) {
          this.nodes.splice(i--, 1)
        }
        if (this.selectedNode === socketId) {
          this.selectedNode = null
        }
      }
    },
    socketId: function (data) {
      this.socketId = data.socketId
    },
    nodes: function (data) {
      this.nodes = Array.from(new Set(this.nodes.concat(data.nodes)))
    },
    sendBlocks: function (data) {
      this.$socket.emit('sendBlocks', {socketId: data.socketId, blocks: this.blocks.slice(data.blockHeight)})
    },
    receiveBlocks: function (newBlocks) {
      for (const key of Object.keys(newBlocks)) {
        const block = newBlocks[key]
        this.verifyBlock(block)
        if (this.error === '') {
          this.$store.dispatch('blockchain/pushBlock', block)
          this.$store.dispatch('block/resetBlock')
          this.error = 'だれかがマイニングに成功したのでブロックチェーンが更新されました。'
        }
      }
    }
  },
  created: function () {
    if (this.blocks.length === 0) {
      this.$store.dispatch('block/generateGenesisBlock')
      this.$store.dispatch('blockchain/pushBlock', {
        previousHash: this.previousHash,
        timestamp: this.timestamp,
        data: this.data,
        nonce: this.nonce
      })
      this.$store.dispatch('block/resetBlock')
    }
  },
  methods: {
    connectNodes: function () {
      this.$socket.emit('nodes')
      this.status = 2
    },
    selectNode: function (node) {
      this.selectedNode = node
    },
    requestBlocks: function () {
      this.$socket.emit('requestBlocks', {socketId: this.selectedNode, blockHeight: this.blocks.length})
    },
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
    },
    nodeName: function (value) {
      console.log(value)
      return value.slice(0, 3)
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
