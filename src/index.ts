import {
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
  GetAssetsBalanceParams,
  Distribution,
  AssetInfo
} from './types'
import { TTx, IOrder, ICancelOrder } from '@waves/waves-transactions'
import { IApiConfig } from './config'
import { IHttp } from './http-bindings'

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
          vars: error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], []),
        }
        break
      case 307: //not allowed by account script
        er = {
          code: 307,
          message: error.response.data.message,
          tx: error.response.data.transaction,
          vars: error.response.data.vars.reduce((a: [], b: []) => [...a, ...b], []),
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

export type ApiIterable<T> = AsyncIterable<T[]> & { first: () => Promise<T[]>; all: () => Promise<T[]> }

export const wavesApi = (config: IApiConfig, h: IHttp): IWavesApi => {
  const http = {
    get: <T>(url: string): Promise<T> => {
      return h.get(url)
    },
    post: <T>(url: string, data: any): Promise<T> => {
      return h.post(url, data)
    },
  }

  const httpCall = <T>(base: string, endpoint: string, data?: any) =>
    retry(() => (data ? http.post<T>(base + endpoint, data) : http.get<T>(base + endpoint)), 5, 1000)

  const build = (base: string) => ({
    get: <T>(endpoint: string): Promise<T> => httpCall(base, endpoint),
    post: <T>(endpoint: string, data: any): Promise<T> => httpCall(base, endpoint, data),
  })

  const node = build(config.nodes)
  const api = build(config.api)
  const matcher = build(config.matcher)

  const p = (args: BaseParams) =>
    Object.entries({ ...args, limit: args.limit || defaultLimit, sort: args.sort || defaultSort })
      .map(x => (x[1] !== undefined ? `${x[0]}=${x[1]}` : undefined))
      .filter(x => x !== undefined)
      .join('&')

  const asyncIterator = <T extends { lastCursor: string }>(fetch: (lastCursor?: string) => Promise<T>) => <R>(
    map: (value: T) => R[]
  ) => (options?: { initialCursor?: string; pageLimit?: number }): ApiIterable<R> => {
    let cursor = options && options.initialCursor
    let pageCount = 0

    async function* asyncIterator() {
      do {
        const data = await fetch(cursor)
        yield map(data)
        cursor = data.lastCursor
        pageCount++
      } while (cursor && pageCount < ((options && options!.pageLimit) || Number.MAX_SAFE_INTEGER))
    }

    const iterator = asyncIterator()

    return {
      ...iterator,
      first: () =>
        iterator[Symbol.asyncIterator]()
          .next()
          .then(x => x.value),
      all: async () => {
        const all: R[][] = []
        for await (const i of iterator) {
          all.push(i)
        }
        return all.reduce((a, b) => [...a, ...b], [])
      },
    }
  }

  type ApiListReponse<T> = { lastCursor: string; data: { data: T }[] }

  const buildEndpoint = <TParams extends BaseParams, T>(url: string) => (params: TParams, options?: PagingOptions) =>
    asyncIterator<ApiListReponse<T>>((lastCursor?: string) =>
      api.post<ApiListReponse<T>>(url, { ...params, after: lastCursor })
    )(x => x.data.map(y => y.data))(options)

  const getDataTxs = buildEndpoint<GetDataTxsParams, DataTransaction>('transactions/data?')
  const getMassTransfersTxs = buildEndpoint<GetMassTransferTxsParams, MassTransferTransaction>(
    'transactions/mass-transfer?'
  )
  const getTransfersTxs = buildEndpoint<GetTransferTxsParams, TransferTransaction>('transactions/transfer?')
  const getIssueTxs = buildEndpoint<GetIssueTxsParams, IssueTransaction>('transactions/issue?')

  const getHeight = async () => node.get<{ height: number }>('blocks/last').then(x => x.height)

  const getTxById = async (txId: string): Promise<TxWithIdAndSender> =>
    node.get<TxWithIdAndSender>(`transactions/info/${txId}`)

  const getUtxById = async (txId: string): Promise<TxWithIdAndSender> =>
    node.get<TxWithIdAndSender>(`transactions/unconfirmed/info/${txId}`)

  const broadcast = async (tx: TTx): Promise<TxWithIdAndSender> =>
    node.post<TxWithIdAndSender>('transactions/broadcast', tx)

  const waitForTx = async (txId: string): Promise<TxWithIdAndSender> => retry(async () => getTxById(txId), 999, 1000)

  const geTxsByAddress = async (address: string, limit: number = 100): Promise<TxWithIdAndSender[]> =>
    (await node.get<TxWithIdAndSender[][]>(`transactions/address/${address}/limit/${limit}`))[0]

  const broadcastAndWait = async (tx: TxWithIdAndSender): Promise<TxWithIdAndSender> =>
    await broadcast(tx).then(x => waitForTx(x.id))

  const getAssetDistribution = async (assetId: string, height?: number, limit: number = 999): Promise<Distribution> =>
    await node.get<Distribution>(`assets/${assetId}/distribution/${height || await getHeight() - 1}/limit/${limit}`)

  const getAssetInfo = async (assetId: string): Promise<AssetInfo> =>
    await node.get<AssetInfo>(`assets/details/${assetId}`)

  const getUtx = (): Promise<TxWithIdAndSender[]> => node.get<TxWithIdAndSender[]>('transactions/unconfirmed')

  const getBalance = (address: string): Promise<number> =>
    node.get<{ available: number }>(`addresses/balance/details/${address}`).then(x => x.available)

  const getAssetsBalance = (address: string): Promise<GetAssetsBalanceParams> => node.get(`assets/balance/${address}`)

  const getSetScripTxsByScript = (script: string, limit: number = 100): Promise<SetScriptTransaction[]> =>
    api
      .post<{ data: { data: SetScriptTransaction }[] }>('transactions/set-script', {
        script: 'base64:' + script,
        limit,
      })
      .then(x => x.data.map(y => y.data))

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
    matcher.post<{ message: any }>('orderbook', order).then(x => x.message as Order)

  const cancelOrder = async (amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder) =>
    matcher.post<void>(`orderbook/${amountAsset}/${priceAsset}/cancel`, cancelOrder)

  return Object.freeze({
    waitForHeight,
    getHeight,
    getTxById,
    getUtxById,
    broadcast,
    waitForTx,
    getDataTxs,
    geTxsByAddress,
    broadcastAndWait,
    getMassTransfersTxs,
    getTransfersTxs,
    getIssueTxs,
    getBalance,
    getAssetsBalance,
    getAssetInfo,
    getUtx,
    getSetScripTxsByScript,
    getOrderbookPair,
    getAssetDistribution,
    placeOrder,
    cancelOrder,
    config,
  })
}

//return await this.node.get<IAssetInfo>(`assets/details/${assetId}`)

export interface PagingOptions {
  initialCursor?: string
  pageLimit?: number
}

export interface IWavesApi {
  //getAssetInfo(assetId: string): Promise<IAssetInfo>
  waitForHeight(height: number): Promise<number>
  getHeight(): Promise<number>
  getTxById(txId: string): Promise<TxWithIdAndSender>
  getUtxById(txId: string): Promise<TxWithIdAndSender>
  broadcast(tx: TTx): Promise<TxWithIdAndSender>
  broadcastAndWait(tx: TTx): Promise<TxWithIdAndSender>
  waitForTx(txId: string): Promise<TxWithIdAndSender>
  getDataTxs(params: GetDataTxsParams, options?: PagingOptions): ApiIterable<DataTransaction>
  getMassTransfersTxs(params: GetMassTransferTxsParams, options?: PagingOptions): ApiIterable<MassTransferTransaction>
  getIssueTxs(params: GetIssueTxsParams, options?: PagingOptions): ApiIterable<IssueTransaction>
  getTransfersTxs(params: GetTransferTxsParams, options?: PagingOptions): ApiIterable<TransferTransaction>
  geTxsByAddress(address: string, limit?: number): Promise<TxWithIdAndSender[]>
  getUtx(): Promise<TxWithIdAndSender[]>
  getSetScripTxsByScript(script: string, limit?: number): Promise<SetScriptTransaction[]>
  getBalance(address: string): Promise<number>
  getAssetDistribution(assetId: string, height?: number, limit?: number): Promise<Distribution>
  getAssetsBalance(address: string): Promise<GetAssetsBalanceParams>
  getAssetInfo(assetId: string): Promise<AssetInfo>
  getOrderbookPair(amountAsset: string, priceAsset: string): Promise<OrderbookPair>
  placeOrder(order: IOrder): Promise<Order>
  cancelOrder(amountAsset: string, priceAsset: string, cancelOrder: ICancelOrder): Promise<void>
  config: IApiConfig
}
