import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getInvokeScriptTxs, stateChanges } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  let last = ''
  // try {
  //   const iterator = await getInvokeScriptTxs({ function: 'buyOutcomeToken' })

  //   for await (const { lastCursor, items } of iterator.take(10)) {
  //     /// items 
  //     last = lastCursor
  //     console.log(items)
  //   }
  // } catch (error) {
  //   console.log(error)
  // }

  try {
    const iterator = await getInvokeScriptTxs({ function: 'buyOutcomeToken', sort: 'asc' })
    const all = await iterator.all()
    console.log(all.length)

    const timeStart = all[3].timestamp
    const a = new Date(all[0].timestamp).valueOf()
    const b = new Date(all[1].timestamp).valueOf()
    console.log(a < b)

    const items = await getInvokeScriptTxs({ function: 'buyOutcomeToken', timeStart: <any>timeStart, sort: 'asc', limit:1  }).all()
    console.log(items.length)

  } catch (error) {
    console.log(error)
  }


}

main()
