export class CacheItem {

    // Table storage partition key
    PartitionKey: string;

    // Table storage Row Key, here the tenant Id
    RowKey: string;

    // Mapped endpoint url
    EndpointUrl: string;

    /**
     * Constructor
     * @param partitionKey Table storage partition key
     * @param rowKey Table storage Row Key, here the tenant Id
     * @param endpointUrl Mapped endpoint url
     */
    constructor(partitionKey: string, rowKey: string, endpointUrl: string) {
        this.PartitionKey = partitionKey;
        this.RowKey = rowKey;
        this.EndpointUrl = endpointUrl
    }
}