import { TableStorageConfig } from '../config/TableStorage';
import * as azStorage from "azure-storage";
import { CacheItem } from '../models/CacheItem';

/**
 * Database connection handler
 */
export class StorageConnector {

    // Table Storage configuration
    config: TableStorageConfig;

    // Table storage connection
    database: azStorage.TableService;

    /**
     * Constructor
     * Creating defined table, if not existing
     * @param config Table Storage configuration
     */
    constructor(config: TableStorageConfig) {
        this.config = config;
        this.database = azStorage.createTableService(this.config.storageAccount, this.config.storageKey);
        this.createTableIfNotExists(this.config.endpointTable);
    }

    /**
     * Creating Table, if it doesn't exists
     * @param tableName Table name
     */
    createTableIfNotExists(tableName: string): void {
        this.database.createTableIfNotExists(tableName, function (error, result, response) {
            if (!error) {
                console.info('Cache Table initialized');
			}
			else console.error(error);
        });
    }

    /**
     * Retrieve the endpoint for a given tenant ID from the cache
     * @param tenantId Tenant Id
     * @param callback Callback function, which will be called with the results
     * @param partitionKey Table storage partition key
     * @param setCacheEntry Optional Callback function for updating the cache entry
     */
    getEndpoint(tenantId: string, callback: Function, partitionKey?: string, setCacheEntry?: Function) {
        partitionKey = partitionKey || this.config.defaultPartition;
        this.database.retrieveEntity(this.config.endpointTable, partitionKey, tenantId, function (error, result, response) {
            if (!error) {
				//@ts-ignore
                const endpointUrl = response.body.EndpointUrl;

                if (setCacheEntry) {
                    setCacheEntry(tenantId, endpointUrl);
                }
                callback(error, tenantId, endpointUrl);
            } else {
                callback(error, tenantId);
            }
        });
    }

    /**
     * Create or update an entry
     * @param tenantId Tenant Id
     * @param endpointUrl Endpoint Url
     * @param partitionKey Optional partition key
     */
    createOrUpdateEndpoint(tenantId: string, endpointUrl: string, partitionKey?: string) {
        partitionKey = partitionKey || this.config.defaultPartition;
        const entry = new CacheItem(partitionKey || this.config.defaultPartition, tenantId, endpointUrl);
        this.database.insertOrReplaceEntity(this.config.endpointTable, entry, function (error, result, response) {
            if (!error) {
                console.info(response);
            } else {
                console.error(error);
            }
        });
    }
}