/**
 * 缓存集成导出
 *
 * @description 集成@aiofix/cache模块，提供缓存功能的统一接口
 * @since 1.0.0
 */

// 重新导出@aiofix/cache模块的核心功能
export type {
  ICacheService,
  CacheOptions,
  CacheHealth,
  CacheConfig,
} from '@aiofix/cache';

export {
  CacheModule,
  RedisCacheService,
  MemoryCacheService,
  CacheManagerService,
  CacheInvalidationService,
  CacheWarmupService,
  CacheKeyFactory,
  CacheKeyDecorator,
  CacheTTL,
  CacheOptionsDecorator,
  CacheEvict,
  CacheEvictAll,
  Cacheable,
  CacheEvictable,
  CacheInterceptor,
} from '@aiofix/cache';
