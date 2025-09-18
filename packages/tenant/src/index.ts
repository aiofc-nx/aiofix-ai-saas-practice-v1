/**
 * 租户管理模块导出
 *
 * @description 导出租户管理相关的业务实体、事件和服务
 * 专注于租户的业务逻辑，不包含技术基础设施
 *
 * @since 1.0.0
 */

// 领域实体
export * from './domain/entities/tenant.entity';

// 领域事件
export * from './domain/events/tenant.events';

// 领域仓储接口
export * from './domain/repositories/tenant.repository.interface';

// 应用服务
export * from './application/services/tenant.service';
export * from './application/services/tenant-context.service';

// 类型定义重新导出，便于其他模块使用
export type { ITenantConfiguration } from './domain/entities/tenant.entity';
export {
  TenantType,
  TenantStatus,
  IsolationStrategy,
} from './domain/entities/tenant.entity';
