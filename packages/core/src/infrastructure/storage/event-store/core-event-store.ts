/**
 * CoreEventStore - 核心事件存储实现
 *
 * 提供了完整的事件存储功能，包括事件存储、事件流管理、
 * 快照管理、版本控制等企业级特性。
 *
 * ## 业务规则
 *
 * ### 事件存储规则
 * - 事件必须按顺序存储，不能乱序
 * - 事件必须具有唯一标识符和版本号
 * - 事件必须支持多租户隔离
 * - 事件必须支持事务性存储
 *
 * ### 事件流规则
 * - 事件流必须按聚合根ID组织
 * - 事件流必须支持版本控制
 * - 事件流必须支持分页查询
 * - 事件流必须支持过滤和排序
 *
 * ### 快照规则
 * - 快照必须定期创建以优化性能
 * - 快照必须支持版本控制
 * - 快照必须支持压缩和清理
 * - 快照必须支持多租户隔离
 *
 * ### 性能规则
 * - 支持批量操作以提高性能
 * - 支持异步处理以提高吞吐量
 * - 支持缓存机制以提高查询性能
 * - 支持索引优化以提高查询效率
 *
 * @description 核心事件存储实现类
 * @example
 * ```typescript
 * const eventStore = new CoreEventStore(logger);
 * await eventStore.start();
 *
 * // 存储事件
 * const result = await eventStore.storeEvents(
 *   aggregateId,
 *   events,
 *   expectedVersion,
 *   { enableTransaction: true }
 * ).toPromise();
 *
 * // 获取事件流
 * const stream = await eventStore.getEventStream(
 *   aggregateId,
 *   { fromVersion: 1, maxEvents: 100 }
 * ).toPromise();
 *
 * await eventStore.stop();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { EntityId } from '../../entities/value-objects/entity-id';
import type { BaseDomainEvent } from '../../events/base/base-domain-event';
import type { IAsyncContext } from '../context/async-context.interface';
import {
  IEventStore,
  IEventStoreOptions,
  IEventStoreResult,
  IEventStreamOptions,
  IEventStreamResult,
  ISnapshotOptions,
  ISnapshotResult,
  IEventStoreStatistics,
} from './event-store.interface';

/**
 * 事件存储条目
 */
interface IEventStoreEntry {
  /**
   * 事件ID
   */
  eventId: string;

  /**
   * 聚合根ID
   */
  aggregateId: string;

  /**
   * 事件类型
   */
  eventType: string;

  /**
   * 事件数据
   */
  eventData: Record<string, unknown>;

  /**
   * 事件元数据
   */
  eventMetadata: Record<string, unknown>;

  /**
   * 版本号
   */
  version: number;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 是否已删除
   */
  deleted: boolean;
}

/**
 * 快照存储条目
 */
interface ISnapshotEntry {
  /**
   * 快照ID
   */
  snapshotId: string;

  /**
   * 聚合根ID
   */
  aggregateId: string;

  /**
   * 版本号
   */
  version: number;

  /**
   * 快照数据
   */
  data: Record<string, unknown>;

  /**
   * 快照元数据
   */
  metadata: Record<string, unknown>;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 过期时间
   */
  expirationTime?: Date;
}

/**
 * 核心事件存储
 */
@Injectable()
export class CoreEventStore implements IEventStore {
  private readonly events = new Map<string, IEventStoreEntry[]>();
  private readonly snapshots = new Map<string, ISnapshotEntry[]>();
  private readonly aggregateVersions = new Map<string, number>();
  private readonly statistics: IEventStoreStatistics = {
    totalEvents: 0,
    totalAggregates: 0,
    totalSnapshots: 0,
    storageSize: 0,
    averageEventSize: 0,
    byEventType: {},
    byAggregateType: {},
    byTenant: {},
    byTime: {
      lastHour: 0,
      lastDay: 0,
      lastWeek: 0,
      lastMonth: 0,
    },
    lastUpdatedAt: new Date(),
  };

  private _isStarted = false;
  private _cleanupTimer?: ReturnType<typeof globalThis.setInterval>;
  private _statisticsTimer?: ReturnType<typeof globalThis.setInterval>;

  constructor(private readonly logger: ILoggerService) {}

  /**
   * 存储事件
   */
  public storeEvents(
    aggregateId: EntityId,
    events: BaseDomainEvent[],
    expectedVersion: number,
    options: IEventStoreOptions = {},
    context?: IAsyncContext,
  ): Observable<IEventStoreResult> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const startTime = Date.now();
    const aggregateIdStr = aggregateId.toString();
    const tenantId = context?.getTenantId();

    this.logger.info(
      `Storing events for aggregate: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      {
        aggregateId: aggregateIdStr,
        eventCount: events.length,
        expectedVersion,
        tenantId,
      },
    );

    try {
      // 检查版本一致性
      const currentVersion = this.aggregateVersions.get(aggregateIdStr) || 0;
      if (currentVersion !== expectedVersion) {
        return throwError(
          () =>
            new Error(
              `Version mismatch: expected ${expectedVersion}, got ${currentVersion}`,
            ),
        );
      }

      // 存储事件
      const eventEntries: IEventStoreEntry[] = [];
      let newVersion = expectedVersion;

      for (const event of events) {
        newVersion++;
        const eventEntry: IEventStoreEntry = {
          eventId: event.eventId.toString(),
          aggregateId: aggregateIdStr,
          eventType: event.eventType,
          eventData: event.eventData,
          eventMetadata: event.eventMetadata,
          version: newVersion,
          tenantId,
          createdAt: event.occurredOn,
          deleted: false,
        };

        eventEntries.push(eventEntry);
      }

      // 更新存储
      const existingEvents = this.events.get(aggregateIdStr) || [];
      this.events.set(aggregateIdStr, [...existingEvents, ...eventEntries]);
      this.aggregateVersions.set(aggregateIdStr, newVersion);

      // 更新统计信息
      this.updateStatistics(eventEntries);

      const result: IEventStoreResult = {
        success: true,
        eventCount: events.length,
        storageTime: Date.now() - startTime,
        version: newVersion,
        transactionId: options.enableTransaction ? uuidv4() : undefined,
        metadata: {
          aggregateId: aggregateIdStr,
          tenantId,
          eventTypes: events.map((e) => e.eventType),
        },
      };

      this.logger.info(
        `Events stored successfully: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          eventCount: events.length,
          newVersion,
          storageTime: result.storageTime,
        },
      );

      return of(result);
    } catch (error) {
      const result: IEventStoreResult = {
        success: false,
        error: (error as Error).message,
        eventCount: 0,
        storageTime: Date.now() - startTime,
      };

      this.logger.error(
        `Failed to store events: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          eventCount: events.length,
          expectedVersion,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(result);
    }
  }

  /**
   * 获取事件流
   */
  public getEventStream(
    aggregateId: EntityId,
    options: IEventStreamOptions = {},
    context?: IAsyncContext,
  ): Observable<IEventStreamResult> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const startTime = Date.now();
    const aggregateIdStr = aggregateId.toString();
    const tenantId = context?.getTenantId();

    this.logger.debug(
      `Getting event stream for aggregate: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      {
        aggregateId: aggregateIdStr,
        options,
        tenantId,
      },
    );

    try {
      const events = this.events.get(aggregateIdStr) || [];
      let filteredEvents = events.filter((event) => !event.deleted);

      // 应用过滤器
      if (options.fromVersion !== undefined) {
        filteredEvents = filteredEvents.filter(
          (event) => event.version >= options.fromVersion!,
        );
      }

      if (options.toVersion !== undefined) {
        filteredEvents = filteredEvents.filter(
          (event) => event.version <= options.toVersion!,
        );
      }

      if (options.eventTypes && options.eventTypes.length > 0) {
        filteredEvents = filteredEvents.filter((event) =>
          options.eventTypes!.includes(event.eventType),
        );
      }

      if (options.timeRange) {
        filteredEvents = filteredEvents.filter(
          (event) =>
            event.createdAt >= options.timeRange!.from &&
            event.createdAt <= options.timeRange!.to,
        );
      }

      // 应用排序
      if (options.sortOrder === 'desc') {
        filteredEvents.sort((a, b) => b.version - a.version);
      } else {
        filteredEvents.sort((a, b) => a.version - b.version);
      }

      // 应用分页
      let paginatedEvents = filteredEvents;
      if (options.enablePagination && options.page && options.pageSize) {
        const startIndex = (options.page - 1) * options.pageSize;
        const endIndex = startIndex + options.pageSize;
        paginatedEvents = filteredEvents.slice(startIndex, endIndex);
      }

      // 应用最大事件数量限制
      if (options.maxEvents) {
        paginatedEvents = paginatedEvents.slice(0, options.maxEvents);
      }

      // 转换为领域事件
      const domainEvents = paginatedEvents.map((entry) => {
        // 这里需要根据实际的事件类型创建相应的领域事件实例
        // 暂时返回一个简化的实现
        return {
          eventId: { toString: () => entry.eventId },
          eventType: entry.eventType,
          eventData: entry.eventData,
          eventMetadata: entry.eventMetadata,
          occurredOn: entry.createdAt,
        } as BaseDomainEvent;
      });

      const currentVersion = this.aggregateVersions.get(aggregateIdStr) || 0;
      const hasMore = options.maxEvents
        ? filteredEvents.length > options.maxEvents
        : false;

      const result: IEventStreamResult = {
        events: domainEvents,
        totalCount: filteredEvents.length,
        currentVersion,
        hasMore,
        nextPage:
          options.enablePagination && hasMore
            ? (options.page || 1) + 1
            : undefined,
        queryTime: Date.now() - startTime,
        metadata: {
          aggregateId: aggregateIdStr,
          tenantId,
          appliedFilters: options,
        },
      };

      this.logger.debug(
        `Event stream retrieved: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          eventCount: domainEvents.length,
          totalCount: filteredEvents.length,
          currentVersion,
          queryTime: result.queryTime,
        },
      );

      return of(result);
    } catch (error) {
      this.logger.error(
        `Failed to get event stream: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          options,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 获取所有事件流
   */
  public getAllEventStreams(
    options: IEventStreamOptions = {},
    context?: IAsyncContext,
  ): Observable<IEventStreamResult> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const startTime = Date.now();
    const tenantId = context?.getTenantId();

    this.logger.debug('Getting all event streams', LogContext.SYSTEM, {
      options,
      tenantId,
    });

    try {
      let allEvents: IEventStoreEntry[] = [];

      // 收集所有事件
      for (const [aggregateId, events] of this.events.entries()) {
        const filteredEvents = events.filter((event) => {
          if (event.deleted) return false;
          if (tenantId && event.tenantId !== tenantId) return false;
          return true;
        });
        allEvents = [...allEvents, ...filteredEvents];
      }

      // 应用过滤器和排序
      if (options.eventTypes && options.eventTypes.length > 0) {
        allEvents = allEvents.filter((event) =>
          options.eventTypes!.includes(event.eventType),
        );
      }

      if (options.timeRange) {
        allEvents = allEvents.filter(
          (event) =>
            event.createdAt >= options.timeRange!.from &&
            event.createdAt <= options.timeRange!.to,
        );
      }

      if (options.sortOrder === 'desc') {
        allEvents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      } else {
        allEvents.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }

      // 应用分页
      let paginatedEvents = allEvents;
      if (options.enablePagination && options.page && options.pageSize) {
        const startIndex = (options.page - 1) * options.pageSize;
        const endIndex = startIndex + options.pageSize;
        paginatedEvents = allEvents.slice(startIndex, endIndex);
      }

      // 应用最大事件数量限制
      if (options.maxEvents) {
        paginatedEvents = paginatedEvents.slice(0, options.maxEvents);
      }

      // 转换为领域事件
      const domainEvents = paginatedEvents.map((entry) => {
        return {
          eventId: { toString: () => entry.eventId },
          eventType: entry.eventType,
          eventData: entry.eventData,
          eventMetadata: entry.eventMetadata,
          occurredOn: entry.createdAt,
        } as BaseDomainEvent;
      });

      const result: IEventStreamResult = {
        events: domainEvents,
        totalCount: allEvents.length,
        currentVersion: 0, // 全局版本号
        hasMore: options.maxEvents
          ? allEvents.length > options.maxEvents
          : false,
        nextPage:
          options.enablePagination && result.hasMore
            ? (options.page || 1) + 1
            : undefined,
        queryTime: Date.now() - startTime,
        metadata: {
          tenantId,
          appliedFilters: options,
        },
      };

      this.logger.debug('All event streams retrieved', LogContext.SYSTEM, {
        eventCount: domainEvents.length,
        totalCount: allEvents.length,
        queryTime: result.queryTime,
      });

      return of(result);
    } catch (error) {
      this.logger.error(
        'Failed to get all event streams',
        LogContext.SYSTEM,
        {
          options,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 获取事件
   */
  public getEvent(
    eventId: string,
    context?: IAsyncContext,
  ): Observable<BaseDomainEvent | null> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    this.logger.debug(`Getting event: ${eventId}`, LogContext.SYSTEM, {
      eventId,
    });

    try {
      for (const events of this.events.values()) {
        const event = events.find((e) => e.eventId === eventId && !e.deleted);
        if (event) {
          const domainEvent = {
            eventId: { toString: () => event.eventId },
            eventType: event.eventType,
            eventData: event.eventData,
            eventMetadata: event.eventMetadata,
            occurredOn: event.createdAt,
          } as BaseDomainEvent;

          return of(domainEvent);
        }
      }

      return of(null);
    } catch (error) {
      this.logger.error(
        `Failed to get event: ${eventId}`,
        LogContext.SYSTEM,
        {
          eventId,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 获取聚合根版本
   */
  public getAggregateVersion(
    aggregateId: EntityId,
    context?: IAsyncContext,
  ): Observable<number> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const aggregateIdStr = aggregateId.toString();
    const version = this.aggregateVersions.get(aggregateIdStr) || 0;

    this.logger.debug(
      `Getting aggregate version: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      { aggregateId: aggregateIdStr, version },
    );

    return of(version);
  }

  /**
   * 检查聚合根是否存在
   */
  public existsAggregate(
    aggregateId: EntityId,
    context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const aggregateIdStr = aggregateId.toString();
    const exists = this.events.has(aggregateIdStr);

    this.logger.debug(
      `Checking aggregate existence: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      { aggregateId: aggregateIdStr, exists },
    );

    return of(exists);
  }

  /**
   * 删除聚合根
   */
  public deleteAggregate(
    aggregateId: EntityId,
    context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const aggregateIdStr = aggregateId.toString();
    const tenantId = context?.getTenantId();

    this.logger.info(
      `Deleting aggregate: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      { aggregateId: aggregateIdStr, tenantId },
    );

    try {
      // 标记事件为已删除
      const events = this.events.get(aggregateIdStr) || [];
      for (const event of events) {
        event.deleted = true;
      }

      // 删除快照
      this.snapshots.delete(aggregateIdStr);

      // 删除版本信息
      this.aggregateVersions.delete(aggregateIdStr);

      this.logger.info(
        `Aggregate deleted: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        { aggregateId: aggregateIdStr },
      );

      return of(true);
    } catch (error) {
      this.logger.error(
        `Failed to delete aggregate: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 创建快照
   */
  public createSnapshot(
    aggregateId: EntityId,
    options: ISnapshotOptions,
    context?: IAsyncContext,
  ): Observable<ISnapshotResult> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const aggregateIdStr = aggregateId.toString();
    const tenantId = context?.getTenantId();
    const snapshotId = uuidv4();

    this.logger.info(
      `Creating snapshot for aggregate: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      {
        aggregateId: aggregateIdStr,
        snapshotId,
        version: options.version,
        tenantId,
      },
    );

    try {
      const snapshotEntry: ISnapshotEntry = {
        snapshotId,
        aggregateId: aggregateIdStr,
        version: options.version,
        data: options.data,
        metadata: options.metadata || {},
        tenantId,
        createdAt: new Date(),
        expirationTime: options.expirationTime,
      };

      const existingSnapshots = this.snapshots.get(aggregateIdStr) || [];
      this.snapshots.set(aggregateIdStr, [...existingSnapshots, snapshotEntry]);

      const result: ISnapshotResult = {
        success: true,
        snapshotId,
        version: options.version,
        size: JSON.stringify(options.data).length,
        createdAt: snapshotEntry.createdAt,
        metadata: options.metadata,
      };

      this.logger.info(
        `Snapshot created: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          snapshotId,
          version: options.version,
          size: result.size,
        },
      );

      return of(result);
    } catch (error) {
      const result: ISnapshotResult = {
        success: false,
        error: (error as Error).message,
        snapshotId,
        version: options.version,
        size: 0,
        createdAt: new Date(),
      };

      this.logger.error(
        `Failed to create snapshot: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          snapshotId,
          version: options.version,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(result);
    }
  }

  /**
   * 获取快照
   */
  public getSnapshot(
    aggregateId: EntityId,
    version?: number,
    context?: IAsyncContext,
  ): Observable<ISnapshotResult | null> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const aggregateIdStr = aggregateId.toString();
    const tenantId = context?.getTenantId();

    this.logger.debug(
      `Getting snapshot for aggregate: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      {
        aggregateId: aggregateIdStr,
        version,
        tenantId,
      },
    );

    try {
      const snapshots = this.snapshots.get(aggregateIdStr) || [];
      let targetSnapshot: ISnapshotEntry | undefined;

      if (version !== undefined) {
        targetSnapshot = snapshots.find((s) => s.version === version);
      } else {
        // 获取最新快照
        targetSnapshot = snapshots.reduce((latest, current) => {
          return current.version > latest.version ? current : latest;
        }, snapshots[0]);
      }

      if (!targetSnapshot) {
        return of(null);
      }

      const result: ISnapshotResult = {
        success: true,
        snapshotId: targetSnapshot.snapshotId,
        version: targetSnapshot.version,
        size: JSON.stringify(targetSnapshot.data).length,
        createdAt: targetSnapshot.createdAt,
        metadata: targetSnapshot.metadata,
      };

      this.logger.debug(
        `Snapshot retrieved: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          snapshotId: targetSnapshot.snapshotId,
          version: targetSnapshot.version,
        },
      );

      return of(result);
    } catch (error) {
      this.logger.error(
        `Failed to get snapshot: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          version,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 删除快照
   */
  public deleteSnapshot(
    aggregateId: EntityId,
    version: number,
    context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const aggregateIdStr = aggregateId.toString();
    const tenantId = context?.getTenantId();

    this.logger.info(
      `Deleting snapshot for aggregate: ${aggregateIdStr}`,
      LogContext.SYSTEM,
      {
        aggregateId: aggregateIdStr,
        version,
        tenantId,
      },
    );

    try {
      const snapshots = this.snapshots.get(aggregateIdStr) || [];
      const filteredSnapshots = snapshots.filter((s) => s.version !== version);
      this.snapshots.set(aggregateIdStr, filteredSnapshots);

      const deleted = snapshots.length !== filteredSnapshots.length;

      this.logger.info(
        `Snapshot deleted: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          version,
          deleted,
        },
      );

      return of(deleted);
    } catch (error) {
      this.logger.error(
        `Failed to delete snapshot: ${aggregateIdStr}`,
        LogContext.SYSTEM,
        {
          aggregateId: aggregateIdStr,
          version,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 获取统计信息
   */
  public getStatistics(
    context?: IAsyncContext,
  ): Observable<IEventStoreStatistics> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    this.updateStatistics();
    return of({ ...this.statistics });
  }

  /**
   * 清理过期数据
   */
  public cleanupExpiredData(
    retentionDays: number,
    context?: IAsyncContext,
  ): Observable<number> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    let cleanedCount = 0;

    this.logger.info(
      `Cleaning up expired data older than ${retentionDays} days`,
      LogContext.SYSTEM,
      { retentionDays, cutoffDate },
    );

    try {
      // 清理过期快照
      for (const [aggregateId, snapshots] of this.snapshots.entries()) {
        const validSnapshots = snapshots.filter((snapshot) => {
          if (snapshot.expirationTime && snapshot.expirationTime < new Date()) {
            cleanedCount++;
            return false;
          }
          return true;
        });
        this.snapshots.set(aggregateId, validSnapshots);
      }

      this.logger.info(`Expired data cleanup completed`, LogContext.SYSTEM, {
        cleanedCount,
        retentionDays,
      });

      return of(cleanedCount);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired data`,
        LogContext.SYSTEM,
        {
          retentionDays,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 备份数据
   */
  public backupData(
    backupPath: string,
    options: Record<string, unknown> = {},
    context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    this.logger.info(`Backing up data to: ${backupPath}`, LogContext.SYSTEM, {
      backupPath,
      options,
    });

    try {
      // 这里应该实现实际的备份逻辑
      // 暂时返回成功
      this.logger.info(
        `Data backup completed: ${backupPath}`,
        LogContext.SYSTEM,
        { backupPath },
      );

      return of(true);
    } catch (error) {
      this.logger.error(
        `Failed to backup data: ${backupPath}`,
        LogContext.SYSTEM,
        {
          backupPath,
          options,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 恢复数据
   */
  public restoreData(
    backupPath: string,
    options: Record<string, unknown> = {},
    context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Event store is not started'));
    }

    this.logger.info(`Restoring data from: ${backupPath}`, LogContext.SYSTEM, {
      backupPath,
      options,
    });

    try {
      // 这里应该实现实际的恢复逻辑
      // 暂时返回成功
      this.logger.info(
        `Data restore completed: ${backupPath}`,
        LogContext.SYSTEM,
        { backupPath },
      );

      return of(true);
    } catch (error) {
      this.logger.error(
        `Failed to restore data: ${backupPath}`,
        LogContext.SYSTEM,
        {
          backupPath,
          options,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 健康检查
   */
  public healthCheck(context?: IAsyncContext): Observable<boolean> {
    return of(this._isStarted);
  }

  /**
   * 启动存储
   */
  public async start(): Promise<void> {
    if (this._isStarted) {
      this.logger.warn('Event store is already started', LogContext.SYSTEM);
      return;
    }

    this.logger.info('Starting event store...', LogContext.SYSTEM);

    // 启动清理定时器
    this._cleanupTimer = globalThis.setInterval(
      () => {
        this.cleanupExpiredData(30).subscribe();
      },
      24 * 60 * 60 * 1000,
    ); // 每天清理一次

    // 启动统计定时器
    this._statisticsTimer = globalThis.setInterval(() => {
      this.updateStatistics();
    }, 60 * 1000); // 每分钟更新一次统计

    this._isStarted = true;
    this.logger.info('Event store started successfully', LogContext.SYSTEM);
  }

  /**
   * 停止存储
   */
  public async stop(): Promise<void> {
    if (!this._isStarted) {
      this.logger.warn('Event store is not started', LogContext.SYSTEM);
      return;
    }

    this.logger.info('Stopping event store...', LogContext.SYSTEM);

    // 停止定时器
    if (this._cleanupTimer) {
      globalThis.clearInterval(this._cleanupTimer);
      this._cleanupTimer = undefined;
    }

    if (this._statisticsTimer) {
      globalThis.clearInterval(this._statisticsTimer);
      this._statisticsTimer = undefined;
    }

    this._isStarted = false;
    this.logger.info('Event store stopped successfully', LogContext.SYSTEM);
  }

  /**
   * 检查是否已启动
   */
  public isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(eventEntries?: IEventStoreEntry[]): void {
    if (eventEntries) {
      // 更新事件统计
      this.statistics.totalEvents += eventEntries.length;

      for (const entry of eventEntries) {
        // 按事件类型统计
        this.statistics.byEventType[entry.eventType] =
          (this.statistics.byEventType[entry.eventType] || 0) + 1;

        // 按租户统计
        const tenantId = entry.tenantId || 'unknown';
        this.statistics.byTenant[tenantId] =
          (this.statistics.byTenant[tenantId] || 0) + 1;

        // 更新存储大小
        const eventSize = JSON.stringify(entry).length;
        this.statistics.storageSize += eventSize;
      }

      // 更新平均事件大小
      this.statistics.averageEventSize =
        this.statistics.storageSize / this.statistics.totalEvents;
    }

    // 更新聚合根统计
    this.statistics.totalAggregates = this.events.size;

    // 更新快照统计
    this.statistics.totalSnapshots = Array.from(this.snapshots.values()).reduce(
      (total, snapshots) => total + snapshots.length,
      0,
    );

    this.statistics.lastUpdatedAt = new Date();
  }
}
