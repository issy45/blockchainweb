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
          <b-card v-for="(blockHash, index) in blockchain.slice().reverse()" :key="index" no-body class="mb-1">
            <b-card-header header-tag="header" class="p-1" role="tab">
              <b-btn block href="#" v-b-toggle="'accordion' + index" variant="info" class="text-left">{{ blocks[blockHash].block.timestamp }}: {{ blocks[blockHash].block.data }}</b-btn>
            </b-card-header>
            <b-collapse :id="'accordion' + index" accordion="my-accordion" role="tabpanel">
              <b-card-body>
                <p class="card-text">
                  <b>hash:</b> {{ blocks[blockHash].block.previousHash + blocks[blockHash].block.timestamp + blocks[blockHash].block.data + blocks[blockHash].block.nonce | hash }}<br>
                  <b>previousHash:</b> {{ blocks[blockHash].block.previousHash }}<br>
                  <b>timestamp:</b> {{ blocks[blockHash].block.timestamp }}<br>
                  <b>data:</b> {{ blocks[blockHash].block.data }}<br>
                  <b>nonce:</b> {{ blocks[blockHash].block.nonce }}<br>
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
      blocks: this.$store.state.blocks.blocks,
      blockchain: this.$store.state.blocks.blockchain,
      error: ''
    }
  },
  created: function () {
    if (Object.keys(this.blocks).length === 0) {
      this.$store.dispatch('block/generateGenesisBlock')
      const blockHash = sha256(this.previousHash + this.timestamp + this.data + this.nonce).toString()
      this.$store.dispatch('blocks/generateGenesisBLock', {
        previousHash: this.previousHash,
        timestamp: this.timestamp,
        data: this.data,
        nonce: this.nonce,
        hash: blockHash
      })
      this.$store.dispatch('block/resetBlock')
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
    getNodes: function (data) {
      this.nodes = Array.from(new Set(this.nodes.concat(data.nodes)))
    },
    sendBlocks: function (data) {
      let blocks = []
      for (var i = this.blockchain.length - 1; i >= 0; i--) {
        if (this.blockchain[i] === data.latestBlockHash) {
          break
        }
        blocks.unshift(this.blocks[this.blockchain[i]].block)
      }

      this.$socket.emit('sendBlocks', {socketId: data.socketId, blocks: blocks})
    },
    receiveBlocks: function (newBlocks) {
      for (const key of Object.keys(newBlocks)) {
        const block = newBlocks[key]
        if (!block.timestamp || !String(block.timestamp).match(/^\d+/)) {
          return
        }
        const hash = sha256(block.previousHash + block.timestamp + block.data + block.nonce).toString()
        if (!hash.match(/^0/)) {
          return
        }
        block.hash = hash
        this.$store.dispatch('blocks/addBlock', block)
      }
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
      this.$socket.emit('requestBlocks', {socketId: this.selectedNode, latestBlockHash: this.$store.getters['blocks/bestBlockHash']})
    },
    verifyMiningBlock: function (newBlock) {
      const previousBlock = this.blocks[this.blockchain.bestBlockHash]
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
        nonce: this.nonce,
        hash: this.$store.getters['block/blockHash']
      }
      this.verifyMiningBlock(newBlock)
      if (this.error === '') {
        this.$store.dispatch('blocks/addBlock', newBlock)
        this.$store.dispatch('block/resetBlock')
      }
    },
    broadcastBlockHeight: function () {
      this.$socket.emit('broadcastBlockHeight', this.blocks.length)
    },
    broadcast: function () {
      this.$socket.emit('broadcast', this.blocks[this.$store.getters['blocks/bestBlockHash']].block)
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
