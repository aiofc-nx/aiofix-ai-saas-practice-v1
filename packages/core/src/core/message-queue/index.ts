/**
 * 消息队列模块
 *
 * @description 提供完整的消息队列功能，支持异步消息处理和通信
 * 包括消息接口、处理器接口、队列接口等核心组件
 *
 * @since 1.0.0
 */

// 消息相关
export type {
  IMessage as ICoreMessage,
  IMessageOptions as ICoreMessageOptions,
  IMessageResult as ICoreMessageResult,
} from './message.interface';
export {
  MessagePriority as CoreMessagePriority,
  MessageStatus as CoreMessageStatus,
} from './message.interface';

// 消息处理器相关
export type {
  IMessageHandler as ICoreMessageHandler,
  IHandlerStatistics as ICoreHandlerStatistics,
  IMessageHandlerFactory as ICoreMessageHandlerFactory,
} from './message-handler.interface';

// 消息队列相关
export type {
  IMessageQueue as ICoreMessageQueue,
  IQueueStatistics as ICoreQueueStatistics,
} from './message-queue.interface';

// 基础实现
export { BaseMessage as CoreBaseMessage } from './base-message';
