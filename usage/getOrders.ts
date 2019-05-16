import { wavesApi } from '../src'
import axios from 'axios'
import { order, cancelOrder as co } from '@waves/waves-transactions'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getOrderbookPair } = wavesApi(config.testnet, axiosHttp(axios))

export const testingHostSeed = 'a897148d797746499489466437b300aa87d8d2e6066f40448a3860729bca1a5e'

const main = async () => {
  const amountAsset = 'Ck5wtwQXRxTVLhpQnSWFEDQPiSexBY9Egepii6uqkvwX'
  const priceAsset = 'WAVES'

  try {
    const orders = await getOrderbookPair(amountAsset, priceAsset)
    console.log(orders)
  } catch (error) {
    console.log(error)
  }
}

main()
