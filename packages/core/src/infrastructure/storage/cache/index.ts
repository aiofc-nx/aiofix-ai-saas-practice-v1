/**
 * 缓存集成导出
 *
 * @description 集成@aiofix/cache模块，提供缓存功能的统一接口
 * @since 1.0.0
 */

// 重新导出@aiofix/cache模块的核心功能（基于当前可用的导出）
export type {
  ICacheService,
  ICacheOptions,
  ICacheHealth,
  ISimpleCacheConfig,
  ISimpleCacheModuleOptions,
} from '@aiofix/cache';

export {
  SimpleCacheManager,
  SimpleCacheConfigService,
  createSimpleCacheConfigService,
  SimpleCacheModule,
  InjectSimpleCacheManager,
  InjectSimpleCacheConfig,
  CacheIsolationStrategy,
  createCacheIsolationStrategy,
  TenantAwareCacheKeyBuilder,
} from '@aiofix/cache';
