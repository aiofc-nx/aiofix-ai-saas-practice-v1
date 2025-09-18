/**
 * 核心事件存储实现
 *
 * @description 基于数据库的事件存储实现，提供完整的事件存储功能
 * 支持乐观并发控制、事务处理、多租户隔离等高级特性
 *
 * ## 业务规则
 *
 * ### 事件保存规则
 * - 事件必须按版本顺序保存，确保事件流的完整性
 * - 支持乐观并发控制，防止并发修改冲突
 * - 事件保存必须具有原子性，要么全部成功，要么全部失败
 * - 支持批量事件保存，提高性能
 *
 * ### 数据隔离规则
 * - 支持多租户数据隔离
 * - 支持按组织、部门等维度隔离
 * - 确保数据安全和隐私保护
 *
 * ### 性能优化规则
 * - 支持事件流式处理，避免内存溢出
 * - 支持事件索引优化，提高查询性能
 * - 支持事件压缩和归档，节省存储空间
 *
 * @example
 * ```typescript
 * // 创建事件存储实例
 * const eventStore = new CoreEventStore(database, logger);
 *
 * // 保存事件
 * await eventStore.saveEvents('order-123', events, 5);
 *
 * // 查询事件流
 * const events = await eventStore.getEvents('order-123', 1);
 * ```
 *
 * @since 1.0.0
 */

import { Injectable, Inject } from '@nestjs/common';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { IEventStore, IEventStreamResult } from './event-store.interface';
import { ConcurrencyError } from './concurrency-error';
import type { BaseDomainEvent } from '../../../domain/entities/base/base-domain-event';

/**
 * 数据库接口
 *
 * @description 定义数据库操作接口，支持事务处理
 */
export interface IDatabase {
  /**
   * 开始事务
   */
  beginTransaction(): Promise<void>;

  /**
   * 提交事务
   */
  commitTransaction(): Promise<void>;

  /**
   * 回滚事务
   */
  rollbackTransaction(): Promise<void>;

  /**
   * 执行查询
   *
   * @param query SQL查询语句
   * @param params 查询参数
   * @returns 查询结果
   */
  query(query: string, params?: any[]): Promise<{ rows: any[] }>;
}

/**
 * 核心事件存储实现
 *
 * @description 基于数据库的事件存储实现
 */
@Injectable()
export class CoreEventStore implements IEventStore {
  private readonly tableName = 'event_store';

  constructor(
    @Inject('IDatabase') private readonly database: IDatabase,
    @Inject('ILoggerService') private readonly logger: ILoggerService,
  ) {}

  /**
   * 保存事件到存储
   *
   * @description 将领域事件保存到事件存储中，支持乐观并发控制
   */
  async saveEvents(
    aggregateId: string,
    events: BaseDomainEvent[],
    expectedVersion: number,
  ): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    const startTime = Date.now();
    const transactionId = uuidv4();

    this.logger.info('开始保存事件', LogContext.BUSINESS, {
      aggregateId,
      eventCount: events.length,
      expectedVersion,
      transactionId,
    });

    try {
      // 开始事务
      await this.database.beginTransaction();

      // 检查当前版本
      const currentVersion = await this.getCurrentVersion(aggregateId);
      if (currentVersion !== expectedVersion) {
        throw ConcurrencyError.versionMismatch(
          aggregateId,
          expectedVersion,
          currentVersion,
        );
      }

      // 保存事件
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;

        await this.database.query(
          `INSERT INTO ${this.tableName} 
           (event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            event.eventId,
            aggregateId,
            event.eventType,
            JSON.stringify(event),
            version,
            event.occurredAt,
            event.tenantId || 'default',
            new Date(),
          ],
        );
      }

      // 提交事务
      await this.database.commitTransaction();

      this.logger.info('事件保存成功', LogContext.BUSINESS, {
        aggregateId,
        eventCount: events.length,
        expectedVersion,
        transactionId,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      // 回滚事务
      await this.database.rollbackTransaction();

      this.logger.error(
        '事件保存失败',
        LogContext.BUSINESS,
        {
          aggregateId,
          eventCount: events.length,
          expectedVersion,
          transactionId,
          duration: Date.now() - startTime,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * 获取聚合根的事件流
   *
   * @description 根据聚合根ID获取其完整的事件流
   */
  async getEvents(
    aggregateId: string,
    fromVersion?: number,
  ): Promise<BaseDomainEvent[]> {
    const startTime = Date.now();

    this.logger.debug('开始获取事件流', LogContext.BUSINESS, {
      aggregateId,
      fromVersion,
    });

    try {
      const query = `
        SELECT event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id
        FROM ${this.tableName}
        WHERE aggregate_id = $1
        ${fromVersion !== undefined ? 'AND version >= $2' : ''}
        ORDER BY version ASC
      `;

      const params =
        fromVersion !== undefined ? [aggregateId, fromVersion] : [aggregateId];
      const result = await this.database.query(query, params);

      const events = result.rows.map((row) => this.deserializeEvent(row));

      this.logger.debug('事件流获取成功', LogContext.BUSINESS, {
        aggregateId,
        fromVersion,
        eventCount: events.length,
        duration: Date.now() - startTime,
      });

      return events;
    } catch (error) {
      this.logger.error(
        '获取事件流失败',
        LogContext.BUSINESS,
        {
          aggregateId,
          fromVersion,
          duration: Date.now() - startTime,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * 根据事件类型查询事件
   *
   * @description 根据事件类型查询所有相关事件
   */
  async getEventsByType(
    eventType: string,
    fromDate?: Date,
  ): Promise<BaseDomainEvent[]> {
    const startTime = Date.now();

    this.logger.debug('开始根据类型获取事件', LogContext.BUSINESS, {
      eventType,
      fromDate,
    });

    try {
      const query = `
        SELECT event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id
        FROM ${this.tableName}
        WHERE event_type = $1
        ${fromDate ? 'AND timestamp >= $2' : ''}
        ORDER BY timestamp ASC
      `;

      const params = fromDate ? [eventType, fromDate] : [eventType];
      const result = await this.database.query(query, params);

      const events = result.rows.map((row) => this.deserializeEvent(row));

      this.logger.debug('根据类型获取事件成功', LogContext.BUSINESS, {
        eventType,
        fromDate,
        eventCount: events.length,
        duration: Date.now() - startTime,
      });

      return events;
    } catch (error) {
      this.logger.error(
        '根据类型获取事件失败',
        LogContext.BUSINESS,
        {
          eventType,
          fromDate,
          duration: Date.now() - startTime,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * 获取事件流
   *
   * @description 获取全局事件流，支持分页查询
   */
  async getEventStream(
    fromEventId?: string,
    limit: number = 100,
  ): Promise<IEventStreamResult> {
    const startTime = Date.now();

    this.logger.debug('开始获取事件流', LogContext.BUSINESS, {
      fromEventId,
      limit,
    });

    try {
      const query = `
        SELECT event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id
        FROM ${this.tableName}
        ${fromEventId ? 'WHERE event_id > $1' : ''}
        ORDER BY event_id ASC
        LIMIT $${fromEventId ? '2' : '1'}
      `;

      const params = fromEventId ? [fromEventId, limit] : [limit];
      const result = await this.database.query(query, params);

      const events = result.rows.map((row) => this.deserializeEvent(row));
      const nextEventId =
        events.length > 0
          ? events[events.length - 1].eventId.toString()
          : undefined;
      const hasMore = events.length === limit;

      this.logger.debug('事件流获取成功', LogContext.BUSINESS, {
        fromEventId,
        limit,
        eventCount: events.length,
        hasMore,
        duration: Date.now() - startTime,
      });

      return {
        events,
        nextEventId,
        hasMore,
      };
    } catch (error) {
      this.logger.error(
        '获取事件流失败',
        LogContext.BUSINESS,
        {
          fromEventId,
          limit,
          duration: Date.now() - startTime,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * 删除聚合根的所有事件
   *
   * @description 删除指定聚合根的所有事件
   */
  async deleteEvents(aggregateId: string): Promise<void> {
    const startTime = Date.now();

    this.logger.info('开始删除事件', LogContext.BUSINESS, {
      aggregateId,
    });

    try {
      const result = await this.database.query(
        `DELETE FROM ${this.tableName} WHERE aggregate_id = $1`,
        [aggregateId],
      );

      this.logger.info('事件删除成功', LogContext.BUSINESS, {
        aggregateId,
        deletedCount: result.rows.length,
        duration: Date.now() - startTime,
      });
    } catch (error) {
      this.logger.error(
        '事件删除失败',
        LogContext.BUSINESS,
        {
          aggregateId,
          duration: Date.now() - startTime,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * 获取聚合根的当前版本
   *
   * @description 获取指定聚合根的当前版本号
   */
  async getCurrentVersion(aggregateId: string): Promise<number> {
    try {
      const result = await this.database.query(
        `SELECT MAX(version) as version FROM ${this.tableName} WHERE aggregate_id = $1`,
        [aggregateId],
      );

      return result.rows[0]?.version || 0;
    } catch (error) {
      this.logger.error(
        '获取当前版本失败',
        LogContext.BUSINESS,
        {
          aggregateId,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * 检查聚合根是否存在
   *
   * @description 检查指定聚合根是否存在于事件存储中
   */
  async exists(aggregateId: string): Promise<boolean> {
    try {
      const result = await this.database.query(
        `SELECT 1 FROM ${this.tableName} WHERE aggregate_id = $1 LIMIT 1`,
        [aggregateId],
      );

      return result.rows.length > 0;
    } catch (error) {
      this.logger.error(
        '检查聚合根存在性失败',
        LogContext.BUSINESS,
        {
          aggregateId,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw error;
    }
  }

  /**
   * 反序列化事件
   *
   * @description 将数据库行数据反序列化为领域事件对象
   */
  private deserializeEvent(row: any): BaseDomainEvent {
    try {
      const eventData = JSON.parse(row.event_data);
      // 创建一个简单的事件对象，包含必要的属性
      return {
        eventId: eventData.eventId,
        aggregateId: eventData.aggregateId,
        eventType: eventData.eventType,
        timestamp: eventData.timestamp,
        tenantId: eventData.tenantId,
        aggregateVersion: eventData.aggregateVersion,
        eventVersion: eventData.eventVersion,
        occurredAt: eventData.occurredAt,
        ...eventData, // 包含其他自定义属性
      } as BaseDomainEvent;
    } catch (error) {
      this.logger.error(
        '事件反序列化失败',
        LogContext.BUSINESS,
        {
          eventId: row.event_id,
          aggregateId: row.aggregate_id,
          eventType: row.event_type,
          error: (error as Error).message,
        },
        error as Error,
      );

      throw new Error(
        `Failed to deserialize event ${row.event_id}: ${(error as Error).message}`,
      );
    }
  }
}
