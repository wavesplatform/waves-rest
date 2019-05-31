import { wavesApi } from '../src'
import { config } from '../src/config'
import { axiosHttp } from '../src/http-bindings'
import axios from 'axios'

const { getAssetDistribution } = wavesApi(config.mainnet, axiosHttp(axios))


const main = async () => {
  try {
    const r = await getAssetDistribution('FwWNdStQo2roM1S6EDAL6UiycLMYsWEqEHBp5DEiNenm')
    console.log(r)
  } catch (error) {
    console.log(error)
  }
}

main()

