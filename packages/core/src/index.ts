/**
 * Core 模块主入口文件
 *
 * 提供 Aiofix-AI-SaaS 平台的核心基础架构库，包括：
 * - 架构基础层（CQRS、装饰器、自动发现）
 * - 实体和值对象
 * - 多租户支持
 * - 数据访问层
 * - 缓存和日志
 * - 性能监控
 * - 测试支持
 * - Fastify 和 MongoDB 集成
 *
 * @description Core 模块的统一导出入口
 * @version 1.0.0
 * @since 1.0.0
 */

// 实体和值对象（已实现）
export * from './entities/base';
export * from './entities/value-objects';

// TODO: 其他模块将在后续阶段实现
// 架构基础层
// export * from './architecture/interfaces';
// export * from './architecture/decorators';
// export * from './architecture/services';
// export * from './architecture/utils';

// CQRS 组件
// export * from './commands/base';
// export * from './commands/handlers';
// export * from './queries/base';
// export * from './queries/handlers';
// export * from './events/base';
// export * from './events/handlers';
// export * from './sagas';

// 多租户支持
// export * from './multi-tenant/context';
// export * from './multi-tenant/isolation';
// export * from './multi-tenant/strategies';

// 数据访问层
// export * from './data-access/repositories';
// export * from './data-access/adapters';

// 缓存和日志
// export * from './cache/services';
// export * from './cache/strategies';
// export * from './logging';

// 性能监控
// export * from './performance/monitoring';
// export * from './performance/metrics';

// 配置和安全
// export * from './configuration';
// export * from './security/permissions';
// export * from './security/validation';

// 验证和异常处理
// export * from './validation';
// export * from './exception-handling';

// 通用组件
// export * from './decorators';
// export * from './interceptors';
// export * from './middleware';
// export * from './utils/common';
// export * from './utils/types';
// export * from './utils/constants';

// 测试支持
// export * from './testing/module';
// export * from './testing/utils';
// export * from './testing/fixtures';

// 集成支持
// export * from './fastify/adapter';
// export * from './fastify/module';
// export * from './fastify/plugins';
// export * from './fastify/middleware';
// export * from './mongodb/adapter';
// export * from './mongodb/module';
// export * from './mongodb/config';
// export * from './mongodb/types';

// 主模块导出
// export * from './core.module';
