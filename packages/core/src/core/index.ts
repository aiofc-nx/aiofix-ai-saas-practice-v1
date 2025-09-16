/**
 * 核心架构层导出
 *
 * @description 导出核心架构相关的类和接口
 * @since 1.0.0
 */

export * from './context';
export * from './decorators';
// 错误类型定义
export * from './errors';

// 错误处理机制（只导出不冲突的部分）
export { ErrorType, CoreErrorBus, CoreExceptionFilter } from './error-handling';

export type {
  IErrorClassifier,
  IErrorHandler,
  IErrorNotifier,
  IErrorRecovery,
  IErrorBus,
  IExceptionFilter,
} from './error-handling';
export * from './interfaces';
export * from './monitoring';
export * from './testing';
export * from './entities';
export * from './cqrs';
