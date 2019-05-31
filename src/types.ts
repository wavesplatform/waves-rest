import {
  TTx,
  WithId,
  WithSender,
  IOrder,
  ICancelOrder,
  IMassTransferTransaction,
  ITransferTransaction,
  IDataTransaction,
  ISetScriptTransaction,
  IIssueTransaction
} from '@waves/waves-transactions'

export type LONG = string | number
export type Sort = 'asc' | 'desc'

export const defaultSort: Sort = 'desc'

export const defaultLimit = 100

export type DataType = 'binary' | 'integer' | 'boolean' | 'string'

export type TxWithIdAndSender = TTx & WithId & WithSender

interface TypeExtension extends WithId, WithSender {
  sender: string
}

export type MassTransferTransaction = IMassTransferTransaction & TypeExtension
export type TransferTransaction = ITransferTransaction & TypeExtension
export type DataTransaction = IDataTransaction & TypeExtension
export type SetScriptTransaction = ISetScriptTransaction & TypeExtension
export type IssueTransaction = IIssueTransaction & TypeExtension
export type Order = IOrder & TypeExtension

export interface BaseParams {
  limit?: number
  timeStart?: number
  timeEnd?: number
  sender?: string
  after?: string
  sort?: Sort
}

export interface GetMassTransferTxsParams extends BaseParams {
  recipient?: string
}

export interface GetTransferTxsParams extends BaseParams {
  recipient?: string
  assetId?: string
}

export interface GetIssueTxsParams extends BaseParams {
  assetId?: string
  script?: string
}

export interface GetReissueTxsParams extends BaseParams {
  assetId?: string
}

export interface GetBurnTxsParams extends BaseParams {
  assetId?: string
}

export interface GetExchangeTxsParams extends BaseParams {
  matcher?: string
  amountAsset?: string
  priceAsset?: string
}

export interface GetLeaseTxsParams extends BaseParams {
  recipient?: string
}

export interface GetLeaseCancelTxsParams extends BaseParams { }

export interface GetDataTxsParams extends BaseParams {
  key?: string
  vaue?: string
  type?: DataType
}

export interface AssetBalance {
  assetId: string
  balance: LONG
  quantity: LONG
  reissuable?: boolean
}

export interface GetAssetsBalanceParams {
  address: string
  balances?: AssetBalance[]
}

export type AmountPricePair = {
  amountAsset: string
  priceAsset: string
}

export type AmountPrice = {
  amount: number
  price: number
}

export interface OrderbookPair {
  pair: AmountPricePair
  bids: AmountPrice[]
  asks: AmountPrice[]
}

export interface Distribution {
  hasNext: boolean
  lastItem: string
  items: { [address: string]: number }
}

export interface AssetInfo {
  assetId: string
  issueHeight: number
  issueTimestamp: number
  issuer: string
  name: string
  description: string
  decimals: number
  reissuable: boolean
  quantity: number
  scripted: boolean
  minSponsoredAssetFee: number | null
}
