import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getMarkets } = wavesApi(config.mainnet, axiosHttp(axios))

const main = async () => {
  try {
    const markets = await getMarkets()
    console.log(markets)
  } catch (error) {
    console.log(error)
  }
}

main()
