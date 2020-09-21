
import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'

const { getTransactionsByAddress } = wavesApi(config.mainnet, axiosHttp(axios))

const main = async () => {
  try {
    const r = await getTransactionsByAddress('3PNikM6yp4NqcSU8guxQtmR5onr2D4e8yTJ', 1)
    console.log(r)
  } catch (error) {
    console.log(error)
  }
}

main()

