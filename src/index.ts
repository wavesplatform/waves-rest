import {
  BaseParams,
  GetDataTxsParams,
  DataTransaction,
  GetMassTransferTxsParams,
  MassTransferTransaction,
  GetTransferTxsParams,
  TransferTransaction,
  GetIssueTxsParams,
  GetInvokeScriptTxsParams,
  IssueTransaction,
  TxWithIdAndSender,
  SetScriptTransaction,
  Order,
  defaultSort,
  OrderbookPair,
  GetAssetsBalanceResponse,
  Distribution,
  AssetInfo,
  PairsResponse,
  IScriptInfo,
  IScriptDecompileResult,
  GetNftBalanceResponse,
  GetMarketsResponse,
  GetBalanceDetailsResponse,
  InvokeScriptTransaction,
  GetSetScriptTxsParams,
  KeyValuePair,
  PagingOptions,
  StateChanges,
  DepositInfo,
  GetAssetBalanceResponse
} from './types'

export {
  BaseParams,
  GetDataTxsParams,
  DataTransaction,
  GetMassTransferTxsParams,
  MassTransferTransaction,
  GetTransferTxsParams,
  TransferTransaction,
  GetIssueTxsParams,
  IssueTransaction,
  TxWithIdAndSender,
  SetScriptTransaction,
  Order,
  defaultLimit,
  defaultSort,
  OrderbookPair,
  GetAssetsBalanceResponse as GetAssetsBalanceParams,
  Distribution,
  AssetInfo
} from './types'

import { TTx, IOrder, ICancelOrder } from '@waves/waves-transactions'
import { IApiConfig } from './config'
import { IHttp } from './http-bindings'
import { address } from '@waves/ts-lib-crypto'
export { IHttp, axiosHttp, apolloHttp } from './http-bindings'
export * from './config'
export * from './well-known-tokens'

export const delay = (millis: number): Promise<{}> => new Promise((resolve, _) => setTimeout(resolve, millis))

const wrapError = (error: any) => {
  let er
  if (error && error.response && error.response.data) {
    switch (error.response.data.error) {
      case 112:
        er = {
          code: 112,
          message: error.response.data.message,
          tx: error.response.data.tx,
        }
        break
      case 199: //script too lagre
        er = {
          code: 199,
          message: error.response.data.message,
        }
        break
      case 306: //error while executing
        er = {
          code: 306,
          message: error.response.data.message,
          tx: error.response.data.transaction,
          trace: error.response.data.trace,
        }
        if (error.response.data.vars) {
          (<any>er).vars = error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], [])
        }
        break
      case 307: //not allowed by account script
        er = {
          code: 307,
          message: error.response.data.message,
          tx: error.response.data.transaction,
          trace: error.response.data.trace,
        }
        if (error.response.data.vars) {
          (<any>er).vars = error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], [])
        }
        break
      default:
        er = error
    }

    return er
  }
}

export const retry = async <T>(action: () => Promise<T>, limit: number, delayAfterFail: number): Promise<T> => {
  try {
    return await action()
  } catch (error) {
    const er = wrapError(error)
    if (er && er.code) throw er
    if (limit < 1) throw er
  }

  await delay(delayAfterFail)
  return await retry(action, limit - 1, delayAfterFail)
}

export type ApiIterable<T> = AsyncIterable<{ lastCursor: string, items: T[] }> & { first: () => Promise<{ lastCursor: string, items: T[] }>; take: (count: number) => AsyncIterableIterator<{ lastCursor: string, items: T[] }>, all: () => Promise<T[]> }

export const wavesApi = (config: IApiConfig, h: IHttp): IWavesApi => {
  const http = {
    get: <T>(url: string): Promise<T> =>
      h.get(url),
    post: <T>(url: string, data: any): Promise<T> =>
      h.post(url, data),
  }

  const defaultLimit = config.chainId === 'W' ? 1000 : 10000

  const httpCall = <T>(base: string, endpoint: string, data?: any) =>
    retry(() => (data ? http.post<T>(base + endpoint, data) : http.get<T>(base + endpoint)), 5, 1000)

  const noEnpoint = <T>(): Promise<T> => {
    throw new Error(`Endpoint is not awailable in chain with ID: ${config.chainId}`)
  }

  const build = (base?: string) => ({
    get: <T>(endpoint: string): Promise<T> => base ? httpCall(base, endpoint) : noEnpoint<T>(),
    post: <T>(endpoint: string, data: any): Promise<T> => base ? httpCall(base, endpoint, data) : noEnpoint<T>(),
  })

  const node = build(config.nodes)
  const api = build(config.api)
  const matcher = build(config.matcher)
  const gateways = build(config.gateways)

  // const p = (args: BaseParams) =>
  //   Object.entries({ ...args, limit: args.limit || defaultLimit, sort: args.sort || defaultSort })
  //     .map(x => (x[1] !== undefined ? `${x[0]}=${x[1]}` : undefined))
  //     .filter(x => x !== undefined)
  //     .join('&')

  const asyncIterator = <T extends { lastCursor: string }>(fetch: (lastCursor?: string) => Promise<T>) => <R>(
    map: (value: T) => { lastCursor: string, items: R[] }
  ) => (options?: { initialCursor?: string; pageLimit?: number }): ApiIterable<R> => {
    let cursor = options && options.initialCursor
    let pageCount = 0

    async function* createIterator() {
      do {
        const data = await fetch(cursor)

        yield map(data)
        cursor = data.lastCursor
        pageCount++
      } while (cursor && pageCount < ((options && options!.pageLimit) || Number.MAX_SAFE_INTEGER))
    }

    const iterator = createIterator()

    async function* take<T>(iterator: AsyncIterableIterator<T>, count: number) {
      let take = 0
      do {
        const data = await iterator.next()
        yield data.value
        take++
      } while (take < count)
    }

    const enchanceIterator = (iterator: AsyncIterableIterator<{ lastCursor: string, items: R[] }>) => ({
      ...iterator,
      first: () => iterator.next().then(x => x.value),
      take: (count: number) => enchanceIterator(take(iterator, count)),
      all: async () => {
        const all: R[][] = []
        for await (const i of iterator) {
          all.push(i.items)
        }
        return all.reduce((a, b) => [...a, ...b], [])
      },
    })

    return enchanceIterator(iterator)
  }

  type ApiListReponse<T> = { lastCursor: string; data: { data: T }[] }

  const buildEndpoint = <TParams extends BaseParams, T>(url: string) => (params: TParams, options?: PagingOptions) =>
    asyncIterator<ApiListReponse<T>>((lastCursor?: string) =>
      api.post<ApiListReponse<T>>(url, { ...params, after: lastCursor })
    )(x => ({ lastCursor: x.lastCursor, items: x.data.map(y => y.data) }))(options)

  const getDataTxs = buildEndpoint<GetDataTxsParams, DataTransaction>('transactions/data?')
  const getMassTransfersTxs = buildEndpoint<GetMassTransferTxsParams, MassTransferTransaction>(
    'transactions/mass-transfer?'
  )
  const getTransfersTxs = buildEndpoint<GetTransferTxsParams, TransferTransaction>('transactions/transfer?')

  const getIssueTxs = buildEndpoint<GetIssueTxsParams, IssueTransaction>('transactions/issue?')

  const getInvokeScriptTxs = buildEndpoint<GetInvokeScriptTxsParams, InvokeScriptTransaction>('transactions/invoke-script?')

  const getSetScriptTxs = buildEndpoint<GetSetScriptTxsParams, SetScriptTransaction>('transactions/set-script?')

  const getHeight = async () => node.get<{ height: number }>('blocks/last').then(x => x.height)

  const getTxById = async (txId: string): Promise<TxWithIdAndSender> =>
    node.get<TxWithIdAndSender>(`transactions/info/${txId}`)

  const getUtxById = async (txId: string): Promise<TxWithIdAndSender> =>
    node.get<TxWithIdAndSender>(`transactions/unconfirmed/info/${txId}`)

  const broadcast = async (tx: TTx): Promise<TxWithIdAndSender> =>
    node.post<TxWithIdAndSender>('transactions/broadcast', tx)

  const waitForTx = async (txId: string): Promise<TxWithIdAndSender> => retry(async () => getTxById(txId), 999, 1000)

  const getTxsByAddress = async (address: string, limit: number = 100): Promise<TxWithIdAndSender[]> =>
    node.get<TxWithIdAndSender[][]>(`transactions/address/${address}/limit/${limit}`).then(x => x[0])

  const broadcastAndWait = async (tx: TxWithIdAndSender): Promise<TxWithIdAndSender> =>
    broadcast(tx).then(x => waitForTx(x.id))

  const getAssetDistribution = async (assetId: string, height?: number, limit: number = 999): Promise<Distribution> =>
    node.get<Distribution>(`assets/${assetId}/distribution/${height || await getHeight() - 1}/limit/${limit}`)

  const getAssetInfo = async (assetId: string): Promise<AssetInfo> =>
    node.get<AssetInfo>(`assets/details/${assetId}`)

  const stateChanges = async (txId: string): Promise<StateChanges> =>
    node.get<StateChanges>(`debug/stateChanges/info/${txId}`)

  const getUtx = (): Promise<TxWithIdAndSender[]> => node.get<TxWithIdAndSender[]>('transactions/unconfirmed')

  const getBalance = (address: string): Promise<number> =>
    node.get<{ available: number }>(`addresses/balance/details/${address}`).then(x => x.available)

  const getBalanceDetails = (address: string): Promise<GetBalanceDetailsResponse> =>
    node.get(`addresses/balance/details/${address}`)

  const getAssetsBalance = (address: string): Promise<GetAssetsBalanceResponse> => node.get(`assets/balance/${address}`)

  const getAssetBalance = (address: string, assetId: string): Promise<GetAssetBalanceResponse> => node.get(`assets/balance/${address}/${assetId}`)

  const getNftBalance = (address: string, limit: number = defaultLimit): Promise<GetNftBalanceResponse> => node.get(`assets/nft/${address}/limit/${limit}`)

  const waitForHeight = (height: number): Promise<number> =>
    retry(
      async () => {
        const h = await getHeight()
        if (h < height) throw 'Still waiting'
        return h
      },
      999,
      5000
    )

  const getOrderbookPair = async (amountAsset: string, priceAsset: string): Promise<OrderbookPair> =>
    matcher.get<OrderbookPair>(`orderbook/${amountAsset}/${priceAsset}`)

  const placeOrder = async (order: IOrder) =>
    matcher.post<{ message: Order }>('orderbook', order).then(x => x.message)

  const cancelOrder = async (amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder) =>
    matcher.post<void>(`orderbook/${amountAsset}/${priceAsset}/cancel`, cancelOrder)

  const getKeyValuePairs = (address: string): Promise<KeyValuePair[]> =>
    node.get<KeyValuePair[]>(`addresses/data/${address}`).then(x => x.map(({ type, value, key }) => ({ type, key, value: value.toString() })))

  const getValueByKey = (address: string, key: string): Promise<KeyValuePair> =>
    node.get<KeyValuePair>(`addresses/data/${address}/${key}`)

  const getWavesExchangeRate = (to: 'btc' | 'usd'): Promise<number> => {
    const map = {
      btc: '8LQW8f7P5d5PZM7GtZEBgaqRPGSzS3DfPuiXrURJ4AJS',
      usd: 'Ft8X1v1LTa1ABafufpaCWyVj8KkaxUWE6xBhW6sNFJck',
    }
    const matcherAddress = address({ publicKey: config.matcherPublicKey }, config.chainId)
    const amountAsset = 'WAVES'
    const priceAsset = map[to]

    return api.get<any>(`matcher/${matcherAddress}/pairs/${amountAsset}/${priceAsset}`)
      .then(x => x.data as PairsResponse)
      .then(x => x.lastPrice)
  }

  const getMarkets = () =>
    matcher.get<GetMarketsResponse>('orderbook')

  const getScriptInfo = (address: string): Promise<IScriptInfo> =>
    node.get<IScriptInfo>(`addresses/scriptInfo/${address}`)

  const decompileScript = (scriptBinary: string) =>
    node.post<IScriptDecompileResult>('utils/script/decompile', scriptBinary)

  const getDepositInfo = (userAddress: string, assetId: string) =>
    gateways.post<DepositInfo>('external/deposit', { userAddress, assetId })

  return Object.freeze({

    //height
    getHeight,
    waitForHeight,

    //txs
    getTxById,
    waitForTx,
    getUtx,
    getUtxById,
    getTxsByAddress,

    //txs filters
    getTransfersTxs,
    getIssueTxs,
    getMassTransfersTxs,
    getDataTxs,
    getInvokeScriptTxs,
    getSetScriptTxs,

    //data
    getKeyValuePairs,
    getValueByKey,

    //balance
    getBalance,
    getBalanceDetails,

    //assets
    getAssetDistribution,
    getAssetsBalance,
    getAssetBalance,
    getAssetInfo,
    getNftBalance,

    //scripts
    getScriptInfo,
    decompileScript,
    stateChanges,


    //matcher
    placeOrder,
    cancelOrder,
    getOrderbookPair,
    getWavesExchangeRate,
    getMarkets,

    //gateways
    getDepositInfo,

    //broadcast
    broadcast,
    broadcastAndWait,

    config,
  })
}

export interface IWavesApi {

  //height
  getHeight(): Promise<number>
  waitForHeight(height: number): Promise<number>

  //txs
  getTxById(txId: string): Promise<TxWithIdAndSender>
  waitForTx(txId: string): Promise<TxWithIdAndSender>
  getUtx(): Promise<TxWithIdAndSender[]>
  getUtxById(txId: string): Promise<TxWithIdAndSender>
  getTxsByAddress(address: string, limit?: number): Promise<TxWithIdAndSender[]>

  //txs filters
  getTransfersTxs(params: GetTransferTxsParams, options?: PagingOptions): ApiIterable<TransferTransaction>
  getIssueTxs(params: GetIssueTxsParams, options?: PagingOptions): ApiIterable<IssueTransaction>
  getMassTransfersTxs(params: GetMassTransferTxsParams, options?: PagingOptions): ApiIterable<MassTransferTransaction>
  getDataTxs(params: GetDataTxsParams, options?: PagingOptions): ApiIterable<DataTransaction>
  getInvokeScriptTxs(params: GetInvokeScriptTxsParams, options?: PagingOptions): ApiIterable<InvokeScriptTransaction>
  getSetScriptTxs(params: GetSetScriptTxsParams, options?: PagingOptions): ApiIterable<SetScriptTransaction>

  //data
  getKeyValuePairs(address: string): Promise<KeyValuePair[]>
  getValueByKey(address: string, key: string): Promise<KeyValuePair>

  //balance
  getBalance(address: string): Promise<number>
  getBalanceDetails(address: string): Promise<GetBalanceDetailsResponse>

  //assets
  getAssetDistribution(assetId: string, height?: number, limit?: number): Promise<Distribution>
  getAssetsBalance(address: string): Promise<GetAssetsBalanceResponse>
  getAssetBalance(address: string, assetId: string): Promise<GetAssetBalanceResponse>
  getAssetInfo(assetId: string): Promise<AssetInfo>
  getNftBalance(address: string): Promise<GetNftBalanceResponse>

  //scripts
  getScriptInfo(address: string): Promise<IScriptInfo>
  decompileScript(scriptBinary: string): Promise<IScriptDecompileResult>
  stateChanges(txId: string): Promise<StateChanges>

  //matcher
  placeOrder(order: IOrder): Promise<Order>
  cancelOrder(amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder): Promise<void>
  getOrderbookPair(amountAsset: string, priceAsset: string): Promise<OrderbookPair>
  getWavesExchangeRate(to: 'btc' | 'usd'): Promise<number>
  getMarkets(): Promise<GetMarketsResponse>

  //gateways
  getDepositInfo(userAddress: string, assetId: string): Promise<DepositInfo>

  //broadcast
  broadcast(tx: TTx): Promise<TxWithIdAndSender>
  broadcastAndWait(tx: TTx): Promise<TxWithIdAndSender>

  config: IApiConfig
}

