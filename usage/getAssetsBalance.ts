import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getAssetsBalance } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  const address = '3N2MUXXWL1Ws9bCAdrR1xoZWKwBAtyaowFH'

  try {
    const balance = await getAssetsBalance(address)
    console.log(balance.balances.map(x => x.issueTransaction))
  } catch (error) {
    console.log(error)
  }
}

main()
