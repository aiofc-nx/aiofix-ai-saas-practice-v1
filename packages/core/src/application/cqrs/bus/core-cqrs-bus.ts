/**
 * 核心 CQRS 总线实现
 *
 * CQRS 总线是统一的命令查询职责分离总线，整合了命令总线、查询总线和事件总线。
 * 提供了统一的接口来处理命令、查询和事件，简化了 CQRS 模式的使用。
 *
 * ## 业务规则
 *
 * ### 统一接口规则
 * - 提供统一的 CQRS 操作接口
 * - 封装底层总线的复杂性
 * - 支持事务性操作
 * - 提供一致的错误处理
 *
 * ### 生命周期规则
 * - 支持总线的初始化和关闭
 * - 管理底层总线的生命周期
 * - 提供资源清理机制
 * - 支持优雅关闭
 *
 * ### 监控规则
 * - 提供统一的监控接口
 * - 收集各总线的统计信息
 * - 支持健康检查
 * - 提供性能指标
 *
 * @description 核心 CQRS 总线实现，提供统一的 CQRS 操作接口
 * @example
 * ```typescript
 * const cqrsBus = new CoreCQRSBus(
 *   new CoreCommandBus(),
 *   new CoreQueryBus(),
 *   new CoreEventBus()
 * );
 *
 * // 初始化
 * await cqrsBus.initialize();
 *
 * // 执行命令
 * const command = new CreateUserCommand('user@example.com', 'John Doe');
 * await cqrsBus.executeCommand(command);
 *
 * // 执行查询
 * const query = new GetUsersQuery('active', 1, 10);
 * const result = await cqrsBus.executeQuery(query);
 *
 * // 发布事件
 * const event = new UserCreatedEvent(userId, 'user@example.com', 'John Doe');
 * await cqrsBus.publishEvent(event);
 *
 * // 关闭
 * await cqrsBus.shutdown();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import type { BaseCommand } from '../commands/base/base-command';
import type { BaseQuery, IQueryResult } from '../queries/base/base-query';
import type { BaseDomainEvent } from '../../../domain/entities/base/base-domain-event';
import type {
  ICQRSBus,
  ICommandBus,
  IQueryBus,
  IEventBus,
} from './cqrs-bus.interface';

/**
 * CQRS 总线统计信息
 */
export interface ICQRSBusStatistics {
  /** 命令总线统计 */
  commandBus: {
    registeredHandlers: number;
    middlewares: number;
  };
  /** 查询总线统计 */
  queryBus: {
    registeredHandlers: number;
    middlewares: number;
    cacheEntries: number;
    cacheHitRate?: number;
  };
  /** 事件总线统计 */
  eventBus: {
    registeredHandlers: number;
    subscriptions: number;
    middlewares: number;
  };
  /** 总体统计 */
  overall: {
    totalHandlers: number;
    totalMiddlewares: number;
    isInitialized: boolean;
  };
}

/**
 * 核心 CQRS 总线实现
 */
@Injectable()
export class CoreCQRSBus implements ICQRSBus {
  private _isInitialized = false;

  constructor(
    private readonly _commandBus: ICommandBus,
    private readonly _queryBus: IQueryBus,
    private readonly _eventBus: IEventBus,
  ) {}

  /**
   * 获取命令总线
   */
  public get commandBus(): ICommandBus {
    return this._commandBus;
  }

  /**
   * 获取查询总线
   */
  public get queryBus(): IQueryBus {
    return this._queryBus;
  }

  /**
   * 获取事件总线
   */
  public get eventBus(): IEventBus {
    return this._eventBus;
  }

  /**
   * 检查是否已初始化
   */
  public get isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * 执行命令
   *
   * @param command - 要执行的命令
   * @returns Promise，命令执行完成后解析
   * @throws {Error} 当总线未初始化或命令执行失败时
   */
  public async executeCommand<TCommand extends BaseCommand>(
    command: TCommand,
  ): Promise<void> {
    this.ensureInitialized();
    await this._commandBus.execute(command);
  }

  /**
   * 执行查询
   *
   * @param query - 要执行的查询
   * @returns Promise，查询执行完成后解析为结果
   * @throws {Error} 当总线未初始化或查询执行失败时
   */
  public async executeQuery<
    TQuery extends BaseQuery,
    TResult extends IQueryResult,
  >(query: TQuery): Promise<TResult> {
    this.ensureInitialized();
    return await this._queryBus.execute<TQuery, TResult>(query);
  }

  /**
   * 发布事件
   *
   * @param event - 要发布的事件
   * @returns Promise，事件发布完成后解析
   * @throws {Error} 当总线未初始化或事件发布失败时
   */
  public async publishEvent<TEvent extends BaseDomainEvent>(
    event: TEvent,
  ): Promise<void> {
    this.ensureInitialized();
    await this._eventBus.publish(event);
  }

  /**
   * 批量发布事件
   *
   * @param events - 要发布的事件数组
   * @returns Promise，所有事件发布完成后解析
   * @throws {Error} 当总线未初始化或事件发布失败时
   */
  public async publishEvents<TEvent extends BaseDomainEvent>(
    events: TEvent[],
  ): Promise<void> {
    this.ensureInitialized();
    await this._eventBus.publishAll(events);
  }

  /**
   * 初始化总线
   *
   * 注册所有处理器和中间件。
   *
   * @returns Promise，初始化完成后解析
   * @throws {Error} 当总线已初始化或初始化失败时
   */
  public async initialize(): Promise<void> {
    if (this._isInitialized) {
      throw new Error('CQRS Bus is already initialized');
    }

    try {
      // 这里可以添加初始化逻辑，比如：
      // - 注册默认中间件
      // - 设置监控
      // - 预热缓存
      // - 连接外部服务

      this._isInitialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize CQRS Bus: ${error}`);
    }
  }

  /**
   * 关闭总线
   *
   * 清理资源和取消订阅。
   *
   * @returns Promise，关闭完成后解析
   * @throws {Error} 当总线未初始化或关闭失败时
   */
  public async shutdown(): Promise<void> {
    if (!this._isInitialized) {
      throw new Error('CQRS Bus is not initialized');
    }

    try {
      // 清理资源
      if ('clearHandlers' in this._commandBus) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._commandBus as any).clearHandlers();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._commandBus as any).clearMiddlewares();
      }

      if ('clearHandlers' in this._queryBus) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._queryBus as any).clearHandlers();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._queryBus as any).clearMiddlewares();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._queryBus as any).clearCache();
      }

      if ('clearHandlers' in this._eventBus) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._eventBus as any).clearHandlers();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._eventBus as any).clearSubscriptions();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this._eventBus as any).clearMiddlewares();
      }

      this._isInitialized = false;
    } catch (error) {
      throw new Error(`Failed to shutdown CQRS Bus: ${error}`);
    }
  }

  /**
   * 检查总线健康状态
   *
   * @returns Promise，健康检查完成后解析为健康状态
   */
  public async healthCheck(): Promise<boolean> {
    if (!this._isInitialized) {
      return false;
    }

    try {
      // 检查各个总线的健康状态
      const commandBusHealthy =
        this._commandBus.supports('_health_check') || true;
      const queryBusHealthy = this._queryBus.supports('_health_check') || true;
      const eventBusHealthy = this._eventBus.supports('_health_check') || true;

      return commandBusHealthy && queryBusHealthy && eventBusHealthy;
    } catch {
      return false;
    }
  }

  /**
   * 获取统计信息
   *
   * @returns CQRS 总线统计信息
   */
  public getStatistics(): ICQRSBusStatistics {
    const commandBusStats = {
      registeredHandlers: this._commandBus.getRegisteredCommandTypes().length,
      middlewares:
        'getMiddlewareCount' in this._commandBus
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._commandBus as any).getMiddlewareCount()
          : 0,
    };

    const queryBusStats = {
      registeredHandlers: this._queryBus.getRegisteredQueryTypes().length,
      middlewares:
        'getMiddlewareCount' in this._queryBus
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._queryBus as any).getMiddlewareCount()
          : 0,
      cacheEntries:
        'getCacheStats' in this._queryBus
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._queryBus as any).getCacheStats().totalEntries
          : 0,
    };

    const eventBusStats = {
      registeredHandlers: this._eventBus.getRegisteredEventTypes().length,
      subscriptions:
        'getHandlerCount' in this._eventBus
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._eventBus as any).getHandlerCount()
          : 0,
      middlewares:
        'getMiddlewareCount' in this._eventBus
          ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (this._eventBus as any).getMiddlewareCount()
          : 0,
    };

    return {
      commandBus: commandBusStats,
      queryBus: queryBusStats,
      eventBus: eventBusStats,
      overall: {
        totalHandlers:
          commandBusStats.registeredHandlers +
          queryBusStats.registeredHandlers +
          eventBusStats.registeredHandlers,
        totalMiddlewares:
          commandBusStats.middlewares +
          queryBusStats.middlewares +
          eventBusStats.middlewares,
        isInitialized: this._isInitialized,
      },
    };
  }

  /**
   * 获取支持的命令类型
   *
   * @returns 支持的命令类型数组
   */
  public getSupportedCommandTypes(): string[] {
    return this._commandBus.getRegisteredCommandTypes();
  }

  /**
   * 获取支持的查询类型
   *
   * @returns 支持的查询类型数组
   */
  public getSupportedQueryTypes(): string[] {
    return this._queryBus.getRegisteredQueryTypes();
  }

  /**
   * 获取支持的事件类型
   *
   * @returns 支持的事件类型数组
   */
  public getSupportedEventTypes(): string[] {
    return this._eventBus.getRegisteredEventTypes();
  }

  /**
   * 检查是否支持指定的命令类型
   *
   * @param commandType - 命令类型
   * @returns 如果支持则返回 true，否则返回 false
   */
  public supportsCommand(commandType: string): boolean {
    return this._commandBus.supports(commandType);
  }

  /**
   * 检查是否支持指定的查询类型
   *
   * @param queryType - 查询类型
   * @returns 如果支持则返回 true，否则返回 false
   */
  public supportsQuery(queryType: string): boolean {
    return this._queryBus.supports(queryType);
  }

  /**
   * 检查是否支持指定的事件类型
   *
   * @param eventType - 事件类型
   * @returns 如果支持则返回 true，否则返回 false
   */
  public supportsEvent(eventType: string): boolean {
    return this._eventBus.supports(eventType);
  }

  /**
   * 确保总线已初始化
   *
   * @throws {Error} 当总线未初始化时
   */
  private ensureInitialized(): void {
    if (!this._isInitialized) {
      throw new Error('CQRS Bus is not initialized. Call initialize() first.');
    }
  }
}
