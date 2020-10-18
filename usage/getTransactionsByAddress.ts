
import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'

const { getTransactionsByAddress } = wavesApi(config.mainnet, axiosHttp(axios))

const main = async () => {
  try {
    const r = await getTransactionsByAddress('3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo')
    console.log(r.length)
  } catch (error) {
    console.log(error)
  }
}

main()

