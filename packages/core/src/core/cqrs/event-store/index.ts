/**
 * 事件存储模块
 *
 * @description 提供完整的事件存储功能，支持 CQRS + Event Sourcing 架构
 * 包括事件存储接口、核心实现、并发控制等功能
 *
 * @since 1.0.0
 */

// 接口和类型
export type { IEventStore, IEventStreamResult } from './event-store.interface';
export type { IDatabase } from './core-event-store';

// 实现类
export { CoreEventStore } from './core-event-store';

// 异常类
export { ConcurrencyError } from './concurrency-error';
