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
  balance: number
  reissuable: boolean
  minSponsoredAssetFee: number | null
  sponsorBalance: number | null
  quantity: number
  issueTransaction: IssueTransaction
}

export type AmountPricePair = {
  amountAsset: string
  priceAsset: string
}

export type AmountPrice = {
  amount: string
  price: string
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

export interface CandlesResponse {
  timestamp: number
  open: string
  high: string
  low: string
  close: string
  vwap: string
  volume: string
  priceVolume: string
  confirmed: boolean
}

export interface GetAssetsBalanceResponse {
  address: string
  balances: AssetBalance[]
}

export interface GetBalanceDetailsResponse {
  address: string
  regular: number
  generating: number
  available: number
  effective: number
}

export type GetNftBalanceResponse = {
  senderPublicKey: string
  quantity: number
  fee: number
  description: string
  type: number
  version: number
  reissuable: boolean
  script: string
  sender: string
  feeAssetId: string
  chainId: number
  proofs: string[]
  assetId: string
  decimals: number
  name: string
  id: string
  timestamp: number
}[]

export interface IScriptInfo {
  address: string
  script: string
  scriptText: string
  complexity: number
  extraFee: number
}

export interface IScriptDecompileResult {
  STDLIB_VERSION: number
  SCRIPT_TYPE: string
  CONTENT_TYPE: string
  script: string
}

export interface GetMarketsResponse {
  matcherPublicKey: string
  markets: Market[]
}

export interface Market {
  amountAssetName: string
  amountAsset: string
  priceAsset: string
  created: number
  amountAssetInfo: { decimals: number } | null
  restrictions: Restrictions
  priceAssetInfo: { decimals: number } | null
  matchingRules: MatchingRules
  priceAssetName: string
}

export interface MatchingRules {
  tickSize: string
}

export interface Restrictions {
  stepAmount: string
  minAmount: string
  maxAmount: string
  stepPrice: string
  minPrice: string
  maxPrice: string
}
