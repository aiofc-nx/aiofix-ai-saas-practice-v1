/**
 * 数据库集成导出
 *
 * @description 集成@aiofix/database模块，提供数据库功能的统一接口
 * @since 1.0.0
 */

// 重新导出@aiofix/database模块的核心功能
export {
  DatabaseAdapterFactory,
  TenantAwareRepository,
  DatabaseConfig,
  RedisConfig,
  IsolationStrategy,
} from '@aiofix/database';

// MongoDB集成（Core模块的扩展实现）
export * from './mongodb';

// TODO: 实现其他数据库适配器
// - PostgreSQL适配器
// - MySQL适配器
// - 通用数据库适配器接口
