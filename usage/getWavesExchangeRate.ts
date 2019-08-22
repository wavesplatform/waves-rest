import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getWavesExchangeRate } = wavesApi(config.stage, axiosHttp(axios))

const main = async () => {
  try {
    const rate = await getWavesExchangeRate('btc')
    console.log(rate)
  } catch (error) {
    console.log(error)
  }
}

main()
