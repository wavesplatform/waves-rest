import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getInvokeScriptTxs, stateChanges } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  let last = ''
  try {
    const iterator = await getInvokeScriptTxs({})

    for await (const { lastCursor, items } of iterator.take(10)) {

      /// items 
      last = lastCursor
      console.log(items[0].id)
    }
  } catch (error) {
    console.log(error)
  }

  try {
    const iterator = await getInvokeScriptTxs({}, { initialCursor: last })
    const all = await iterator.all()
    console.log(all)
  } catch (error) {
    console.log(error)
  }


}

main()
