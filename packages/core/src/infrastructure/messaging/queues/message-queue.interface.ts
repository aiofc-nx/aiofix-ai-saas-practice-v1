/**
 * 消息队列接口定义
 *
 * 定义了消息队列系统的核心接口，包括消息发布、订阅、
 * 处理、重试、死信队列等功能。
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
 * @description 消息队列接口定义
 * @since 1.0.0
 */

import { Observable } from 'rxjs';
import type { IAsyncContext } from '../context/async-context.interface';

/**
 * 消息优先级枚举
 */
export enum MessagePriority {
  /**
   * 低优先级
   */
  LOW = 1,

  /**
   * 普通优先级
   */
  NORMAL = 5,

  /**
   * 高优先级
   */
  HIGH = 10,

  /**
   * 紧急优先级
   */
  URGENT = 15,
}

/**
 * 消息状态枚举
 */
export enum MessageStatus {
  /**
   * 待处理
   */
  PENDING = 'pending',

  /**
   * 处理中
   */
  PROCESSING = 'processing',

  /**
   * 已完成
   */
  COMPLETED = 'completed',

  /**
   * 失败
   */
  FAILED = 'failed',

  /**
   * 重试中
   */
  RETRYING = 'retrying',

  /**
   * 已取消
   */
  CANCELLED = 'cancelled',

  /**
   * 已过期
   */
  EXPIRED = 'expired',

  /**
   * 死信
   */
  DEAD_LETTER = 'dead_letter',
}

/**
 * 消息类型枚举
 */
export enum MessageType {
  /**
   * 命令消息
   */
  COMMAND = 'command',

  /**
   * 事件消息
   */
  EVENT = 'event',

  /**
   * 查询消息
   */
  QUERY = 'query',

  /**
   * 通知消息
   */
  NOTIFICATION = 'notification',

  /**
   * 任务消息
   */
  TASK = 'task',
}

/**
 * 消息接口
 */
export interface IMessage {
  /**
   * 消息ID
   */
  id: string;

  /**
   * 消息类型
   */
  type: MessageType;

  /**
   * 消息主题
   */
  topic: string;

  /**
   * 消息数据
   */
  data: Record<string, unknown>;

  /**
   * 消息元数据
   */
  metadata: Record<string, unknown>;

  /**
   * 消息优先级
   */
  priority: MessagePriority;

  /**
   * 消息状态
   */
  status: MessageStatus;

  /**
   * 创建时间
   */
  createdAt: Date;

  /**
   * 更新时间
   */
  updatedAt: Date;

  /**
   * 过期时间
   */
  expiresAt?: Date;

  /**
   * 延迟时间（毫秒）
   */
  delay?: number;

  /**
   * 重试次数
   */
  retryCount: number;

  /**
   * 最大重试次数
   */
  maxRetries: number;

  /**
   * 重试间隔（毫秒）
   */
  retryInterval: number;

  /**
   * 租户ID
   */
  tenantId?: string;

  /**
   * 用户ID
   */
  userId?: string;

  /**
   * 组织ID
   */
  organizationId?: string;

  /**
   * 部门ID
   */
  departmentId?: string;

  /**
   * 请求ID
   */
  requestId?: string;

  /**
   * 关联ID
   */
  correlationId?: string;

  /**
   * 原因ID
   */
  causationId?: string;
}

/**
 * 消息发布选项
 */
export interface IMessagePublishOptions {
  /**
   * 消息优先级
   */
  priority?: MessagePriority;

  /**
   * 延迟时间（毫秒）
   */
  delay?: number;

  /**
   * 过期时间
   */
  expiresAt?: Date;

  /**
   * 最大重试次数
   */
  maxRetries?: number;

  /**
   * 重试间隔（毫秒）
   */
  retryInterval?: number;

  /**
   * 是否启用去重
   */
  enableDeduplication?: boolean;

  /**
   * 去重键
   */
  deduplicationKey?: string;

  /**
   * 是否启用事务
   */
  enableTransaction?: boolean;

  /**
   * 事务ID
   */
  transactionId?: string;

  /**
   * 是否启用压缩
   */
  enableCompression?: boolean;

  /**
   * 是否启用加密
   */
  enableEncryption?: boolean;

  /**
   * 消息标签
   */
  tags?: string[];

  /**
   * 消息属性
   */
  properties?: Record<string, unknown>;
}

/**
 * 消息发布结果
 */
export interface IMessagePublishResult {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 消息ID
   */
  messageId: string;

  /**
   * 发布时间（毫秒）
   */
  publishTime: number;

  /**
   * 队列名称
   */
  queueName: string;

  /**
   * 元数据
   */
  metadata?: Record<string, unknown>;
}

/**
 * 消息订阅选项
 */
export interface IMessageSubscribeOptions {
  /**
   * 消费者组
   */
  consumerGroup?: string;

  /**
   * 消费者ID
   */
  consumerId?: string;

  /**
   * 是否启用自动确认
   */
  enableAutoAck?: boolean;

  /**
   * 确认超时时间（毫秒）
   */
  ackTimeout?: number;

  /**
   * 预取数量
   */
  prefetchCount?: number;

  /**
   * 是否启用消息过滤
   */
  enableFiltering?: boolean;

  /**
   * 消息过滤器
   */
  filter?: Record<string, unknown>;

  /**
   * 是否启用死信队列
   */
  enableDeadLetter?: boolean;

  /**
   * 死信队列名称
   */
  deadLetterQueue?: string;

  /**
   * 是否启用消息去重
   */
  enableDeduplication?: boolean;

  /**
   * 消息处理超时时间（毫秒）
   */
  processingTimeout?: number;

  /**
   * 是否启用批量处理
   */
  enableBatchProcessing?: boolean;

  /**
   * 批量大小
   */
  batchSize?: number;

  /**
   * 批量超时时间（毫秒）
   */
  batchTimeout?: number;
}

/**
 * 消息处理结果
 */
export interface IMessageProcessResult {
  /**
   * 是否成功
   */
  success: boolean;

  /**
   * 错误信息
   */
  error?: string;

  /**
   * 消息ID
   */
  messageId: string;

  /**
   * 处理时间（毫秒）
   */
  processingTime: number;

  /**
   * 是否需要重试
   */
  shouldRetry: boolean;

  /**
   * 重试延迟时间（毫秒）
   */
  retryDelay?: number;

  /**
   * 是否发送到死信队列
   */
  sendToDeadLetter: boolean;

  /**
   * 元数据
   */
  metadata?: Record<string, unknown>;
}

/**
 * 消息处理器接口
 */
export interface IMessageHandler {
  /**
   * 处理器名称
   */
  name: string;

  /**
   * 处理的消息类型
   */
  messageType: MessageType;

  /**
   * 处理的消息主题
   */
  topic: string;

  /**
   * 处理消息
   */
  handle(
    message: IMessage,
    context?: IAsyncContext,
  ): Observable<IMessageProcessResult>;

  /**
   * 是否应该处理消息
   */
  shouldHandle(message: IMessage): boolean;

  /**
   * 获取处理器配置
   */
  getConfig(): Record<string, unknown>;
}

/**
 * 消息队列统计信息
 */
export interface IMessageQueueStatistics {
  /**
   * 总消息数量
   */
  totalMessages: number;

  /**
   * 待处理消息数量
   */
  pendingMessages: number;

  /**
   * 处理中消息数量
   */
  processingMessages: number;

  /**
   * 已完成消息数量
   */
  completedMessages: number;

  /**
   * 失败消息数量
   */
  failedMessages: number;

  /**
   * 死信消息数量
   */
  deadLetterMessages: number;

  /**
   * 平均处理时间（毫秒）
   */
  averageProcessingTime: number;

  /**
   * 按类型统计
   */
  byType: Record<MessageType, number>;

  /**
   * 按状态统计
   */
  byStatus: Record<MessageStatus, number>;

  /**
   * 按优先级统计
   */
  byPriority: Record<MessagePriority, number>;

  /**
   * 按租户统计
   */
  byTenant: Record<string, number>;

  /**
   * 按时间统计
   */
  byTime: {
    lastHour: number;
    lastDay: number;
    lastWeek: number;
    lastMonth: number;
  };

  /**
   * 最后更新时间
   */
  lastUpdatedAt: Date;
}

/**
 * 消息队列配置
 */
export interface IMessageQueueConfiguration {
  /**
   * 队列名称
   */
  queueName: string;

  /**
   * 是否启用
   */
  enabled: boolean;

  /**
   * 最大消息数量
   */
  maxMessages: number;

  /**
   * 消息过期时间（毫秒）
   */
  messageExpiration: number;

  /**
   * 默认重试次数
   */
  defaultRetries: number;

  /**
   * 默认重试间隔（毫秒）
   */
  defaultRetryInterval: number;

  /**
   * 是否启用死信队列
   */
  enableDeadLetter: boolean;

  /**
   * 死信队列名称
   */
  deadLetterQueue: string;

  /**
   * 是否启用消息去重
   */
  enableDeduplication: boolean;

  /**
   * 去重窗口时间（毫秒）
   */
  deduplicationWindow: number;

  /**
   * 是否启用压缩
   */
  enableCompression: boolean;

  /**
   * 是否启用加密
   */
  enableEncryption: boolean;

  /**
   * 是否启用多租户
   */
  enableMultiTenant: boolean;

  /**
   * 是否启用监控
   */
  enableMonitoring: boolean;

  /**
   * 监控间隔（毫秒）
   */
  monitoringInterval: number;
}

/**
 * 消息队列接口
 */
export interface IMessageQueue {
  /**
   * 发布消息
   */
  publish(
    topic: string,
    data: Record<string, unknown>,
    options?: IMessagePublishOptions,
    context?: IAsyncContext,
  ): Observable<IMessagePublishResult>;

  /**
   * 批量发布消息
   */
  publishBatch(
    messages: Array<{
      topic: string;
      data: Record<string, unknown>;
      options?: IMessagePublishOptions;
    }>,
    context?: IAsyncContext,
  ): Observable<IMessagePublishResult[]>;

  /**
   * 订阅消息
   */
  subscribe(
    topic: string,
    handler: IMessageHandler,
    options?: IMessageSubscribeOptions,
    context?: IAsyncContext,
  ): Observable<void>;

  /**
   * 取消订阅
   */
  unsubscribe(
    topic: string,
    handlerName: string,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 获取消息
   */
  getMessage(
    messageId: string,
    context?: IAsyncContext,
  ): Observable<IMessage | null>;

  /**
   * 确认消息
   */
  acknowledge(messageId: string, context?: IAsyncContext): Observable<boolean>;

  /**
   * 拒绝消息
   */
  reject(
    messageId: string,
    reason?: string,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 重新排队消息
   */
  requeue(
    messageId: string,
    delay?: number,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 发送到死信队列
   */
  sendToDeadLetter(
    messageId: string,
    reason?: string,
    context?: IAsyncContext,
  ): Observable<boolean>;

  /**
   * 获取队列统计信息
   */
  getStatistics(context?: IAsyncContext): Observable<IMessageQueueStatistics>;

  /**
   * 清理过期消息
   */
  cleanupExpiredMessages(
    retentionDays: number,
    context?: IAsyncContext,
  ): Observable<number>;

  /**
   * 暂停队列
   */
  pauseQueue(context?: IAsyncContext): Observable<boolean>;

  /**
   * 恢复队列
   */
  resumeQueue(context?: IAsyncContext): Observable<boolean>;

  /**
   * 清空队列
   */
  clearQueue(context?: IAsyncContext): Observable<boolean>;

  /**
   * 健康检查
   */
  healthCheck(context?: IAsyncContext): Observable<boolean>;

  /**
   * 启动队列
   */
  start(): Promise<void>;

  /**
   * 停止队列
   */
  stop(): Promise<void>;

  /**
   * 检查是否已启动
   */
  isStarted(): boolean;
}
