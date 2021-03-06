import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getNftBalance } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  const address = '3N341VEEExcAt9FtSJ7taaUTCgGQpVbGS1Y'

  try {
    const balance = await getNftBalance(address)
    console.log(balance.map(x => x))
  } catch (error) {
    console.log(error)
  }
}

main()
