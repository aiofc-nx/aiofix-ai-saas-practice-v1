/**
 * Web 基础设施导出
 *
 * @description 导出 Web 相关的类和接口
 * @since 1.0.0
 */

// 简化Web中间件
export { SimpleWebMiddleware } from './middleware/simple-web-middleware';
export type {
  ISimpleWebMiddlewareOptions,
  IRequestInfo,
} from './middleware/simple-web-middleware';

// 原有Fastify模块导出
export * from './fastify';

// TODO: 实现其他Web框架集成
// - Express高级集成
// - Koa集成
// - 自定义框架适配器
