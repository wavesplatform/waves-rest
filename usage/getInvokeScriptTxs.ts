import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getInvokeScriptTxs } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  try {
    const r = await getInvokeScriptTxs({ sender: '3N7zQyPsFcxZWWnyX1HCXgqisByKHAKrUYJ' }).first()
    console.log(r)
  } catch (error) {
    console.log(error)
  }
}

main()
