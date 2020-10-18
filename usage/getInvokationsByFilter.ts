
import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'
import moment from 'moment'

const { getInvokeScriptTxs } = wavesApi(config.mainnet, axiosHttp(axios))

const main = async () => {
  try {

    const result = await getInvokeScriptTxs({ dapp: '3P9ZegsKUtsEpdRPNVrMH7nHEEqY5MrmjDp' })
      .takeWhile(p => p.items.every(x =>
        moment(x.timestamp).valueOf() > moment().subtract(4, 'h').valueOf()
      )).all()

    console.log(result.length)

  } catch (error) {
    console.log(error)
  }
}

main()

