import { wavesApi } from '../src'
import axios from 'axios'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'

const { stateChanges } = wavesApi(config.local, axiosHttp(axios))

const main = async () => {
  const r = await stateChanges('6QL24kZ8MVs7CMZe2jdcmMogPk6qKEVxgWf8SpfHKg1x')
  console.log(r)
}

main()