import { Options } from "node-cache";
import { isUndefined } from 'util';
import { StorageConnector } from './StorageConnector';
import NodeCache = require("node-cache");

export class Cache {

    // DB connection
    dbCon: StorageConnector;

    // Cache
    cache: NodeCache;

    /**
     * Constructor
     * Initializing cache
     * @param dbCon DB connection
     * @param cacheOptions Optional caching configuration
     */
    constructor (dbCon: StorageConnector, cacheOptions?: Options) {
        this.dbCon = dbCon;
        this.initCache(cacheOptions);
    }

    /**
     * Initializing Cache
     * @param cacheOptions Optional cache configuration
     */
    initCache(cacheOptions?: Options) {
        if(isUndefined(cacheOptions)) {
            this.cache = new NodeCache();
        } else {
            this.cache = new NodeCache(cacheOptions);
        }
    }

    /**
     * Retriving cache entry for tenant Id.
     * @param tenantId Tenant Id
     */
    getCacheEntry (tenantId: string): string | undefined {
        return this.cache.get(tenantId);
    }

    /**
     * Setting a new cache entry
     * @param tenantId Tenant Id
     * @param endpointUrl Mapped endpoint Url
     */
    setCacheEntry(tenantId: string, endpointUrl: string): void {
        this.cache.set(tenantId, endpointUrl);
    }

    /**
     * Resolving Endpoint for tenant
     * 1) Looking for cache entry
     * 2) If no cache entry is available => Database search
     * 3) If an database entry was found, the cache will be updated
     * @param callback Callback function, which will be called with the results
     * @param tenantId Tenant Id
     * @param partitionKey Optional partition key
     */
    resolveEndpointForTenant(callback:(error: Error, tentantId: string, endpointUrl?: string)=>void, tenantId: string, partitionKey?: string): void {

        const cacheEntry = this.getCacheEntry(tenantId);
        if (isUndefined(cacheEntry)) {
            this.dbCon.getEndpoint(tenantId, callback, partitionKey, this.setCacheEntry);
        } else {
            callback(null, tenantId, cacheEntry);
        }
    }
    
}