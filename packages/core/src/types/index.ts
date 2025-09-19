/**
 * Core模块对外类型导出
 *
 * @description 为其他模块提供Core模块的核心类型接口
 * 确保类型的一致性和可用性
 *
 * @since 1.0.0
 */

// ==================== 多租户相关类型 ====================

// 租户上下文类型
export type { ITenantContextData as TenantContext } from '../common/multi-tenant/context/tenant-context-manager';

// 租户上下文管理器
export { TenantContextManager } from '../common/multi-tenant/context/tenant-context-manager';

// 隔离策略相关类型
export {
  IsolationLevel,
  DataSensitivity,
  DataIsolationContext,
} from '../common/multi-tenant/isolation/isolation-context';

// ==================== 性能监控相关类型 ====================

// 性能监控器
export { CorePerformanceMonitor } from '../infrastructure/monitoring/core-performance-monitor';

// 性能监控接口
export type {
  IPerformanceMonitor,
  IPerformanceCollector,
  IPerformanceAlert,
} from '../infrastructure/monitoring/performance-monitor.interface';

// ==================== 事件总线相关类型 ====================

// 事件总线
export { CoreEventBus } from '../application/cqrs/bus/core-event-bus';

// CQRS总线
export { CoreCQRSBus } from '../application/cqrs/bus/core-cqrs-bus';

// ==================== 错误处理相关类型 ====================

// 错误总线
export { CoreErrorBus } from '../common/error-handling/core-error-bus';

// 基础错误类型
export { BaseError, BusinessError, SystemError } from '../common/errors';

// ==================== 实体和值对象类型 ====================

// 基础实体
export { BaseEntity, BaseAggregateRoot } from '../domain/entities/base';

// 实体ID
export { EntityId } from '../domain/entities/value-objects/entity-id';

// ==================== 配置集成类型 ====================

// Core配置服务
export { CoreConfigService } from '../infrastructure/config/core-config.service';

// Core配置模块
export {
  CoreConfigModule,
  InjectCoreConfig,
  InjectCoreConfigService,
} from '../infrastructure/config/core-config.module';

// Core配置接口
export type {
  ICoreModuleConfig,
  ICoreConfigStatus,
} from '../infrastructure/config/core-config.interface';
