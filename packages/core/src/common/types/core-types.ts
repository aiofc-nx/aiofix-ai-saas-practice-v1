/**
 * Core模块核心类型定义
 *
 * @description 定义Core模块对外暴露的核心类型
 * 为其他模块提供统一的类型接口
 *
 * @since 1.0.0
 */

// 重新导出租户上下文相关类型
export type { ITenantContextData as TenantContext } from '../multi-tenant/context/tenant-context-manager';

// 重新导出隔离策略相关类型
export type {
  IsolationLevel,
  DataSensitivity,
  IDataIsolationContext,
} from '../multi-tenant/isolation/isolation-context';

// 重新导出错误处理相关类型
export type {
  IErrorContext,
  IErrorMetadata,
} from '../error-handling/error-context.interface';

// 重新导出性能监控相关类型
export type {
  IPerformanceMetrics,
  ISystemMetrics,
  IApplicationMetrics,
  IBusinessMetrics,
} from '../../infrastructure/monitoring/performance-metrics.interface';

// 重新导出CQRS相关类型
export type {
  ICommandMetadata,
  IQueryMetadata,
  IEventMetadata,
} from '../../application/cqrs/interfaces/cqrs.interface';
