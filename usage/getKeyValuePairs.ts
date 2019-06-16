import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { getKeyValuePairs } = wavesApi(config.testnet, axiosHttp(axios))

const main = async () => {
  const kvp = await getKeyValuePairs('3Mz9N7YPfZPWGd4yYaX6H53Gcgrq6ifYiH7')
  console.log(kvp)
}

main()