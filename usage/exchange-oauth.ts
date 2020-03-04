import { libs } from '@waves/waves-transactions'
import { base64Encode, stringToBytes } from '@waves/ts-lib-crypto'
import axios from 'axios'

const getSecretToken = async (seed: string) => {
  const publicKey = libs.crypto.publicKey(seed)
  const expires = (new Date().getTime() + 1000 * 60 * 60 * 24)

  const data = Uint8Array.from([
    ...Array.from(libs.marshall.serializePrimitives.BASE58_STRING(publicKey)),
    ...Array.from(libs.marshall.serializePrimitives.LONG(expires)),
  ]);

  try {
    
  const r = await axios.post('https://waves.exchange/oauth/token',
    `grant_type=password&username=${publicKey}&password=${expires}:${libs.crypto.signBytes(seed, data)}&scope=client`,
    {
      headers: {
        "Authorization": `Basic ${base64Encode(stringToBytes("test-client:secret"))}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
    })
  
    console.log(r.data.access_token)
    
  } catch (error) {
    console.log(error)
  }

}

getSecretToken("seeeeeeed")
