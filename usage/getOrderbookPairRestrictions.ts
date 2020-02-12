import { wavesApi, wellKnownTokens } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getOrderbookPairRestrictions } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  try {
    const restrictions = await getOrderbookPairRestrictions('WAVES', wellKnownTokens.testnet.btc.id)

    console.log(restrictions)
  } catch (error) {
    console.log(error)
  }
}

main()
