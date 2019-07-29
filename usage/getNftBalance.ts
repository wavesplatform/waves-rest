import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getNftBalance } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  const address = '3N4XQDFXBw86EzPy8814GiE1v2tXbKusQiH'

  try {
    const balance = await getNftBalance(address)
    console.log(balance)
  } catch (error) {
    console.log(error)
  }
}

main()
