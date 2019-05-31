import { wavesApi } from '../src'
import { config } from '../src/config'
import axios from 'axios'
import { axiosHttp } from '../src/http-bindings'
import { TTx } from '@waves/waves-transactions'
import { writeFileSync } from 'fs'
import path, { dirname } from 'path'
import { TRANSACTION_TYPE } from '@waves/waves-transactions/dist/transactions'

const test = async () => {

  const { getHeight } = wavesApi(config.mainnet, axiosHttp(axios))

  const all: TTx[][] = []

  let h = await getHeight()
  const blocksCount = 60 * 24 * 4
  const totalBatches = (blocksCount % 99)
  console.log(`Total batches: ${totalBatches}`)
  let ch = h - 99 * totalBatches
  let i = 1
  while (ch < h) {
    // const txs = await getTxsFromBlocks(ch, ch + 99)
    // ch += 99
    // console.log(`Batch ${i++} saved`)
    // all.push(txs)
  }

  const txs = all.reduce((a, b) => [...a, ...b], [])

  const filter = txs.filter(x => x.type == TRANSACTION_TYPE.TRANSFER && x.amount > 100000000 * 1000 * 10 && !x.assetId)
  writeFileSync(path.join(__dirname, 'largeTxs.json'), JSON.stringify(filter), { encoding: 'utf8' })

  //All chunks (continue fetching chuncks)
  //for await (const chunk of chunks) {
  //  console.log(chunk.map(x => x.timestamp))
  //}

}

test()