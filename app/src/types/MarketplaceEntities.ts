import Web3 from "web3";
import { AbiItem } from 'web3-utils';
import { abi as IdentityManagerABI } from '../asset/json/IdentityManager.abi.json';
import { abi as MarketplaceABI } from '../asset/json/Marketplace.abi.json';
import { VOLTA_IDENTITY_MANAGER_ADDRESS, VOLTA_MARKETPLACE_ADDRESS } from '../asset/json/voltaContractAddresses.json';
import IdentityManager from './IdentityManager';
import Marketplace from './Marketplace';

const zeroAddress = '0x0000000000000000000000000000000000000000';


export class Asset {
    constructor(private _asset: string, private _owner: string = zeroAddress, private _volume: number = 0, private _price: number = 0, private _remainingVolume: number = 0, private _matches: number = 0) { }

    public async fetchOwner(web3: Web3) {
        const identityManager = new web3.eth.Contract(IdentityManagerABI as AbiItem[], VOLTA_IDENTITY_MANAGER_ADDRESS) as unknown as IdentityManager;
        this._owner = await identityManager.methods.identityOwner(this.asset).call();
        return this._owner;
    }

    public async fetchMarketplaceOffer(web3: Web3) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        const offer = await marketplace.methods.offers(this.asset).call();

        this._matches = Number.parseInt(offer.matches);
        this._volume = Number.parseInt(offer.volume);
        this._remainingVolume = Number.parseInt(offer.remainingVolume);
        this._price = Number.parseInt(offer.price);
        return this;
    }

    public async createOffer(web3: Web3, owner: string, volume: number, price: number) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.createOffer(this.asset, volume, price).send({ from: owner });

        this._volume = volume;
        this._remainingVolume = volume;
        this._price = price;
        return this;
    }

    public async cancelOffer(web3: Web3, owner: string) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.cancelOffer(this.asset).send({ from: owner });

        this._volume = 0;
        this._remainingVolume = 0;
        this._price = 0;
        return this;
    }

    get doesOfferExists(): boolean { return this._volume > 0 && this._price > 0; }

    get asset(): string { return this._asset; }

    get owner(): string { return this._owner; }

    get volume(): number { return this._volume; }

    get price(): number { return this._price; }

    get remainingVolume(): number { return this._remainingVolume; }

    get matches(): number { return this._matches; }

    get isMatched(): boolean { return this.matches > 0; }
}

export class Demand {
    constructor(private _buyer: string, private _volume: number = 0, private _price: number = 0, private _isMatched: boolean = false) { }

    public async fetchMarketplaceDemand(web3: Web3) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        const demand = await marketplace.methods.demands(this._buyer).call();

        this._isMatched = demand.isMatched;
        this._volume = Number.parseInt(demand.volume);
        this._price = Number.parseInt(demand.price);
        return this;
    }

    public async createDemand(web3: Web3, volume: number, price: number) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.createDemand(volume, price).send({ from: this._buyer });

        this._isMatched = false;
        this._volume = volume;
        this._price = price;
        return this;
    }

    public async cancelOffer(web3: Web3) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.cancelDemand().send({ from: this._buyer });

        this._isMatched = false;
        this._volume = 0;
        this._price = 0;
        return this;
    }

    get doesDemandExists(): boolean { return this._volume > 0 && this._price > 0; }

    get buyer(): string { return this._buyer; }

    get volume(): number { return this._volume; }

    get price(): number { return this._price; }

    get isMatched(): boolean { return this._isMatched; }
}

export class Match {
    constructor(private _matchId: number, private _asset?: Asset, private _demand?: Demand, private _volume: number = 0, private _price: number  = 0, private _isAccepted: boolean = false) { }

    public async fetchMarketplaceMatch(web3: Web3, autoFetch: boolean = true) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        const matches = await marketplace.methods.matches(this._matchId).call();

        this._isAccepted = matches.isAccepted;
        this._volume = Number.parseInt(matches.volume);
        this._price = Number.parseInt(matches.price);

        this._asset = new Asset(matches.asset);
        this._demand = new Demand(matches.buyer);
        if (autoFetch) {
            await this._asset.fetchMarketplaceOffer(web3);
            await this._demand.fetchMarketplaceDemand(web3);
        }

        return this;
    }

    private resetMatch() {
        this._isAccepted = false;
        this._volume = 0;
        this._price = 0;
        this._asset = undefined;
        this._demand = undefined;
    }

    private async recursiveFetch(web3: Web3) {
        if (this._asset)
            await this._asset.fetchMarketplaceOffer(web3);
        if (this._demand)
            await this._demand.fetchMarketplaceDemand(web3);
    }

    public async proposeMatch(web3: Web3, aggregator: string, asset: Asset, demand: Demand, volume: number, price: number) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.proposeMatch(asset.asset, demand.buyer, volume, price).send({ from: aggregator });

        this._isAccepted = false;
        this._volume = volume;
        this._price = price;
        this._asset = asset;
        this._demand = demand;
        return this;
    }

    public async cancelProposedMatch(web3: Web3, aggregator: string) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.cancelProposedMatch(this._matchId).send({ from: aggregator });

        this.resetMatch();
        return this;
    }

    public async acceptMatch(web3: Web3, buyer: string, autoFetch: boolean = true) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.acceptMatch(this._matchId).send({ from: buyer });

        this._isAccepted = true;
        if (autoFetch)
            await this.fetchMarketplaceMatch(web3, true);
        return this;
    }

    public async rejectMatch(web3: Web3, buyer: string, autoFetch: boolean = true) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.rejectMatch(this._matchId).send({ from: buyer });

        if (autoFetch)
            await this.recursiveFetch(web3);
        this.resetMatch();
        return this;
    }

    public async deleteMatch(web3: Web3, buyerOrOwner: string, autoFetch: boolean = true) {
        const marketplace = new web3.eth.Contract(MarketplaceABI as AbiItem[], VOLTA_MARKETPLACE_ADDRESS) as unknown as Marketplace;
        await marketplace.methods.deleteMatch(this._matchId).send({ from: buyerOrOwner });

        if (autoFetch)
            await this.recursiveFetch(web3);
        this.resetMatch();
        return this;
    }

    get doesMatchExists(): boolean { return this._volume > 0 && this._price > 0; }

    get matchId(): number { return this._matchId; }

    get asset(): Asset | undefined { return this._asset; }

    get demand(): Demand | undefined { return this._demand; }

    get volume(): number { return this._volume; }

    get price(): number { return this._price; }

    get isAccepted(): boolean { return this._isAccepted; }
}