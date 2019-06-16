import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'

const { getWavesExchangeRate } = wavesApi(config.mainnet, axiosHttp(axios))


const main = async () => {
  try {
    const r = await getWavesExchangeRate('usd')
    console.log(r)
  } catch (error) {
    console.log(error)
  }
}

main()

