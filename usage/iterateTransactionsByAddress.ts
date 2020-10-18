
import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'
import moment from 'moment'

const { iterateTransactionsByAddress } = wavesApi(config.mainnet, axiosHttp(axios))

const main = async () => {
  try {
    const r = await iterateTransactionsByAddress('3PC9BfRwJWWiw9AREE2B3eWzCks3CYtg4yo', { pageSize: 1000 })
      .takeWithFilter(x => x.timestamp > moment().subtract(2, 'd').valueOf())
      .all()
    console.log(r.length)
  } catch (error) {
    console.log(error)
  }
}

main()

