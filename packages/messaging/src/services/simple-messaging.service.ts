/**
 * 简化消息传递服务
 *
 * @description 简化的消息传递服务实现，专注于核心功能
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId, TenantContextManager } from '@aiofix/core';
import {
  IMessage,
  IMessagingService,
  IMessageSendOptions,
  IMessageHandler,
  MessageType,
  MessagePriority,
  MessageStatus,
} from '../interfaces/messaging.interface';
import { SimpleBullQueueAdapter } from '../adapters/simple-bull-queue.adapter';

/**
 * 简化消息传递服务
 */
@Injectable()
export class SimpleMessagingService implements IMessagingService {
  private readonly queues = new Map<string, SimpleBullQueueAdapter>();

  constructor(queues: SimpleBullQueueAdapter[] = []) {
    // 注册队列
    for (const queue of queues) {
      this.queues.set(queue.name, queue);
    }
  }

  /**
   * 发送消息
   */
  async send(
    topic: string,
    payload: unknown,
    options?: IMessageSendOptions,
  ): Promise<void> {
    const message = this.createMessage({
      type: MessageType.COMMAND,
      topic,
      payload,
      options,
    });

    const queue = this.getDefaultQueue();
    await queue.send(message, options);

    // eslint-disable-next-line no-console
    console.log(`消息已发送到主题 ${topic}`);
  }

  /**
   * 发布事件
   */
  async publish(
    eventType: string,
    eventData: unknown,
    options?: IMessageSendOptions,
  ): Promise<void> {
    const message = this.createMessage({
      type: MessageType.EVENT,
      topic: eventType,
      payload: eventData,
      options,
    });

    const queue = this.getDefaultQueue();
    await queue.send(message, options);

    // eslint-disable-next-line no-console
    console.log(`事件已发布: ${eventType}`);
  }

  /**
   * 订阅主题
   */
  async subscribe(
    topic: string,
    handler: (message: unknown) => Promise<void>,
  ): Promise<string> {
    const queue = this.getDefaultQueue();

    // 创建消息处理器包装器
    const messageHandler: IMessageHandler = {
      name: `handler_${topic}_${Date.now()}`,
      supportedMessageTypes: [MessageType.EVENT, MessageType.COMMAND],
      supportedTopics: [topic],

      async handle(message: IMessage): Promise<void> {
        await handler(message.payload);
      },

      canHandle(message: IMessage): boolean {
        return message.topic === topic;
      },

      getPriority(): number {
        return 0;
      },
    };

    const subscriptionId = await queue.subscribe(topic, messageHandler);
    // eslint-disable-next-line no-console
    console.log(`已订阅主题 ${topic}`);

    return subscriptionId;
  }

  /**
   * 取消订阅
   */
  async unsubscribe(subscriptionId: string): Promise<void> {
    const queue = this.getDefaultQueue();
    await queue.unsubscribe(subscriptionId);
    // eslint-disable-next-line no-console
    console.log(`已取消订阅 ${subscriptionId}`);
  }

  /**
   * 请求响应模式
   */
  async request<T>(
    topic: string,
    payload: unknown,
    timeout: number = 30000,
  ): Promise<T> {
    // eslint-disable-next-line no-console
    console.log(`发送请求到 ${topic}，超时 ${timeout}ms`);

    // 模拟请求响应
    return new Promise((resolve) => {
      global.setTimeout(() => {
        resolve({ success: true, data: payload } as T);
      }, 100);
    });
  }

  /**
   * 响应请求
   */
  async reply(message: IMessage, response: unknown): Promise<void> {
    if (!message.replyTo) {
      throw new Error('消息缺少回复地址');
    }

    await this.send(message.replyTo, response, {
      correlationId: message.correlationId,
    });

    // eslint-disable-next-line no-console
    console.log(`已回复请求: ${message.correlationId}`);
  }

  /**
   * 注册队列
   */
  registerQueue(queue: SimpleBullQueueAdapter): void {
    this.queues.set(queue.name, queue);
    // eslint-disable-next-line no-console
    console.log(`队列已注册: ${queue.name}`);
  }

  /**
   * 获取所有队列统计
   */
  async getAllStatistics(): Promise<Record<string, unknown>> {
    const stats: Record<string, unknown> = {};

    for (const [name, queue] of this.queues) {
      stats[name] = await queue.getStatistics();
    }

    return stats;
  }

  // ==================== 私有方法 ====================

  /**
   * 创建消息
   */
  private createMessage(params: {
    type: MessageType;
    topic: string;
    payload: unknown;
    options?: IMessageSendOptions;
  }): IMessage {
    const tenantContext = TenantContextManager.getCurrentTenant();
    const currentTime = new Date();

    return {
      id: EntityId.generate(),
      type: params.type,
      topic: params.topic,
      payload: params.payload as Record<string, unknown>,
      priority: params.options?.priority || MessagePriority.NORMAL,
      status: MessageStatus.PENDING,
      tenantId: tenantContext?.tenantId || 'default',
      senderId: 'messaging-service',
      createdAt: currentTime,
      retryCount: 0,
      maxRetries: params.options?.maxRetries || 3,
      correlationId: params.options?.correlationId,
      replyTo: params.options?.replyTo,
      routingKey: params.options?.routingKey,
      metadata: {
        tenantContext,
        ...params.options?.metadata,
      },
      headers: params.options?.headers || {},
      expiresAt: params.options?.ttl
        ? new Date(currentTime.getTime() + params.options.ttl)
        : undefined,
    };
  }

  /**
   * 获取默认队列
   */
  private getDefaultQueue(): SimpleBullQueueAdapter {
    const queue = Array.from(this.queues.values())[0];
    if (!queue) {
      throw new Error('没有可用的队列');
    }
    return queue;
  }
}
