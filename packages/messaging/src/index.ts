/**
 * @aiofix/messaging - 消息传递模块
 *
 * @description 提供分布式消息传递和事件驱动架构支持
 * 支持多种消息队列技术的统一抽象和集成
 *
 * ## 主要功能
 *
 * ### 消息队列支持
 * - Bull队列（基于Redis）
 * - RabbitMQ（计划支持）
 * - Apache Kafka（计划支持）
 *
 * ### 事件驱动架构
 * - 事件发布订阅
 * - 事件路由和分发
 * - 消息持久化
 * - 最终一致性保证
 *
 * ### 企业级特性
 * - 多租户消息隔离
 * - 消息加密和压缩
 * - 监控和统计
 * - 高可用和容错
 *
 * @example
 * ```typescript
 * import { MessagingModule, MessagingService } from '@aiofix/messaging';
 *
 * @Module({
 *   imports: [
 *     MessagingModule.forRoot({
 *       defaultQueue: 'default',
 *       queueMapping: {
 *         'UserCreated': 'user-events',
 *         'OrderCreated': 'order-events',
 *       },
 *       queues: [
 *         {
 *           name: 'default',
 *           type: 'bull',
 *           config: {
 *             redis: { host: 'localhost', port: 6379 },
 *           },
 *         },
 *       ],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 *
 * @since 1.0.0
 */

// 核心接口和类型
export * from './interfaces/messaging.interface';

// 简化Bull队列适配器
export { SimpleBullQueueAdapter } from './adapters/simple-bull-queue.adapter';
export type { ISimpleBullConfig } from './adapters/simple-bull-queue.adapter';

// 简化消息传递服务
export { SimpleMessagingService } from './services/simple-messaging.service';

// TODO: 完整实现
// - 完整的Bull队列适配器
// - RabbitMQ适配器
// - Kafka适配器
// - 事件路由服务
// - 消息传递模块

// TODO: 后续导出
// - RabbitMQ适配器
// - Kafka适配器
// - 消息中间件
// - 装饰器系统
