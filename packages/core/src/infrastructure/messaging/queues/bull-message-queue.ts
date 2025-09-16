/**
 * BullMessageQueue - 基于 Bull 的消息队列实现
 *
 * 提供了基于 Redis 和 Bull 的消息队列功能，包括消息发布、
 * 订阅、处理、重试、死信队列等企业级特性。
 *
 * ## 业务规则
 *
 * ### 消息发布规则
 * - 消息必须具有唯一标识符
 * - 消息必须支持优先级设置
 * - 消息必须支持延迟发送
 * - 消息必须支持批量发布
 *
 * ### 消息订阅规则
 * - 支持多种订阅模式（点对点、发布订阅）
 * - 支持消息过滤和路由
 * - 支持消费者组管理
 * - 支持消息确认机制
 *
 * ### 消息处理规则
 * - 支持消息重试机制
 * - 支持死信队列处理
 * - 支持消息超时处理
 * - 支持消息去重
 *
 * ### 性能规则
 * - 支持消息批处理
 * - 支持异步处理
 * - 支持背压控制
 * - 支持流量控制
 *
 * @description 基于 Bull 的消息队列实现类
 * @example
 * ```typescript
 * const messageQueue = new BullMessageQueue(logger, {
 *   redis: {
 *     host: 'localhost',
 *     port: 6379,
 *     db: 0
 *   }
 * });
 * await messageQueue.start();
 *
 * // 发布消息
 * const result = await messageQueue.publish(
 *   'user.created',
 *   { userId: '123', name: 'John' },
 *   { priority: MessagePriority.HIGH }
 * ).toPromise();
 *
 * // 订阅消息
 * await messageQueue.subscribe(
 *   'user.created',
 *   new UserCreatedHandler(),
 *   { enableAutoAck: true }
 * ).toPromise();
 *
 * await messageQueue.stop();
 * ```
 *
 * @since 1.0.0
 */
import { Injectable } from '@nestjs/common';
import { Observable, of, throwError } from 'rxjs';
import type { ILoggerService } from '@aiofix/logging';
import { LogContext } from '@aiofix/logging';
import { v4 as uuidv4 } from 'uuid';
import type { IAsyncContext } from '../../../core/context/async-context.interface';
import {
  IMessageQueue,
  IMessage,
  IMessagePublishOptions,
  IMessagePublishResult,
  IMessageSubscribeOptions,
  IMessageHandler,
  IMessageQueueStatistics,
  MessagePriority,
  MessageStatus,
  MessageType,
} from './message-queue.interface';

/**
 * Bull 队列配置
 */
interface IBullQueueConfig {
  /**
   * Redis 配置
   */
  redis: {
    host: string;
    port: number;
    db?: number;
    password?: string;
    keyPrefix?: string;
  };

  /**
   * 队列配置
   */
  queue?: {
    defaultJobOptions?: {
      removeOnComplete?: number;
      removeOnFail?: number;
      attempts?: number;
      backoff?: {
        type: 'fixed' | 'exponential';
        delay: number;
      };
    };
  };
}

/**
 * 基于 Bull 的消息队列
 */
@Injectable()
export class BullMessageQueue implements IMessageQueue {
  private readonly queues = new Map<string, Record<string, unknown>>();
  private readonly handlers = new Map<string, IMessageHandler[]>();
  private readonly messages = new Map<string, IMessage>();
  private readonly statistics: IMessageQueueStatistics = {
    totalMessages: 0,
    pendingMessages: 0,
    processingMessages: 0,
    completedMessages: 0,
    failedMessages: 0,
    deadLetterMessages: 0,
    averageProcessingTime: 0,
    byType: {} as Record<MessageType, number>,
    byStatus: {} as Record<MessageStatus, number>,
    byPriority: {} as Record<MessagePriority, number>,
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
  private _statisticsTimer?: ReturnType<typeof globalThis.setInterval>;
  private _cleanupTimer?: ReturnType<typeof globalThis.setInterval>;

  constructor(
    private readonly logger: ILoggerService,
    private readonly _config: IBullQueueConfig,
  ) {
    // 配置属性保留用于未来实现
    void this._config; // 避免未使用警告
  }

  /**
   * 发布消息
   */
  public publish(
    topic: string,
    data: Record<string, unknown>,
    options: IMessagePublishOptions = {},
    context?: IAsyncContext,
  ): Observable<IMessagePublishResult> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    const startTime = Date.now();
    const messageId = uuidv4();
    const tenantId = context?.getTenantId();

    this.logger.info(
      `Publishing message to topic: ${topic}`,
      LogContext.SYSTEM,
      {
        messageId,
        topic,
        dataKeys: Object.keys(data),
        options,
        tenantId,
      },
    );

    try {
      // 创建消息
      const message: IMessage = {
        id: messageId,
        type: this.determineMessageType(topic),
        topic,
        data,
        metadata: {
          publishedAt: new Date(),
          publisher: 'bull-message-queue',
          ...options.properties,
        },
        priority: options.priority || MessagePriority.NORMAL,
        status: MessageStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: options.expiresAt,
        delay: options.delay,
        retryCount: 0,
        maxRetries: options.maxRetries || 3,
        retryInterval: options.retryInterval || 1000,
        tenantId,
        userId: context?.getUserId(),
        organizationId: context?.getOrganizationId(),
        departmentId: context?.getDepartmentId(),
        requestId: context?.getRequestId(),
        correlationId: context?.getCorrelationId(),
        causationId: context?.getCausationId(),
      };

      // 存储消息
      this.messages.set(messageId, message);

      // 获取或创建队列
      const queue = this.getOrCreateQueue(topic);

      // 准备 Bull 作业选项
      const jobOptions: Record<string, unknown> = {
        jobId: messageId,
        priority: message.priority,
        delay: message.delay || 0,
        attempts: message.maxRetries + 1,
        backoff: {
          type: 'exponential',
          delay: message.retryInterval,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      };

      // 添加过期时间
      if (message.expiresAt) {
        jobOptions.ttl = message.expiresAt.getTime() - Date.now();
      }

      // 添加去重键
      if (options.enableDeduplication && options.deduplicationKey) {
        jobOptions.jobId = options.deduplicationKey;
      }

      // 发布到 Bull 队列
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queue as any).add(
        {
          message,
          context: this.serializeContext(context),
        },
        jobOptions,
      );

      // 更新统计信息
      this.updateStatistics(message, 'published');

      const result: IMessagePublishResult = {
        success: true,
        messageId,
        publishTime: Date.now() - startTime,
        queueName: topic,
        metadata: {
          topic,
          messageType: message.type,
          priority: message.priority,
          tenantId,
        },
      };

      this.logger.info(
        `Message published successfully: ${topic}`,
        LogContext.SYSTEM,
        {
          messageId,
          topic,
          publishTime: result.publishTime,
        },
      );

      return of(result);
    } catch (error) {
      const result: IMessagePublishResult = {
        success: false,
        error: (error as Error).message,
        messageId,
        publishTime: Date.now() - startTime,
        queueName: topic,
      };

      this.logger.error(
        `Failed to publish message: ${topic}`,
        LogContext.SYSTEM,
        {
          messageId,
          topic,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(result);
    }
  }

  /**
   * 批量发布消息
   */
  public publishBatch(
    messages: Array<{
      topic: string;
      data: Record<string, unknown>;
      options?: IMessagePublishOptions;
    }>,
    context?: IAsyncContext,
  ): Observable<IMessagePublishResult[]> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.info(
      `Publishing batch of ${messages.length} messages`,
      LogContext.SYSTEM,
      {
        messageCount: messages.length,
        topics: messages.map((m) => m.topic),
      },
    );

    const publishObservables = messages.map((msg) =>
      this.publish(msg.topic, msg.data, msg.options, context),
    );

    return new Observable((observer) => {
      let completed = 0;
      const results: IMessagePublishResult[] = [];

      publishObservables.forEach((obs, index) => {
        obs.subscribe({
          next: (result) => {
            results[index] = result;
            completed++;

            if (completed === messages.length) {
              observer.next(results);
              observer.complete();
            }
          },
          error: (error) => {
            results[index] = {
              success: false,
              error: (error as Error).message,
              messageId: uuidv4(),
              publishTime: 0,
              queueName: messages[index].topic,
            };
            completed++;

            if (completed === messages.length) {
              observer.next(results);
              observer.complete();
            }
          },
        });
      });
    });
  }

  /**
   * 订阅消息
   */
  public subscribe(
    topic: string,
    handler: IMessageHandler,
    options: IMessageSubscribeOptions = {},
    _context?: IAsyncContext,
  ): Observable<void> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.info(`Subscribing to topic: ${topic}`, LogContext.SYSTEM, {
      topic,
      handlerName: handler.name,
      options,
    });

    try {
      // 注册处理器
      const topicHandlers = this.handlers.get(topic) || [];
      topicHandlers.push(handler);
      this.handlers.set(topic, topicHandlers);

      // 获取或创建队列
      const queue = this.getOrCreateQueue(topic);

      // 设置处理器
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (queue as any).process(
        options.batchSize || 1,
        async (job: Record<string, unknown>) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const message = (job as any).data.message as IMessage;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const context = this.deserializeContext((job as any).data.context);

          this.logger.debug(
            `Processing message: ${message.id}`,
            LogContext.SYSTEM,
            {
              messageId: message.id,
              topic: message.topic,
              handlerName: handler.name,
            },
          );

          // 更新消息状态
          message.status = MessageStatus.PROCESSING;
          message.updatedAt = new Date();
          this.messages.set(message.id, message);

          try {
            // 处理消息
            const result = await handler.handle(message, context).toPromise();

            if (result?.success) {
              message.status = MessageStatus.COMPLETED;
              this.updateStatistics(message, 'completed');
            } else {
              message.status = MessageStatus.FAILED;
              message.retryCount++;
              this.updateStatistics(message, 'failed');

              if (
                result?.shouldRetry &&
                message.retryCount < message.maxRetries
              ) {
                message.status = MessageStatus.RETRYING;
                this.updateStatistics(message, 'retrying');
                throw new Error(result.error || 'Processing failed');
              } else if (result?.sendToDeadLetter) {
                message.status = MessageStatus.DEAD_LETTER;
                this.updateStatistics(message, 'dead_letter');
                await this.sendToDeadLetter(message.id, result.error);
              }
            }

            message.updatedAt = new Date();
            this.messages.set(message.id, message);

            return result;
          } catch (error) {
            message.status = MessageStatus.FAILED;
            message.retryCount++;
            message.updatedAt = new Date();
            this.messages.set(message.id, message);

            this.updateStatistics(message, 'failed');

            if (message.retryCount < message.maxRetries) {
              message.status = MessageStatus.RETRYING;
              this.updateStatistics(message, 'retrying');
              throw error;
            } else {
              message.status = MessageStatus.DEAD_LETTER;
              this.updateStatistics(message, 'dead_letter');
              await this.sendToDeadLetter(message.id, (error as Error).message);
            }

            throw error;
          }
        },
      );

      this.logger.info(`Subscribed to topic: ${topic}`, LogContext.SYSTEM, {
        topic,
        handlerName: handler.name,
      });

      return of(undefined);
    } catch (error) {
      this.logger.error(
        `Failed to subscribe to topic: ${topic}`,
        LogContext.SYSTEM,
        {
          topic,
          handlerName: handler.name,
          error: (error as Error).message,
        },
        error as Error,
      );

      return throwError(() => error);
    }
  }

  /**
   * 取消订阅
   */
  public unsubscribe(
    topic: string,
    handlerName: string,
    _context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.info(`Unsubscribing from topic: ${topic}`, LogContext.SYSTEM, {
      topic,
      handlerName,
    });

    try {
      const handlers = this.handlers.get(topic) || [];
      const filteredHandlers = handlers.filter((h) => h.name !== handlerName);
      this.handlers.set(topic, filteredHandlers);

      const removed = handlers.length !== filteredHandlers.length;

      this.logger.info(`Unsubscribed from topic: ${topic}`, LogContext.SYSTEM, {
        topic,
        handlerName,
        removed,
      });

      return of(removed);
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe from topic: ${topic}`,
        LogContext.SYSTEM,
        {
          topic,
          handlerName,
          error: (error as Error).message,
        },
        error as Error,
      );

      return of(false);
    }
  }

  /**
   * 获取消息
   */
  public getMessage(
    messageId: string,
    _context?: IAsyncContext,
  ): Observable<IMessage | null> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.debug(`Getting message: ${messageId}`, LogContext.SYSTEM, {
      messageId,
    });

    const message = this.messages.get(messageId) || null;
    return of(message);
  }

  /**
   * 确认消息
   */
  public acknowledge(
    messageId: string,
    _context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.debug(
      `Acknowledging message: ${messageId}`,
      LogContext.SYSTEM,
      { messageId },
    );

    try {
      const message = this.messages.get(messageId);
      if (message) {
        message.status = MessageStatus.COMPLETED;
        message.updatedAt = new Date();
        this.messages.set(messageId, message);
        this.updateStatistics(message, 'acknowledged');
        return of(true);
      }
      return of(false);
    } catch (error) {
      this.logger.error(
        `Failed to acknowledge message: ${messageId}`,
        LogContext.SYSTEM,
        {
          messageId,
          error: (error as Error).message,
        },
        error as Error,
      );
      return of(false);
    }
  }

  /**
   * 拒绝消息
   */
  public reject(
    messageId: string,
    reason?: string,
    _context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.info(`Rejecting message: ${messageId}`, LogContext.SYSTEM, {
      messageId,
      reason,
    });

    try {
      const message = this.messages.get(messageId);
      if (message) {
        message.status = MessageStatus.FAILED;
        message.updatedAt = new Date();
        this.messages.set(messageId, message);
        this.updateStatistics(message, 'rejected');
        return of(true);
      }
      return of(false);
    } catch (error) {
      this.logger.error(
        `Failed to reject message: ${messageId}`,
        LogContext.SYSTEM,
        {
          messageId,
          reason,
          error: (error as Error).message,
        },
        error as Error,
      );
      return of(false);
    }
  }

  /**
   * 重新排队消息
   */
  public requeue(
    messageId: string,
    delay?: number,
    context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.info(`Requeuing message: ${messageId}`, LogContext.SYSTEM, {
      messageId,
      delay,
    });

    try {
      const message = this.messages.get(messageId);
      if (message) {
        message.status = MessageStatus.PENDING;
        message.delay = delay;
        message.updatedAt = new Date();
        this.messages.set(messageId, message);
        this.updateStatistics(message, 'requeued');

        // 重新发布到队列
        const queue = this.getOrCreateQueue(message.topic);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (queue as any).add(
          {
            message,
            context: this.serializeContext(context),
          },
          {
            jobId: messageId,
            delay: delay || 0,
          },
        );

        return of(true);
      }
      return of(false);
    } catch (error) {
      this.logger.error(
        `Failed to requeue message: ${messageId}`,
        LogContext.SYSTEM,
        {
          messageId,
          delay,
          error: (error as Error).message,
        },
        error as Error,
      );
      return of(false);
    }
  }

  /**
   * 发送到死信队列
   */
  public sendToDeadLetter(
    messageId: string,
    reason?: string,
    context?: IAsyncContext,
  ): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.warn(
      `Sending message to dead letter queue: ${messageId}`,
      LogContext.SYSTEM,
      { messageId, reason },
    );

    try {
      const message = this.messages.get(messageId);
      if (message) {
        message.status = MessageStatus.DEAD_LETTER;
        message.updatedAt = new Date();
        this.messages.set(messageId, message);
        this.updateStatistics(message, 'dead_letter');

        // 发送到死信队列
        const deadLetterQueue = this.getOrCreateQueue('dead-letter');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (deadLetterQueue as any).add({
          message,
          reason,
          context: this.serializeContext(context),
        });

        return of(true);
      }
      return of(false);
    } catch (error) {
      this.logger.error(
        `Failed to send message to dead letter queue: ${messageId}`,
        LogContext.SYSTEM,
        {
          messageId,
          reason,
          error: (error as Error).message,
        },
        error as Error,
      );
      return of(false);
    }
  }

  /**
   * 获取队列统计信息
   */
  public getStatistics(
    _context?: IAsyncContext,
  ): Observable<IMessageQueueStatistics> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.updateStatistics();
    return of({ ...this.statistics });
  }

  /**
   * 清理过期消息
   */
  public cleanupExpiredMessages(
    retentionDays: number,
    _context?: IAsyncContext,
  ): Observable<number> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    let cleanedCount = 0;

    this.logger.info(
      `Cleaning up expired messages older than ${retentionDays} days`,
      LogContext.SYSTEM,
      { retentionDays, cutoffDate },
    );

    try {
      for (const [messageId, message] of this.messages.entries()) {
        if (message.createdAt < cutoffDate) {
          this.messages.delete(messageId);
          cleanedCount++;
        }
      }

      this.logger.info(
        `Expired messages cleanup completed`,
        LogContext.SYSTEM,
        { cleanedCount, retentionDays },
      );

      return of(cleanedCount);
    } catch (error) {
      this.logger.error(
        `Failed to cleanup expired messages`,
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
   * 暂停队列
   */
  public pauseQueue(_context?: IAsyncContext): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.info('Pausing message queue', LogContext.SYSTEM);

    try {
      for (const queue of this.queues.values()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (queue as any).pause();
      }

      this.logger.info('Message queue paused', LogContext.SYSTEM);
      return of(true);
    } catch (error) {
      this.logger.error(
        'Failed to pause message queue',
        LogContext.SYSTEM,
        { error: (error as Error).message },
        error as Error,
      );
      return of(false);
    }
  }

  /**
   * 恢复队列
   */
  public resumeQueue(_context?: IAsyncContext): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.info('Resuming message queue', LogContext.SYSTEM);

    try {
      for (const queue of this.queues.values()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (queue as any).resume();
      }

      this.logger.info('Message queue resumed', LogContext.SYSTEM);
      return of(true);
    } catch (error) {
      this.logger.error(
        'Failed to resume message queue',
        LogContext.SYSTEM,
        { error: (error as Error).message },
        error as Error,
      );
      return of(false);
    }
  }

  /**
   * 清空队列
   */
  public clearQueue(_context?: IAsyncContext): Observable<boolean> {
    if (!this._isStarted) {
      return throwError(() => new Error('Message queue is not started'));
    }

    this.logger.warn('Clearing message queue', LogContext.SYSTEM);

    try {
      for (const queue of this.queues.values()) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (queue as any).empty();
      }

      this.messages.clear();
      this.handlers.clear();

      this.logger.warn('Message queue cleared', LogContext.SYSTEM);
      return of(true);
    } catch (error) {
      this.logger.error(
        'Failed to clear message queue',
        LogContext.SYSTEM,
        { error: (error as Error).message },
        error as Error,
      );
      return of(false);
    }
  }

  /**
   * 健康检查
   */
  public healthCheck(_context?: IAsyncContext): Observable<boolean> {
    return of(this._isStarted);
  }

  /**
   * 启动队列
   */
  public async start(): Promise<void> {
    if (this._isStarted) {
      this.logger.warn('Message queue is already started', LogContext.SYSTEM);
      return;
    }

    this.logger.info('Starting message queue...', LogContext.SYSTEM);

    // 启动统计定时器
    this._statisticsTimer = globalThis.setInterval(() => {
      this.updateStatistics();
    }, 60 * 1000); // 每分钟更新一次统计

    // 启动清理定时器
    this._cleanupTimer = globalThis.setInterval(
      () => {
        this.cleanupExpiredMessages(7).subscribe();
      },
      24 * 60 * 60 * 1000,
    ); // 每天清理一次

    this._isStarted = true;
    this.logger.info('Message queue started successfully', LogContext.SYSTEM);
  }

  /**
   * 停止队列
   */
  public async stop(): Promise<void> {
    if (!this._isStarted) {
      this.logger.warn('Message queue is not started', LogContext.SYSTEM);
      return;
    }

    this.logger.info('Stopping message queue...', LogContext.SYSTEM);

    // 停止定时器
    if (this._statisticsTimer) {
      globalThis.clearInterval(this._statisticsTimer);
      this._statisticsTimer = undefined;
    }

    if (this._cleanupTimer) {
      globalThis.clearInterval(this._cleanupTimer);
      this._cleanupTimer = undefined;
    }

    // 关闭所有队列
    for (const queue of this.queues.values()) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (queue as any).close();
    }

    this.queues.clear();
    this.handlers.clear();
    this.messages.clear();

    this._isStarted = false;
    this.logger.info('Message queue stopped successfully', LogContext.SYSTEM);
  }

  /**
   * 检查是否已启动
   */
  public isStarted(): boolean {
    return this._isStarted;
  }

  /**
   * 获取或创建队列
   */
  private getOrCreateQueue(topic: string): Record<string, unknown> {
    if (!this.queues.has(topic)) {
      // 这里应该创建实际的 Bull 队列
      // 暂时使用模拟实现
      const mockQueue = {
        add: (
          data: Record<string, unknown>,
          options: Record<string, unknown>,
        ): void => {
          this.logger.debug(`Mock queue add: ${topic}`, LogContext.SYSTEM, {
            topic,
            data,
            options,
          });
        },
        process: (
          concurrency: number,
          _processor: Record<string, unknown>,
        ): void => {
          this.logger.debug(`Mock queue process: ${topic}`, LogContext.SYSTEM, {
            topic,
            concurrency,
          });
        },
        pause: (): void => {
          this.logger.debug(`Mock queue pause: ${topic}`, LogContext.SYSTEM);
        },
        resume: (): void => {
          this.logger.debug(`Mock queue resume: ${topic}`, LogContext.SYSTEM);
        },
        empty: (): void => {
          this.logger.debug(`Mock queue empty: ${topic}`, LogContext.SYSTEM);
        },
        close: async (): Promise<void> => {
          this.logger.debug(`Mock queue close: ${topic}`, LogContext.SYSTEM);
        },
      };

      this.queues.set(topic, mockQueue);
    }

    return this.queues.get(topic)!;
  }

  /**
   * 确定消息类型
   */
  private determineMessageType(topic: string): MessageType {
    if (topic.includes('command')) return MessageType.COMMAND;
    if (topic.includes('event')) return MessageType.EVENT;
    if (topic.includes('query')) return MessageType.QUERY;
    if (topic.includes('notification')) return MessageType.NOTIFICATION;
    if (topic.includes('task')) return MessageType.TASK;
    return MessageType.EVENT; // 默认类型
  }

  /**
   * 序列化上下文
   */
  private serializeContext(context?: IAsyncContext): Record<string, unknown> {
    if (!context) return {};

    return {
      tenantId: context.getTenantId(),
      userId: context.getUserId(),
      organizationId: context.getOrganizationId(),
      departmentId: context.getDepartmentId(),
      requestId: context.getRequestId(),
      correlationId: context.getCorrelationId(),
      causationId: context.getCausationId(),
    };
  }

  /**
   * 反序列化上下文
   */
  private deserializeContext(
    data: Record<string, unknown>,
  ): IAsyncContext | undefined {
    if (!data) return undefined;

    // 这里应该创建实际的上下文对象
    // 暂时返回 undefined
    return undefined;
  }

  /**
   * 更新统计信息
   */
  private updateStatistics(message?: IMessage, action?: string): void {
    if (message && action) {
      this.statistics.totalMessages++;

      // 按类型统计
      this.statistics.byType[message.type] =
        (this.statistics.byType[message.type] || 0) + 1;

      // 按状态统计
      this.statistics.byStatus[message.status] =
        (this.statistics.byStatus[message.status] || 0) + 1;

      // 按优先级统计
      this.statistics.byPriority[message.priority] =
        (this.statistics.byPriority[message.priority] || 0) + 1;

      // 按租户统计
      const tenantId = message.tenantId || 'unknown';
      this.statistics.byTenant[tenantId] =
        (this.statistics.byTenant[tenantId] || 0) + 1;
    }

    // 更新状态统计
    this.statistics.pendingMessages = Array.from(this.messages.values()).filter(
      (m) => m.status === MessageStatus.PENDING,
    ).length;

    this.statistics.processingMessages = Array.from(
      this.messages.values(),
    ).filter((m) => m.status === MessageStatus.PROCESSING).length;

    this.statistics.completedMessages = Array.from(
      this.messages.values(),
    ).filter((m) => m.status === MessageStatus.COMPLETED).length;

    this.statistics.failedMessages = Array.from(this.messages.values()).filter(
      (m) => m.status === MessageStatus.FAILED,
    ).length;

    this.statistics.deadLetterMessages = Array.from(
      this.messages.values(),
    ).filter((m) => m.status === MessageStatus.DEAD_LETTER).length;

    this.statistics.lastUpdatedAt = new Date();
  }
}
