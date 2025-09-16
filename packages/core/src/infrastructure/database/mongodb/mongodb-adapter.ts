/**
 * MongoDBAdapter - MongoDB适配器实现
 *
 * 提供了完整的MongoDB集成功能，包括连接管理、数据库操作、
 * 事务管理、索引管理等功能。
 *
 * ## 业务规则
 *
 * ### 连接管理规则
 * - 支持连接池配置和管理
 * - 支持连接重试和恢复
 * - 支持连接监控和统计
 * - 支持连接清理和优化
 *
 * ### 数据库操作规则
 * - 支持CRUD操作
 * - 支持聚合管道
 * - 支持变更流
 * - 支持批量操作
 *
 * ### 事务管理规则
 * - 支持事务开始和提交
 * - 支持事务回滚
 * - 支持事务重试
 * - 支持事务监控
 *
 * ### 索引管理规则
 * - 支持索引创建和删除
 * - 支持索引监控
 * - 支持索引优化
 * - 支持索引统计
 *
 * @description MongoDB适配器实现类
 * @example
 * ```typescript
 * const adapter = new CoreMongoDBAdapter({
 *   connection: {
 *     uri: 'mongodb://localhost:27017',
 *     database: 'test_db'
 *   },
 *   collections: [
 *     {
 *       name: 'users',
 *       indexes: [
 *         { key: { email: 1 }, options: { unique: true } }
 *       ]
 *     }
 *   ]
 * });
 *
 * await adapter.connect();
 *
 * // 获取集合
 * const usersCollection = adapter.getCollection('users');
 *
 * // 执行查询
 * const users = await usersCollection.find({}).toArray();
 *
 * // 执行事务
 * const session = adapter.startSession();
 * await adapter.withTransaction(session, async (session) => {
 *   await usersCollection.insertOne({ name: 'John' }, { session });
 * });
 *
 * await adapter.disconnect();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import {
  MongoClient,
  Db,
  Collection,
  IndexSpecification,
  ClientSession,
  type Document,
} from 'mongodb';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import type {
  IMongoDBAdapter,
  IMongoDBConfiguration,
} from './mongodb.interface';

/**
 * 核心MongoDB适配器
 */
@Injectable()
export class CoreMongoDBAdapter implements IMongoDBAdapter {
  public readonly client: MongoClient;
  public readonly database: Db;
  public readonly configuration: IMongoDBConfiguration;
  public readonly isConnected: boolean;

  private _isConnected = false;
  private _connectTime?: Date;
  private _disconnectTime?: Date;

  constructor(
    configuration: IMongoDBConfiguration,
    private readonly logger?: ILoggerService,
  ) {
    this.configuration = configuration;
    this.client = this.createMongoClient();
    this.database = this.client.db(configuration.connection.database);
    this.isConnected = this._isConnected;
  }

  /**
   * 连接数据库
   */
  public async connect(): Promise<void> {
    if (this._isConnected) {
      this.logger?.warn('MongoDB is already connected', LogContext.SYSTEM);
      return;
    }

    this.logger?.info('Connecting to MongoDB...', LogContext.SYSTEM, {
      uri: this.configuration.connection.uri,
      database: this.configuration.connection.database,
    });

    try {
      // 连接数据库
      await this.client.connect();

      // 验证连接
      await this.client.db('admin').command({ ping: 1 });

      // 初始化集合和索引
      await this.initializeCollections();
      await this.initializeIndexes();

      this._isConnected = true;
      this._connectTime = new Date();

      this.logger?.info('MongoDB connected successfully', LogContext.SYSTEM, {
        uri: this.configuration.connection.uri,
        database: this.configuration.connection.database,
        connectTime: this._connectTime,
      });
    } catch (error) {
      this.logger?.error(
        'Failed to connect to MongoDB',
        LogContext.SYSTEM,
        {
          uri: this.configuration.connection.uri,
          database: this.configuration.connection.database,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 断开数据库连接
   */
  public async disconnect(): Promise<void> {
    if (!this._isConnected) {
      this.logger?.warn('MongoDB is not connected', LogContext.SYSTEM);
      return;
    }

    this.logger?.info('Disconnecting from MongoDB...', LogContext.SYSTEM);

    try {
      await this.client.close();

      this._isConnected = false;
      this._disconnectTime = new Date();

      this.logger?.info(
        'MongoDB disconnected successfully',
        LogContext.SYSTEM,
        {
          disconnectTime: this._disconnectTime,
          uptime: this._connectTime
            ? this._disconnectTime.getTime() - this._connectTime.getTime()
            : 0,
        },
      );
    } catch (error) {
      this.logger?.error(
        'Failed to disconnect from MongoDB',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 重新连接数据库
   */
  public async reconnect(): Promise<void> {
    this.logger?.info('Reconnecting to MongoDB...', LogContext.SYSTEM);

    try {
      await this.disconnect();
      await this.connect();

      this.logger?.info('MongoDB reconnected successfully', LogContext.SYSTEM);
    } catch (error) {
      this.logger?.error(
        'Failed to reconnect to MongoDB',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取集合
   */
  public getCollection<T extends Document = Document>(
    name: string,
  ): Collection<T> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    return this.database.collection<T>(name);
  }

  /**
   * 创建集合
   */
  public async createCollection<T extends Document = Document>(
    name: string,
    options?: Record<string, unknown>,
  ): Promise<Collection<T>> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    this.logger?.debug(`Creating collection: ${name}`, LogContext.SYSTEM, {
      collectionName: name,
      options,
    });

    try {
      const collection = await this.database.createCollection<T>(name, options);

      this.logger?.debug(`Collection created: ${name}`, LogContext.SYSTEM, {
        collectionName: name,
      });

      return collection;
    } catch (error) {
      this.logger?.error(
        `Failed to create collection: ${name}`,
        LogContext.SYSTEM,
        {
          collectionName: name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 删除集合
   */
  public async dropCollection(name: string): Promise<boolean> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    this.logger?.debug(`Dropping collection: ${name}`, LogContext.SYSTEM, {
      collectionName: name,
    });

    try {
      const result = await this.database.dropCollection(name);

      this.logger?.debug(`Collection dropped: ${name}`, LogContext.SYSTEM, {
        collectionName: name,
        result,
      });

      return result;
    } catch (error) {
      this.logger?.error(
        `Failed to drop collection: ${name}`,
        LogContext.SYSTEM,
        {
          collectionName: name,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 列出所有集合
   */
  public async listCollections(): Promise<Array<Record<string, unknown>>> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    try {
      const collections = await this.database.listCollections().toArray();

      this.logger?.debug('Collections listed', LogContext.SYSTEM, {
        collectionCount: collections.length,
      });

      return collections;
    } catch (error) {
      this.logger?.error(
        'Failed to list collections',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 创建索引
   */
  public async createIndex(
    collectionName: string,
    indexSpec: IndexSpecification,
    options?: Record<string, unknown>,
  ): Promise<string> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    this.logger?.debug(`Creating index: ${collectionName}`, LogContext.SYSTEM, {
      collectionName,
      indexSpec,
      options,
    });

    try {
      const collection = this.getCollection(collectionName);
      const indexName = await collection.createIndex(indexSpec, options);

      this.logger?.debug(
        `Index created: ${collectionName}`,
        LogContext.SYSTEM,
        { collectionName, indexName },
      );

      return indexName;
    } catch (error) {
      this.logger?.error(
        `Failed to create index: ${collectionName}`,
        LogContext.SYSTEM,
        {
          collectionName,
          indexSpec,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 删除索引
   */
  public async dropIndex(
    collectionName: string,
    indexName: string,
  ): Promise<Record<string, unknown>> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    this.logger?.debug(`Dropping index: ${collectionName}`, LogContext.SYSTEM, {
      collectionName,
      indexName,
    });

    try {
      const collection = this.getCollection(collectionName);
      const result = await collection.dropIndex(indexName);

      this.logger?.debug(
        `Index dropped: ${collectionName}`,
        LogContext.SYSTEM,
        { collectionName, indexName, result },
      );

      return result;
    } catch (error) {
      this.logger?.error(
        `Failed to drop index: ${collectionName}`,
        LogContext.SYSTEM,
        {
          collectionName,
          indexName,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 列出索引
   */
  public async listIndexes(
    collectionName: string,
  ): Promise<Array<Record<string, unknown>>> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    try {
      const collection = this.getCollection(collectionName);
      const indexes = await collection.listIndexes().toArray();

      this.logger?.debug(
        `Indexes listed: ${collectionName}`,
        LogContext.SYSTEM,
        { collectionName, indexCount: indexes.length },
      );

      return indexes;
    } catch (error) {
      this.logger?.error(
        `Failed to list indexes: ${collectionName}`,
        LogContext.SYSTEM,
        {
          collectionName,
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 开始事务
   */
  public startSession(): ClientSession {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    return this.client.startSession();
  }

  /**
   * 执行事务
   */
  public async withTransaction<T>(
    session: ClientSession,
    callback: (session: ClientSession) => Promise<T>,
  ): Promise<T> {
    if (!this._isConnected) {
      throw new Error('MongoDB is not connected');
    }

    this.logger?.debug('Starting transaction', LogContext.SYSTEM, {
      sessionId: session.id?.toString(),
    });

    try {
      const result = (await session.withTransaction(callback)) as T;

      this.logger?.debug('Transaction completed', LogContext.SYSTEM, {
        sessionId: session.id?.toString(),
      });

      return result;
    } catch (error) {
      this.logger?.error(
        'Transaction failed',
        LogContext.SYSTEM,
        {
          sessionId: session.id?.toString(),
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 获取连接信息
   */
  public getConnectionInfo(): Record<string, unknown> {
    return {
      isConnected: this._isConnected,
      uri: this.configuration.connection.uri,
      database: this.configuration.connection.database,
      connectTime: this._connectTime,
      disconnectTime: this._disconnectTime,
      uptime: this._connectTime ? Date.now() - this._connectTime.getTime() : 0,
    };
  }

  /**
   * 获取健康状态
   */
  public getHealthStatus(): Record<string, unknown> {
    return {
      status: this._isConnected ? 'healthy' : 'unhealthy',
      isConnected: this._isConnected,
      connectTime: this._connectTime,
      uptime: this._connectTime ? Date.now() - this._connectTime.getTime() : 0,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 获取性能指标
   */
  public getPerformanceMetrics(): Record<string, unknown> {
    return {
      connection: this.getConnectionInfo(),
      health: this.getHealthStatus(),
      performance: {
        // 性能指标将在未来版本中实现
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 创建MongoDB客户端
   */
  private createMongoClient(): MongoClient {
    const options = {
      maxPoolSize: this.configuration.connectionPool?.maxConnections || 10,
      minPoolSize: this.configuration.connectionPool?.minConnections || 1,
      connectTimeoutMS:
        this.configuration.connectionPool?.connectionTimeout || 30000,
      serverSelectionTimeoutMS:
        this.configuration.connection.options?.serverSelectionTimeoutMS ||
        30000,
      socketTimeoutMS:
        this.configuration.connection.options?.socketTimeoutMS || 30000,
      ...this.configuration.connection.options,
    } as const;

    return new MongoClient(
      this.configuration.connection.uri,
      options as Record<string, unknown>,
    );
  }

  /**
   * 初始化集合
   */
  private async initializeCollections(): Promise<void> {
    this.logger?.debug('Initializing collections...', LogContext.SYSTEM);

    try {
      for (const collectionConfig of this.configuration.collections) {
        try {
          // 检查集合是否存在
          const existingCollections = await this.listCollections();
          const collectionExists = existingCollections.some(
            (col) => col.name === collectionConfig.name,
          );

          if (!collectionExists) {
            // 创建集合
            await this.createCollection(
              collectionConfig.name,
              collectionConfig.options,
            );
          }
        } catch (error) {
          this.logger?.warn(
            `Failed to initialize collection: ${collectionConfig.name}`,
            LogContext.SYSTEM,
            {
              collectionName: collectionConfig.name,
              error: (error as Error).message,
            },
          );
        }
      }

      this.logger?.debug('Collections initialized', LogContext.SYSTEM, {
        collectionCount: this.configuration.collections.length,
      });
    } catch (error) {
      this.logger?.error(
        'Failed to initialize collections',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }

  /**
   * 初始化索引
   */
  private async initializeIndexes(): Promise<void> {
    this.logger?.debug('Initializing indexes...', LogContext.SYSTEM);

    try {
      for (const collectionConfig of this.configuration.collections) {
        if (collectionConfig.indexes) {
          for (const indexConfig of collectionConfig.indexes) {
            try {
              await this.createIndex(
                collectionConfig.name,
                indexConfig.key,
                indexConfig.options,
              );
            } catch (error) {
              this.logger?.warn(
                `Failed to create index: ${collectionConfig.name}`,
                LogContext.SYSTEM,
                {
                  collectionName: collectionConfig.name,
                  indexKey: indexConfig.key,
                  error: (error as Error).message,
                },
              );
            }
          }
        }
      }

      this.logger?.debug('Indexes initialized', LogContext.SYSTEM);
    } catch (error) {
      this.logger?.error(
        'Failed to initialize indexes',
        LogContext.SYSTEM,
        {
          error: (error as Error).message,
        },
        error as Error,
      );
      throw error;
    }
  }
}
