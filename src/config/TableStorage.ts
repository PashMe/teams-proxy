/**
 * Table Storage Configuration Class
 */
export class TableStorageConfig {

    // Table containing the endpoint mapping for the tenantId
    endpointTable: string;

    // Storage account
    storageAccount: string;

    // Storage account key
    storageKey: string;

    // Default partition
    defaultPartition: string;

    /**
     * Constructor
     * All parameters als optional. If they are not given, they will be loaded from enviroment variables.
     * @param endpointTable Table containing the endpoint mapping for the tenantId
     * @param storageAccount Storage account
     * @param storageKey Storage account key
     * @param defaultPartition Default partition
     */
    constructor(endpointTable?: string, storageAccount?: string, storageKey?: string, defaultPartition?: string) {
        this.endpointTable = endpointTable || process.env.TableStorage_Endpoint_Table;
        this.storageAccount = storageAccount || process.env.TableStorage_Account;
        this.storageKey = storageKey || process.env.TableStorage_Key;
        this.defaultPartition = defaultPartition || process.env.TableStorage_DefaultPartition;
    }
}