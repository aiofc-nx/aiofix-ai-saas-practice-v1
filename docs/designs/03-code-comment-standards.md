# Aiofix-AI-SaaS 平台代码注释规范

## 概述

本文档为 Aiofix-AI-SaaS 平台制定统一的代码注释规范，确保代码注释质量、可读性和团队协作效率。遵循"代码即文档"的原则，通过详细的业务规则和逻辑注释，让代码本身成为最好的业务文档。

## 设计原则

### 核心原则

1. **中文注释**：所有注释使用中文，确保团队理解一致
2. **完整性**：所有公共 API、类、方法、接口、枚举都必须添加完整的 TSDoc 注释
3. **准确性**：注释内容必须与实际代码功能一致
4. **及时更新**：代码变更时同步更新注释
5. **避免冗余**：避免重复代码中已明确表达的信息
6. **业务导向**：重点描述业务规则、业务逻辑和业务约束
7. **规则明确**：详细说明业务规则、验证条件、异常情况
8. **逻辑清晰**：解释业务逻辑的执行流程和决策依据

### 技术原则

- **TSDoc 标准**：遵循 TSDoc 注释规范
- **代码即文档**：通过注释实现代码即文档的目标
- **业务规则**：详细描述业务规则和约束条件
- **异常处理**：明确说明异常情况和处理方式

## 目录结构

1. [TSDoc 注释规范](#tsdoc-注释规范)
2. [业务规则注释规范](#业务规则注释规范)
3. [基础设施层模块注释规范](#基础设施层模块注释规范)
4. [最佳实践](#最佳实践)

---

## TSDoc 注释规范

### 类注释规范

```typescript
/**
 * 用户聚合根
 * 
 * 用户聚合根负责管理用户的核心业务逻辑，包括用户创建、更新、角色分配等操作。
 * 通过事件溯源机制记录所有用户状态变更，支持完整的审计追踪。
 * 
 * @description 用户聚合根是用户领域模型的核心，封装了用户相关的所有业务规则和约束。
 * 继承自 TenantAwareAggregateRoot，支持多租户架构和事件驱动设计。
 * 遵循 Clean Architecture 的 Domain Layer 设计原则。
 * 
 * ## 业务规则
 * 
 * ### 用户创建规则
 * - 同一租户内邮箱必须唯一
 * - 用户姓名不能为空且长度不超过 50 个字符
 * - 邮箱格式必须符合标准邮箱格式
 * - 创建用户时自动设置为 ACTIVE 状态
 * 
 * ### 用户状态管理规则
 * - 只有 ACTIVE 状态的用户才能执行业务操作
 * - 用户状态变更必须记录操作者和操作原因
 * - 软删除的用户数据保留但不可访问
 * - 用户状态变更会触发相应的领域事件
 * 
 * ### 角色分配规则
 * - 同一用户不能重复分配相同角色
 * - 角色分配必须记录分配者和分配时间
 * - 角色分配会触发 UserRoleAssignedEvent 事件
 * - 支持动态角色分配和回收
 * 
 * ### 多租户隔离规则
 * - 用户数据严格按租户隔离
 * - 跨租户数据访问被严格禁止
 * - 所有操作必须验证租户上下文
 * - 租户级别的用户配额限制
 * 
 * @example
 * ```typescript
 * // 创建新用户
 * const user = new User(
 *   EntityId.generate(),
 *   tenantId,
 *   '张三',
 *   'zhangsan@example.com',
 *   createdBy
 * );
 * 
 * // 更新用户信息
 * user.updateName('李四', updatedBy);
 * 
 * // 分配角色
 * user.assignRole('admin', assignedBy);
 * ```
 * 
 * @since 1.0.0
 * @version 1.2.0
 */
export class User extends TenantAwareAggregateRoot {
  // 实现
}
```

### 方法注释规范

```typescript
/**
 * 更新用户姓名
 * 
 * 更新用户的姓名信息，并发布相应的领域事件。如果新姓名与当前姓名相同，
 * 则不执行任何操作。更新操作会自动记录操作者和时间戳。
 * 
 * @description 此方法会验证用户状态，确保只有活跃用户才能更新姓名。
 * 更新成功后会自动发布 UserNameUpdatedEvent 事件，供其他模块响应。
 * 
 * ## 业务规则
 * 
 * ### 前置条件验证
 * - 用户状态必须为 ACTIVE，非活跃用户不能更新姓名
 * - 新姓名不能为空字符串或只包含空格
 * - 新姓名长度必须在 1-50 个字符之间
 * - 新姓名不能包含特殊字符（仅允许中文、英文、数字、空格、连字符）
 * 
 * ### 业务逻辑
 * - 如果新姓名与当前姓名相同，直接返回，不执行任何操作
 * - 如果新姓名不同，更新内部状态并记录操作者
 * - 自动发布 UserNameUpdatedEvent 事件，包含旧姓名和新姓名
 * - 事件包含完整的审计信息（操作者、时间戳、租户上下文）
 * 
 * ### 异常处理
 * - 用户状态非 ACTIVE 时抛出 UserNotActiveError
 * - 姓名为空或格式不正确时抛出 InvalidNameError
 * - 姓名长度超限时抛出 NameLengthExceededError
 * 
 * @param newName - 新的用户姓名，不能为空且长度不超过 50 个字符
 * @param updatedBy - 执行更新操作的用户 ID，用于审计追踪
 * 
 * @throws {UserNotActiveError} 当用户状态不是 ACTIVE 时抛出
 * @throws {InvalidNameError} 当新姓名为空或格式不正确时抛出
 * @throws {NameLengthExceededError} 当姓名长度超过 50 个字符时抛出
 * 
 * @example
 * ```typescript
 * // 更新用户姓名
 * user.updateName('新姓名', UserId.fromString('user-123'));
 * 
 * // 验证用户状态
 * if (user.getStatus() === UserStatus.ACTIVE) {
 *   user.updateName('新姓名', updatedBy);
 * }
 * ```
 * 
 * @since 1.0.0
 * @version 1.1.0
 */
updateName(newName: string, updatedBy: UserId): void {
  // 实现
}
```

### 接口注释规范

```typescript
/**
 * 用户仓储接口
 * 
 * 定义用户聚合根的数据访问操作，包括查询、保存、删除等基础操作。
 * 支持多租户数据隔离和软删除功能。
 * 
 * @description 此接口遵循仓储模式，将数据访问逻辑与业务逻辑分离。
 * 所有方法都支持租户级别的数据隔离，确保数据安全性。
 * 
 * ## 业务规则
 * 
 * ### 数据隔离规则
 * - 所有查询操作必须包含租户上下文
 * - 跨租户数据访问被严格禁止
 * - 软删除的数据在查询时自动过滤
 * - 支持组织级别和部门级别的数据隔离
 * 
 * ### 并发控制规则
 * - 保存操作支持乐观锁并发控制
 * - 版本冲突时抛出 ConcurrencyError 异常
 * - 支持事件溯源的状态重建
 * - 保证数据一致性和完整性
 * 
 * ### 查询优化规则
 * - 支持分页查询，避免大数据量查询
 * - 提供索引优化的查询方法
 * - 支持复合条件查询和排序
 * - 查询结果按创建时间倒序排列
 * 
 * @template TEntity 用户聚合根类型
 * 
 * @example
 * ```typescript
 * // 根据 ID 查找用户
 * const user = await userRepository.findById(userId);
 * 
 * // 根据租户查找所有用户
 * const users = await userRepository.findByTenant(tenantId);
 * 
 * // 保存用户
 * await userRepository.save(user);
 * ```
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
export interface IUserRepository {
  /**
   * 根据 ID 查找用户
   * 
   * 根据用户 ID 查找指定的用户聚合根。查询会自动应用租户隔离和软删除过滤。
   * 
   * ## 业务规则
   * - 查询结果自动过滤软删除的用户
   * - 验证租户上下文，确保数据隔离
   * - 支持事件溯源的状态重建
   * 
   * @param id - 用户 ID，必须是有效的 EntityId
   * @returns 用户聚合根或 null（如果不存在或已被软删除）
   * @throws {InvalidEntityIdError} 当 ID 格式不正确时抛出
   */
  findById(id: EntityId): Promise<User | null>;

  /**
   * 根据租户 ID 查找所有用户
   * 
   * 查找指定租户下的所有活跃用户。支持分页查询和条件过滤。
   * 
   * ## 业务规则
   * - 只返回 ACTIVE 状态的用户
   * - 自动过滤软删除的用户
   * - 支持按组织、部门等条件过滤
   * - 结果按创建时间倒序排列
   * 
   * @param tenantId - 租户 ID，必须是有效的 TenantId
   * @returns 用户聚合根数组，可能为空数组
   * @throws {InvalidTenantIdError} 当租户 ID 格式不正确时抛出
   */
  findByTenant(tenantId: TenantId): Promise<User[]>;

  /**
   * 保存用户聚合根
   * 
   * 保存用户聚合根到持久化存储，支持新增和更新操作。
   * 保存过程包括事件存储和状态持久化。
   * 
   * ## 业务规则
   * - 支持乐观锁并发控制
   * - 自动保存未提交的领域事件
   * - 验证聚合根的业务规则
   * - 更新聚合根版本号
   * 
   * @param user - 用户聚合根，必须包含有效的租户上下文
   * @throws {ConcurrencyError} 当并发冲突时抛出
   * @throws {InvalidAggregateError} 当聚合根状态无效时抛出
   * @throws {TenantMismatchError} 当租户上下文不匹配时抛出
   */
  save(user: User): Promise<void>;
}
```

### 枚举注释规范

```typescript
/**
 * 用户状态枚举
 * 
 * 定义用户可能的所有状态，用于用户生命周期管理。
 * 状态变更会触发相应的领域事件。
 * 
 * @description 用户状态遵循预定义的状态机规则，确保状态变更的合法性。
 * 每个状态都有对应的业务含义和处理逻辑。
 * 
 * ## 业务规则
 * 
 * ### 状态转换规则
 * - ACTIVE → INACTIVE：用户被禁用，保留数据但无法使用系统
 * - ACTIVE → DELETED：用户被软删除，数据保留但不可访问
 * - INACTIVE → ACTIVE：用户被重新激活，恢复系统使用权限
 * - INACTIVE → DELETED：用户被软删除，从非活跃状态删除
 * - DELETED → ACTIVE：用户被恢复，从删除状态恢复到活跃状态
 * 
 * ### 状态约束规则
 * - 只有 ACTIVE 状态的用户才能执行业务操作
 * - INACTIVE 状态的用户不能登录系统
 * - DELETED 状态的用户数据不可访问但保留用于审计
 * - 状态变更必须记录操作者和操作原因
 * 
 * ### 事件触发规则
 * - 状态变更时自动发布相应的领域事件
 * - 事件包含完整的状态变更信息
 * - 支持事件溯源和状态重建
 * 
 * @example
 * ```typescript
 * // 检查用户状态
 * if (user.getStatus() === UserStatus.ACTIVE) {
 *   // 处理活跃用户逻辑
 * }
 * 
 * // 状态转换
 * user.activate(activatedBy);
 * user.deactivate(deactivatedBy, '账户违规');
 * ```
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
export enum UserStatus {
  /**
   * 活跃状态
   * 
   * 用户可以正常使用系统功能，参与业务流程。
   * 这是用户的默认状态。
   * 
   * ## 业务规则
   * - 用户可以正常登录和使用系统
   * - 可以执行所有被授权的业务操作
   * - 可以接收系统通知和消息
   * - 可以参与工作流程和审批流程
   */
  ACTIVE = 'ACTIVE',

  /**
   * 非活跃状态
   * 
   * 用户被暂时禁用，无法使用系统功能。
   * 可以通过激活操作恢复到活跃状态。
   * 
   * ## 业务规则
   * - 用户无法登录系统
   * - 不能执行任何业务操作
   * - 不接收系统通知和消息
   * - 数据保留但不可访问
   * - 可以通过激活操作恢复到 ACTIVE 状态
   */
  INACTIVE = 'INACTIVE',

  /**
   * 已删除状态
   * 
   * 用户被软删除，数据保留但不可访问。
   * 可以通过恢复操作恢复到活跃状态。
   * 
   * ## 业务规则
   * - 用户无法登录系统
   * - 不能执行任何业务操作
   * - 不接收系统通知和消息
   * - 数据保留用于审计和合规要求
   * - 可以通过恢复操作恢复到 ACTIVE 状态
   * - 删除操作不可逆，需要特殊权限
   */
  DELETED = 'DELETED'
}
```

### 行内注释规范

```typescript
// ✅ 正确：行内注释
export class UserService {
  async createUser(command: CreateUserCommand): Promise<User> {
    // 验证租户访问权限
    this.validateTenantAccess(command);

    // 验证业务规则
    await this.validateBusinessRules(command);

    // 创建聚合根
    const user = new User(
      EntityId.generate(), // 自动生成新的用户 ID
      command.tenantId,
      command.name,
      command.email,
      command.userId
    );

    // 保存聚合根（会触发事件存储）
    await this.userRepository.save(user);

    // 发布领域事件
    await this.eventBus.publishAll(user.getUncommittedEvents());

    return user;
  }

  private async validateBusinessRules(command: CreateUserCommand): Promise<void> {
    // 检查邮箱唯一性 - 确保同一租户内邮箱不重复
    const existingUser = await this.userRepository.findByEmail(
      command.email, 
      command.tenantId
    );
    if (existingUser) {
      throw new UserEmailAlreadyExistsError(command.email);
    }

    // 检查租户配额 - 防止超出订阅计划限制
    const userCount = await this.userRepository.countByTenant(command.tenantId);
    const quota = await this.getTenantQuota(command.tenantId);
    if (userCount >= quota) {
      throw new TenantQuotaExceededError(command.tenantId.toString(), quota);
    }
  }
}
```

---

## 业务规则注释规范

### 业务规则描述要求

在注释中描述业务规则时，必须包含以下要素：

1. **规则分类**：将业务规则按功能分类（如验证规则、状态规则、权限规则等）
2. **规则详情**：详细说明每个规则的具体内容和约束条件
3. **异常情况**：明确说明违反规则时的异常处理
4. **业务逻辑**：解释规则背后的业务逻辑和决策依据
5. **依赖关系**：说明规则之间的依赖关系和执行顺序

### 复杂业务逻辑注释

```typescript
/**
 * 验证用户创建的业务规则
 * 
 * 执行用户创建前的所有业务规则验证，包括邮箱唯一性检查、
 * 租户配额验证、组织权限验证等。验证失败会抛出相应的业务异常。
 * 
 * @description 此方法封装了用户创建的所有前置条件检查，确保数据一致性
 * 和业务规则的正确执行。验证过程包括：
 * 1. 邮箱唯一性验证
 * 2. 租户用户配额检查
 * 3. 组织权限验证
 * 4. 数据格式验证
 * 
 * ## 业务规则
 * 
 * ### 邮箱唯一性规则
 * - 同一租户内邮箱必须唯一
 * - 邮箱格式必须符合 RFC 5322 标准
 * - 邮箱不区分大小写
 * - 已软删除用户的邮箱可以重新使用
 * 
 * ### 租户配额规则
 * - 租户用户数量不能超过订阅计划限制
 * - 配额检查基于 ACTIVE 状态的用户数量
 * - 软删除的用户不计入配额统计
 * - 超出配额时拒绝创建新用户
 * 
 * ### 组织权限规则
 * - 用户只能在其所属组织内创建用户
 * - 组织管理员可以创建下级组织用户
 * - 跨组织用户创建需要特殊权限
 * - 组织状态必须为 ACTIVE
 * 
 * ### 数据格式规则
 * - 用户姓名：1-50 个字符，支持中文、英文、数字
 * - 邮箱：符合标准邮箱格式，长度不超过 254 个字符
 * - 组织 ID：必须是有效的 UUID 格式
 * - 部门 ID：必须是有效的 UUID 格式
 * 
 * ## 业务逻辑流程
 * 
 * 1. **邮箱验证**：检查邮箱格式和唯一性
 * 2. **配额检查**：验证租户用户配额限制
 * 3. **权限验证**：检查用户在组织中的权限
 * 4. **数据验证**：验证所有输入数据的格式和约束
 * 5. **异常处理**：根据验证结果抛出相应的业务异常
 * 
 * @param command - 创建用户命令，包含所有必要的用户信息
 * 
 * @throws {UserEmailAlreadyExistsError} 当邮箱已存在时抛出
 * @throws {TenantQuotaExceededError} 当租户用户配额超限时抛出
 * @throws {OrganizationAccessDeniedError} 当用户无权在指定组织创建用户时抛出
 * @throws {InvalidUserDataError} 当用户数据格式不正确时抛出
 * 
 * @example
 * ```typescript
 * // 在命令处理器中调用
 * await this.validateBusinessRules(command);
 * 
 * // 验证通过后创建用户
 * const user = new User(/* ... */);
 * ```
 * 
 * @since 1.0.0
 * @version 1.1.0
 */
private async validateBusinessRules(command: CreateUserCommand): Promise<void> {
  // 1. 验证邮箱唯一性
  const existingUser = await this.userRepository.findByEmail(
    command.email, 
    command.tenantId
  );
  if (existingUser) {
    throw new UserEmailAlreadyExistsError(command.email);
  }

  // 2. 验证租户配额
  const userCount = await this.userRepository.countByTenant(command.tenantId);
  const quota = await this.getTenantQuota(command.tenantId);
  if (userCount >= quota) {
    throw new TenantQuotaExceededError(command.tenantId.toString(), quota);
  }

  // 3. 验证组织权限（如果指定了组织）
  if (command.organizationId) {
    const hasAccess = await this.organizationService.checkUserAccess(
      command.userId,
      command.organizationId,
      command.tenantId
    );
    if (!hasAccess) {
      throw new OrganizationAccessDeniedError(command.organizationId.toString());
    }
  }

  // 4. 验证数据格式
  this.validateUserData(command);
}
```

---

## 基础设施层模块注释规范

### 日志模块注释规范

```typescript
/**
 * Pino 日志服务
 * 
 * 基于 Pino 的高性能日志服务实现，提供结构化日志记录功能。
 * 支持多级别日志、上下文管理、性能监控等特性。
 * 
 * @description 此服务是日志模块的核心实现，提供统一的日志记录接口。
 * 支持租户上下文、用户上下文、请求上下文等信息的自动注入。
 * 遵循结构化日志设计原则，便于日志分析和监控。
 * 
 * ## 业务规则
 * 
 * ### 日志级别规则
 * - TRACE：详细的调试信息，仅在开发环境使用
 * - DEBUG：调试信息，用于问题排查
 * - INFO：一般信息，记录重要的业务流程
 * - WARN：警告信息，表示潜在问题
 * - ERROR：错误信息，表示业务异常
 * - FATAL：致命错误，表示系统级错误
 * 
 * ### 上下文注入规则
 * - 自动注入租户 ID（从请求头或 JWT 中提取）
 * - 自动注入用户 ID（从请求头或 JWT 中提取）
 * - 自动注入请求 ID（用于请求追踪）
 * - 自动注入会话 ID（用于会话追踪）
 * 
 * ### 性能监控规则
 * - 记录日志统计信息（总数、各级别数量、大小等）
 * - 支持日志性能监控和告警
 * - 提供日志健康检查功能
 * - 支持日志轮转和清理策略
 * 
 * @example
 * ```typescript
 * // 基础日志记录
 * logger.info('用户登录成功', { userId: 'user-123', tenantId: 'tenant-456' });
 * 
 * // 错误日志记录
 * logger.error('用户创建失败', { error: error.message, command });
 * 
 * // 性能监控日志
 * logger.info('数据库查询完成', { 
 *   query: 'SELECT * FROM users', 
 *   duration: 150,
 *   rowCount: 100 
 * });
 * ```
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
@Injectable()
export class PinoLoggerService implements ILoggerService {
  // 实现
}
```

### 缓存模块注释规范

```typescript
/**
 * Redis 缓存服务
 * 
 * 基于 Redis 的分布式缓存服务实现，提供高性能的缓存功能。
 * 支持多级缓存、缓存策略、失效管理、性能监控等特性。
 * 
 * @description 此服务是缓存模块的核心实现，提供统一的缓存操作接口。
 * 支持多租户缓存隔离、缓存键管理、缓存统计等功能。
 * 遵循缓存最佳实践，提供高可用性和高性能。
 * 
 * ## 业务规则
 * 
 * ### 缓存策略规则
 * - LRU：最近最少使用策略，自动淘汰最久未使用的数据
 * - LFU：最少使用频率策略，自动淘汰使用频率最低的数据
 * - FIFO：先进先出策略，按时间顺序淘汰数据
 * - TTL：基于时间过期策略，数据在指定时间后自动过期
 * 
 * ### 多租户隔离规则
 * - 缓存键自动包含租户 ID，确保数据隔离
 * - 支持租户级别的缓存配额管理
 * - 跨租户缓存访问被严格禁止
 * - 支持租户级别的缓存统计和监控
 * 
 * ### 缓存失效规则
 * - 支持基于模式的批量失效
 * - 支持基于标签的失效管理
 * - 支持手动失效和自动失效
 * - 失效操作会记录审计日志
 * 
 * ### 性能监控规则
 * - 记录缓存命中率和未命中率
 * - 监控缓存操作延迟和吞吐量
 * - 提供缓存健康检查功能
 * - 支持缓存性能告警
 * 
 * @example
 * ```typescript
 * // 设置缓存
 * await cacheService.set('user:123', userData, { ttl: 3600 });
 * 
 * // 获取缓存
 * const userData = await cacheService.get('user:123');
 * 
 * // 批量失效
 * await cacheService.deletePattern('user:*');
 * 
 * // 缓存统计
 * const stats = await cacheService.getStats();
 * ```
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
@Injectable()
export class RedisCacheService implements ICacheService {
  // 实现
}
```

### 数据库模块注释规范

```typescript
/**
 * PostgreSQL 数据库适配器
 * 
 * PostgreSQL 数据库的适配器实现，提供统一的数据库操作接口。
 * 支持连接池管理、事务处理、健康检查、性能监控等特性。
 * 
 * @description 此适配器是数据库模块的核心实现，提供数据库抽象层。
 * 支持多租户数据隔离、连接池管理、事务处理等功能。
 * 遵循数据库最佳实践，提供高可用性和高性能。
 * 
 * ## 业务规则
 * 
 * ### 连接池管理规则
 * - 支持连接池大小配置和动态调整
 * - 自动管理连接的生命周期
 * - 支持连接超时和重试机制
 * - 提供连接池健康检查功能
 * 
 * ### 事务处理规则
 * - 支持自动事务和手动事务
 * - 支持嵌套事务和事务传播
 * - 事务失败时自动回滚
 * - 支持事务超时和死锁检测
 * 
 * ### 多租户隔离规则
 * - 支持数据库级别的租户隔离
 * - 支持 Schema 级别的租户隔离
 * - 支持行级安全的租户隔离
 * - 跨租户数据访问被严格禁止
 * 
 * ### 性能监控规则
 * - 记录数据库操作统计信息
 * - 监控查询性能和执行计划
 * - 提供数据库健康检查功能
 * - 支持慢查询检测和告警
 * 
 * @example
 * ```typescript
 * // 执行查询
 * const users = await adapter.query('SELECT * FROM users WHERE tenant_id = $1', [tenantId]);
 * 
 * // 执行事务
 * await adapter.transaction(async (trx) => {
 *   await trx.query('INSERT INTO users ...', [userData]);
 *   await trx.query('INSERT INTO user_roles ...', [roleData]);
 * });
 * 
 * // 健康检查
 * const health = await adapter.healthCheck();
 * ```
 * 
 * @since 1.0.0
 * @version 1.0.0
 */
@Injectable()
export class PostgreSQLAdapter implements IDatabaseAdapter {
  // 实现
}
```

---

## 最佳实践

### 1. 规则分类原则

```typescript
/**
 * ## 业务规则
 * 
 * ### 验证规则
 * - 规则1：详细说明
 * - 规则2：详细说明
 * 
 * ### 状态规则
 * - 规则1：详细说明
 * - 规则2：详细说明
 * 
 * ### 权限规则
 * - 规则1：详细说明
 * - 规则2：详细说明
 */
```

### 2. 规则描述原则

```typescript
/**
 * ### 邮箱唯一性规则
 * - 同一租户内邮箱必须唯一
 * - 邮箱格式必须符合 RFC 5322 标准
 * - 邮箱不区分大小写
 * - 已软删除用户的邮箱可以重新使用
 * 
 * ### 租户配额规则
 * - 租户用户数量不能超过订阅计划限制
 * - 配额检查基于 ACTIVE 状态的用户数量
 * - 软删除的用户不计入配额统计
 * - 超出配额时拒绝创建新用户
 */
```

### 3. 异常处理原则

```typescript
/**
 * ### 异常处理
 * - 用户状态非 ACTIVE 时抛出 UserNotActiveError
 * - 姓名为空或格式不正确时抛出 InvalidNameError
 * - 姓名长度超限时抛出 NameLengthExceededError
 * 
 * @throws {UserNotActiveError} 当用户状态不是 ACTIVE 时抛出
 * @throws {InvalidNameError} 当新姓名为空或格式不正确时抛出
 * @throws {NameLengthExceededError} 当姓名长度超过 50 个字符时抛出
 */
```

### 4. 业务逻辑流程原则

```typescript
/**
 * ## 业务逻辑流程
 * 
 * 1. **邮箱验证**：检查邮箱格式和唯一性
 * 2. **配额检查**：验证租户用户配额限制
 * 3. **权限验证**：检查用户在组织中的权限
 * 4. **数据验证**：验证所有输入数据的格式和约束
 * 5. **异常处理**：根据验证结果抛出相应的业务异常
 */
```

### 5. 注释更新原则

- **同步更新**：代码变更时立即更新相关注释
- **版本标记**：使用 `@version` 标记注释版本
- **变更记录**：在注释中记录重要的变更历史
- **向后兼容**：保持注释的向后兼容性

### 6. 注释质量检查

- **完整性检查**：确保所有公共 API 都有完整注释
- **准确性检查**：验证注释内容与实际代码功能一致
- **一致性检查**：确保注释风格和格式统一
- **可读性检查**：确保注释清晰易懂

---

## 总结

本文档为 Aiofix-AI-SaaS 平台制定了完整的代码注释规范，涵盖：

### 📝 **核心规范**

1. **TSDoc 注释**：完整的类、方法、接口、枚举注释
2. **中文注释**：确保团队理解一致
3. **业务规则**：详细描述业务规则、约束条件和验证逻辑
4. **业务逻辑**：解释业务逻辑的执行流程和决策依据
5. **行内注释**：关键业务逻辑说明
6. **示例代码**：提供使用示例和最佳实践

### 🚀 **核心价值**

- **一致性**：统一的注释风格和格式规范
- **可读性**：清晰的中文注释和文档
- **业务导向**：详细的业务规则和逻辑描述，确保代码即文档
- **可维护性**：规范的注释结构和组织
- **完整性**：所有公共 API 都有完整的注释说明

### 🏗️ **架构支持**

- **基础设施层**：为基础设施层模块提供专门的注释规范
- **业务层**：为业务逻辑提供详细的规则描述
- **接口层**：为 API 接口提供完整的使用说明
- **测试层**：为测试代码提供清晰的测试意图说明

通过遵循这些规范，团队可以实现真正的"代码即文档"，让代码本身成为最好的业务文档，确保代码质量和开发效率。

---

## 相关文档

- [项目架构设计](./02-project-architecture-design.md)
- [Core 模块设计](./06-core-module-design.md)
- [Logging 模块技术设计](./05-01-logging-module-technical-design.md)
