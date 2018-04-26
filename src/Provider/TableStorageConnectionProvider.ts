import { ConversationReference } from 'botbuilder';
import { PendingConnection, EstablishedConnection } from '../Models/Connection';
import { ConnectionProvider } from './ConnectionProvider';
import * as azure from 'azure-storage';
import { flatten, unflatten } from 'flat';
const entityGenerator = azure.TableUtilities.entityGenerator;

/*
Five tables:
    Users (ConversationReferences)
    Bot instances (ConversationReferences)
    Aggregation channels (C# specific, ConversationReferences)
    Connections (2 * ConversationReferences + DateTime [time of last activity])
    Connection requests (ConversationReference + DateTime [time the request was made])
*/

export interface TableStorageSettings {
    tableName: string;
    storageAccessKey: string;
    storageAccountOrConnectionString: string;
    host?: azure.StorageHost;
}

// Map of already initialized tables. Key = tableName, Value = Promise with TableResult creation.
const checkedTables: { [name: string]: Promise<azure.TableService.TableResult>; } = {};

export class TableStorageConnectionProvider implements ConnectionProvider {
    private settings: TableStorageSettings;
    private tableService: TableServiceAsync;

    protected readonly PARTITIONKEY: string = 'PartitionKey';
    protected readonly TABLENAMEUSERS: string = 'Users';
    protected readonly TABLENAMEBOTINSTANCES: string = 'BotInstances';
    protected readonly TABLENAMECONNECTIONS: string = 'Connections';
    protected readonly TABLENAMECONNECTIONREQUESTS: string = 'ConnectionRequests';

    // Creates a new instance of the storage provider.
    public constructor(settings: TableStorageSettings) {
        if (!settings) {
            throw new Error('The settings parameter is required.');
        }

        // https://docs.microsoft.com/en-us/rest/api/storageservices/Understanding-the-Table-Service-Data-Model?redirectedfrom=MSDN#table-names
        if (!/^[A-Za-z][A-Za-z0-9]{2,62}$/.test(settings.tableName)) {
            throw new Error('The table name contains invalid characters.');
        }

        this.settings = Object.assign({}, settings);
        this.tableService = this.createTableService(this.settings.storageAccountOrConnectionString, this.settings.storageAccessKey, this.settings.host);
    }

    public endConnection(connection: ConversationReference): Promise<void> {
        throw new Error('not implemented');
    }

    public addPendingConnection(connection: PendingConnection): Promise<void> {
        throw new Error('not implemented');
    }

    public addEstablishedConnection(connection: EstablishedConnection): Promise<void> {
        throw new Error('not implemented');
    }

    public getPendingConnections(): Promise<PendingConnection[]> {
        throw new Error('not implemented');
    }

    public getEstablishedConnections(): Promise<EstablishedConnection[]> {

        return this.ensureTable().then(() => {

            const query = new azure.TableQuery()
                .where('PartitionKey eq ?', this.PARTITIONKEY);

            const results = this.tableService.queryEntities<any>(this.settings.tableName, query, { entityResolver: entityResolver })
                .then(result => {
                    const value = unflatten(result, flattenOptions);
                    //TODO: Element implicitly has an 'any' type because type '{}' has no index signature.
                    // value.eTag = value['.metadata'].etag;

                    //TODO: Element implicitly has an 'any' type because type '{}' has no index signature.
                    // remove TableRow Properties from storeItem
                    // ['PartitionKey', 'RowKey', '.metadata'].forEach(k => delete value[k]);

                    return value;
                });

            const tempresults: EstablishedConnection[] = [];
            return tempresults;
            // return Promise.all(results)
            //     .then(items => items
            //         .filter(prop => prop.value !== null)
            //         .reduce(propsReducer, {}));     // as EstablishedConnection
        });
    }

    // create TableServiceAsync instance based on connection config
    private createTableService(storageAccountOrConnectionString: string, storageAccessKey: string, host: any): TableServiceAsync {
        const tableService = storageAccountOrConnectionString ? azure.createTableService(storageAccountOrConnectionString, storageAccessKey, host) : azure.createTableService();

        // create TableServiceAsync by using denodeify to create promise wrappers around cb functions
        return {
            createTableIfNotExistsAsync: this.denodeify(tableService, tableService.createTableIfNotExists),
            deleteTableIfExistsAsync: this.denodeify(tableService, tableService.deleteTableIfExists),
            queryEntities: this.denodeify(tableService, tableService.queryEntities),
            retrieveEntityAsync: this.denodeify(tableService, tableService.retrieveEntity),
            insertOrReplaceEntityAsync: this.denodeify(tableService, tableService.insertOrReplaceEntity),
            replaceEntityAsync: this.denodeify(tableService, tableService.replaceEntity),
            deleteEntityAsync: this.denodeify(tableService, tableService.deleteEntity)
        } as any;
    }

    // turn a cb based azure method into a Promisified one
    private denodeify<T>(thisArg: any, fn: Function): (...args: any[]) => Promise<T> {
        return (...args: any[]) => {
            return new Promise<T>((resolve, reject) => {
                args.push((error: Error, result: any) => (error) ? reject(error) : resolve(result));
                fn.apply(thisArg, args);
            });
        };
    }

    /** Ensure the table is created. */
    public ensureTable(): Promise<azure.TableService.TableResult> {
        if (!checkedTables[this.settings.tableName]) {
            checkedTables[this.settings.tableName] = this.tableService.createTableIfNotExistsAsync(this.settings.tableName);
        }
        return checkedTables[this.settings.tableName];
    }

    /** Delete backing table (mostly used for unit testing.) */
    public deleteTable(): Promise<boolean> {
        if (checkedTables[this.settings.tableName]) {
            delete checkedTables[this.settings.tableName];
        }
        return this.tableService.deleteTableIfExistsAsync(this.settings.tableName);
    }

}

// Convert EDM types back to an JS object
const entityResolver = (entity: any) => {
    return Object.keys(entity)
        .map(key => ({ key, value: getEdmValue(entity[key]) }))
        .reduce(propsReducer, {});
};

const getEdmValue = (entityValue: any) => {
    return entityValue.$ === azure.TableUtilities.EdmType.INT64
        ? Number(entityValue._)
        : entityValue._;
};

// Reduces pairs for key/value into an object (e.g.: Connection)
const propsReducer = (resolved: any, propValue: { key: any, value: any }): any => {
    resolved[propValue.key] = propValue.value;
    return resolved;
};

// flat/flatten options to use '_' as delimiter (same as C#'s TableEntity.Flatten default delimiter)
const flattenOptions = {
    delimiter: '_'
};

// Promise based methods created using denodeify function
interface TableServiceAsync extends azure.TableService {
    createTableIfNotExistsAsync(table: string): Promise<azure.TableService.TableResult>;
    deleteTableIfExistsAsync(table: string): Promise<boolean>;

    queryEntities<T>(table: string, tableQuery: azure.TableQuery, options: any): Promise<T>;
    retrieveEntityAsync<T>(table: string, partitionKey: string, rowKey: string, options: any): Promise<T>;
    replaceEntityAsync<T>(table: string, entityDescriptor: T): Promise<azure.TableService.EntityMetadata>;
    insertOrReplaceEntityAsync<T>(table: string, entityDescriptor: T): Promise<azure.TableService.EntityMetadata>;
    deleteEntityAsync<T>(table: string, entityDescriptor: T): Promise<void>;
}
