# SAAS 平台项目架构设计方案

本文档是在 `01-architecture-design-overview.md` 的基础上更具体的架构设计阐述。

## 项目概述

Aiofix-AI-SaaS平台致力于为现代企业提供**AI原生**的SaaS解决方案，帮助传统企业管理系统在AI时代实现**智能化重构**，通过预训练大语言模型等AI技术，彻底改变企业经营管理模式。

声明：本阶段开发聚焦于基础框架的搭建，不涉及AI以及其他ERP内容。

## 技术栈选择

- **后端框架**：Node.js + NestJS + Fastify + Pino
- **数据层**：MikroORM + PostgreSQL + MongoDB
- **开发工具**：pnpm + Nx + TypeScript
- **部署**：Docker + Kubernetes + CI/CD

## 核心架构设计

混合架构模式：Clean Architecture + CQRS + 事件溯源（ES）+ 事件驱动架构（EDA）

### 架构模式组合说明

这个混合架构模式将四种强大的架构模式有机结合：

- **Clean Architecture**: 提供分层架构基础和依赖控制
- **CQRS**: 在应用层实现命令查询职责分离
- **Event Sourcing**: 在领域层提供事件存储和重放能力
- **Event-Driven Architecture**: 在基础设施层实现异步事件处理

## 技术栈建议

### 框架选择

- **NestJS**: 提供良好的依赖注入和模块化支持
- **MikroORM**: 数据访问层
- **数据库**: PostgresQL/MongoDB
- **Bull/Agenda**: 任务队列
- **Socket.io**: WebSocket 支持

### 核心架构模式

- **Clean Architecture**: 分层架构设计
- **CQRS**: 命令查询职责分离
- **Event Sourcing (ES)**: 事件溯源
- **Event-Driven Architecture (EDA)**: 事件驱动架构

### 设计模式

- **Repository Pattern**: 数据访问抽象
- **Factory Pattern**: 对象创建
- **Strategy Pattern**: 多租户策略
- **Observer Pattern**: 事件处理
- **Command Pattern**: 命令封装

## 业务需求与架构对应分析

### 基于术语定义的业务实体设计

根据 `XS-definition-of-terms.md` 中的业务需求，我们的 SAAS 平台需要支持复杂的多层级组织结构：

**核心业务实体**：

- **Platform（平台）**: 最高层级，管理所有租户和用户
- **Tenant（租户）**: 四种类型（企业、社群、团队、个人）
- **Organization（组织）**: 横向职能部门（委员会、项目团队等）
- **Department（部门）**: 纵向业务部门（支持多级嵌套）
- **User（用户）**: 复杂的用户分类体系

**业务关系复杂性**：

- 用户可以属于多个租户
- 用户可以同时属于多个组织
- 用户在同一个组织中只能属于一个部门
- 用户可以属于不同组织的不同部门
- 组织可以管理多个部门
- 支持跨组织兼职用户的权限合并

## 整体目录结构

### 模块化依赖项目设计

基于业务领域和限界上下文，将系统划分为独立的依赖项目，每个项目遵循 Clean Architecture 原则：

```text
aiofix-ai-saas-practice-v1/
├── packages/                      # 依赖项目目录
│   ├── platform/                  # 平台核心业务模块
│   ├── logging/                   # 日志管理模块
│   │   ├── src/
│   │   │   ├── services/          # 日志服务
│   │   │   │   ├── pino-logger.service.ts
│   │   │   │   └── pino-logger-config.service.ts
│   │   │   ├── interfaces/        # 日志接口
│   │   │   │   └── logging.interface.ts
│   │   │   ├── factories/         # 日志工厂
│   │   │   │   └── pino-logger.factory.ts
│   │   │   ├── middleware/        # 日志中间件
│   │   │   │   └── pino-logging.middleware.ts
│   │   │   ├── interceptors/      # 日志拦截器
│   │   │   │   └── pino-logging.interceptor.ts
│   │   │   ├── logging.module.ts  # 日志模块
│   │   │   └── index.ts           # 导出文件
│   │   ├── tests/                 # 测试
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── config/                    # 配置管理模块
│   │   ├── src/
│   │   │   ├── config/            # 配置定义
│   │   │   ├── environments/      # 环境配置
│   │   │   ├── config.service.ts  # 配置服务
│   │   │   ├── config.module.ts   # 配置模块
│   │   │   ├── default-config.ts  # 默认配置
│   │   │   ├── config-loader.ts   # 配置加载器
│   │   │   └── index.ts           # 导出文件
│   │   ├── tests/                 # 测试
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── cache/                     # 缓存管理模块
│   │   ├── src/
│   │   │   ├── services/          # 缓存服务
│   │   │   │   ├── redis-cache.service.ts
│   │   │   │   ├── memory-cache.service.ts
│   │   │   │   ├── cache-manager.service.ts
│   │   │   │   ├── cache-invalidation.service.ts
│   │   │   │   └── cache-warmup.service.ts
│   │   │   ├── interfaces/        # 缓存接口
│   │   │   │   └── cache.interface.ts
│   │   │   ├── factories/         # 缓存工厂
│   │   │   │   └── cache-key.factory.ts
│   │   │   ├── decorators/        # 缓存装饰器
│   │   │   │   └── cache.decorator.ts
│   │   │   ├── interceptors/      # 缓存拦截器
│   │   │   │   └── cache.interceptor.ts
│   │   │   ├── config/            # 缓存配置
│   │   │   │   └── cache.config.ts
│   │   │   ├── cache.module.ts    # 缓存模块
│   │   │   └── index.ts           # 导出文件
│   │   ├── tests/                 # 测试
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── database/                  # 数据库管理模块
│   │   ├── src/
│   │   │   ├── adapters/          # 数据库适配器
│   │   │   │   ├── postgresql.adapter.ts
│   │   │   │   └── database-adapter.factory.ts
│   │   │   ├── interfaces/        # 数据库接口
│   │   │   │   └── database.interface.ts
│   │   │   ├── repositories/      # 数据库仓储
│   │   │   │   └── tenant-aware.repository.ts
│   │   │   ├── config/            # 数据库配置
│   │   │   │   └── database.config.ts
│   │   │   ├── test/              # 测试工具
│   │   │   ├── database.module.ts # 数据库模块
│   │   │   └── index.ts           # 导出文件
│   │   ├── tests/                 # 测试
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── core/                      # 核心基础架构库
│   │   ├── src/
│   │   │   ├── architecture/      # 架构基础
│   │   │   │   ├── entities/      # 基础实体
│   │   │   │   │   ├── base-entity.ts
│   │   │   │   │   ├── base-aggregate-root.ts
│   │   │   │   │   └── base-value-object.ts
│   │   │   │   ├── commands/      # CQRS 基础
│   │   │   │   │   ├── base-command.ts
│   │   │   │   │   ├── base-command-handler.ts
│   │   │   │   │   └── command-bus.ts
│   │   │   │   ├── queries/       # 查询基础
│   │   │   │   │   ├── base-query.ts
│   │   │   │   │   ├── base-query-handler.ts
│   │   │   │   │   └── query-bus.ts
│   │   │   │   └── events/        # 事件基础
│   │   │   │       ├── base-domain-event.ts
│   │   │   │       ├── event-handler.ts
│   │   │   │       └── event-bus.ts
│   │   │   ├── multi-tenant/      # 多租户支持
│   │   │   │   ├── context/       # 租户上下文
│   │   │   │   │   ├── tenant-context.ts
│   │   │   │   │   ├── tenant-context.decorator.ts
│   │   │   │   │   └── tenant-context.middleware.ts
│   │   │   │   ├── isolation/     # 隔离策略
│   │   │   │   │   ├── isolation-strategy.interface.ts
│   │   │   │   │   ├── isolation-strategy.factory.ts
│   │   │   │   │   └── strategies/
│   │   │   │   │       ├── database-per-tenant.strategy.ts
│   │   │   │   │       ├── schema-per-tenant.strategy.ts
│   │   │   │   │       ├── row-level-security.strategy.ts
│   │   │   │   │       └── shared-database.strategy.ts
│   │   │   │   └── guards/        # 租户守卫
│   │   │   │       ├── tenant-isolation.guard.ts
│   │   │   │       └── tenant-context.guard.ts
│   │   │   ├── data-access/       # 数据访问
│   │   │   │   ├── repositories/  # 仓储基础
│   │   │   │   │   ├── base-repository.interface.ts
│   │   │   │   │   ├── paginated-repository.interface.ts
│   │   │   │   │   └── event-store.interface.ts
│   │   │   │   ├── unit-of-work/  # 工作单元
│   │   │   │   │   ├── unit-of-work.interface.ts
│   │   │   │   │   └── unit-of-work.ts
│   │   │   │   └── specifications/ # 规约模式
│   │   │   │       ├── specification.interface.ts
│   │   │   │       └── base-specification.ts
│   │   │   ├── caching/           # 缓存层
│   │   │   │   ├── cache.interface.ts
│   │   │   │   ├── redis-cache.ts
│   │   │   │   ├── memory-cache.ts
│   │   │   │   └── decorators/
│   │   │   │       └── cacheable.decorator.ts
│   │   │   ├── logging/           # 日志监控
│   │   │   │   ├── logger.interface.ts
│   │   │   │   ├── structured-logger.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   └── log-execution.decorator.ts
│   │   │   │   └── middleware/
│   │   │   │       └── request-logging.middleware.ts
│   │   │   ├── monitoring/        # 性能监控
│   │   │   │   ├── metrics-collector.interface.ts
│   │   │   │   ├── prometheus-metrics.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   └── monitor-performance.decorator.ts
│   │   │   │   └── health-check/
│   │   │   │       ├── health-check.interface.ts
│   │   │   │       └── health-check.service.ts
│   │   │   ├── configuration/     # 配置管理
│   │   │   │   ├── configuration.interface.ts
│   │   │   │   ├── environment-configuration.ts
│   │   │   │   ├── decorators/
│   │   │   │   │   └── config-value.decorator.ts
│   │   │   │   └── validators/
│   │   │   │       └── configuration.validator.ts
│   │   │   ├── security/          # 安全层
│   │   │   │   ├── permissions/   # 权限管理
│   │   │   │   │   ├── permission.service.ts
│   │   │   │   │   ├── decorators/
│   │   │   │   │   │   └── require-permission.decorator.ts
│   │   │   │   │   └── guards/
│   │   │   │   │       └── permission.guard.ts
│   │   │   │   ├── authentication/ # 认证
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   └── jwt.strategy.ts
│   │   │   │   └── authorization/  # 授权
│   │   │   │       ├── authorization.service.ts
│   │   │   │       └── decorators/
│   │   │   │           └── require-tenant-isolation.decorator.ts
│   │   │   ├── validation/        # 验证层
│   │   │   │   ├── validators/    # 自定义验证器
│   │   │   │   │   ├── tenant-id.validator.ts
│   │   │   │   │   ├── email.validator.ts
│   │   │   │   │   └── phone.validator.ts
│   │   │   │   ├── pipes/         # 验证管道
│   │   │   │   │   ├── validation.pipe.ts
│   │   │   │   │   └── tenant-context.pipe.ts
│   │   │   │   └── decorators/    # 验证装饰器
│   │   │   │       └── validate-tenant.decorator.ts
│   │   │   ├── exceptions/        # 异常处理
│   │   │   │   ├── base-exception.ts
│   │   │   │   ├── business-exception.ts
│   │   │   │   ├── validation-exception.ts
│   │   │   │   ├── tenant-isolation-exception.ts
│   │   │   │   └── filters/
│   │   │   │       ├── global-exception.filter.ts
│   │   │   │       └── tenant-exception.filter.ts
│   │   │   ├── decorators/        # 通用装饰器
│   │   │   │   ├── retry.decorator.ts
│   │   │   │   ├── timeout.decorator.ts
│   │   │   │   ├── circuit-breaker.decorator.ts
│   │   │   │   └── rate-limit.decorator.ts
│   │   │   ├── interceptors/      # 通用拦截器
│   │   │   │   ├── logging.interceptor.ts
│   │   │   │   ├── performance.interceptor.ts
│   │   │   │   ├── tenant-context.interceptor.ts
│   │   │   │   └── error-handling.interceptor.ts
│   │   │   ├── middleware/        # 通用中间件
│   │   │   │   ├── request-id.middleware.ts
│   │   │   │   ├── correlation-id.middleware.ts
│   │   │   │   ├── tenant-context.middleware.ts
│   │   │   │   └── security-headers.middleware.ts
│   │   │   ├── utils/             # 工具函数
│   │   │   │   ├── date.utils.ts
│   │   │   │   ├── string.utils.ts
│   │   │   │   ├── validation.utils.ts
│   │   │   │   ├── encryption.utils.ts
│   │   │   │   └── serialization.utils.ts
│   │   │   ├── types/             # 类型定义
│   │   │   │   ├── common.types.ts
│   │   │   │   ├── tenant.types.ts
│   │   │   │   ├── pagination.types.ts
│   │   │   │   └── api.types.ts
│   │   │   ├── constants/         # 常量定义
│   │   │   │   ├── error-codes.ts
│   │   │   │   ├── event-types.ts
│   │   │   │   ├── permission-types.ts
│   │   │   │   └── tenant-types.ts
│   │   │   └── index.ts           # 导出文件
│   │   ├── tests/                 # 测试
│   │   │   ├── unit/              # 单元测试
│   │   │   ├── integration/       # 集成测试
│   │   │   └── fixtures/          # 测试数据
│   │   ├── docs/                  # 文档
│   │   │   ├── api/               # API 文档
│   │   │   ├── examples/          # 使用示例
│   │   │   └── migration/         # 迁移指南
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── README.md
│   ├── platform/                  # 平台核心业务模块
│   │   ├── src/
│   │   │   ├── domain/            # 领域层
│   │   │   │   ├── entities/      # 实体
│   │   │   │   │   └── {entity-name}.entity.ts
│   │   │   │   ├── value-objects/ # 值对象
│   │   │   │   │   └── {value-object-name}.vo.ts
│   │   │   │   ├── aggregates/    # 聚合根
│   │   │   │   │   └── {aggregate-name}.aggregate.ts
│   │   │   │   ├── services/      # 领域服务
│   │   │   │   │   └── {service-name}.service.ts
│   │   │   │   ├── events/        # 领域事件
│   │   │   │   │   └── {event-name}.event.ts
│   │   │   │   ├── repositories/  # 仓储接口
│   │   │   │   │   └── {repository-name}.repository.ts
│   │   │   │   └── exceptions/    # 领域异常
│   │   │   │       └── {exception-name}.exception.ts
│   │   │   ├── application/       # 应用层
│   │   │   │   ├── commands/      # 命令端
│   │   │   │   │   └── {command-name}/
│   │   │   │   │       ├── {command-name}.command.ts
│   │   │   │   │       ├── {command-name}.handler.ts
│   │   │   │   │       ├── {command-name}.result.ts
│   │   │   │   │       └── {command-name}.spec.ts
│   │   │   │   ├── queries/       # 查询端
│   │   │   │   │   └── {query-name}/
│   │   │   │   │       ├── {query-name}.query.ts
│   │   │   │   │       ├── {query-name}.handler.ts
│   │   │   │   │       ├── {query-name}.result.ts
│   │   │   │   │       └── {query-name}.spec.ts
│   │   │   │   ├── events/        # 事件处理器
│   │   │   │   │   ├── projectors/    # 投影器
│   │   │   │   │   │   └── {projector-name}.projector.ts
│   │   │   │   │   ├── subscribers/   # 订阅器
│   │   │   │   │   │   └── {subscriber-name}.subscriber.ts
│   │   │   │   │   └── sagas/         # Saga
│   │   │   │   │       └── {saga-name}.saga.ts
│   │   │   │   └── ports/         # 端口接口
│   │   │   │       ├── commands/  # 命令侧端口
│   │   │   │       │   └── {repository-name}.interface.ts
│   │   │   │       ├── queries/   # 查询侧端口
│   │   │   │       │   └── {read-repository-name}.interface.ts
│   │   │   │       └── shared/    # 共享端口
│   │   │   │           ├── event-store.interface.ts
│   │   │   │           ├── message-bus.interface.ts
│   │   │   │           └── unit-of-work.interface.ts
│   │   │   ├── infrastructure/    # 基础设施层
│   │   │   │   ├── persistence/   # 持久化
│   │   │   │   │   ├── event-store/    # 事件存储
│   │   │   │   │   │   └── {event-store-name}.service.ts
│   │   │   │   │   ├── projections/    # 投影器实现
│   │   │   │   │   │   └── {projection-name}.projection.ts
│   │   │   │   │   └── repositories/   # 仓储实现
│   │   │   │   │       └── {repository-name}.impl.ts
│   │   │   │   ├── messaging/     # 消息处理
│   │   │   │   │   ├── message-bus.ts
│   │   │   │   │   └── serializers/
│   │   │   │   │       ├── event-serializer.ts
│   │   │   │   │       └── event-deserializer.ts
│   │   │   │   ├── external-services/ # 外部服务
│   │   │   │   │   └── {service-name}/
│   │   │   │   │       └── {service-name}.service.ts
│   │   │   │   ├── cache/         # 缓存
│   │   │   │   │   └── {cache-name}.service.ts
│   │   │   │   └── monitoring/    # 监控
│   │   │   │       ├── metrics.service.ts
│   │   │   │       ├── logging.service.ts
│   │   │   │       └── health-check.service.ts
│   │   │   └── interfaces/        # 接口层
│   │   │       ├── rest/          # REST API
│   │   │       │   ├── controllers/
│   │   │       │   │   └── {controller-name}.controller.ts
│   │   │       │   ├── middleware/
│   │   │       │   │   └── {middleware-name}.middleware.ts
│   │   │       │   ├── guards/
│   │   │       │   │   └── {guard-name}.guard.ts
│   │   │       │   └── pipes/
│   │   │       │       └── {pipe-name}.pipe.ts
│   │   │       ├── graphql/       # GraphQL
│   │   │       │   ├── resolvers/
│   │   │       │   │   └── {resolver-name}.resolver.ts
│   │   │       │   ├── schemas/
│   │   │       │   │   └── {schema-name}.schema.ts
│   │   │       │   └── directives/
│   │   │       │       └── {directive-name}.directive.ts
│   │   │       ├── websocket/     # WebSocket
│   │   │       │   ├── gateways/
│   │   │       │   │   └── {gateway-name}.gateway.ts
│   │   │       │   └── handlers/
│   │   │       │       └── {handler-name}.handler.ts
│   │   │       ├── cli/           # CLI 命令
│   │   │       │   └── {command-name}.command.ts
│   │   │       ├── queue-consumers/ # 消息队列消费者
│   │   │       │   └── {consumer-name}.consumer.ts
│   │   │       └── schedulers/    # 定时任务
│   │   │           └── {scheduler-name}.scheduler.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── tenant-management/         # 租户管理包
│   │   ├── src/
│   │   │   ├── domain/            # 领域层
│   │   │   │   ├── entities/      # 实体
│   │   │   │   │   └── {entity-name}.entity.ts
│   │   │   │   ├── value-objects/ # 值对象
│   │   │   │   │   └── {value-object-name}.vo.ts
│   │   │   │   ├── aggregates/    # 聚合根
│   │   │   │   │   └── {aggregate-name}.aggregate.ts
│   │   │   │   ├── services/      # 领域服务
│   │   │   │   │   └── {service-name}.service.ts
│   │   │   │   ├── events/        # 领域事件
│   │   │   │   │   └── {event-name}.event.ts
│   │   │   │   ├── repositories/  # 仓储接口
│   │   │   │   │   └── {repository-name}.repository.ts
│   │   │   │   └── exceptions/    # 领域异常
│   │   │   │       └── {exception-name}.exception.ts
│   │   │   ├── application/       # 应用层
│   │   │   │   ├── commands/      # 命令端
│   │   │   │   │   └── {command-name}/
│   │   │   │   │       ├── {command-name}.command.ts
│   │   │   │   │       ├── {command-name}.handler.ts
│   │   │   │   │       ├── {command-name}.result.ts
│   │   │   │   │       └── {command-name}.spec.ts
│   │   │   │   ├── queries/       # 查询端
│   │   │   │   │   └── {query-name}/
│   │   │   │   │       ├── {query-name}.query.ts
│   │   │   │   │       ├── {query-name}.handler.ts
│   │   │   │   │       ├── {query-name}.result.ts
│   │   │   │   │       └── {query-name}.spec.ts
│   │   │   │   ├── events/        # 事件处理器
│   │   │   │   │   ├── projectors/    # 投影器
│   │   │   │   │   │   └── {projector-name}.projector.ts
│   │   │   │   │   ├── subscribers/   # 订阅器
│   │   │   │   │   │   └── {subscriber-name}.subscriber.ts
│   │   │   │   │   └── sagas/         # Saga
│   │   │   │   │       └── {saga-name}.saga.ts
│   │   │   │   └── ports/         # 端口接口
│   │   │   │       ├── commands/  # 命令侧端口
│   │   │   │       │   └── {repository-name}.interface.ts
│   │   │   │       ├── queries/   # 查询侧端口
│   │   │   │       │   └── {read-repository-name}.interface.ts
│   │   │   │       └── shared/    # 共享端口
│   │   │   │           ├── event-store.interface.ts
│   │   │   │           ├── message-bus.interface.ts
│   │   │   │           └── unit-of-work.interface.ts
│   │   │   ├── infrastructure/    # 基础设施层
│   │   │   │   ├── persistence/   # 持久化
│   │   │   │   │   ├── event-store/    # 事件存储
│   │   │   │   │   │   └── {event-store-name}.service.ts
│   │   │   │   │   ├── projections/    # 投影器实现
│   │   │   │   │   │   └── {projection-name}.projection.ts
│   │   │   │   │   └── repositories/   # 仓储实现
│   │   │   │   │       └── {repository-name}.impl.ts
│   │   │   │   ├── messaging/     # 消息处理
│   │   │   │   │   ├── message-bus.ts
│   │   │   │   │   └── serializers/
│   │   │   │   │       ├── event-serializer.ts
│   │   │   │   │       └── event-deserializer.ts
│   │   │   │   ├── external-services/ # 外部服务
│   │   │   │   │   └── {service-name}/
│   │   │   │   │       └── {service-name}.service.ts
│   │   │   │   ├── cache/         # 缓存
│   │   │   │   │   └── {cache-name}.service.ts
│   │   │   │   └── monitoring/    # 监控
│   │   │   │       ├── metrics.service.ts
│   │   │   │       ├── logging.service.ts
│   │   │   │       └── health-check.service.ts
│   │   │   └── interfaces/        # 接口层
│   │   │       ├── rest/          # REST API
│   │   │       │   ├── controllers/
│   │   │       │   │   └── {controller-name}.controller.ts
│   │   │       │   ├── middleware/
│   │   │       │   │   └── {middleware-name}.middleware.ts
│   │   │       │   ├── guards/
│   │   │       │   │   └── {guard-name}.guard.ts
│   │   │       │   └── pipes/
│   │   │       │       └── {pipe-name}.pipe.ts
│   │   │       ├── graphql/       # GraphQL
│   │   │       │   ├── resolvers/
│   │   │       │   │   └── {resolver-name}.resolver.ts
│   │   │       │   ├── schemas/
│   │   │       │   │   └── {schema-name}.schema.ts
│   │   │       │   └── directives/
│   │   │       │       └── {directive-name}.directive.ts
│   │   │       ├── websocket/     # WebSocket
│   │   │       │   ├── gateways/
│   │   │       │   │   └── {gateway-name}.gateway.ts
│   │   │       │   └── handlers/
│   │   │       │       └── {handler-name}.handler.ts
│   │   │       ├── cli/           # CLI 命令
│   │   │       │   └── {command-name}.command.ts
│   │   │       ├── queue-consumers/ # 消息队列消费者
│   │   │       │   └── {consumer-name}.consumer.ts
│   │   │       └── schedulers/    # 定时任务
│   │   │           └── {scheduler-name}.scheduler.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   ├── identity/                  # 身份认证包
│   │   └── [相同的目录结构]
│   ├── organization/              # 组织架构包
│   │   └── [相同的目录结构]
│   ├── authorization/             # 权限管理包
│   │   └── [相同的目录结构]
│   └── subscription/              # 订阅计费包
│       └── [相同的目录结构]
├── apps/                         # 应用目录
│   ├── api-gateway/              # API 网关应用
│   ├── admin-panel/              # 管理后台应用
│   └── tenant-portal/            # 租户门户应用
├── shared/                       # 共享组件
│   ├── types/                    # 类型定义
│   │   └── {type-name}.type.ts
│   ├── utils/                    # 工具函数
│   │   └── {util-name}.util.ts
│   ├── events/                   # 事件定义
│   │   └── {event-name}.event.ts
│   ├── constants/                # 常量定义
│   │   └── {constant-name}.constant.ts
│   ├── decorators/               # 装饰器
│   │   └── {decorator-name}.decorator.ts
│   ├── interceptors/             # 拦截器
│   │   └── {interceptor-name}.interceptor.ts
│   └── filters/                  # 异常过滤器
│       └── {filter-name}.filter.ts
├── docs/                         # 文档
├── tests/                        # 测试
├── scripts/                      # 脚本
├── config/                       # 配置文件
├── package.json                  # 根包配置
├── pnpm-workspace.yaml           # pnpm 工作空间配置
└── tsconfig.json                 # 根 TypeScript 配置
```

### 模块依赖关系设计

```text
依赖层次（从下到上）：
1. 基础设施层模块（无业务依赖）：
   - logging (日志管理模块)
   - config (配置管理模块)
   - cache (缓存管理模块)
   - database (数据库管理模块)
2. core (核心基础架构库，依赖基础设施层模块)
3. platform (平台核心业务模块，依赖 core)
4. tenant-management (依赖 core, platform)
5. identity (依赖 core, platform, tenant-management)
6. organization (依赖 core, platform, tenant-management)
7. authorization (依赖 core, platform, identity, organization)
8. subscription (依赖 core, platform, tenant-management)
```

### 基础设施层模块设计说明

基础设施层模块是 Aiofix-AI-SaaS 平台的技术基础设施，提供核心的技术服务能力。这些模块作为最底层的基础设施，为所有上层模块提供技术支撑。

#### 基础设施层模块核心功能

1. **Logging 模块**: 提供高性能的结构化日志服务
   - 基于 Pino 的高性能日志系统
   - 支持多级别日志、结构化输出、上下文管理
   - 提供 NestJS 集成、中间件、拦截器
   - 支持日志统计和性能监控

2. **Config 模块**: 提供统一的配置管理服务
   - 基于 NestJS ConfigModule 的封装
   - 支持多环境配置、配置缓存
   - 提供全局配置服务和动态配置更新
   - 支持配置验证和默认值管理

3. **Cache 模块**: 提供高性能的缓存服务
   - 多级缓存架构（内存+Redis）
   - 支持多种缓存策略、预热、失效管理
   - 提供 AOP 装饰器和拦截器
   - 支持缓存统计、健康检查、性能监控

4. **Database 模块**: 提供统一的数据库管理服务
   - 适配器模式实现数据库抽象层
   - 支持 PostgreSQL 等数据库
   - 提供连接池管理、健康检查
   - 支持事务管理、性能监控

### Core 模块设计说明

Core 模块是 Aiofix-AI-SaaS 平台的核心基础架构库，依赖基础设施层模块，为所有业务领域模块提供统一的架构基础、共享组件和通用功能。通过 Core 模块，确保整个平台的技术架构一致性，提高开发效率，降低维护成本。

#### Core 模块核心功能

1. **架构基础层**: 提供 Clean Architecture + CQRS + 事件驱动的基础设施
2. **多租户支持层**: 统一的租户上下文管理和数据隔离策略
3. **数据访问层**: 基础仓储接口、工作单元模式和规约模式
4. **缓存层**: 统一的缓存抽象和装饰器支持
5. **日志监控层**: 结构化日志和性能监控基础设施
6. **配置管理层**: 统一的配置服务和环境管理
7. **安全层**: 权限检查、认证授权和租户隔离
8. **验证层**: 自定义验证器、管道和装饰器
9. **异常处理层**: 统一的异常处理和过滤器
10. **通用组件**: 装饰器、拦截器、中间件和工具函数

### Platform 模块设计说明

Platform 模块是 Aiofix-AI-SaaS 平台的平台核心业务模块，包含平台级别的核心业务逻辑和功能。它作为业务模块的基础层，为其他业务模块提供平台相关的核心服务。

#### Platform 模块核心功能

1. **平台管理**: 平台配置、系统设置、全局参数管理
2. **系统监控**: 系统健康检查、性能监控、告警管理
3. **数据统计**: 平台级数据统计、报表生成、分析服务
4. **系统集成**: 外部系统集成、API 网关、服务发现
5. **平台安全**: 平台级安全策略、审计日志、合规管理
6. **资源管理**: 系统资源分配、容量管理、负载均衡
7. **版本管理**: 系统版本控制、升级管理、回滚机制
8. **配置中心**: 动态配置管理、环境配置、特性开关

## 配置和部署

### 配置文件结构

```text
config/
├── development/
│   └── {config-name}.config.ts
├── production/
│   └── {config-name}.config.ts
├── test/
│   └── {config-name}.config.ts
└── common/
    └── {config-name}.config.ts
```

### 环境变量

```bash
# 数据库配置
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=saas_platform
DATABASE_USER=saas_user
DATABASE_PASSWORD=saas_password

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=redis_password

# 事件存储配置
EVENT_STORE_TYPE=postgres
EVENT_STORE_CONNECTION_STRING=postgresql://...

# 消息队列配置
MESSAGE_QUEUE_TYPE=redis
MESSAGE_QUEUE_CONNECTION_STRING=redis://...

# 租户隔离配置
TENANT_ISOLATION_STRATEGY=database_per_tenant
TENANT_ID_HEADER=x-tenant-id
```

## 测试结构

### 测试目录结构

```text
tests/
├── unit/                          # 单元测试
│   ├── domain/
│   ├── application/
│   └── shared/
├── integration/                   # 集成测试
│   ├── infrastructure/
│   └── interfaces/
├── e2e/                          # 端到端测试
│   └── {test-name}.e2e.spec.ts
├── fixtures/                      # 测试数据
│   └── {fixture-name}.fixture.ts
└── helpers/                       # 测试辅助工具
    └── {helper-name}.helper.ts
```

## 文档结构

### 文档目录

```text
docs/
├── architecture/                  # 架构文档
│   └── {doc-name}.md
├── api/                          # API 文档
│   └── {api-name}.md
├── deployment/                   # 部署文档
│   └── {deployment-name}.md
└── development/                  # 开发文档
    └── {dev-doc-name}.md
```

## 脚本和工具

### 脚本目录

```text
scripts/
├── database/
│   └── {script-name}.ts
├── event-store/
│   └── {script-name}.ts
├── tenant/
│   └── {script-name}.ts
└── monitoring/
    └── {script-name}.ts
```

## 包管理配置

### pnpm workspace 配置

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
  - 'apps/*'
  - 'shared/*'
```

## 模块间通信和依赖关系设计

### 模块间通信策略

#### 同步通信

通过 Core 模块提供的接口定义模块间契约，实现类型安全的同步调用：

```typescript
// 在 core 模块中定义基础接口
export interface TenantService {
  getTenantById(id: TenantId): Promise<Tenant>;
  createTenant(data: CreateTenantData): Promise<Tenant>;
}

// 在 identity 模块中使用 Core 模块的基础组件
import { 
  BaseAggregateRoot, 
  BaseDomainEvent, 
  TenantContext,
  RequirePermission,
  LogExecution,
  Cacheable
} from '@aiofix/core';

@Injectable()
export class UserService {
  constructor(
    private tenantService: TenantService,
    private userRepository: UserRepository,
    private cache: ICache,
    private logger: ILogger
  ) {}
  
  @RequirePermission('user:read')
  @Cacheable((args) => `user:${args[0]}`, 300) // 5分钟缓存
  async getUserById(userId: string): Promise<User> {
    return this.userRepository.findById(userId);
  }
  
  @RequirePermission('user:write')
  @LogExecution()
  async createUser(data: CreateUserData): Promise<User> {
    // 验证租户存在
    const tenant = await this.tenantService.getTenantById(data.tenantId);
    // 创建用户逻辑
    const user = new User(data);
    await this.userRepository.save(user);
    
    // 清除缓存
    await this.cache.delete(`user:${user.id}`);
    
    return user;
  }
}
```

#### 异步通信

通过 Core 模块提供的事件总线进行松耦合的异步通信：

```typescript
// 在 core 模块中定义基础事件类
export abstract class BaseDomainEvent {
  constructor(
    public readonly eventId: string = uuidv4(),
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly timestamp: Date = new Date(),
    public readonly version: number = 1
  ) {}
}

// 在 shared/events 中定义跨模块事件
export class TenantCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantId: TenantId,
    public readonly tenantData: TenantData,
    timestamp: Date = new Date()
  ) {
    super(uuidv4(), tenantId, 'TenantCreated', timestamp);
  }
}

// 在 identity 模块中订阅事件
import { BaseDomainEvent, IEventHandler } from '@aiofix/core';

@EventHandler(TenantCreatedEvent)
export class TenantCreatedHandler implements IEventHandler<TenantCreatedEvent> {
  async handle(event: TenantCreatedEvent) {
    // 处理租户创建后的用户相关逻辑
    await this.setupDefaultUserRoles(event.tenantId);
  }
}
```

### 依赖注入配置

#### 模块注册

```typescript
// 在应用层注册模块依赖
@Module({
  imports: [
    // 基础设施层模块
    LoggingModule.forRoot(),       // 日志管理模块
    ConfigModule,                  // 配置管理模块
    CacheModule.forRoot(),         // 缓存管理模块
    DatabaseModule.forRoot(),      // 数据库管理模块
    
    // 核心架构层
    CoreModule,                    // Core 模块作为基础架构层
    PlatformModule,                // Platform 模块作为平台核心业务层
    
    // 业务模块
    TenantManagementModule,        // 租户管理模块
    IdentityModule,                // 身份认证模块
    OrganizationModule,            // 组织架构模块
    AuthorizationModule,           // 权限管理模块
    SubscriptionModule,            // 订阅计费模块
  ],
  providers: [
    // 跨模块服务注入
    {
      provide: 'TenantService',
      useClass: TenantService,
    },
    // Core 模块提供的服务
    {
      provide: 'ICache',
      useClass: RedisCache,
    },
    {
      provide: 'ILogger',
      useClass: StructuredLogger,
    },
    {
      provide: 'IMetricsCollector',
      useClass: PrometheusMetrics,
    },
  ],
})
export class AppModule {}
```

#### 接口实现

```typescript
// 在 tenant-management 模块中实现接口，使用 Core 模块的基础组件
import { 
  BaseAggregateRoot, 
  IEventBus, 
  IUnitOfWork,
  RequireTenantIsolation,
  LogExecution
} from '@aiofix/core';

@Injectable()
export class TenantService implements ITenantService {
  constructor(
    private tenantRepository: TenantRepository,
    private eventBus: IEventBus,
    private unitOfWork: IUnitOfWork
  ) {}
  
  @RequireTenantIsolation()
  @LogExecution()
  async createTenant(data: CreateTenantData): Promise<Tenant> {
    await this.unitOfWork.begin();
    
    try {
    const tenant = new Tenant(data);
    await this.tenantRepository.save(tenant);
    
    // 发布领域事件
    await this.eventBus.publish(new TenantCreatedEvent(
      tenant.id,
      tenant.toData(),
      new Date()
    ));
    
      await this.unitOfWork.commit();
    return tenant;
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
```

### 数据一致性保证

#### 事件溯源

每个模块维护自己的事件存储，通过 Core 模块提供的事件存储接口实现最终一致性：

```typescript
// 在 identity 模块中处理跨模块数据同步
import { IEventStore, BaseDomainEvent } from '@aiofix/core';

@EventHandler(TenantCreatedEvent)
export class TenantCreatedProjector {
  constructor(
    private eventStore: IEventStore,
    private userReadModel: UserReadModel
  ) {}
  
  async handle(event: TenantCreatedEvent) {
    // 保存事件到事件存储
    await this.eventStore.saveEvents(
      event.aggregateId,
      [event],
      event.version
    );
    
    // 更新用户模块的读模型
    await this.userReadModel.updateTenantInfo(
      event.tenantId,
      event.tenantData
    );
  }
}
```

#### Saga 模式

使用 Core 模块提供的 Saga 基础设施处理跨模块的分布式事务：

```typescript
import { BaseSaga, IEventBus, ILogger } from '@aiofix/core';

@Saga()
export class UserOnboardingSaga extends BaseSaga {
  constructor(
    private organizationService: OrganizationService,
    private authorizationService: AuthorizationService,
    private notificationService: NotificationService,
    private eventBus: IEventBus,
    private logger: ILogger
  ) {
    super();
  }
  
  @Saga()
  userOnboarding = (events$: Observable<any>) => {
    return events$.pipe(
      ofType(UserCreatedEvent),
      switchMap(async (event) => {
        try {
          this.logger.info('Starting user onboarding saga', { userId: event.userId });
          
          // 步骤1：创建用户组织关系
          await this.organizationService.assignUserToDefaultOrg(
            event.userId,
            event.tenantId
          );
          
          // 步骤2：分配默认角色
          await this.authorizationService.assignDefaultRole(
            event.userId,
            event.tenantId
          );
          
          // 步骤3：发送欢迎邮件
          await this.notificationService.sendWelcomeEmail(
            event.userId
          );
          
          this.logger.info('User onboarding saga completed successfully', { userId: event.userId });
        } catch (error) {
          this.logger.error('User onboarding saga failed', { userId: event.userId, error });
          // 补偿操作
          await this.compensateUserCreation(event.userId);
        }
      })
    );
  };
}
```

## 开发工作流

### 模块化开发流程

1. **Core 模块开发**: 首先开发 Core 模块，建立基础架构和共享组件
2. **需求分析**: 基于业务需求设计领域模型和模块边界
3. **模块设计**: 定义模块接口和依赖关系，确保所有业务模块依赖 Core 模块
4. **领域建模**: 在各自模块的领域层定义实体、聚合根、值对象，继承 Core 模块的基础类
5. **事件设计**: 定义跨模块事件和事件处理器，使用 Core 模块的事件基础设施
6. **命令查询设计**: 在应用层设计 CQRS 命令和查询，使用 Core 模块的 CQRS 基础设施
7. **接口实现**: 实现模块间通信接口，使用 Core 模块的装饰器和中间件
8. **测试编写**: 编写单元测试、集成测试、模块间测试，使用 Core 模块的测试工具
9. **集成部署**: 配置模块集成和部署，确保 Core 模块正确集成

### 开发环境配置

#### 本地开发命令

```bash
# 安装所有依赖
pnpm install

# 构建基础设施层模块（必须先构建）
pnpm --filter @aiofix/logging build
pnpm --filter @aiofix/config build
pnpm --filter @aiofix/cache build
pnpm --filter @aiofix/database build

# 构建 Core 模块
pnpm --filter @aiofix/core build

# 构建 Platform 模块
pnpm --filter @aiofix/platform build

# 启动所有模块的开发模式
pnpm dev

# 启动特定模块
pnpm --filter @aiofix/logging dev
pnpm --filter @aiofix/config dev
pnpm --filter @aiofix/cache dev
pnpm --filter @aiofix/database dev
pnpm --filter @aiofix/core dev
pnpm --filter @aiofix/platform dev
pnpm --filter @aiofix/identity dev

# 运行所有测试
pnpm test

# 运行特定模块测试
pnpm --filter @aiofix/logging test
pnpm --filter @aiofix/config test
pnpm --filter @aiofix/cache test
pnpm --filter @aiofix/database test
pnpm --filter @aiofix/core test
pnpm --filter @aiofix/platform test
pnpm --filter @aiofix/identity test

# 构建所有模块
pnpm build

# 构建特定模块
pnpm --filter @aiofix/logging build
pnpm --filter @aiofix/config build
pnpm --filter @aiofix/cache build
pnpm --filter @aiofix/database build
pnpm --filter @aiofix/core build
pnpm --filter @aiofix/platform build
pnpm --filter @aiofix/identity build

# 检查模块依赖关系
pnpm --filter @aiofix/core list
```

#### 模块开发规范

- **基础设施优先**: 基础设施层模块作为最底层，无业务依赖，提供核心技术能力
- **Core 优先**: 所有业务模块必须依赖 Core 模块，使用其提供的基础组件
- **Platform 基础**: 所有业务模块必须依赖 Platform 模块，使用其提供的平台核心服务
- **接口优先**: 先定义模块接口，再实现具体功能
- **事件驱动**: 跨模块通信优先使用 Core 模块提供的事件基础设施
- **依赖管理**: 严格遵循依赖层次，避免循环依赖，基础设施层模块作为最底层
- **版本控制**: 使用语义化版本管理模块版本，基础设施层和 Core 模块版本变更需要向后兼容
- **测试覆盖**: 每个模块必须达到 80% 以上的测试覆盖率，基础设施层和 Core 模块要求 95% 以上
- **文档完整**: 每个模块必须提供完整的 API 文档和使用示例

### 代码规范

- **命名规范**: 使用清晰的业务术语命名，基础设施层、Core 和 Platform 模块使用统一的前缀和命名约定
- **文件组织**: 按功能模块组织文件结构，基础设施层、Core 和 Platform 模块提供标准的目录结构模板
- **依赖管理**: 严格遵循依赖倒置原则，所有模块依赖基础设施层、Core 和 Platform 模块的接口而非实现
- **错误处理**: 使用 Core 模块提供的统一异常处理机制和过滤器
- **日志记录**: 使用 Logging 模块提供的结构化日志和审计轨迹
- **配置管理**: 使用 Config 模块提供的统一配置服务
- **缓存策略**: 使用 Cache 模块提供的缓存服务和装饰器
- **数据访问**: 使用 Database 模块提供的数据库适配器和连接管理
- **类型安全**: 使用 TypeScript 确保类型安全，基础设施层、Core 和 Platform 模块提供基础类型定义
- **装饰器使用**: 优先使用基础设施层和 Core 模块提供的装饰器（权限、缓存、日志等）
- **中间件集成**: 使用基础设施层和 Core 模块提供的中间件（租户上下文、请求ID等）
- **平台服务**: 使用 Platform 模块提供的平台核心服务（配置管理、监控、统计等）

## 总结

这个代码组织结构完全基于我们的混合架构模式设计，结合基础设施层模块、Core 模块基础架构和 Platform 模块平台核心，具有以下特点：

### 架构优势

1. **清晰的层次分离**: 严格按照 Clean Architecture 的层次组织代码，基础设施层提供核心技术能力，Core 模块提供统一的基础架构，Platform 模块提供平台核心业务
2. **CQRS 实现**: 命令和查询完全分离，Core 模块提供 CQRS 基础设施
3. **事件驱动**: 完整的事件存储、事件总线、消息队列实现，Core 模块提供事件驱动基础设施
4. **租户隔离**: 在每一层都考虑租户隔离的实现，Core 模块提供统一的多租户支持
5. **模块化设计**: 按业务领域划分独立模块，基础设施层、Core 和 Platform 模块作为基础层支持并行开发
6. **依赖管理**: 通过 pnpm workspace 实现统一的依赖管理，基础设施层模块作为最底层依赖，Core 模块作为架构基础层，Platform 模块作为业务基础层
7. **微服务演进**: 为未来微服务化奠定坚实基础，基础设施层、Core 和 Platform 模块提供技术架构一致性

### 模块化优势

1. **业务边界清晰**: 每个模块都有明确的业务职责和限界上下文，基础设施层、Core 和 Platform 模块提供技术边界
2. **独立开发**: 支持团队并行开发不同模块，基础设施层、Core 和 Platform 模块提供统一的开发基础
3. **版本管理**: 每个模块可以独立版本管理和发布，基础设施层、Core 和 Platform 模块版本变更影响所有业务模块
4. **技术选择**: 可以针对不同模块选择最适合的技术栈，基础设施层、Core 和 Platform 模块提供技术栈统一性
5. **测试隔离**: 每个模块可以独立测试和验证，基础设施层、Core 和 Platform 模块提供测试基础设施
6. **部署灵活**: 支持模块级别的独立部署和扩展，基础设施层、Core 和 Platform 模块作为共享基础架构

### 开发效率

1. **统一工具链**: 通过 pnpm workspace 统一管理构建、测试、部署工具，基础设施层、Core 和 Platform 模块提供开发工具
2. **类型安全**: 模块间通过 TypeScript 接口保证类型安全，基础设施层、Core 和 Platform 模块提供基础类型定义
3. **事件通信**: 通过事件驱动架构实现松耦合的模块间通信，Core 模块提供事件基础设施
4. **开发规范**: 统一的代码规范和开发流程，基础设施层、Core 和 Platform 模块提供标准化的开发模式
5. **文档完整**: 清晰的架构文档和开发指南，基础设施层、Core 和 Platform 模块提供完整的 API 文档
6. **开箱即用**: 基础设施层、Core 和 Platform 模块提供丰富的装饰器、中间件、工具函数，减少重复开发
7. **架构一致性**: 所有业务模块基于基础设施层、Core 和 Platform 模块构建，确保技术架构统一

### 未来扩展性

1. **微服务化**: 模块化设计为微服务拆分提供清晰边界，基础设施层、Core 和 Platform 模块提供技术架构一致性
2. **技术演进**: 支持渐进式技术栈升级，基础设施层、Core 和 Platform 模块作为技术演进的基础
3. **业务扩展**: 新业务模块可以独立开发和集成，基础设施层、Core 和 Platform 模块提供快速开发基础
4. **性能优化**: 支持模块级别的性能优化和扩展，基础设施层、Core 和 Platform 模块提供性能监控基础设施
5. **运维管理**: 为未来的 DevOps 和自动化运维奠定基础，基础设施层、Core 和 Platform 模块提供运维工具
6. **架构升级**: 基础设施层、Core 和 Platform 模块的版本升级可以统一提升所有业务模块的技术能力
7. **标准化**: 基础设施层、Core 和 Platform 模块确保整个平台的技术标准化和最佳实践

这个结构为我们的 SAAS 平台提供了坚实的技术基础，基础设施层模块提供核心技术能力，Core 模块作为核心基础架构库，Platform 模块作为平台核心业务模块，既保持了单体应用的开发效率，又具备了微服务架构的扩展性和灵活性，完美支持复杂的多租户业务需求。通过基础设施层、Core 和 Platform 模块，我们实现了技术架构的统一性、开发效率的提升和未来扩展的灵活性。
