/**
 * Core 模块导出文件
 *
 * 按照分层架构组织导出：
 * - core: 核心架构层
 * - infrastructure: 基础设施层
 * - application: 应用层
 * - domain: 领域层
 * - shared: 共享层
 *
 * @description Core 模块统一导出
 * @since 1.0.0
 */

// 通用功能层 (包含所有横切关注点)
export * from './common';

// 基础设施层
export * from './infrastructure';

// 应用层
export * from './application';

// 领域层
export * from './domain';

// 对外类型导出（为其他模块提供统一的类型接口）
export * from './types';

// 共享层已合并到通用功能层
// export * from './shared';
