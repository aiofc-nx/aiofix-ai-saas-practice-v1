# 租户模块技术设计方案

## 📋 文档概述

本文档基于《租户管理业务需求文档》，详细阐述AIOFix SAAS平台租户模块的技术设计方案，包括架构设计、数据模型、服务设计、API设计、安全设计等核心技术实现方案。

## 🎯 设计目标

### 技术目标

1. **Clean Architecture合规**：严格遵循Clean Architecture分层原则
2. **CQRS实现**：实现命令查询职责分离，优化读写性能
3. **事件驱动**：基于事件驱动架构，支持异步处理和系统解耦
4. **多租户支持**：完整的多租户技术基础设施
5. **高性能**：支持大规模并发和数据处理
6. **可扩展性**：支持业务增长和功能扩展

### 业务目标

1. **完整生命周期管理**：支持租户从创建到删除的完整生命周期
2. **灵活的组织架构**：支持复杂的组织和部门结构
3. **精细权限控制**：支持分级权限管理和访问控制
4. **业务规则执行**：严格执行业务规则和约束
5. **审计和合规**：完整的操作审计和合规支持

## 📁 代码组织结构

### 租户模块目录结构

基于Clean Architecture分层原则和业务需求，租户模块采用以下标准化目录结构：

```text
packages/tenant/
├── src/
│   ├── 🏛️ domain/                     # 领域层（Domain Layer）
│   │   ├── aggregates/               # 聚合根
│   │   │   ├── tenant/              # 租户聚合
│   │   │   │   ├── tenant.aggregate.ts
│   │   │   │   ├── tenant.aggregate.spec.ts
│   │   │   │   └── index.ts
│   │   │   ├── organization/        # 组织聚合
│   │   │   │   ├── organization.aggregate.ts
│   │   │   │   ├── organization.aggregate.spec.ts
│   │   │   │   └── index.ts
│   │   │   └── department/          # 部门聚合
│   │   │       ├── department.aggregate.ts
│   │   │       ├── department.aggregate.spec.ts
│   │   │       └── index.ts
│   │   ├── value-objects/           # 值对象
│   │   │   ├── tenant/              # 租户相关值对象
│   │   │   │   ├── tenant-code.vo.ts
│   │   │   │   ├── tenant-name.vo.ts
│   │   │   │   ├── tenant-domain.vo.ts
│   │   │   │   ├── tenant-configuration.vo.ts
│   │   │   │   └── index.ts
│   │   │   ├── organization/        # 组织相关值对象
│   │   │   │   ├── organization-name.vo.ts
│   │   │   │   ├── organization-type.vo.ts
│   │   │   │   └── index.ts
│   │   │   └── shared/              # 共享值对象
│   │   │       ├── entity-id.vo.ts
│   │   │       └── index.ts
│   │   ├── events/                  # 领域事件
│   │   │   ├── tenant/              # 租户相关事件
│   │   │   │   ├── tenant-created.event.ts
│   │   │   │   ├── tenant-upgraded.event.ts
│   │   │   │   ├── tenant-suspended.event.ts
│   │   │   │   ├── tenant-name-change-requested.event.ts
│   │   │   │   ├── tenant-name-changed.event.ts
│   │   │   │   └── index.ts
│   │   │   ├── organization/        # 组织相关事件
│   │   │   │   ├── organization-created.event.ts
│   │   │   │   ├── organization-updated.event.ts
│   │   │   │   └── index.ts
│   │   │   └── department/          # 部门相关事件
│   │   │       ├── department-created.event.ts
│   │   │       ├── user-assigned-to-department.event.ts
│   │   │       ├── user-unassigned-from-department.event.ts
│   │   │       └── index.ts
│   │   ├── services/                # 领域服务
│   │   │   ├── tenant-uniqueness.service.ts
│   │   │   ├── tenant-validation.service.ts
│   │   │   ├── organization-limit.service.ts
│   │   │   └── index.ts
│   │   ├── repositories/            # 仓储接口
│   │   │   ├── tenant.repository.interface.ts
│   │   │   ├── organization.repository.interface.ts
│   │   │   ├── department.repository.interface.ts
│   │   │   └── index.ts
│   │   ├── specifications/          # 业务规格
│   │   │   ├── tenant-can-upgrade.spec.ts
│   │   │   ├── organization-limit-check.spec.ts
│   │   │   └── index.ts
│   │   └── exceptions/              # 领域异常
│   │       ├── tenant.exception.ts
│   │       ├── organization.exception.ts
│   │       ├── department.exception.ts
│   │       └── index.ts
│   │
│   ├── 🔧 application/               # 应用层（Application Layer）
│   │   ├── common/                  # 公共组件
│   │   │   ├── interfaces/          # 应用层接口
│   │   │   │   ├── tenant-service.interface.ts
│   │   │   │   ├── notification.interface.ts
│   │   │   │   ├── billing.interface.ts
│   │   │   │   └── index.ts
│   │   │   ├── decorators/          # 应用层装饰器
│   │   │   │   ├── tenant-scoped.decorator.ts
│   │   │   │   └── index.ts
│   │   │   └── exceptions/          # 应用层异常
│   │   │       ├── tenant-application.exception.ts
│   │   │       └── index.ts
│   │   ├── commands/                # 命令端（Command Side）
│   │   │   ├── tenant/              # 租户命令
│   │   │   │   ├── create-tenant/
│   │   │   │   │   ├── create-tenant.command.ts
│   │   │   │   │   ├── create-tenant.handler.ts
│   │   │   │   │   ├── create-tenant.result.ts
│   │   │   │   │   ├── create-tenant.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── upgrade-tenant/
│   │   │   │   │   ├── upgrade-tenant.command.ts
│   │   │   │   │   ├── upgrade-tenant.handler.ts
│   │   │   │   │   ├── upgrade-tenant.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── suspend-tenant/
│   │   │   │   │   ├── suspend-tenant.command.ts
│   │   │   │   │   ├── suspend-tenant.handler.ts
│   │   │   │   │   ├── suspend-tenant.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── request-name-change/
│   │   │   │       ├── request-name-change.command.ts
│   │   │   │       ├── request-name-change.handler.ts
│   │   │   │       ├── request-name-change.spec.ts
│   │   │   │       └── index.ts
│   │   │   ├── organization/        # 组织命令
│   │   │   │   ├── create-organization/
│   │   │   │   │   ├── create-organization.command.ts
│   │   │   │   │   ├── create-organization.handler.ts
│   │   │   │   │   ├── create-organization.result.ts
│   │   │   │   │   ├── create-organization.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── update-organization/
│   │   │   │       ├── update-organization.command.ts
│   │   │   │       ├── update-organization.handler.ts
│   │   │   │       ├── update-organization.spec.ts
│   │   │   │       └── index.ts
│   │   │   └── department/          # 部门命令
│   │   │       ├── create-department/
│   │   │       │   ├── create-department.command.ts
│   │   │       │   ├── create-department.handler.ts
│   │   │       │   ├── create-department.result.ts
│   │   │       │   ├── create-department.spec.ts
│   │   │       │   └── index.ts
│   │   │       ├── assign-user-to-department/
│   │   │       │   ├── assign-user.command.ts
│   │   │       │   ├── assign-user.handler.ts
│   │   │       │   ├── assign-user.spec.ts
│   │   │       │   └── index.ts
│   │   │       └── unassign-user-from-department/
│   │   │           ├── unassign-user.command.ts
│   │   │           ├── unassign-user.handler.ts
│   │   │           ├── unassign-user.spec.ts
│   │   │           └── index.ts
│   │   ├── queries/                 # 查询端（Query Side）
│   │   │   ├── tenant/              # 租户查询
│   │   │   │   ├── get-tenant-by-id/
│   │   │   │   │   ├── get-tenant-by-id.query.ts
│   │   │   │   │   ├── get-tenant-by-id.handler.ts
│   │   │   │   │   ├── get-tenant-by-id.result.ts
│   │   │   │   │   ├── get-tenant-by-id.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── get-tenants/
│   │   │   │   │   ├── get-tenants.query.ts
│   │   │   │   │   ├── get-tenants.handler.ts
│   │   │   │   │   ├── get-tenants.result.ts
│   │   │   │   │   ├── get-tenants.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── get-tenant-statistics/
│   │   │   │   │   ├── get-tenant-statistics.query.ts
│   │   │   │   │   ├── get-tenant-statistics.handler.ts
│   │   │   │   │   ├── get-tenant-statistics.result.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── check-tenant-availability/
│   │   │   │       ├── check-availability.query.ts
│   │   │   │       ├── check-availability.handler.ts
│   │   │   │       ├── check-availability.result.ts
│   │   │   │       └── index.ts
│   │   │   ├── organization/        # 组织查询
│   │   │   │   ├── get-organizations-by-tenant/
│   │   │   │   │   ├── get-organizations.query.ts
│   │   │   │   │   ├── get-organizations.handler.ts
│   │   │   │   │   ├── get-organizations.result.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── get-organization-by-id/
│   │   │   │       ├── get-organization.query.ts
│   │   │   │       ├── get-organization.handler.ts
│   │   │   │       ├── get-organization.result.ts
│   │   │   │       └── index.ts
│   │   │   └── department/          # 部门查询
│   │   │       ├── get-departments-by-organization/
│   │   │       │   ├── get-departments.query.ts
│   │   │       │   ├── get-departments.handler.ts
│   │   │       │   ├── get-departments.result.ts
│   │   │       │   └── index.ts
│   │   │       └── get-department-hierarchy/
│   │   │           ├── get-hierarchy.query.ts
│   │   │           ├── get-hierarchy.handler.ts
│   │   │           ├── get-hierarchy.result.ts
│   │   │           └── index.ts
│   │   ├── events/                  # 事件处理器
│   │   │   ├── handlers/            # 事件处理器
│   │   │   │   ├── tenant/          # 租户事件处理器
│   │   │   │   │   ├── tenant-created.handler.ts
│   │   │   │   │   ├── tenant-upgraded.handler.ts
│   │   │   │   │   ├── tenant-suspended.handler.ts
│   │   │   │   │   ├── tenant-name-change-requested.handler.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── organization/    # 组织事件处理器
│   │   │   │   │   ├── organization-created.handler.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── department/      # 部门事件处理器
│   │   │   │       ├── department-created.handler.ts
│   │   │   │       ├── user-assigned.handler.ts
│   │   │   │       └── index.ts
│   │   │   ├── projectors/          # 投影器（更新读模型）
│   │   │   │   ├── tenant-read-model.projector.ts
│   │   │   │   ├── organization-statistics.projector.ts
│   │   │   │   └── index.ts
│   │   │   ├── sagas/               # Saga流程管理器
│   │   │   │   ├── tenant-onboarding.saga.ts
│   │   │   │   ├── tenant-upgrade.saga.ts
│   │   │   │   └── index.ts
│   │   │   └── integration/         # 集成事件发布器
│   │   │       ├── tenant-integration.publisher.ts
│   │   │       └── index.ts
│   │   ├── services/                # 应用服务
│   │   │   ├── tenant.service.ts
│   │   │   ├── organization.service.ts
│   │   │   ├── department.service.ts
│   │   │   ├── tenant-context.service.ts
│   │   │   └── index.ts
│   │   └── ports/                   # 输出端口（接口定义）
│   │       ├── commands/            # 命令侧端口
│   │       │   ├── tenant-command.port.ts
│   │       │   ├── organization-command.port.ts
│   │       │   └── index.ts
│   │       ├── queries/             # 查询侧端口
│   │       │   ├── tenant-query.port.ts
│   │       │   ├── organization-query.port.ts
│   │       │   └── index.ts
│   │       └── shared/              # 共享端口
│   │           ├── notification.port.ts
│   │           ├── audit.port.ts
│   │           ├── billing.port.ts
│   │           └── index.ts
│   │
│   ├── 🏗️ infrastructure/           # 基础设施层（Infrastructure Layer）
│   │   ├── persistence/             # 持久化层
│   │   │   ├── entities/            # 数据库实体
│   │   │   │   ├── tenant.entity.ts
│   │   │   │   ├── tenant-read-model.entity.ts
│   │   │   │   ├── organization.entity.ts
│   │   │   │   ├── department.entity.ts
│   │   │   │   └── index.ts
│   │   │   ├── repositories/        # 仓储实现
│   │   │   │   ├── tenant/          # 租户仓储
│   │   │   │   │   ├── tenant.repository.ts
│   │   │   │   │   ├── tenant-query.repository.ts
│   │   │   │   │   ├── tenant.repository.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── organization/    # 组织仓储
│   │   │   │   │   ├── organization.repository.ts
│   │   │   │   │   ├── organization-query.repository.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── department/      # 部门仓储
│   │   │   │       ├── department.repository.ts
│   │   │   │       ├── department-query.repository.ts
│   │   │   │       └── index.ts
│   │   │   ├── migrations/          # 数据库迁移
│   │   │   │   ├── 001-create-tenants-table.ts
│   │   │   │   ├── 002-create-organizations-table.ts
│   │   │   │   ├── 003-create-departments-table.ts
│   │   │   │   ├── 004-create-tenant-read-models-table.ts
│   │   │   │   └── index.ts
│   │   │   └── seeders/             # 数据种子
│   │   │       ├── default-tenant-types.seeder.ts
│   │   │       └── index.ts
│   │   ├── messaging/               # 消息传递
│   │   │   ├── event-store/         # 事件存储
│   │   │   │   ├── tenant-event.store.ts
│   │   │   │   ├── event-serializer.ts
│   │   │   │   └── index.ts
│   │   │   ├── publishers/          # 事件发布器
│   │   │   │   ├── tenant-event.publisher.ts
│   │   │   │   └── index.ts
│   │   │   └── subscribers/         # 事件订阅器
│   │   │       ├── tenant-notification.subscriber.ts
│   │   │       └── index.ts
│   │   ├── cache/                   # 缓存实现
│   │   │   ├── tenant-cache.service.ts
│   │   │   ├── organization-cache.service.ts
│   │   │   └── index.ts
│   │   ├── monitoring/              # 监控实现
│   │   │   ├── tenant-performance.monitor.ts
│   │   │   ├── tenant-metrics.service.ts
│   │   │   └── index.ts
│   │   ├── external-services/       # 外部服务适配器
│   │   │   ├── notification/        # 通知服务适配器
│   │   │   │   ├── email-notification.adapter.ts
│   │   │   │   ├── sms-notification.adapter.ts
│   │   │   │   └── index.ts
│   │   │   ├── billing/             # 计费服务适配器
│   │   │   │   ├── stripe-billing.adapter.ts
│   │   │   │   └── index.ts
│   │   │   └── audit/               # 审计服务适配器
│   │   │       ├── audit-log.adapter.ts
│   │   │       └── index.ts
│   │   ├── config/                  # 配置实现
│   │   │   ├── tenant-config.factory.ts
│   │   │   ├── tenant-config.validator.ts
│   │   │   └── index.ts
│   │   └── security/                # 安全实现
│   │       ├── tenant-isolation.middleware.ts
│   │       ├── tenant-access.guard.ts
│   │       ├── role-based-access.guard.ts
│   │       └── index.ts
│   │
│   ├── 🌐 interfaces/               # 接口层（Interface Layer）
│   │   ├── rest/                    # REST API
│   │   │   ├── controllers/         # 控制器
│   │   │   │   ├── tenant/          # 租户控制器
│   │   │   │   │   ├── tenant.controller.ts
│   │   │   │   │   ├── tenant.controller.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── organization/    # 组织控制器
│   │   │   │   │   ├── organization.controller.ts
│   │   │   │   │   ├── organization.controller.spec.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── department/      # 部门控制器
│   │   │   │       ├── department.controller.ts
│   │   │   │       ├── department.controller.spec.ts
│   │   │   │       └── index.ts
│   │   │   ├── dto/                 # 数据传输对象
│   │   │   │   ├── tenant/          # 租户DTO
│   │   │   │   │   ├── create-tenant.dto.ts
│   │   │   │   │   ├── update-tenant.dto.ts
│   │   │   │   │   ├── tenant-response.dto.ts
│   │   │   │   │   ├── tenant-list.dto.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── organization/    # 组织DTO
│   │   │   │   │   ├── create-organization.dto.ts
│   │   │   │   │   ├── organization-response.dto.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── department/      # 部门DTO
│   │   │   │       ├── create-department.dto.ts
│   │   │   │       ├── department-response.dto.ts
│   │   │   │       ├── department-hierarchy.dto.ts
│   │   │   │       └── index.ts
│   │   │   ├── middleware/          # 中间件
│   │   │   │   ├── tenant-context.middleware.ts
│   │   │   │   ├── audit-logging.middleware.ts
│   │   │   │   └── index.ts
│   │   │   ├── guards/              # 守卫
│   │   │   │   ├── tenant-access.guard.ts
│   │   │   │   ├── organization-access.guard.ts
│   │   │   │   ├── role-based.guard.ts
│   │   │   │   └── index.ts
│   │   │   ├── pipes/               # 管道
│   │   │   │   ├── tenant-validation.pipe.ts
│   │   │   │   └── index.ts
│   │   │   └── filters/             # 异常过滤器
│   │   │       ├── tenant-exception.filter.ts
│   │   │       └── index.ts
│   │   ├── graphql/                 # GraphQL（可选）
│   │   │   ├── resolvers/           # 解析器
│   │   │   │   ├── tenant.resolver.ts
│   │   │   │   ├── organization.resolver.ts
│   │   │   │   └── index.ts
│   │   │   ├── schemas/             # GraphQL模式
│   │   │   │   ├── tenant.schema.ts
│   │   │   │   └── index.ts
│   │   │   └── directives/          # 指令
│   │   │       ├── tenant-auth.directive.ts
│   │   │       └── index.ts
│   │   └── cli/                     # CLI命令（管理工具）
│   │       ├── tenant-management.command.ts
│   │       ├── tenant-migration.command.ts
│   │       └── index.ts
│   │
│   ├── 📊 shared/                   # 共享组件
│   │   ├── constants/               # 常量
│   │   │   ├── tenant.constants.ts
│   │   │   ├── organization.constants.ts
│   │   │   ├── department.constants.ts
│   │   │   └── index.ts
│   │   ├── types/                   # 类型定义
│   │   │   ├── tenant.types.ts
│   │   │   ├── organization.types.ts
│   │   │   ├── department.types.ts
│   │   │   ├── common.types.ts
│   │   │   └── index.ts
│   │   ├── enums/                   # 枚举定义
│   │   │   ├── tenant-type.enum.ts
│   │   │   ├── tenant-status.enum.ts
│   │   │   ├── organization-type.enum.ts
│   │   │   ├── data-isolation-strategy.enum.ts
│   │   │   └── index.ts
│   │   ├── utils/                   # 工具函数
│   │   │   ├── tenant.utils.ts
│   │   │   ├── organization.utils.ts
│   │   │   ├── department.utils.ts
│   │   │   └── index.ts
│   │   ├── decorators/              # 装饰器
│   │   │   ├── tenant-scoped.decorator.ts
│   │   │   ├── organization-scoped.decorator.ts
│   │   │   └── index.ts
│   │   ├── interceptors/            # 拦截器
│   │   │   ├── tenant-context.interceptor.ts
│   │   │   ├── performance-logging.interceptor.ts
│   │   │   └── index.ts
│   │   └── validators/              # 验证器
│   │       ├── tenant-code.validator.ts
│   │       ├── tenant-name.validator.ts
│   │       ├── domain.validator.ts
│   │       └── index.ts
│   │
│   └── index.ts                     # 模块主入口
│
├── 🧪 tests/                        # 测试目录
│   ├── unit/                        # 单元测试
│   │   ├── domain/                  # 领域层测试
│   │   │   ├── aggregates/
│   │   │   ├── value-objects/
│   │   │   ├── services/
│   │   │   └── events/
│   │   ├── application/             # 应用层测试
│   │   │   ├── commands/
│   │   │   ├── queries/
│   │   │   └── handlers/
│   │   └── infrastructure/         # 基础设施层测试
│   │       ├── repositories/
│   │       ├── cache/
│   │       └── monitoring/
│   ├── integration/                 # 集成测试
│   │   ├── api/                     # API集成测试
│   │   ├── database/                # 数据库集成测试
│   │   └── events/                  # 事件集成测试
│   ├── e2e/                         # 端到端测试
│   │   ├── tenant-lifecycle.e2e.spec.ts
│   │   ├── organization-management.e2e.spec.ts
│   │   └── department-hierarchy.e2e.spec.ts
│   ├── fixtures/                    # 测试数据
│   │   ├── tenant.fixtures.ts
│   │   ├── organization.fixtures.ts
│   │   └── department.fixtures.ts
│   └── helpers/                     # 测试助手
│       ├── test-database.helper.ts
│       ├── test-cache.helper.ts
│       └── test-event-bus.helper.ts
│
├── 📚 docs/                         # 模块文档
│   ├── api/                         # API文档
│   │   ├── tenant-api.md
│   │   ├── organization-api.md
│   │   └── department-api.md
│   ├── guides/                      # 使用指南
│   │   ├── getting-started.md
│   │   ├── advanced-usage.md
│   │   └── troubleshooting.md
│   └── examples/                    # 示例代码
│       ├── basic-tenant-usage.ts
│       ├── complex-organization.ts
│       └── department-hierarchy.ts
│
├── 📦 package.json                  # 包配置
├── 📝 README.md                     # 模块说明
├── ⚙️ tsconfig.json                 # TypeScript配置
├── ⚙️ tsconfig.lib.json             # 库TypeScript配置
├── 🧪 jest.config.js                # Jest测试配置
├── 📋 project.json                  # Nx项目配置
└── 🔍 .eslintrc.json               # ESLint配置
```

### 代码组织原则

#### **1. 分层隔离原则**

- **严格分层**：每个层级都有独立的目录，不允许跨层直接调用
- **依赖方向**：外层可以依赖内层，内层不能依赖外层
- **接口隔离**：通过 `ports/` 目录定义层间接口契约

#### **2. 业务聚合原则**

- **聚合边界**：每个聚合都有独立的目录和完整的实现
- **功能内聚**：相关的命令、查询、事件处理器按业务聚合组织
- **职责单一**：每个文件只负责单一的业务概念

#### **3. 可测试性原则**

- **测试并行**：测试目录结构与源码目录结构一一对应
- **测试分层**：单元测试、集成测试、端到端测试分离
- **测试数据**：独立的测试数据和助手工具

#### **4. 可维护性原则**

- **索引文件**：每个目录都有 `index.ts` 文件统一导出
- **命名规范**：文件命名清晰，反映其功能和职责
- **文档完整**：每个重要组件都有对应的文档

### 文件命名约定

#### **聚合根文件**

```text
{aggregate-name}.aggregate.ts     # 聚合根实现
{aggregate-name}.aggregate.spec.ts # 聚合根测试
```

#### **命令文件**

```text
{command-name}.command.ts         # 命令定义
{command-name}.handler.ts         # 命令处理器
{command-name}.result.ts          # 命令结果
{command-name}.spec.ts           # 命令测试
```

#### **查询文件**

```text
{query-name}.query.ts            # 查询定义
{query-name}.handler.ts          # 查询处理器
{query-name}.result.ts           # 查询结果
{query-name}.spec.ts            # 查询测试
```

#### **事件文件**

```text
{event-name}.event.ts            # 事件定义
{event-name}.handler.ts          # 事件处理器
{event-name}.spec.ts            # 事件测试
```

#### **值对象文件**

```text
{value-object-name}.vo.ts        # 值对象实现
{value-object-name}.vo.spec.ts   # 值对象测试
```

### 导入路径配置

#### **路径别名配置（tsconfig.json）**

```json
{
  "compilerOptions": {
    "baseUrl": "./src",
    "paths": {
      "@tenant/domain/*": ["domain/*"],
      "@tenant/application/*": ["application/*"],
      "@tenant/infrastructure/*": ["infrastructure/*"],
      "@tenant/interfaces/*": ["interfaces/*"],
      "@tenant/shared/*": ["shared/*"],
      "@tenant/tests/*": ["../tests/*"]
    }
  }
}
```

#### **清晰的导入示例**

```typescript
// ✅ 领域层导入
import { Tenant } from '@tenant/domain/aggregates/tenant';
import { TenantCode } from '@tenant/domain/value-objects/tenant/tenant-code.vo';
import { TenantCreatedEvent } from '@tenant/domain/events/tenant/tenant-created.event';

// ✅ 应用层导入
import { CreateTenantCommand } from '@tenant/application/commands/tenant/create-tenant';
import { GetTenantByIdQuery } from '@tenant/application/queries/tenant/get-tenant-by-id';

// ✅ 基础设施层导入
import { TenantRepository } from '@tenant/infrastructure/persistence/repositories/tenant';
import { TenantCacheService } from '@tenant/infrastructure/cache/tenant-cache.service';

// ✅ 接口层导入
import { TenantController } from '@tenant/interfaces/rest/controllers/tenant';
import { CreateTenantDto } from '@tenant/interfaces/rest/dto/tenant/create-tenant.dto';
```

### 模块配置文件

#### **package.json 配置**

```json
{
  "name": "@aiofix/tenant",
  "version": "1.0.0",
  "description": "AIOFix SAAS平台租户管理模块",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc -p tsconfig.lib.json",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix"
  },
  "dependencies": {
    "@aiofix/core": "workspace:*",
    "@aiofix/config": "workspace:*",
    "@aiofix/database": "workspace:*",
    "@aiofix/messaging": "workspace:*",
    "@aiofix/cache": "workspace:*",
    "@aiofix/logging": "workspace:*",
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/cqrs": "^10.0.0",
    "@nestjs/typeorm": "^10.0.0",
    "typeorm": "^0.3.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  },
  "devDependencies": {
    "@types/jest": "^29.0.0",
    "@types/node": "^20.0.0",
    "jest": "^29.0.0",
    "typescript": "^5.0.0",
    "eslint": "^8.0.0"
  },
  "peerDependencies": {
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.0"
  }
}
```

#### **tsconfig.lib.json 配置**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2020",
    "lib": ["es2020"],
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "./src",
    "paths": {
      "@tenant/domain/*": ["domain/*"],
      "@tenant/application/*": ["application/*"],
      "@tenant/infrastructure/*": ["infrastructure/*"],
      "@tenant/interfaces/*": ["interfaces/*"],
      "@tenant/shared/*": ["shared/*"],
      "@tenant/tests/*": ["../tests/*"],
      "@aiofix/core": ["../../core/src"],
      "@aiofix/core/*": ["../../core/src/*"],
      "@aiofix/config": ["../../config/src"],
      "@aiofix/database": ["../../database/src"],
      "@aiofix/messaging": ["../../messaging/src"],
      "@aiofix/cache": ["../../cache/src"],
      "@aiofix/logging": ["../../logging/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["**/*.spec.ts", "**/*.test.ts", "tests/**/*"]
}
```

#### **project.json 配置（Nx）**

```json
{
  "name": "tenant",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "packages/tenant/src",
  "projectType": "library",
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{options.outputPath}"],
      "options": {
        "outputPath": "dist/packages/tenant",
        "tsConfig": "packages/tenant/tsconfig.lib.json",
        "packageJson": "packages/tenant/package.json"
      }
    },
    "test": {
      "executor": "@nx/jest:jest",
      "outputs": ["{workspaceRoot}/coverage/packages/tenant"],
      "options": {
        "jestConfig": "packages/tenant/jest.config.js"
      }
    },
    "lint": {
      "executor": "@nx/eslint:lint",
      "outputs": ["{options.outputFile}"],
      "options": {
        "lintFilePatterns": ["packages/tenant/**/*.ts"]
      }
    }
  },
  "tags": ["scope:tenant", "type:lib"]
}
```

### 依赖关系图

#### **模块依赖关系**

```text
租户模块依赖关系：
┌─────────────────────────────────────────────────────────────┐
│                     @aiofix/tenant                         │
├─────────────────────────────────────────────────────────────┤
│                      依赖关系                                │
│                                                            │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │   @aiofix/core  │  │  @aiofix/config │                │
│  │                 │  │                 │                │
│  │ • BaseEntity    │  │ • ConfigManager │                │
│  │ • CQRS系统      │  │ • 配置验证       │                │
│  │ • 多租户基础设施  │  │ • 热更新        │                │
│  │ • 错误处理       │  │                 │                │
│  └─────────────────┘  └─────────────────┘                │
│           │                     │                         │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │@aiofix/database │  │ @aiofix/messaging│               │
│  │                 │  │                 │                │
│  │ • 仓储基类       │  │ • 事件总线       │                │
│  │ • 事务管理       │  │ • 消息队列       │                │
│  │ • 查询优化       │  │ • 事件存储       │                │
│  └─────────────────┘  └─────────────────┘                │
│           │                     │                         │
│  ┌─────────────────┐  ┌─────────────────┐                │
│  │  @aiofix/cache  │  │ @aiofix/logging │                │
│  │                 │  │                 │                │
│  │ • 缓存服务       │  │ • 日志服务       │                │
│  │ • 多租户缓存     │  │ • 审计日志       │                │
│  │ • 性能优化       │  │ • 性能监控       │                │
│  └─────────────────┘  └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

#### **层间依赖规则**

```typescript
// ✅ 正确的依赖方向
// 接口层 → 应用层 → 领域层 ← 基础设施层

// 接口层可以依赖应用层
import { CreateTenantCommand } from '@tenant/application/commands/tenant/create-tenant';

// 应用层可以依赖领域层
import { Tenant } from '@tenant/domain/aggregates/tenant';
import { ITenantRepository } from '@tenant/domain/repositories/tenant.repository.interface';

// 基础设施层实现领域层接口
export class TenantRepository implements ITenantRepository {
  // 实现领域层定义的接口
}

// ❌ 禁止的依赖方向
// 领域层不能依赖应用层或基础设施层
// import { CreateTenantHandler } from '@tenant/application/commands/tenant/create-tenant'; // ❌ 错误
// import { TenantRepository } from '@tenant/infrastructure/persistence/repositories/tenant'; // ❌ 错误
```

### 代码质量标准

#### **TypeScript配置要求**

```json
{
  "compilerOptions": {
    "strict": true,                    // 启用严格模式
    "noImplicitAny": true,            // 禁止隐式any
    "noImplicitReturns": true,        // 禁止隐式返回
    "noUnusedLocals": true,           // 禁止未使用的局部变量
    "noUnusedParameters": true,       // 禁止未使用的参数
    "exactOptionalPropertyTypes": true, // 严格可选属性类型
    "noImplicitOverride": true,       // 要求显式override
    "experimentalDecorators": true,    // 启用装饰器
    "emitDecoratorMetadata": true     // 发出装饰器元数据
  }
}
```

#### **ESLint配置要求**

```json
{
  "extends": [
    "../../.eslintrc.json"
  ],
  "ignorePatterns": ["!**/*"],
  "overrides": [
    {
      "files": ["*.ts"],
      "rules": {
        "@typescript-eslint/no-explicit-any": "error",
        "@typescript-eslint/explicit-function-return-type": "error",
        "@typescript-eslint/no-unused-vars": "error",
        "prefer-const": "error",
        "no-console": "error"
      }
    },
    {
      "files": ["*.spec.ts", "*.test.ts"],
      "rules": {
        "no-console": "off"
      }
    }
  ]
}
```

#### **Jest测试配置**

```javascript
module.exports = {
  displayName: 'tenant',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }]
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/packages/tenant',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  moduleNameMapping: {
    '^@tenant/(.*)$': '<rootDir>/src/$1',
    '^@aiofix/core$': '<rootDir>/../../core/src',
    '^@aiofix/core/(.*)$': '<rootDir>/../../core/src/$1',
    '^@aiofix/config$': '<rootDir>/../../config/src',
    '^@aiofix/database$': '<rootDir>/../../database/src',
    '^@aiofix/messaging$': '<rootDir>/../../messaging/src',
    '^@aiofix/cache$': '<rootDir>/../../cache/src',
    '^@aiofix/logging$': '<rootDir>/../../logging/src'
  }
};
```

### 模块导出策略

#### **主入口文件（src/index.ts）**

```typescript
// 租户模块主入口文件
// 只导出公共API，不暴露内部实现细节

// 🏛️ 领域层公共导出
export * from './domain/aggregates/tenant';
export * from './domain/aggregates/organization';
export * from './domain/aggregates/department';
export * from './domain/value-objects/tenant';
export * from './domain/events/tenant';
export * from './domain/repositories';

// 🔧 应用层公共导出
export * from './application/commands/tenant/create-tenant';
export * from './application/commands/tenant/upgrade-tenant';
export * from './application/queries/tenant/get-tenant-by-id';
export * from './application/queries/tenant/get-tenants';
export * from './application/services';

// 🌐 接口层公共导出
export * from './interfaces/rest/dto/tenant';
export * from './interfaces/rest/dto/organization';
export * from './interfaces/rest/dto/department';

// 📊 共享组件导出
export * from './shared/constants';
export * from './shared/types';
export * from './shared/enums';
export * from './shared/utils';

// 🔧 模块配置导出
export { TenantModule } from './tenant.module';
```

#### **分层导出策略**

```typescript
// 领域层导出（domain/index.ts）
export * from './aggregates';
export * from './value-objects';
export * from './events';
export * from './services';
export * from './repositories';
export * from './specifications';
export * from './exceptions';

// 应用层导出（application/index.ts）
export * from './commands';
export * from './queries';
export * from './events';
export * from './services';
export * from './ports';

// 基础设施层导出（infrastructure/index.ts）
// 注意：基础设施层通常不直接导出，通过依赖注入使用
export * from './persistence/entities';
export * from './config';

// 接口层导出（interfaces/index.ts）
export * from './rest/controllers';
export * from './rest/dto';
export * from './rest/guards';
export * from './rest/middleware';
```

### 开发工作流程

#### **1. 新功能开发流程**

```text
功能开发标准流程：
1. 领域层设计
   ├── 定义聚合根和值对象
   ├── 设计领域事件
   ├── 实现业务规则
   └── 编写单元测试

2. 应用层实现
   ├── 设计命令和查询
   ├── 实现处理器
   ├── 设计事件处理器
   └── 编写集成测试

3. 基础设施层实现
   ├── 实现仓储
   ├── 配置数据库实体
   ├── 实现缓存策略
   └── 编写基础设施测试

4. 接口层实现
   ├── 设计REST API
   ├── 实现控制器
   ├── 设计DTO
   └── 编写API测试

5. 端到端验证
   ├── 编写E2E测试
   ├── 性能测试
   ├── 安全测试
   └── 文档更新
```

#### **2. 代码审查清单**

```text
代码审查检查项：
├── 架构合规性
│   ├── ✅ 分层架构正确
│   ├── ✅ 依赖方向正确
│   ├── ✅ 接口隔离完整
│   └── ✅ 单一职责明确

├── 代码质量
│   ├── ✅ TypeScript严格模式
│   ├── ✅ ESLint规则通过
│   ├── ✅ 测试覆盖率≥80%
│   └── ✅ TSDoc注释完整

├── 业务逻辑
│   ├── ✅ 业务规则正确实现
│   ├── ✅ 异常处理完整
│   ├── ✅ 验证逻辑严格
│   └── ✅ 审计日志完整

└── 性能和安全
    ├── ✅ 查询性能优化
    ├── ✅ 缓存策略合理
    ├── ✅ 权限控制严格
    └── ✅ 数据隔离正确
```

### 文档和示例

#### **README.md 模板**

```markdown
# @aiofix/tenant - 租户管理模块

## 概述

AIOFix SAAS平台的租户管理模块，基于Clean Architecture + CQRS + Event Sourcing架构设计，提供完整的多租户支持和管理功能。

## 特性

- ✅ 完整的租户生命周期管理
- ✅ 支持7层组织部门架构
- ✅ CQRS读写分离优化
- ✅ 事件驱动架构
- ✅ 多租户数据隔离
- ✅ 企业级权限控制

## 快速开始

### 安装

\`\`\`bash
pnpm install @aiofix/tenant
\`\`\`

### 基础使用

\`\`\`typescript
import { TenantModule, CreateTenantCommand } from '@aiofix/tenant';

// 在应用模块中导入
@Module({
  imports: [TenantModule],
})
export class AppModule {}

// 创建租户
const command = new CreateTenantCommand(
  'tech-startup',
  '科技创业公司',
  'techstartup.aiofix.com',
  '专注于技术创新的创业公司',
  'user-123'
);

const result = await commandBus.execute(command);
\`\`\`

## API文档

详细的API文档请参考：
- [租户API文档](./docs/api/tenant-api.md)
- [组织API文档](./docs/api/organization-api.md)
- [部门API文档](./docs/api/department-api.md)

## 架构设计

详细的架构设计请参考：
- [技术设计方案](./docs/tenant-module-technical-design.md)
- [业务需求文档](./docs/tenant-management-business-requirements.md)

## 开发指南

- [开发入门](./docs/guides/getting-started.md)
- [高级用法](./docs/guides/advanced-usage.md)
- [故障排除](./docs/guides/troubleshooting.md)

## 许可证

MIT License
```

## 🏗️ 技术架构设计

### 整体架构

```text
租户模块架构（Clean Architecture + CQRS + Event Sourcing）

┌─────────────────────────────────────────────────────────────┐
│                    Interface Layer                         │
├─────────────────────────────────────────────────────────────┤
│ REST Controllers │ GraphQL Resolvers │ Event Handlers     │
│ DTO Classes      │ Validation        │ Middleware         │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│ Commands         │ Queries           │ Event Handlers     │
│ Command Handlers │ Query Handlers    │ Sagas             │
│ Application Services              │ Event Publishers    │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                    Domain Layer                            │
├─────────────────────────────────────────────────────────────┤
│ Tenant Aggregate │ Organization Aggregate │ Department Agg │
│ Domain Services  │ Domain Events         │ Value Objects  │
│ Business Rules   │ Repository Interfaces │ Specifications │
└─────────────────────────────────────────────────────────────┘
                            │
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure Layer                        │
├─────────────────────────────────────────────────────────────┤
│ Repository Impl  │ Event Store       │ Message Bus       │
│ Database Access  │ External Services │ Caching          │
│ Configuration    │ Logging          │ Monitoring        │
└─────────────────────────────────────────────────────────────┘
```

### 核心设计原则

#### **1. 依赖倒置原则**

- **内层不依赖外层**：Domain Layer不依赖Application Layer
- **接口隔离**：通过接口定义层间交互契约
- **依赖注入**：使用NestJS的依赖注入容器

#### **2. 单一职责原则**

- **聚合边界清晰**：每个聚合负责单一业务概念
- **服务职责明确**：每个服务只处理特定类型的业务逻辑
- **命令查询分离**：写操作和读操作完全分离

#### **3. 开闭原则**

- **扩展友好**：通过事件和插件机制支持功能扩展
- **配置驱动**：通过配置调整业务行为
- **策略模式**：使用策略模式支持不同的业务策略

## 📊 领域模型设计

### 核心聚合设计

#### **1. 租户聚合（Tenant Aggregate）**

```typescript
/**
 * 租户聚合根
 * 
 * 租户是SAAS平台的核心业务概念，代表一个独立的客户单位。
 * 租户聚合负责管理租户的完整生命周期，包括创建、配置、状态管理、升级等。
 * 
 * 业务规则：
 * - 租户代码全平台唯一，创建后不可修改
 * - 租户名称可以修改，但需要审核确保唯一性
 * - 租户类型决定功能权限和资源限制
 * - 租户状态控制服务可用性
 * - 隔离策略在创建时确定，运营初期统一为行级隔离
 */
export class Tenant extends BaseAggregateRoot {
  private constructor(
    id: EntityId,
    private readonly code: TenantCode,
    private name: TenantName,
    private readonly domain: TenantDomain,
    private type: TenantType,
    private status: TenantStatus,
    private readonly isolationStrategy: DataIsolationStrategy,
    private configuration: TenantConfiguration,
    private readonly ownerId: EntityId,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super(id);
  }

  /**
   * 创建新租户
   * 
   * @param code 租户代码（全平台唯一）
   * @param name 租户名称
   * @param domain 租户域名
   * @param ownerId 租户所有者ID
   * @returns 新创建的租户实例
   */
  static create(
    code: TenantCode,
    name: TenantName,
    domain: TenantDomain,
    ownerId: EntityId
  ): Tenant {
    const tenant = new Tenant(
      EntityId.generate(),
      code,
      name,
      domain,
      TenantType.FREE, // 默认免费租户
      TenantStatus.TRIAL, // 默认试用状态
      DataIsolationStrategy.ROW_LEVEL_SECURITY, // 运营初期统一行级隔离
      TenantConfiguration.createDefault(TenantType.FREE),
      ownerId,
      new Date(),
      new Date()
    );

    // 发布租户创建事件
    tenant.addDomainEvent(new TenantCreatedEvent(
      tenant.getId(),
      code.getValue(),
      name.getValue(),
      domain.getValue(),
      ownerId,
      new Date()
    ));

    return tenant;
  }

  /**
   * 更新租户名称（需要审核）
   * 
   * 业务规则：
   * - 租户名称修改需要系统审核
   * - 确保全平台范围内的唯一性
   * - 审核通过后才能更新名称
   */
  requestNameChange(newName: TenantName, requestedBy: EntityId, reason: string): void {
    if (this.name.equals(newName)) {
      throw new BusinessError('新名称与当前名称相同');
    }

    // 发布名称变更请求事件
    this.addDomainEvent(new TenantNameChangeRequestedEvent(
      this.getId(),
      this.name.getValue(),
      newName.getValue(),
      requestedBy,
      reason,
      new Date()
    ));
  }

  /**
   * 应用名称变更（审核通过后调用）
   */
  applyNameChange(newName: TenantName): void {
    const oldName = this.name.getValue();
    this.name = newName;
    this.updatedAt = new Date();

    // 发布名称变更完成事件
    this.addDomainEvent(new TenantNameChangedEvent(
      this.getId(),
      oldName,
      newName.getValue(),
      new Date()
    ));
  }

  /**
   * 升级租户类型
   * 
   * 业务规则：
   * - 只能升级到更高级的租户类型
   * - 升级后自动调整配置和限制
   * - 发布升级事件用于后续处理
   */
  upgrade(newType: TenantType): void {
    if (!this.canUpgradeTo(newType)) {
      throw new BusinessError(`不能从 ${this.type} 升级到 ${newType}`);
    }

    const oldType = this.type;
    this.type = newType;
    this.configuration = TenantConfiguration.createDefault(newType);
    this.updatedAt = new Date();

    // 如果从试用状态升级，自动激活
    if (this.status === TenantStatus.TRIAL) {
      this.status = TenantStatus.ACTIVE;
    }

    // 发布租户升级事件
    this.addDomainEvent(new TenantUpgradedEvent(
      this.getId(),
      oldType,
      newType,
      new Date()
    ));
  }

  /**
   * 暂停租户服务
   */
  suspend(reason: string, suspendedBy: EntityId): void {
    if (this.status === TenantStatus.DELETED) {
      throw new BusinessError('已删除的租户不能暂停');
    }

    const oldStatus = this.status;
    this.status = TenantStatus.SUSPENDED;
    this.updatedAt = new Date();

    this.addDomainEvent(new TenantSuspendedEvent(
      this.getId(),
      oldStatus,
      reason,
      suspendedBy,
      new Date()
    ));
  }

  /**
   * 恢复租户服务
   */
  resume(resumedBy: EntityId): void {
    if (this.status !== TenantStatus.SUSPENDED) {
      throw new BusinessError('只有暂停状态的租户才能恢复');
    }

    this.status = TenantStatus.ACTIVE;
    this.updatedAt = new Date();

    this.addDomainEvent(new TenantResumedEvent(
      this.getId(),
      resumedBy,
      new Date()
    ));
  }

  /**
   * 检查是否可以升级到指定类型
   */
  private canUpgradeTo(newType: TenantType): boolean {
    const typeHierarchy = [
      TenantType.FREE,
      TenantType.BASIC,
      TenantType.PROFESSIONAL,
      TenantType.ENTERPRISE,
      TenantType.CUSTOM
    ];

    const currentIndex = typeHierarchy.indexOf(this.type);
    const newIndex = typeHierarchy.indexOf(newType);

    return newIndex > currentIndex;
  }

  // Getters
  getCode(): TenantCode { return this.code; }
  getName(): TenantName { return this.name; }
  getDomain(): TenantDomain { return this.domain; }
  getType(): TenantType { return this.type; }
  getStatus(): TenantStatus { return this.status; }
  getIsolationStrategy(): DataIsolationStrategy { return this.isolationStrategy; }
  getConfiguration(): TenantConfiguration { return this.configuration; }
  getOwnerId(): EntityId { return this.ownerId; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
```

#### **2. 组织聚合（Organization Aggregate）**

```typescript
/**
 * 组织聚合根
 * 
 * 组织是租户内设的横向管理单位，负责管理特定职能的业务。
 * 组织聚合负责管理组织的创建、配置、部门管理等。
 * 
 * 业务规则：
 * - 组织数量受租户类型限制
 * - 组织名称在租户内唯一
 * - 每个组织都有根部门，不可删除
 * - 组织之间为平级关系
 */
export class Organization extends BaseAggregateRoot {
  private departments: Map<EntityId, Department> = new Map();

  private constructor(
    id: EntityId,
    private readonly tenantId: EntityId,
    private name: OrganizationName,
    private readonly type: OrganizationType,
    private description: string,
    private readonly adminId: EntityId,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super(id);
  }

  /**
   * 创建新组织
   */
  static create(
    tenantId: EntityId,
    name: OrganizationName,
    type: OrganizationType,
    description: string,
    adminId: EntityId
  ): Organization {
    const organization = new Organization(
      EntityId.generate(),
      tenantId,
      name,
      type,
      description,
      adminId,
      new Date(),
      new Date()
    );

    // 创建根部门
    const rootDepartment = Department.createRoot(
      organization.getId(),
      `${name.getValue()}-根部门`,
      adminId
    );
    
    organization.departments.set(rootDepartment.getId(), rootDepartment);

    // 发布组织创建事件
    organization.addDomainEvent(new OrganizationCreatedEvent(
      organization.getId(),
      tenantId,
      name.getValue(),
      type,
      adminId,
      new Date()
    ));

    return organization;
  }

  /**
   * 创建部门
   * 
   * 业务规则：
   * - 部门必须有父部门（除根部门外）
   * - 部门层级不能超过配置限制
   * - 部门名称在组织内唯一
   */
  createDepartment(
    name: string,
    parentDepartmentId: EntityId,
    adminId: EntityId,
    maxLevels: number = 7
  ): Department {
    const parentDepartment = this.departments.get(parentDepartmentId);
    if (!parentDepartment) {
      throw new BusinessError('父部门不存在');
    }

    // 检查层级限制
    const currentLevel = parentDepartment.getLevel() + 1;
    if (currentLevel > maxLevels) {
      throw new BusinessError(`部门层级不能超过 ${maxLevels} 层`);
    }

    // 检查名称唯一性
    if (this.isDepartmentNameExists(name)) {
      throw new BusinessError('部门名称在组织内必须唯一');
    }

    const department = Department.create(
      this.getId(),
      name,
      parentDepartmentId,
      currentLevel,
      adminId
    );

    this.departments.set(department.getId(), department);
    this.updatedAt = new Date();

    // 发布部门创建事件
    this.addDomainEvent(new DepartmentCreatedEvent(
      department.getId(),
      this.getId(),
      this.tenantId,
      name,
      parentDepartmentId,
      currentLevel,
      adminId,
      new Date()
    ));

    return department;
  }

  /**
   * 检查部门名称是否存在
   */
  private isDepartmentNameExists(name: string): boolean {
    return Array.from(this.departments.values())
      .some(dept => dept.getName() === name);
  }

  /**
   * 获取部门
   */
  getDepartment(departmentId: EntityId): Department | undefined {
    return this.departments.get(departmentId);
  }

  /**
   * 获取所有部门
   */
  getDepartments(): Department[] {
    return Array.from(this.departments.values());
  }

  /**
   * 获取根部门
   */
  getRootDepartment(): Department {
    const rootDepartment = Array.from(this.departments.values())
      .find(dept => dept.isRoot());
    
    if (!rootDepartment) {
      throw new BusinessError('组织必须有根部门');
    }
    
    return rootDepartment;
  }

  // Getters
  getTenantId(): EntityId { return this.tenantId; }
  getName(): OrganizationName { return this.name; }
  getType(): OrganizationType { return this.type; }
  getDescription(): string { return this.description; }
  getAdminId(): EntityId { return this.adminId; }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
```

#### **3. 部门聚合（Department Aggregate）**

```typescript
/**
 * 部门聚合根
 * 
 * 部门是组织内的纵向管理单位，具有层级关系。
 * 部门聚合负责管理部门的层级结构、用户分配等。
 * 
 * 业务规则：
 * - 部门支持多级嵌套，技术上无限制
 * - 系统配置限制默认7层
 * - 用户在同一组织内只能属于一个部门
 * - 根部门不可删除
 */
export class Department extends BaseAggregateRoot {
  private userAssignments: Set<EntityId> = new Set();

  private constructor(
    id: EntityId,
    private readonly organizationId: EntityId,
    private name: string,
    private readonly parentId: EntityId | null,
    private readonly level: number,
    private readonly isRoot: boolean,
    private readonly adminId: EntityId,
    private readonly createdAt: Date,
    private updatedAt: Date
  ) {
    super(id);
  }

  /**
   * 创建根部门
   */
  static createRoot(
    organizationId: EntityId,
    name: string,
    adminId: EntityId
  ): Department {
    return new Department(
      EntityId.generate(),
      organizationId,
      name,
      null,
      1,
      true,
      adminId,
      new Date(),
      new Date()
    );
  }

  /**
   * 创建子部门
   */
  static create(
    organizationId: EntityId,
    name: string,
    parentId: EntityId,
    level: number,
    adminId: EntityId
  ): Department {
    return new Department(
      EntityId.generate(),
      organizationId,
      name,
      parentId,
      level,
      false,
      adminId,
      new Date(),
      new Date()
    );
  }

  /**
   * 分配用户到部门
   * 
   * 业务规则：
   * - 用户在同一组织内只能属于一个部门
   * - 分配前需要检查用户是否已在其他部门
   */
  assignUser(userId: EntityId, assignedBy: EntityId): void {
    if (this.userAssignments.has(userId)) {
      throw new BusinessError('用户已在此部门');
    }

    this.userAssignments.add(userId);
    this.updatedAt = new Date();

    // 发布用户分配事件
    this.addDomainEvent(new UserAssignedToDepartmentEvent(
      userId,
      this.getId(),
      this.organizationId,
      assignedBy,
      new Date()
    ));
  }

  /**
   * 从部门移除用户
   */
  unassignUser(userId: EntityId, unassignedBy: EntityId): void {
    if (!this.userAssignments.has(userId)) {
      throw new BusinessError('用户不在此部门');
    }

    this.userAssignments.delete(userId);
    this.updatedAt = new Date();

    // 发布用户移除事件
    this.addDomainEvent(new UserUnassignedFromDepartmentEvent(
      userId,
      this.getId(),
      this.organizationId,
      unassignedBy,
      new Date()
    ));
  }

  /**
   * 检查用户是否在此部门
   */
  hasUser(userId: EntityId): boolean {
    return this.userAssignments.has(userId);
  }

  /**
   * 获取部门用户数量
   */
  getUserCount(): number {
    return this.userAssignments.size;
  }

  // Getters
  getOrganizationId(): EntityId { return this.organizationId; }
  getName(): string { return this.name; }
  getParentId(): EntityId | null { return this.parentId; }
  getLevel(): number { return this.level; }
  isRootDepartment(): boolean { return this.isRoot; }
  getAdminId(): EntityId { return this.adminId; }
  getUsers(): EntityId[] { return Array.from(this.userAssignments); }
  getCreatedAt(): Date { return this.createdAt; }
  getUpdatedAt(): Date { return this.updatedAt; }
}
```

### 值对象设计

#### **租户相关值对象**

```typescript
/**
 * 租户代码值对象
 * 
 * 业务规则：
 * - 3-20个字符
 * - 字母数字开头结尾
 * - 可包含连字符和下划线
 * - 全平台唯一
 */
export class TenantCode extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(code: string): TenantCode {
    if (!code || code.trim().length === 0) {
      throw new ValidationError('租户代码不能为空');
    }

    const trimmedCode = code.trim();
    
    if (trimmedCode.length < 3 || trimmedCode.length > 20) {
      throw new ValidationError('租户代码长度必须在3-20个字符之间');
    }

    if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/.test(trimmedCode)) {
      throw new ValidationError('租户代码格式不正确');
    }

    return new TenantCode(trimmedCode);
  }
}

/**
 * 租户名称值对象
 */
export class TenantName extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(name: string): TenantName {
    if (!name || name.trim().length === 0) {
      throw new ValidationError('租户名称不能为空');
    }

    const trimmedName = name.trim();
    
    if (trimmedName.length < 2 || trimmedName.length > 50) {
      throw new ValidationError('租户名称长度必须在2-50个字符之间');
    }

    return new TenantName(trimmedName);
  }
}

/**
 * 租户域名值对象
 */
export class TenantDomain extends ValueObject<string> {
  private constructor(value: string) {
    super(value);
  }

  static create(domain: string): TenantDomain {
    if (!domain || domain.trim().length === 0) {
      throw new ValidationError('租户域名不能为空');
    }

    const trimmedDomain = domain.trim().toLowerCase();
    
    // 基础域名格式验证
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*$/.test(trimmedDomain)) {
      throw new ValidationError('域名格式不正确');
    }

    return new TenantDomain(trimmedDomain);
  }
}
```

#### **租户配置值对象**

```typescript
/**
 * 租户配置值对象
 * 
 * 封装租户的各种配置信息，包括资源限制、功能开关等
 */
export class TenantConfiguration extends ValueObject<ITenantConfigurationData> {
  private constructor(value: ITenantConfigurationData) {
    super(value);
  }

  static createDefault(tenantType: TenantType): TenantConfiguration {
    const config = this.getDefaultConfigByType(tenantType);
    return new TenantConfiguration(config);
  }

  private static getDefaultConfigByType(type: TenantType): ITenantConfigurationData {
    switch (type) {
      case TenantType.FREE:
        return {
          userLimit: 5,
          storageLimit: 100, // MB
          organizationLimit: 1,
          departmentLevelLimit: 7,
          apiCallLimit: 1000,
          features: ['basic'],
          trialDays: 30,
          dataRetentionDays: 30
        };
      case TenantType.BASIC:
        return {
          userLimit: 50,
          storageLimit: 1024, // MB
          organizationLimit: 2,
          departmentLevelLimit: 7,
          apiCallLimit: 10000,
          features: ['basic', 'standard'],
          trialDays: 0,
          dataRetentionDays: 365
        };
      case TenantType.PROFESSIONAL:
        return {
          userLimit: 500,
          storageLimit: 10240, // MB
          organizationLimit: 10,
          departmentLevelLimit: 7,
          apiCallLimit: 100000,
          features: ['basic', 'standard', 'advanced'],
          trialDays: 0,
          dataRetentionDays: 1095
        };
      case TenantType.ENTERPRISE:
        return {
          userLimit: 10000,
          storageLimit: 102400, // MB
          organizationLimit: 100,
          departmentLevelLimit: 7,
          apiCallLimit: 1000000,
          features: ['basic', 'standard', 'advanced', 'enterprise'],
          trialDays: 0,
          dataRetentionDays: -1 // 永久保留
        };
      case TenantType.CUSTOM:
        return {
          userLimit: -1, // 无限制
          storageLimit: -1, // 无限制
          organizationLimit: -1, // 无限制
          departmentLevelLimit: -1, // 无限制
          apiCallLimit: -1, // 无限制
          features: ['all'],
          trialDays: 0,
          dataRetentionDays: -1 // 永久保留
        };
      default:
        throw new Error(`未支持的租户类型: ${type}`);
    }
  }

  getUserLimit(): number { return this.value.userLimit; }
  getStorageLimit(): number { return this.value.storageLimit; }
  getOrganizationLimit(): number { return this.value.organizationLimit; }
  getDepartmentLevelLimit(): number { return this.value.departmentLevelLimit; }
  getApiCallLimit(): number { return this.value.apiCallLimit; }
  getFeatures(): string[] { return this.value.features; }
  getTrialDays(): number { return this.value.trialDays; }
  getDataRetentionDays(): number { return this.value.dataRetentionDays; }

  hasFeature(feature: string): boolean {
    return this.value.features.includes(feature) || this.value.features.includes('all');
  }
}

interface ITenantConfigurationData {
  userLimit: number;
  storageLimit: number;
  organizationLimit: number;
  departmentLevelLimit: number;
  apiCallLimit: number;
  features: string[];
  trialDays: number;
  dataRetentionDays: number;
}
```

### 领域事件设计

#### **租户相关事件**

```typescript
/**
 * 租户创建事件
 */
export class TenantCreatedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly code: string,
    public readonly name: string,
    public readonly domain: string,
    public readonly ownerId: EntityId,
    occurredOn: Date
  ) {
    super(occurredOn);
  }
}

/**
 * 租户名称变更请求事件
 */
export class TenantNameChangeRequestedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly currentName: string,
    public readonly requestedName: string,
    public readonly requestedBy: EntityId,
    public readonly reason: string,
    occurredOn: Date
  ) {
    super(occurredOn);
  }
}

/**
 * 租户名称变更完成事件
 */
export class TenantNameChangedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly oldName: string,
    public readonly newName: string,
    occurredOn: Date
  ) {
    super(occurredOn);
  }
}

/**
 * 租户升级事件
 */
export class TenantUpgradedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly oldType: TenantType,
    public readonly newType: TenantType,
    occurredOn: Date
  ) {
    super(occurredOn);
  }
}

/**
 * 租户暂停事件
 */
export class TenantSuspendedEvent extends BaseDomainEvent {
  constructor(
    public readonly tenantId: EntityId,
    public readonly previousStatus: TenantStatus,
    public readonly reason: string,
    public readonly suspendedBy: EntityId,
    occurredOn: Date
  ) {
    super(occurredOn);
  }
}
```

### 领域服务设计

#### **租户唯一性验证服务**

```typescript
/**
 * 租户唯一性验证服务
 * 
 * 负责验证租户代码、名称、域名的唯一性
 */
export interface ITenantUniquenessService {
  /**
   * 验证租户代码唯一性
   */
  isCodeUnique(code: TenantCode): Promise<boolean>;

  /**
   * 验证租户名称唯一性
   */
  isNameUnique(name: TenantName): Promise<boolean>;

  /**
   * 验证租户域名唯一性
   */
  isDomainUnique(domain: TenantDomain): Promise<boolean>;

  /**
   * 检查名称相似度
   */
  checkNameSimilarity(name: TenantName): Promise<string[]>;
}

@Injectable()
export class TenantUniquenessService implements ITenantUniquenessService {
  constructor(
    private readonly tenantRepository: ITenantRepository
  ) {}

  async isCodeUnique(code: TenantCode): Promise<boolean> {
    const existingTenant = await this.tenantRepository.findByCode(code);
    return !existingTenant;
  }

  async isNameUnique(name: TenantName): Promise<boolean> {
    const existingTenant = await this.tenantRepository.findByName(name);
    return !existingTenant;
  }

  async isDomainUnique(domain: TenantDomain): Promise<boolean> {
    const existingTenant = await this.tenantRepository.findByDomain(domain);
    return !existingTenant;
  }

  async checkNameSimilarity(name: TenantName): Promise<string[]> {
    // 实现相似度检查算法
    const allTenants = await this.tenantRepository.findAll();
    const similarNames: string[] = [];

    for (const tenant of allTenants) {
      const similarity = this.calculateSimilarity(
        name.getValue(),
        tenant.getName().getValue()
      );
      
      if (similarity > 0.8) { // 相似度阈值
        similarNames.push(tenant.getName().getValue());
      }
    }

    return similarNames;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // 实现字符串相似度计算算法（如编辑距离）
    // 这里简化实现
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const distance = this.levenshteinDistance(longer, shorter);
    return (longer.length - distance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null)
      .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
      matrix[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
      matrix[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
      for (let i = 1; i <= str1.length; i += 1) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator,
        );
      }
    }

    return matrix[str2.length][str1.length];
  }
}
```

## 🔧 应用层设计（CQRS实现）

### 命令端设计

#### **租户创建命令**

```typescript
/**
 * 创建租户命令
 */
export class CreateTenantCommand implements ICommand {
  constructor(
    public readonly code: string,
    public readonly name: string,
    public readonly domain: string,
    public readonly description: string,
    public readonly ownerId: string
  ) {}
}

/**
 * 创建租户命令结果
 */
export class CreateTenantResult {
  constructor(
    public readonly tenantId: string,
    public readonly code: string,
    public readonly name: string,
    public readonly domain: string,
    public readonly status: TenantStatus,
    public readonly createdAt: Date
  ) {}
}

/**
 * 创建租户命令处理器
 */
@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand, CreateTenantResult> {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly uniquenessService: ITenantUniquenessService,
    private readonly eventBus: IEventBus,
    private readonly logger: ILoggerService
  ) {}

  async execute(command: CreateTenantCommand): Promise<CreateTenantResult> {
    this.logger.info('开始执行创建租户命令', { command });

    try {
      // 1. 验证输入参数
      const tenantCode = TenantCode.create(command.code);
      const tenantName = TenantName.create(command.name);
      const tenantDomain = TenantDomain.create(command.domain);
      const ownerId = EntityId.fromString(command.ownerId);

      // 2. 验证唯一性
      await this.validateUniqueness(tenantCode, tenantName, tenantDomain);

      // 3. 创建租户聚合
      const tenant = Tenant.create(tenantCode, tenantName, tenantDomain, ownerId);

      // 4. 保存到仓储
      await this.tenantRepository.save(tenant);

      // 5. 发布领域事件
      const events = tenant.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      tenant.markEventsAsCommitted();

      this.logger.info('租户创建成功', {
        tenantId: tenant.getId().getValue(),
        code: command.code
      });

      // 6. 返回结果
      return new CreateTenantResult(
        tenant.getId().getValue(),
        tenant.getCode().getValue(),
        tenant.getName().getValue(),
        tenant.getDomain().getValue(),
        tenant.getStatus(),
        tenant.getCreatedAt()
      );

    } catch (error) {
      this.logger.error('创建租户失败', { error, command });
      throw error;
    }
  }

  private async validateUniqueness(
    code: TenantCode,
    name: TenantName,
    domain: TenantDomain
  ): Promise<void> {
    const [isCodeUnique, isNameUnique, isDomainUnique] = await Promise.all([
      this.uniquenessService.isCodeUnique(code),
      this.uniquenessService.isNameUnique(name),
      this.uniquenessService.isDomainUnique(domain)
    ]);

    if (!isCodeUnique) {
      throw new BusinessError('租户代码已存在');
    }

    if (!isNameUnique) {
      throw new BusinessError('租户名称已存在');
    }

    if (!isDomainUnique) {
      throw new BusinessError('租户域名已存在');
    }
  }
}
```

#### **租户升级命令**

```typescript
/**
 * 升级租户命令
 */
export class UpgradeTenantCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly newType: TenantType,
    public readonly upgradedBy: string
  ) {}
}

/**
 * 升级租户命令处理器
 */
@CommandHandler(UpgradeTenantCommand)
export class UpgradeTenantHandler implements ICommandHandler<UpgradeTenantCommand, void> {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
    private readonly logger: ILoggerService
  ) {}

  async execute(command: UpgradeTenantCommand): Promise<void> {
    this.logger.info('开始执行租户升级命令', { command });

    try {
      // 1. 获取租户聚合
      const tenantId = EntityId.fromString(command.tenantId);
      const tenant = await this.tenantRepository.findById(tenantId);
      
      if (!tenant) {
        throw new BusinessError('租户不存在');
      }

      // 2. 执行升级
      tenant.upgrade(command.newType);

      // 3. 保存变更
      await this.tenantRepository.save(tenant);

      // 4. 发布事件
      const events = tenant.getUncommittedEvents();
      for (const event of events) {
        await this.eventBus.publish(event);
      }
      tenant.markEventsAsCommitted();

      this.logger.info('租户升级成功', {
        tenantId: command.tenantId,
        newType: command.newType
      });

    } catch (error) {
      this.logger.error('租户升级失败', { error, command });
      throw error;
    }
  }
}
```

### 查询端设计

#### **租户查询**

```typescript
/**
 * 根据ID查询租户
 */
export class GetTenantByIdQuery implements IQuery {
  constructor(public readonly tenantId: string) {}
}

/**
 * 租户查询结果DTO
 */
export class TenantDto {
  constructor(
    public readonly id: string,
    public readonly code: string,
    public readonly name: string,
    public readonly domain: string,
    public readonly type: TenantType,
    public readonly status: TenantStatus,
    public readonly isolationStrategy: DataIsolationStrategy,
    public readonly configuration: ITenantConfigurationData,
    public readonly ownerId: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {}
}

/**
 * 租户查询处理器
 */
@QueryHandler(GetTenantByIdQuery)
export class GetTenantByIdHandler implements IQueryHandler<GetTenantByIdQuery, TenantDto | null> {
  constructor(
    private readonly tenantQueryRepository: ITenantQueryRepository,
    private readonly logger: ILoggerService
  ) {}

  async execute(query: GetTenantByIdQuery): Promise<TenantDto | null> {
    this.logger.debug('执行租户查询', { tenantId: query.tenantId });

    try {
      const tenant = await this.tenantQueryRepository.findById(query.tenantId);
      
      if (!tenant) {
        return null;
      }

      return new TenantDto(
        tenant.id,
        tenant.code,
        tenant.name,
        tenant.domain,
        tenant.type,
        tenant.status,
        tenant.isolationStrategy,
        tenant.configuration,
        tenant.ownerId,
        tenant.createdAt,
        tenant.updatedAt
      );

    } catch (error) {
      this.logger.error('租户查询失败', { error, query });
      throw error;
    }
  }
}
```

#### **租户列表查询**

```typescript
/**
 * 租户列表查询
 */
export class GetTenantsQuery implements IQuery {
  constructor(
    public readonly filters: ITenantFilters = {},
    public readonly pagination: IPaginationOptions = { page: 1, limit: 20 },
    public readonly sorting: ISortOptions = { field: 'createdAt', direction: 'desc' }
  ) {}
}

/**
 * 租户过滤条件
 */
export interface ITenantFilters {
  status?: TenantStatus[];
  type?: TenantType[];
  searchTerm?: string;
  ownerId?: string;
  createdAfter?: Date;
  createdBefore?: Date;
}

/**
 * 分页选项
 */
export interface IPaginationOptions {
  page: number;
  limit: number;
}

/**
 * 排序选项
 */
export interface ISortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * 分页结果
 */
export class PaginatedResult<T> {
  constructor(
    public readonly items: T[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
    public readonly totalPages: number
  ) {}
}

/**
 * 租户列表查询处理器
 */
@QueryHandler(GetTenantsQuery)
export class GetTenantsHandler implements IQueryHandler<GetTenantsQuery, PaginatedResult<TenantDto>> {
  constructor(
    private readonly tenantQueryRepository: ITenantQueryRepository,
    private readonly logger: ILoggerService
  ) {}

  async execute(query: GetTenantsQuery): Promise<PaginatedResult<TenantDto>> {
    this.logger.debug('执行租户列表查询', { query });

    try {
      const result = await this.tenantQueryRepository.findMany(
        query.filters,
        query.pagination,
        query.sorting
      );

      const tenants = result.items.map(tenant => new TenantDto(
        tenant.id,
        tenant.code,
        tenant.name,
        tenant.domain,
        tenant.type,
        tenant.status,
        tenant.isolationStrategy,
        tenant.configuration,
        tenant.ownerId,
        tenant.createdAt,
        tenant.updatedAt
      ));

      return new PaginatedResult(
        tenants,
        result.total,
        query.pagination.page,
        query.pagination.limit,
        Math.ceil(result.total / query.pagination.limit)
      );

    } catch (error) {
      this.logger.error('租户列表查询失败', { error, query });
      throw error;
    }
  }
}
```

### 事件处理器设计

#### **租户创建事件处理器**

```typescript
/**
 * 租户创建事件处理器
 * 
 * 处理租户创建后的后续操作：
 * 1. 创建默认组织
 * 2. 发送欢迎邮件
 * 3. 初始化租户配置
 * 4. 记录审计日志
 */
@EventsHandler(TenantCreatedEvent)
export class TenantCreatedEventHandler implements IEventHandler<TenantCreatedEvent> {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly notificationService: INotificationService,
    private readonly auditService: IAuditService,
    private readonly logger: ILoggerService
  ) {}

  async handle(event: TenantCreatedEvent): Promise<void> {
    this.logger.info('处理租户创建事件', { event });

    try {
      // 1. 创建默认组织
      await this.createDefaultOrganization(event);

      // 2. 发送欢迎通知
      await this.sendWelcomeNotification(event);

      // 3. 记录审计日志
      await this.recordAuditLog(event);

      this.logger.info('租户创建事件处理完成', { 
        tenantId: event.tenantId.getValue() 
      });

    } catch (error) {
      this.logger.error('租户创建事件处理失败', { error, event });
      throw error;
    }
  }

  private async createDefaultOrganization(event: TenantCreatedEvent): Promise<void> {
    const command = new CreateOrganizationCommand(
      event.tenantId.getValue(),
      `${event.name}-默认组织`,
      OrganizationType.DEFAULT,
      '系统自动创建的默认组织',
      event.ownerId.getValue()
    );

    await this.commandBus.execute(command);
  }

  private async sendWelcomeNotification(event: TenantCreatedEvent): Promise<void> {
    await this.notificationService.send({
      to: event.ownerId.getValue(),
      type: 'tenant_created',
      subject: '欢迎使用AIOFix平台',
      data: {
        tenantName: event.name,
        tenantCode: event.code,
        domain: event.domain
      }
    });
  }

  private async recordAuditLog(event: TenantCreatedEvent): Promise<void> {
    await this.auditService.log({
      action: 'tenant_created',
      entityType: 'tenant',
      entityId: event.tenantId.getValue(),
      userId: event.ownerId.getValue(),
      metadata: {
        code: event.code,
        name: event.name,
        domain: event.domain
      },
      timestamp: event.occurredOn
    });
  }
}
```

#### **租户升级事件处理器**

```typescript
/**
 * 租户升级事件处理器
 * 
 * 处理租户升级后的后续操作：
 * 1. 更新资源配额
 * 2. 启用新功能
 * 3. 发送升级通知
 * 4. 记录计费信息
 */
@EventsHandler(TenantUpgradedEvent)
export class TenantUpgradedEventHandler implements IEventHandler<TenantUpgradedEvent> {
  constructor(
    private readonly tenantService: ITenantService,
    private readonly billingService: IBillingService,
    private readonly notificationService: INotificationService,
    private readonly logger: ILoggerService
  ) {}

  async handle(event: TenantUpgradedEvent): Promise<void> {
    this.logger.info('处理租户升级事件', { event });

    try {
      // 1. 更新资源配额
      await this.updateResourceQuotas(event);

      // 2. 启用新功能
      await this.enableNewFeatures(event);

      // 3. 更新计费信息
      await this.updateBilling(event);

      // 4. 发送升级通知
      await this.sendUpgradeNotification(event);

      this.logger.info('租户升级事件处理完成', { 
        tenantId: event.tenantId.getValue() 
      });

    } catch (error) {
      this.logger.error('租户升级事件处理失败', { error, event });
      throw error;
    }
  }

  private async updateResourceQuotas(event: TenantUpgradedEvent): Promise<void> {
    // 根据新的租户类型更新资源配额
    const newConfig = TenantConfiguration.createDefault(event.newType);
    await this.tenantService.updateConfiguration(
      event.tenantId.getValue(),
      newConfig.getValue()
    );
  }

  private async enableNewFeatures(event: TenantUpgradedEvent): Promise<void> {
    // 启用新租户类型的功能
    const newConfig = TenantConfiguration.createDefault(event.newType);
    const features = newConfig.getFeatures();
    
    await this.tenantService.enableFeatures(
      event.tenantId.getValue(),
      features
    );
  }

  private async updateBilling(event: TenantUpgradedEvent): Promise<void> {
    // 更新计费信息
    await this.billingService.updateSubscription(
      event.tenantId.getValue(),
      event.newType
    );
  }

  private async sendUpgradeNotification(event: TenantUpgradedEvent): Promise<void> {
    const tenant = await this.tenantService.findById(event.tenantId.getValue());
    
    await this.notificationService.send({
      to: tenant.getOwnerId().getValue(),
      type: 'tenant_upgraded',
      subject: '租户升级成功',
      data: {
        tenantName: tenant.getName().getValue(),
        oldType: event.oldType,
        newType: event.newType
      }
    });
  }
}
```

## 🏗️ 基础设施层设计

### 仓储实现

#### **租户仓储实现**

```typescript
/**
 * 租户仓储接口
 */
export interface ITenantRepository {
  findById(id: EntityId): Promise<Tenant | null>;
  findByCode(code: TenantCode): Promise<Tenant | null>;
  findByName(name: TenantName): Promise<Tenant | null>;
  findByDomain(domain: TenantDomain): Promise<Tenant | null>;
  findByOwnerId(ownerId: EntityId): Promise<Tenant[]>;
  save(tenant: Tenant): Promise<void>;
  delete(id: EntityId): Promise<void>;
  exists(id: EntityId): Promise<boolean>;
}

/**
 * 租户仓储实现（基于@aiofix/database）
 */
@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantEntityRepository: Repository<TenantEntity>,
    private readonly eventStore: IEventStore,
    private readonly logger: ILoggerService
  ) {}

  async findById(id: EntityId): Promise<Tenant | null> {
    try {
      const entity = await this.tenantEntityRepository.findOne({
        where: { id: id.getValue() }
      });

      if (!entity) {
        return null;
      }

      return this.toDomainModel(entity);
    } catch (error) {
      this.logger.error('查询租户失败', { error, id: id.getValue() });
      throw new RepositoryError('查询租户失败', error);
    }
  }

  async findByCode(code: TenantCode): Promise<Tenant | null> {
    try {
      const entity = await this.tenantEntityRepository.findOne({
        where: { code: code.getValue() }
      });

      return entity ? this.toDomainModel(entity) : null;
    } catch (error) {
      this.logger.error('根据代码查询租户失败', { error, code: code.getValue() });
      throw new RepositoryError('根据代码查询租户失败', error);
    }
  }

  async save(tenant: Tenant): Promise<void> {
    const queryRunner = this.tenantEntityRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 保存租户实体
      const entity = this.toEntity(tenant);
      await queryRunner.manager.save(TenantEntity, entity);

      // 2. 保存领域事件到事件存储
      const events = tenant.getUncommittedEvents();
      for (const event of events) {
        await this.eventStore.saveEvent(
          tenant.getId().getValue(),
          'tenant',
          event,
          queryRunner.manager
        );
      }

      await queryRunner.commitTransaction();
      
      this.logger.info('租户保存成功', { 
        tenantId: tenant.getId().getValue() 
      });

    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('租户保存失败', { 
        error, 
        tenantId: tenant.getId().getValue() 
      });
      throw new RepositoryError('租户保存失败', error);
    } finally {
      await queryRunner.release();
    }
  }

  private toDomainModel(entity: TenantEntity): Tenant {
    // 使用反射或工厂方法重建领域模型
    return Tenant.fromPersistence({
      id: EntityId.fromString(entity.id),
      code: TenantCode.create(entity.code),
      name: TenantName.create(entity.name),
      domain: TenantDomain.create(entity.domain),
      type: entity.type,
      status: entity.status,
      isolationStrategy: entity.isolationStrategy,
      configuration: TenantConfiguration.fromData(entity.configuration),
      ownerId: EntityId.fromString(entity.ownerId),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    });
  }

  private toEntity(tenant: Tenant): TenantEntity {
    const entity = new TenantEntity();
    entity.id = tenant.getId().getValue();
    entity.code = tenant.getCode().getValue();
    entity.name = tenant.getName().getValue();
    entity.domain = tenant.getDomain().getValue();
    entity.type = tenant.getType();
    entity.status = tenant.getStatus();
    entity.isolationStrategy = tenant.getIsolationStrategy();
    entity.configuration = tenant.getConfiguration().getValue();
    entity.ownerId = tenant.getOwnerId().getValue();
    entity.createdAt = tenant.getCreatedAt();
    entity.updatedAt = tenant.getUpdatedAt();
    return entity;
  }
}
```

#### **查询仓储实现**

```typescript
/**
 * 租户查询仓储接口（读模型优化）
 */
export interface ITenantQueryRepository {
  findById(id: string): Promise<ITenantReadModel | null>;
  findMany(
    filters: ITenantFilters,
    pagination: IPaginationOptions,
    sorting: ISortOptions
  ): Promise<IPaginatedResult<ITenantReadModel>>;
  findByStatus(status: TenantStatus[]): Promise<ITenantReadModel[]>;
  findExpiringSoon(days: number): Promise<ITenantReadModel[]>;
  getStatistics(): Promise<ITenantStatistics>;
}

/**
 * 租户读模型
 */
export interface ITenantReadModel {
  id: string;
  code: string;
  name: string;
  domain: string;
  type: TenantType;
  status: TenantStatus;
  isolationStrategy: DataIsolationStrategy;
  configuration: ITenantConfigurationData;
  ownerId: string;
  organizationCount: number;
  userCount: number;
  storageUsed: number;
  lastActiveAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 租户查询仓储实现
 */
@Injectable()
export class TenantQueryRepository implements ITenantQueryRepository {
  constructor(
    @InjectRepository(TenantReadModelEntity)
    private readonly readModelRepository: Repository<TenantReadModelEntity>,
    private readonly cacheService: ICacheService,
    private readonly logger: ILoggerService
  ) {}

  async findById(id: string): Promise<ITenantReadModel | null> {
    // 先从缓存查找
    const cacheKey = `tenant:${id}`;
    const cached = await this.cacheService.get<ITenantReadModel>(cacheKey);
    
    if (cached) {
      return cached;
    }

    // 从数据库查找
    const entity = await this.readModelRepository.findOne({
      where: { id }
    });

    if (!entity) {
      return null;
    }

    const readModel = this.toReadModel(entity);
    
    // 缓存结果
    await this.cacheService.set(cacheKey, readModel, 300); // 5分钟缓存
    
    return readModel;
  }

  async findMany(
    filters: ITenantFilters,
    pagination: IPaginationOptions,
    sorting: ISortOptions
  ): Promise<IPaginatedResult<ITenantReadModel>> {
    const queryBuilder = this.readModelRepository.createQueryBuilder('tenant');

    // 应用过滤条件
    this.applyFilters(queryBuilder, filters);

    // 应用排序
    queryBuilder.orderBy(`tenant.${sorting.field}`, sorting.direction.toUpperCase() as 'ASC' | 'DESC');

    // 应用分页
    const offset = (pagination.page - 1) * pagination.limit;
    queryBuilder.skip(offset).take(pagination.limit);

    // 执行查询
    const [entities, total] = await queryBuilder.getManyAndCount();

    const items = entities.map(entity => this.toReadModel(entity));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit)
    };
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<TenantReadModelEntity>,
    filters: ITenantFilters
  ): void {
    if (filters.status && filters.status.length > 0) {
      queryBuilder.andWhere('tenant.status IN (:...statuses)', {
        statuses: filters.status
      });
    }

    if (filters.type && filters.type.length > 0) {
      queryBuilder.andWhere('tenant.type IN (:...types)', {
        types: filters.type
      });
    }

    if (filters.searchTerm) {
      queryBuilder.andWhere(
        '(tenant.name ILIKE :search OR tenant.code ILIKE :search OR tenant.domain ILIKE :search)',
        { search: `%${filters.searchTerm}%` }
      );
    }

    if (filters.ownerId) {
      queryBuilder.andWhere('tenant.ownerId = :ownerId', {
        ownerId: filters.ownerId
      });
    }

    if (filters.createdAfter) {
      queryBuilder.andWhere('tenant.createdAt >= :createdAfter', {
        createdAfter: filters.createdAfter
      });
    }

    if (filters.createdBefore) {
      queryBuilder.andWhere('tenant.createdAt <= :createdBefore', {
        createdBefore: filters.createdBefore
      });
    }
  }

  private toReadModel(entity: TenantReadModelEntity): ITenantReadModel {
    return {
      id: entity.id,
      code: entity.code,
      name: entity.name,
      domain: entity.domain,
      type: entity.type,
      status: entity.status,
      isolationStrategy: entity.isolationStrategy,
      configuration: entity.configuration,
      ownerId: entity.ownerId,
      organizationCount: entity.organizationCount,
      userCount: entity.userCount,
      storageUsed: entity.storageUsed,
      lastActiveAt: entity.lastActiveAt,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt
    };
  }
}
```

### 数据库实体设计

#### **租户实体**

```typescript
/**
 * 租户数据库实体（写模型）
 */
@Entity('tenants')
@Index(['code'], { unique: true })
@Index(['name'], { unique: true })
@Index(['domain'], { unique: true })
@Index(['ownerId'])
@Index(['status'])
@Index(['type'])
export class TenantEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  domain: string;

  @Column({
    type: 'enum',
    enum: TenantType,
    default: TenantType.FREE
  })
  type: TenantType;

  @Column({
    type: 'enum',
    enum: TenantStatus,
    default: TenantStatus.TRIAL
  })
  status: TenantStatus;

  @Column({
    type: 'enum',
    enum: DataIsolationStrategy,
    default: DataIsolationStrategy.ROW_LEVEL_SECURITY
  })
  isolationStrategy: DataIsolationStrategy;

  @Column({ type: 'jsonb' })
  configuration: ITenantConfigurationData;

  @Column('uuid')
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt: Date | null;

  // 租户级别的软删除
  @DeleteDateColumn()
  softDeletedAt: Date | null;
}

/**
 * 租户读模型实体（查询优化）
 */
@Entity('tenant_read_models')
@Index(['status'])
@Index(['type'])
@Index(['ownerId'])
@Index(['createdAt'])
@Index(['lastActiveAt'])
export class TenantReadModelEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 20 })
  code: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  domain: string;

  @Column({ type: 'enum', enum: TenantType })
  type: TenantType;

  @Column({ type: 'enum', enum: TenantStatus })
  status: TenantStatus;

  @Column({ type: 'enum', enum: DataIsolationStrategy })
  isolationStrategy: DataIsolationStrategy;

  @Column({ type: 'jsonb' })
  configuration: ITenantConfigurationData;

  @Column('uuid')
  ownerId: string;

  // 聚合统计字段（通过事件投影更新）
  @Column({ type: 'int', default: 0 })
  organizationCount: number;

  @Column({ type: 'int', default: 0 })
  userCount: number;

  @Column({ type: 'bigint', default: 0 })
  storageUsed: number;

  @Column({ type: 'timestamp', nullable: true })
  lastActiveAt: Date;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'timestamp' })
  updatedAt: Date;
}
```

#### **组织和部门实体**

```typescript
/**
 * 组织实体
 */
@Entity('organizations')
@Index(['tenantId'])
@Index(['name', 'tenantId'], { unique: true })
export class OrganizationEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({
    type: 'enum',
    enum: OrganizationType,
    default: OrganizationType.DEFAULT
  })
  type: OrganizationType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column('uuid')
  adminId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => DepartmentEntity, department => department.organization)
  departments: DepartmentEntity[];

  @ManyToOne(() => TenantEntity)
  @JoinColumn({ name: 'tenantId' })
  tenant: TenantEntity;
}

/**
 * 部门实体
 */
@Entity('departments')
@Index(['organizationId'])
@Index(['parentId'])
@Index(['name', 'organizationId'], { unique: true })
export class DepartmentEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  organizationId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'uuid', nullable: true })
  parentId: string | null;

  @Column({ type: 'int' })
  level: number;

  @Column({ type: 'boolean', default: false })
  isRoot: boolean;

  @Column('uuid')
  adminId: string;

  // 路径压缩字段，用于优化层级查询
  @Column({ type: 'varchar', length: 500, nullable: true })
  path: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => OrganizationEntity, organization => organization.departments)
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;

  @ManyToOne(() => DepartmentEntity)
  @JoinColumn({ name: 'parentId' })
  parent: DepartmentEntity;

  @OneToMany(() => DepartmentEntity, department => department.parent)
  children: DepartmentEntity[];
}
```

### 事件存储实现

#### **租户事件存储**

```typescript
/**
 * 租户事件存储服务
 */
@Injectable()
export class TenantEventStore {
  constructor(
    @Inject('EVENT_STORE')
    private readonly eventStore: IEventStore,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 保存租户事件
   */
  async saveEvents(
    tenantId: string,
    events: BaseDomainEvent[],
    expectedVersion: number
  ): Promise<void> {
    try {
      for (const event of events) {
        await this.eventStore.saveEvent(
          tenantId,
          'tenant',
          event,
          expectedVersion
        );
        expectedVersion++;
      }

      this.logger.info('租户事件保存成功', {
        tenantId,
        eventCount: events.length
      });

    } catch (error) {
      this.logger.error('租户事件保存失败', { error, tenantId });
      throw error;
    }
  }

  /**
   * 获取租户事件流
   */
  async getEvents(
    tenantId: string,
    fromVersion?: number
  ): Promise<BaseDomainEvent[]> {
    try {
      return await this.eventStore.getEvents(
        tenantId,
        'tenant',
        fromVersion
      );
    } catch (error) {
      this.logger.error('获取租户事件失败', { error, tenantId });
      throw error;
    }
  }

  /**
   * 重建租户聚合
   */
  async rebuildAggregate(tenantId: string): Promise<Tenant | null> {
    try {
      const events = await this.getEvents(tenantId);
      
      if (events.length === 0) {
        return null;
      }

      // 从事件流重建聚合
      let tenant: Tenant | null = null;

      for (const event of events) {
        if (event instanceof TenantCreatedEvent) {
          tenant = Tenant.fromHistory(event);
        } else if (tenant) {
          tenant.applyEvent(event);
        }
      }

      return tenant;

    } catch (error) {
      this.logger.error('重建租户聚合失败', { error, tenantId });
      throw error;
    }
  }
}
```

### 缓存策略实现

#### **租户缓存服务**

```typescript
/**
 * 租户缓存服务
 */
@Injectable()
export class TenantCacheService {
  private readonly CACHE_TTL = 300; // 5分钟
  private readonly CACHE_PREFIX = 'tenant:';

  constructor(
    @Inject('CACHE_SERVICE')
    private readonly cacheService: ICacheService,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 获取租户缓存
   */
  async get(tenantId: string): Promise<ITenantReadModel | null> {
    try {
      const cacheKey = this.getCacheKey(tenantId);
      return await this.cacheService.get<ITenantReadModel>(cacheKey);
    } catch (error) {
      this.logger.warn('获取租户缓存失败', { error, tenantId });
      return null;
    }
  }

  /**
   * 设置租户缓存
   */
  async set(tenantId: string, tenant: ITenantReadModel): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(tenantId);
      await this.cacheService.set(cacheKey, tenant, this.CACHE_TTL);
    } catch (error) {
      this.logger.warn('设置租户缓存失败', { error, tenantId });
    }
  }

  /**
   * 删除租户缓存
   */
  async delete(tenantId: string): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(tenantId);
      await this.cacheService.delete(cacheKey);
    } catch (error) {
      this.logger.warn('删除租户缓存失败', { error, tenantId });
    }
  }

  /**
   * 批量删除租户缓存
   */
  async deleteMany(tenantIds: string[]): Promise<void> {
    try {
      const cacheKeys = tenantIds.map(id => this.getCacheKey(id));
      await this.cacheService.deleteMany(cacheKeys);
    } catch (error) {
      this.logger.warn('批量删除租户缓存失败', { error, tenantIds });
    }
  }

  private getCacheKey(tenantId: string): string {
    return `${this.CACHE_PREFIX}${tenantId}`;
  }
}
```

## 🌐 接口层设计

### REST API控制器

#### **租户管理控制器**

```typescript
/**
 * 租户管理REST API控制器
 */
@Controller('api/v1/tenants')
@ApiTags('租户管理')
@UseGuards(AuthGuard, RoleGuard)
export class TenantController {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 创建租户
   */
  @Post()
  @ApiOperation({ summary: '创建租户' })
  @ApiResponse({ status: 201, description: '租户创建成功', type: CreateTenantResponseDto })
  @ApiResponse({ status: 400, description: '请求参数无效' })
  @ApiResponse({ status: 409, description: '租户代码或名称已存在' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.PLATFORM_USER)
  async createTenant(
    @Body() createTenantDto: CreateTenantDto,
    @CurrentUser() user: ICurrentUser
  ): Promise<CreateTenantResponseDto> {
    this.logger.info('创建租户请求', { createTenantDto, userId: user.id });

    try {
      const command = new CreateTenantCommand(
        createTenantDto.code,
        createTenantDto.name,
        createTenantDto.domain,
        createTenantDto.description,
        user.id
      );

      const result = await this.commandBus.execute<CreateTenantCommand, CreateTenantResult>(command);

      return new CreateTenantResponseDto(
        result.tenantId,
        result.code,
        result.name,
        result.domain,
        result.status,
        result.createdAt
      );

    } catch (error) {
      this.logger.error('创建租户失败', { error, createTenantDto });
      
      if (error instanceof BusinessError) {
        throw new BadRequestException(error.message);
      }
      
      throw new InternalServerErrorException('创建租户失败');
    }
  }

  /**
   * 获取租户详情
   */
  @Get(':id')
  @ApiOperation({ summary: '获取租户详情' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: TenantResponseDto })
  @ApiResponse({ status: 404, description: '租户不存在' })
  async getTenant(
    @Param('id') tenantId: string,
    @CurrentUser() user: ICurrentUser
  ): Promise<TenantResponseDto> {
    this.logger.debug('获取租户详情', { tenantId, userId: user.id });

    // 权限检查：只有租户成员或平台管理员可以查看
    await this.checkTenantAccess(tenantId, user);

    const query = new GetTenantByIdQuery(tenantId);
    const tenant = await this.queryBus.execute<GetTenantByIdQuery, TenantDto | null>(query);

    if (!tenant) {
      throw new NotFoundException('租户不存在');
    }

    return TenantResponseDto.fromDomain(tenant);
  }

  /**
   * 获取租户列表
   */
  @Get()
  @ApiOperation({ summary: '获取租户列表' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: TenantStatus, isArray: true })
  @ApiQuery({ name: 'type', required: false, enum: TenantType, isArray: true })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: '获取成功', type: GetTenantsResponseDto })
  @Roles(UserRole.PLATFORM_ADMIN)
  async getTenants(
    @Query() queryDto: GetTenantsQueryDto
  ): Promise<GetTenantsResponseDto> {
    this.logger.debug('获取租户列表', { queryDto });

    const query = new GetTenantsQuery(
      {
        status: queryDto.status,
        type: queryDto.type,
        searchTerm: queryDto.search
      },
      {
        page: queryDto.page || 1,
        limit: queryDto.limit || 20
      }
    );

    const result = await this.queryBus.execute<GetTenantsQuery, PaginatedResult<TenantDto>>(query);

    return GetTenantsResponseDto.fromDomain(result);
  }

  /**
   * 升级租户
   */
  @Put(':id/upgrade')
  @ApiOperation({ summary: '升级租户' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '升级成功' })
  @ApiResponse({ status: 400, description: '升级请求无效' })
  @ApiResponse({ status: 404, description: '租户不存在' })
  @Roles(UserRole.PLATFORM_ADMIN, UserRole.TENANT_ADMIN)
  async upgradeTenant(
    @Param('id') tenantId: string,
    @Body() upgradeDto: UpgradeTenantDto,
    @CurrentUser() user: ICurrentUser
  ): Promise<void> {
    this.logger.info('升级租户请求', { tenantId, upgradeDto, userId: user.id });

    // 权限检查
    await this.checkTenantAdminAccess(tenantId, user);

    const command = new UpgradeTenantCommand(
      tenantId,
      upgradeDto.newType,
      user.id
    );

    await this.commandBus.execute(command);
  }

  /**
   * 暂停租户
   */
  @Put(':id/suspend')
  @ApiOperation({ summary: '暂停租户' })
  @ApiParam({ name: 'id', description: '租户ID' })
  @ApiResponse({ status: 200, description: '暂停成功' })
  @Roles(UserRole.PLATFORM_ADMIN)
  async suspendTenant(
    @Param('id') tenantId: string,
    @Body() suspendDto: SuspendTenantDto,
    @CurrentUser() user: ICurrentUser
  ): Promise<void> {
    this.logger.info('暂停租户请求', { tenantId, suspendDto, userId: user.id });

    const command = new SuspendTenantCommand(
      tenantId,
      suspendDto.reason,
      user.id
    );

    await this.commandBus.execute(command);
  }

  private async checkTenantAccess(tenantId: string, user: ICurrentUser): Promise<void> {
    if (user.roles.includes(UserRole.PLATFORM_ADMIN)) {
      return; // 平台管理员有全部权限
    }

    // 检查用户是否属于该租户
    const hasAccess = user.tenants.some(t => t.tenantId === tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('无权访问该租户');
    }
  }

  private async checkTenantAdminAccess(tenantId: string, user: ICurrentUser): Promise<void> {
    if (user.roles.includes(UserRole.PLATFORM_ADMIN)) {
      return; // 平台管理员有全部权限
    }

    // 检查用户是否是该租户的管理员
    const tenantRole = user.tenants.find(t => t.tenantId === tenantId);
    if (!tenantRole || !tenantRole.roles.includes(UserRole.TENANT_ADMIN)) {
      throw new ForbiddenException('需要租户管理员权限');
    }
  }
}
```

#### **组织管理控制器**

```typescript
/**
 * 组织管理REST API控制器
 */
@Controller('api/v1/tenants/:tenantId/organizations')
@ApiTags('组织管理')
@UseGuards(AuthGuard, TenantGuard, RoleGuard)
export class OrganizationController {
  constructor(
    private readonly commandBus: ICommandBus,
    private readonly queryBus: IQueryBus,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 创建组织
   */
  @Post()
  @ApiOperation({ summary: '创建组织' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ status: 201, description: '组织创建成功', type: CreateOrganizationResponseDto })
  @Roles(UserRole.TENANT_ADMIN)
  async createOrganization(
    @Param('tenantId') tenantId: string,
    @Body() createOrgDto: CreateOrganizationDto,
    @CurrentUser() user: ICurrentUser
  ): Promise<CreateOrganizationResponseDto> {
    this.logger.info('创建组织请求', { tenantId, createOrgDto, userId: user.id });

    const command = new CreateOrganizationCommand(
      tenantId,
      createOrgDto.name,
      createOrgDto.type,
      createOrgDto.description,
      user.id
    );

    const result = await this.commandBus.execute<CreateOrganizationCommand, CreateOrganizationResult>(command);

    return new CreateOrganizationResponseDto(
      result.organizationId,
      result.name,
      result.type,
      result.createdAt
    );
  }

  /**
   * 获取组织列表
   */
  @Get()
  @ApiOperation({ summary: '获取组织列表' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: [OrganizationResponseDto] })
  @Roles(UserRole.TENANT_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.TENANT_USER)
  async getOrganizations(
    @Param('tenantId') tenantId: string,
    @CurrentUser() user: ICurrentUser
  ): Promise<OrganizationResponseDto[]> {
    this.logger.debug('获取组织列表', { tenantId, userId: user.id });

    const query = new GetOrganizationsByTenantQuery(tenantId);
    const organizations = await this.queryBus.execute<GetOrganizationsByTenantQuery, OrganizationDto[]>(query);

    return organizations.map(org => OrganizationResponseDto.fromDomain(org));
  }

  /**
   * 获取组织详情
   */
  @Get(':orgId')
  @ApiOperation({ summary: '获取组织详情' })
  @ApiParam({ name: 'tenantId', description: '租户ID' })
  @ApiParam({ name: 'orgId', description: '组织ID' })
  @ApiResponse({ status: 200, description: '获取成功', type: OrganizationDetailResponseDto })
  @Roles(UserRole.TENANT_ADMIN, UserRole.ORGANIZATION_ADMIN, UserRole.TENANT_USER)
  async getOrganization(
    @Param('tenantId') tenantId: string,
    @Param('orgId') organizationId: string,
    @CurrentUser() user: ICurrentUser
  ): Promise<OrganizationDetailResponseDto> {
    this.logger.debug('获取组织详情', { tenantId, organizationId, userId: user.id });

    const query = new GetOrganizationByIdQuery(organizationId);
    const organization = await this.queryBus.execute<GetOrganizationByIdQuery, OrganizationDetailDto | null>(query);

    if (!organization) {
      throw new NotFoundException('组织不存在');
    }

    return OrganizationDetailResponseDto.fromDomain(organization);
  }
}
```

### DTO设计

#### **租户相关DTO**

```typescript
/**
 * 创建租户请求DTO
 */
export class CreateTenantDto {
  @ApiProperty({ description: '租户代码', example: 'tech-startup' })
  @IsString()
  @Length(3, 20)
  @Matches(/^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$/, {
    message: '租户代码格式不正确'
  })
  code: string;

  @ApiProperty({ description: '租户名称', example: '科技创业公司' })
  @IsString()
  @Length(2, 50)
  name: string;

  @ApiProperty({ description: '租户域名', example: 'techstartup.aiofix.com' })
  @IsString()
  @IsUrl({}, { message: '域名格式不正确' })
  domain: string;

  @ApiProperty({ description: '租户描述', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

/**
 * 创建租户响应DTO
 */
export class CreateTenantResponseDto {
  @ApiProperty({ description: '租户ID' })
  id: string;

  @ApiProperty({ description: '租户代码' })
  code: string;

  @ApiProperty({ description: '租户名称' })
  name: string;

  @ApiProperty({ description: '租户域名' })
  domain: string;

  @ApiProperty({ description: '租户状态', enum: TenantStatus })
  status: TenantStatus;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  constructor(
    id: string,
    code: string,
    name: string,
    domain: string,
    status: TenantStatus,
    createdAt: Date
  ) {
    this.id = id;
    this.code = code;
    this.name = name;
    this.domain = domain;
    this.status = status;
    this.createdAt = createdAt;
  }
}

/**
 * 租户响应DTO
 */
export class TenantResponseDto {
  @ApiProperty({ description: '租户ID' })
  id: string;

  @ApiProperty({ description: '租户代码' })
  code: string;

  @ApiProperty({ description: '租户名称' })
  name: string;

  @ApiProperty({ description: '租户域名' })
  domain: string;

  @ApiProperty({ description: '租户类型', enum: TenantType })
  type: TenantType;

  @ApiProperty({ description: '租户状态', enum: TenantStatus })
  status: TenantStatus;

  @ApiProperty({ description: '数据隔离策略', enum: DataIsolationStrategy })
  isolationStrategy: DataIsolationStrategy;

  @ApiProperty({ description: '租户配置' })
  configuration: ITenantConfigurationData;

  @ApiProperty({ description: '所有者ID' })
  ownerId: string;

  @ApiProperty({ description: '创建时间' })
  createdAt: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt: Date;

  static fromDomain(tenant: TenantDto): TenantResponseDto {
    const dto = new TenantResponseDto();
    dto.id = tenant.id;
    dto.code = tenant.code;
    dto.name = tenant.name;
    dto.domain = tenant.domain;
    dto.type = tenant.type;
    dto.status = tenant.status;
    dto.isolationStrategy = tenant.isolationStrategy;
    dto.configuration = tenant.configuration;
    dto.ownerId = tenant.ownerId;
    dto.createdAt = tenant.createdAt;
    dto.updatedAt = tenant.updatedAt;
    return dto;
  }
}

/**
 * 升级租户请求DTO
 */
export class UpgradeTenantDto {
  @ApiProperty({ description: '新的租户类型', enum: TenantType })
  @IsEnum(TenantType)
  newType: TenantType;

  @ApiProperty({ description: '升级原因', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reason?: string;
}

/**
 * 查询租户列表DTO
 */
export class GetTenantsQueryDto {
  @ApiProperty({ description: '页码', required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @ApiProperty({ description: '每页数量', required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiProperty({ description: '租户状态', enum: TenantStatus, isArray: true, required: false })
  @IsOptional()
  @IsEnum(TenantStatus, { each: true })
  status?: TenantStatus[];

  @ApiProperty({ description: '租户类型', enum: TenantType, isArray: true, required: false })
  @IsOptional()
  @IsEnum(TenantType, { each: true })
  type?: TenantType[];

  @ApiProperty({ description: '搜索关键词', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}
```

## 🛡️ 安全和权限设计

### 租户级权限控制

#### **租户访问守卫**

```typescript
/**
 * 租户访问守卫
 * 
 * 确保用户只能访问其有权限的租户资源
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly logger: ILoggerService
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: ICurrentUser = request.user;
    const tenantId: string = request.params.tenantId;

    if (!tenantId) {
      return true; // 如果没有租户ID参数，跳过检查
    }

    if (!user) {
      this.logger.warn('租户守卫：用户未认证');
      return false;
    }

    // 平台管理员有所有权限
    if (user.roles.includes(UserRole.PLATFORM_ADMIN)) {
      return true;
    }

    // 检查用户是否属于该租户
    const hasAccess = user.tenants.some(t => t.tenantId === tenantId);
    
    if (!hasAccess) {
      this.logger.warn('租户守卫：用户无权访问租户', {
        userId: user.id,
        tenantId,
        userTenants: user.tenants.map(t => t.tenantId)
      });
      return false;
    }

    // 将租户信息添加到请求上下文
    request.currentTenant = user.tenants.find(t => t.tenantId === tenantId);
    
    return true;
  }
}
```

#### **多租户数据隔离中间件**

```typescript
/**
 * 多租户数据隔离中间件
 * 
 * 自动为数据库查询添加租户ID过滤条件
 */
@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContextManager: TenantContextManager,
    private readonly logger: ILoggerService
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const tenantId = this.extractTenantId(req);
    
    if (tenantId) {
      // 设置租户上下文
      this.tenantContextManager.setContext({
        tenantId,
        isolationStrategy: DataIsolationStrategy.ROW_LEVEL_SECURITY,
        dataClassification: DataClassification.TENANT_SPECIFIC
      });

      this.logger.debug('设置租户上下文', { tenantId });
    }

    // 清理上下文的回调
    res.on('finish', () => {
      this.tenantContextManager.clearContext();
    });

    next();
  }

  private extractTenantId(req: Request): string | null {
    // 从URL参数提取
    if (req.params.tenantId) {
      return req.params.tenantId;
    }

    // 从查询参数提取
    if (req.query.tenantId) {
      return req.query.tenantId as string;
    }

    // 从请求头提取
    if (req.headers['x-tenant-id']) {
      return req.headers['x-tenant-id'] as string;
    }

    // 从用户上下文提取（如果用户只属于一个租户）
    const user = (req as any).user as ICurrentUser;
    if (user && user.tenants.length === 1) {
      return user.tenants[0].tenantId;
    }

    return null;
  }
}
```

### 审计和日志

#### **租户操作审计服务**

```typescript
/**
 * 租户操作审计服务
 */
@Injectable()
export class TenantAuditService {
  constructor(
    private readonly auditRepository: IAuditRepository,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 记录租户操作审计日志
   */
  async logTenantOperation(audit: ITenantAuditLog): Promise<void> {
    try {
      const auditLog: IAuditLog = {
        id: EntityId.generate().getValue(),
        action: audit.action,
        entityType: 'tenant',
        entityId: audit.tenantId,
        userId: audit.userId,
        tenantId: audit.tenantId,
        metadata: {
          ...audit.metadata,
          userAgent: audit.userAgent,
          ipAddress: audit.ipAddress,
          requestId: audit.requestId
        },
        timestamp: new Date(),
        result: audit.result || 'success'
      };

      await this.auditRepository.save(auditLog);

      this.logger.info('租户操作审计记录成功', {
        action: audit.action,
        tenantId: audit.tenantId,
        userId: audit.userId
      });

    } catch (error) {
      this.logger.error('租户操作审计记录失败', { error, audit });
    }
  }

  /**
   * 查询租户审计日志
   */
  async getTenantAuditLogs(
    tenantId: string,
    filters: IAuditLogFilters,
    pagination: IPaginationOptions
  ): Promise<PaginatedResult<IAuditLog>> {
    return await this.auditRepository.findByTenant(
      tenantId,
      filters,
      pagination
    );
  }
}

/**
 * 租户审计日志接口
 */
export interface ITenantAuditLog {
  action: string;
  tenantId: string;
  userId: string;
  metadata: Record<string, any>;
  userAgent?: string;
  ipAddress?: string;
  requestId?: string;
  result?: 'success' | 'failure' | 'partial';
}
```

## 📊 监控和性能

### 租户性能监控

#### **租户性能监控服务**

```typescript
/**
 * 租户性能监控服务
 */
@Injectable()
export class TenantPerformanceMonitor {
  constructor(
    private readonly metricsService: IMetricsService,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 记录租户操作性能指标
   */
  recordOperationMetrics(
    tenantId: string,
    operation: string,
    duration: number,
    success: boolean
  ): void {
    const labels = {
      tenant_id: tenantId,
      operation,
      status: success ? 'success' : 'failure'
    };

    // 记录响应时间
    this.metricsService.recordHistogram('tenant_operation_duration', duration, labels);

    // 记录操作计数
    this.metricsService.incrementCounter('tenant_operation_total', labels);

    // 记录错误率
    if (!success) {
      this.metricsService.incrementCounter('tenant_operation_errors', labels);
    }
  }

  /**
   * 记录租户资源使用情况
   */
  recordResourceUsage(
    tenantId: string,
    resourceType: string,
    usage: number,
    limit: number
  ): void {
    const labels = {
      tenant_id: tenantId,
      resource_type: resourceType
    };

    // 记录资源使用量
    this.metricsService.recordGauge('tenant_resource_usage', usage, labels);

    // 记录资源限制
    this.metricsService.recordGauge('tenant_resource_limit', limit, labels);

    // 记录使用率
    const usageRate = limit > 0 ? (usage / limit) * 100 : 0;
    this.metricsService.recordGauge('tenant_resource_usage_rate', usageRate, labels);

    // 如果使用率超过80%，记录告警指标
    if (usageRate > 80) {
      this.metricsService.incrementCounter('tenant_resource_high_usage', labels);
    }
  }

  /**
   * 记录租户活跃度
   */
  recordTenantActivity(tenantId: string, activityType: string): void {
    const labels = {
      tenant_id: tenantId,
      activity_type: activityType
    };

    this.metricsService.incrementCounter('tenant_activity', labels);
  }
}
```

### 性能优化策略

#### **查询优化**

```typescript
/**
 * 租户查询优化服务
 */
@Injectable()
export class TenantQueryOptimizer {
  constructor(
    private readonly cacheService: ICacheService,
    private readonly logger: ILoggerService
  ) {}

  /**
   * 优化租户列表查询
   */
  async optimizeListQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    ttl: number = 300
  ): Promise<T> {
    // 尝试从缓存获取
    const cached = await this.cacheService.get<T>(cacheKey);
    if (cached) {
      this.logger.debug('命中查询缓存', { cacheKey });
      return cached;
    }

    // 执行查询
    const startTime = Date.now();
    const result = await queryFn();
    const duration = Date.now() - startTime;

    // 缓存结果
    await this.cacheService.set(cacheKey, result, ttl);

    this.logger.debug('查询执行完成', {
      cacheKey,
      duration,
      cached: false
    });

    return result;
  }

  /**
   * 批量预加载租户数据
   */
  async preloadTenantData(tenantIds: string[]): Promise<void> {
    const promises = tenantIds.map(async (tenantId) => {
      try {
        // 预加载租户基本信息
        const cacheKey = `tenant:${tenantId}`;
        const exists = await this.cacheService.exists(cacheKey);
        
        if (!exists) {
          // 从数据库加载并缓存
          // 这里应该调用具体的加载逻辑
          this.logger.debug('预加载租户数据', { tenantId });
        }
      } catch (error) {
        this.logger.warn('预加载租户数据失败', { error, tenantId });
      }
    });

    await Promise.allSettled(promises);
  }
}
```

## 🔧 模块集成

### NestJS模块配置

#### **租户模块**

```typescript
/**
 * 租户模块
 */
@Module({
  imports: [
    // 导入基础设施模块
    UnifiedConfigModule,
    DatabaseModule,
    MessagingModule,
    CacheModule,
    LoggingModule,
    
    // CQRS模块
    CqrsModule,
    
    // TypeORM模块
    TypeOrmModule.forFeature([
      TenantEntity,
      TenantReadModelEntity,
      OrganizationEntity,
      DepartmentEntity
    ])
  ],
  controllers: [
    TenantController,
    OrganizationController,
    DepartmentController
  ],
  providers: [
    // 仓储
    {
      provide: 'ITenantRepository',
      useClass: TenantRepository
    },
    {
      provide: 'ITenantQueryRepository',
      useClass: TenantQueryRepository
    },
    {
      provide: 'IOrganizationRepository',
      useClass: OrganizationRepository
    },
    
    // 领域服务
    {
      provide: 'ITenantUniquenessService',
      useClass: TenantUniquenessService
    },
    
    // 应用服务
    TenantService,
    OrganizationService,
    DepartmentService,
    
    // 命令处理器
    CreateTenantHandler,
    UpgradeTenantHandler,
    SuspendTenantHandler,
    CreateOrganizationHandler,
    CreateDepartmentHandler,
    
    // 查询处理器
    GetTenantByIdHandler,
    GetTenantsHandler,
    GetOrganizationsByTenantHandler,
    GetDepartmentsByOrganizationHandler,
    
    // 事件处理器
    TenantCreatedEventHandler,
    TenantUpgradedEventHandler,
    TenantSuspendedEventHandler,
    OrganizationCreatedEventHandler,
    
    // 基础设施服务
    TenantEventStore,
    TenantCacheService,
    TenantAuditService,
    TenantPerformanceMonitor,
    TenantQueryOptimizer
  ],
  exports: [
    'ITenantRepository',
    'ITenantQueryRepository',
    TenantService,
    OrganizationService,
    DepartmentService
  ]
})
export class TenantModule implements OnModuleInit {
  constructor(
    private readonly logger: ILoggerService,
    private readonly configService: IUnifiedConfigService
  ) {}

  async onModuleInit(): Promise<void> {
    this.logger.info('租户模块初始化开始');

    // 验证配置
    await this.validateConfiguration();

    // 初始化性能监控
    await this.initializeMonitoring();

    this.logger.info('租户模块初始化完成');
  }

  private async validateConfiguration(): Promise<void> {
    const config = this.configService.getTenantConfig();
    
    if (!config) {
      throw new Error('租户模块配置缺失');
    }

    this.logger.info('租户模块配置验证通过', {
      maxTrialDays: config.maxTrialDays,
      defaultIsolationStrategy: config.defaultIsolationStrategy
    });
  }

  private async initializeMonitoring(): Promise<void> {
    // 初始化性能监控指标
    this.logger.info('租户模块性能监控初始化完成');
  }
}
```

#### **租户配置**

```typescript
/**
 * 租户模块配置
 */
export interface ITenantModuleConfig {
  // 试用期配置
  maxTrialDays: number;
  defaultTrialDays: number;
  gracePeroidDays: number;
  
  // 隔离策略配置
  defaultIsolationStrategy: DataIsolationStrategy;
  
  // 性能配置
  queryTimeout: number;
  cacheTimeout: number;
  
  // 限制配置
  maxOrganizationsPerTenant: number;
  maxDepartmentLevels: number;
  maxUsersPerTenant: number;
  
  // 审计配置
  auditEnabled: boolean;
  auditRetentionDays: number;
}

/**
 * 租户配置工厂
 */
@Injectable()
export class TenantConfigFactory {
  static create(): ITenantModuleConfig {
    return {
      maxTrialDays: 90,
      defaultTrialDays: 30,
      gracePeroidDays: 7,
      defaultIsolationStrategy: DataIsolationStrategy.ROW_LEVEL_SECURITY,
      queryTimeout: 30000,
      cacheTimeout: 300,
      maxOrganizationsPerTenant: 100,
      maxDepartmentLevels: 7,
      maxUsersPerTenant: 10000,
      auditEnabled: true,
      auditRetentionDays: 365
    };
  }
}
```

## 📋 总结

### 技术特点

1. **Clean Architecture合规**：严格的分层架构和依赖控制
2. **CQRS实现完整**：命令查询完全分离，读写优化
3. **事件驱动架构**：完整的事件存储和处理机制
4. **多租户支持**：全面的多租户技术基础设施
5. **高性能设计**：缓存、查询优化、性能监控
6. **企业级安全**：权限控制、审计日志、数据隔离

### 业务价值

1. **完整生命周期管理**：从创建到删除的完整租户管理
2. **灵活组织架构**：支持复杂的7层部门结构
3. **精细权限控制**：分级权限管理和访问控制
4. **运营效率提升**：自动化流程和智能监控
5. **合规性保证**：完整的审计追踪和合规支持

### 扩展性

1. **模块化设计**：独立的领域模块，易于扩展
2. **事件驱动**：松耦合架构，支持功能扩展
3. **配置驱动**：灵活的配置管理，适应业务变化
4. **插件机制**：支持第三方插件和定制开发

---

**文档版本**：v1.1.0  
**创建日期**：2024年12月19日  
**更新日期**：2024年12月19日  
**技术范围**：租户模块完整技术设计 + 代码组织结构 - Clean Architecture + CQRS + Event Sourcing  
**状态**：✅ 技术设计和代码组织完成，可立即开始实现开发
