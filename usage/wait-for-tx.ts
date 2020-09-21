
import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'

const { waitForTx } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  try {
    const r = await waitForTx('B7fJdxWZKvjRZE25J5xg6EnvPNvRytsqGRHArYvrWwUS', 0)
    console.log(r)
  } catch (error) {
    console.log(error.isAxiosError)
    console.log(JSON.stringify(error.toJSON()).replace(/[\r\n]+/g, ' '))
    console.log(error.response.data)
  }
}

main()

