# Core 模块技术设计方案

## 模块概述

Core 模块是 Aiofix-AI-SaaS 平台的核心基础架构库，为所有业务领域模块提供统一的架构基础、共享组件和通用功能。通过 Core 模块，确保整个平台的技术架构一致性，提高开发效率，降低维护成本。

## 设计目标

### 1. 架构一致性

- 提供统一的架构模式和设计原则
- 确保所有业务模块遵循相同的架构规范
- 标准化模块间的通信和依赖关系

### 2. 开发效率

- 提供开箱即用的基础组件和工具
- 减少重复代码和配置
- 简化业务模块的开发复杂度

### 3. 维护成本

- 集中管理通用功能和配置
- 统一升级和维护基础组件
- 降低系统整体维护复杂度

### 4. 扩展性

- 支持新业务模块的快速集成
- 提供灵活的扩展点和插件机制
- 为未来微服务化奠定基础

## 技术栈

### 核心框架

- **NestJS**: 依赖注入、模块化架构
- **TypeScript**: 类型安全的开发语言

### 基础设施模块

- **`@aiofix/logging`**: 高性能结构化日志记录
- **`@aiofix/config`**: 类型安全的配置管理
- **`@aiofix/cache`**: 多级缓存管理
- **`@aiofix/database`**: 数据库抽象层

### 数据访问

- **MikroORM**: 对象关系映射
- **PostgreSQL**: 主数据库

### 消息和事件

- **@nestjs/event-emitter**: 事件驱动架构
- **Bull/Agenda**: 任务队列
- **RxJS**: 响应式编程和 Saga 模式

### 验证和序列化

- **class-validator**: 数据验证
- **class-transformer**: 数据转换
- **JSON**: 数据序列化

### 服务器和数据库

- **Fastify**: 高性能 HTTP 服务器
- **MongoDB**: 文档数据库支持

### 工具库

- **uuid**: 唯一标识符生成
- **moment**: 时间处理
- **lodash**: 工具函数
- **reflect-metadata**: 反射元数据支持

## 核心功能模块

### 1. 架构基础层 (Architecture Foundation)

#### 1.1 装饰器系统

```typescript
/**
 * 命令处理器装饰器
 * 
 * 标记一个类为命令处理器，自动注册到命令总线中。
 * 支持依赖注入和自动发现机制。
 * 
 * @param command 要处理的命令类型
 * @param options 可选的依赖注入选项
 * 
 * @example
 * ```typescript
 * @CommandHandler(CreateUserCommand)
 * export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
 *   async execute(command: CreateUserCommand): Promise<User> {
 *     // 处理创建用户命令
 *   }
 * }
 * ```
 */
export const CommandHandler = (
  command: ICommand | (new (...args: any[]) => ICommand),
  options?: InjectableOptions,
): ClassDecorator => {
  return (target: Function) => {
    if (!Reflect.hasOwnMetadata(COMMAND_METADATA, command)) {
      Reflect.defineMetadata(COMMAND_METADATA, { id: randomUUID() }, command);
    }
    Reflect.defineMetadata(COMMAND_HANDLER_METADATA, command, target);

    if (options) {
      Injectable(options)(target);
    }
  };
};

/**
 * 查询处理器装饰器
 * 
 * 标记一个类为查询处理器，自动注册到查询总线中。
 * 
 * @param query 要处理的查询类型
 * @param options 可选的依赖注入选项
 * 
 * @example
 * ```typescript
 * @QueryHandler(GetUserQuery)
 * export class GetUserHandler implements IQueryHandler<GetUserQuery> {
 *   async execute(query: GetUserQuery): Promise<User[]> {
 *     // 处理获取用户查询
 *   }
 * }
 * ```
 */
export const QueryHandler = (
  query: IQuery,
  options?: InjectableOptions,
): ClassDecorator => {
  return (target: Function) => {
    if (!Reflect.hasOwnMetadata(QUERY_METADATA, query)) {
      Reflect.defineMetadata(QUERY_METADATA, { id: randomUUID() }, query);
    }
    Reflect.defineMetadata(QUERY_HANDLER_METADATA, query, target);

    if (options) {
      Injectable(options)(target);
    }
  };
};

/**
 * 事件处理器装饰器
 * 
 * 标记一个类为事件处理器，自动注册到事件总线中。
 * 支持处理多个事件类型。
 * 
 * @param events 要处理的事件类型列表
 * @param options 可选的依赖注入选项
 * 
 * @example
 * ```typescript
 * @EventsHandler(UserCreatedEvent, UserUpdatedEvent)
 * export class UserEventHandler implements IEventHandler<UserCreatedEvent | UserUpdatedEvent> {
 *   async handle(event: UserCreatedEvent | UserUpdatedEvent): Promise<void> {
 *     // 处理用户事件
 *   }
 * }
 * ```
 */
export const EventsHandler = (
  ...events: (IEvent | (new (...args: any[]) => IEvent) | InjectableOptions)[]
): ClassDecorator => {
  return (target: Function) => {
    const last = events[events.length - 1];
    if (last && typeof last !== 'function' && 'scope' in last) {
      Injectable(last)(target);
      events.pop();
    }

    events.forEach((event) => {
      if (!Reflect.hasOwnMetadata(EVENT_METADATA, event)) {
        Reflect.defineMetadata(EVENT_METADATA, { id: randomUUID() }, event);
      }
    });

    Reflect.defineMetadata(EVENTS_HANDLER_METADATA, events, target);
  };
};

/**
 * Saga 装饰器
 * 
 * 标记一个方法为 Saga，用于处理复杂的业务流程。
 * 支持事件驱动的业务流程编排。
 * 
 * @example
 * ```typescript
 * @Injectable()
 * export class OrderProcessingSaga {
 *   @Saga()
 *   orderCreated = (events$: Observable<OrderCreatedEvent>): Observable<ICommand> => {
 *     return events$.pipe(
 *       ofType(OrderCreatedEvent),
 *       map(event => new ReserveInventoryCommand(event.orderId, event.items))
 *     );
 *   };
 * }
 * ```
 */
export const Saga = (): PropertyDecorator => {
  return (target: object, propertyKey: string | symbol) => {
    const properties =
      Reflect.getMetadata(SAGA_METADATA, target.constructor) || [];
    Reflect.defineMetadata(
      SAGA_METADATA,
      [...properties, propertyKey],
      target.constructor,
    );
  };
};

/**
 * 缓存装饰器
 * 
 * 为方法添加缓存功能，支持多级缓存策略。
 * 
 * @param key 缓存键
 * @param ttl 生存时间（秒）
 * @param strategy 缓存策略
 * 
 * @example
 * ```typescript
 * @Cacheable('user:profile', 300, CacheStrategy.MEMORY_AND_REDIS)
 * async getUserProfile(userId: string): Promise<UserProfile> {
 *   // 方法实现
 * }
 * ```
 */
export const Cacheable = (
  key: string,
  ttl: number = 300,
  strategy: CacheStrategy = CacheStrategy.MEMORY_AND_REDIS,
): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${key}:${JSON.stringify(args)}`;
      const cacheService = this.cacheService;
      
      // 尝试从缓存获取
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 执行原方法
      const result = await originalMethod.apply(this, args);
      
      // 缓存结果
      await cacheService.set(cacheKey, result, ttl, strategy);
      
      return result;
    };
    
    return descriptor;
  };
};

/**
 * 数据隔离装饰器
 * 
 * 为方法添加数据隔离功能，自动应用租户、组织、部门等隔离策略。
 * 
 * @param level 隔离级别
 * @param sensitivity 数据敏感度
 * 
 * @example
 * ```typescript
 * @DataIsolation(IsolationLevel.TENANT, DataSensitivity.INTERNAL)
 * async getDocuments(tenantId: string): Promise<Document[]> {
 *   // 方法实现
 * }
 * ```
 */
export const DataIsolation = (
  level: IsolationLevel,
  sensitivity: DataSensitivity = DataSensitivity.INTERNAL,
): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const isolationService = this.isolationService;
      const context = isolationService.createContext(level, sensitivity);
      
      // 应用隔离策略
      const isolatedArgs = await isolationService.applyIsolation(args, context);
      
      return originalMethod.apply(this, isolatedArgs);
    };
    
    return descriptor;
  };
};
```

#### 1.2 自动发现和注册机制

```typescript
/**
 * Core 模块探索服务
 * 
 * 自动发现和注册所有装饰器标记的处理器、Saga 等组件。
 * 支持依赖注入和模块化架构。
 */
@Injectable()
export class CoreExplorerService {
  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
  ) {}

  /**
   * 探索所有 CQRS 组件
   * 
   * @returns 发现的组件集合
   */
  explore(): {
    commands: InstanceWrapper<ICommandHandler>[];
    queries: InstanceWrapper<IQueryHandler>[];
    events: InstanceWrapper<IEventHandler>[];
    sagas: InstanceWrapper<object>[];
  } {
    const commands = this.reflector.get<ICommandHandler[]>('command_handlers', this.moduleRef);
    const queries = this.reflector.get<IQueryHandler[]>('query_handlers', this.moduleRef);
    const events = this.reflector.get<IEventHandler[]>('event_handlers', this.moduleRef);
    const sagas = this.reflector.get<object[]>('sagas', this.moduleRef);
    
    return { commands, queries, events, sagas };
  }

  /**
   * 探索命令处理器
   */
  private exploreCommands(): InstanceWrapper<ICommandHandler>[] {
    // 实现命令处理器发现逻辑
  }

  /**
   * 探索查询处理器
   */
  private exploreQueries(): InstanceWrapper<IQueryHandler>[] {
    // 实现查询处理器发现逻辑
  }

  /**
   * 探索事件处理器
   */
  private exploreEvents(): InstanceWrapper<IEventHandler>[] {
    // 实现事件处理器发现逻辑
  }

  /**
   * 探索 Saga
   */
  private exploreSagas(): InstanceWrapper<object>[] {
    // 实现 Saga 发现逻辑
  }
}
```

#### 1.3 异步上下文支持

```typescript
/**
 * Core 异步上下文
 * 
 * 提供请求级别的上下文管理，支持租户隔离、用户上下文等。
 * 参考 @nestjs/cqrs 的 AsyncContext 设计。
 */
export class CoreAsyncContext {
  private static readonly contextMap = new Map<string, CoreAsyncContext>();
  
  constructor(
    public readonly id: string = uuidv4(),
    public readonly tenantId?: string,
    public readonly userId?: string,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly requestId?: string,
    public readonly correlationId?: string,
  ) {}

  /**
   * 从目标对象获取上下文
   */
  static of<T extends object>(target: T): CoreAsyncContext | undefined {
    return Reflect.getMetadata('core_async_context', target);
  }

  /**
   * 检查是否已附加上下文
   */
  static isAttached<T extends object>(target: T): boolean {
    return Reflect.hasMetadata('core_async_context', target);
  }

  /**
   * 将上下文附加到目标对象
   */
  attachTo<T extends object>(target: T): void {
    Reflect.defineMetadata('core_async_context', this, target);
  }

  /**
   * 创建新的异步上下文
   */
  static create(options?: {
    tenantId?: string;
    userId?: string;
    organizationId?: string;
    departmentId?: string;
    requestId?: string;
    correlationId?: string;
  }): CoreAsyncContext {
    return new CoreAsyncContext(
      uuidv4(),
      options?.tenantId,
      options?.userId,
      options?.organizationId,
      options?.departmentId,
      options?.requestId,
      options?.correlationId,
    );
  }

  /**
   * 获取当前租户ID
   */
  getCurrentTenantId(): string | undefined {
    return this.tenantId;
  }

  /**
   * 获取当前用户ID
   */
  getCurrentUserId(): string | undefined {
    return this.userId;
  }

  /**
   * 获取当前组织ID
   */
  getCurrentOrganizationId(): string | undefined {
    return this.organizationId;
  }

  /**
   * 获取当前部门ID
   */
  getCurrentDepartmentId(): string | undefined {
    return this.departmentId;
  }
}
```

#### 1.4 Clean Architecture 基础设施

```typescript
/**
 * 审计信息接口
 * 
 * 定义实体的审计追踪信息，包括创建、更新、删除等操作的完整记录。
 * 支持多租户架构和完整的审计追踪需求。
 */
export interface AuditInfo {
  /** 创建时间 */
  readonly createdAt: Date;
  /** 创建者ID */
  readonly createdBy: string;
  /** 创建者类型（用户、系统、API等） */
  readonly createdByType: 'user' | 'system' | 'api' | 'migration';
  /** 更新时间 */
  readonly updatedAt: Date;
  /** 更新者ID */
  readonly updatedBy: string;
  /** 更新者类型 */
  readonly updatedByType: 'user' | 'system' | 'api' | 'migration';
  /** 实体版本号（乐观锁） */
  readonly version: number;
  /** 租户ID */
  readonly tenantId: string;
  /** 软删除时间 */
  readonly deletedAt?: Date;
  /** 删除者ID */
  readonly deletedBy?: string;
  /** 删除者类型 */
  readonly deletedByType?: 'user' | 'system' | 'api' | 'migration';
  /** 删除原因 */
  readonly deleteReason?: string;
  /** 最后操作类型 */
  readonly lastOperation: 'create' | 'update' | 'delete' | 'restore';
  /** 操作IP地址 */
  readonly lastOperationIp?: string;
  /** 操作用户代理 */
  readonly lastOperationUserAgent?: string;
  /** 操作来源（web、mobile、api等） */
  readonly lastOperationSource?: string;
}

/**
 * 基础实体类
 * 
 * 提供完整的审计追踪能力，包括创建、更新、删除等操作的完整记录。
 * 支持多租户架构、乐观锁、软删除等企业级功能。
 * 默认使用EntityId作为唯一标识符类型。
 * 
 * @description 所有领域实体的基类，提供统一的审计追踪能力。
 * 继承此类的实体自动获得完整的审计信息记录和追踪功能。
 * 
 * ## 业务规则
 * 
 * ### 审计追踪规则
 * - 每个实体创建时自动记录创建者和创建时间
 * - 每次更新时自动记录更新者和更新时间
 * - 支持软删除，记录删除者和删除时间
 * - 版本号自动递增，支持乐观锁并发控制
 * - 记录操作来源和上下文信息
 * 
 * ### 多租户规则
 * - 所有审计信息都包含租户上下文
 * - 跨租户操作被严格禁止
 * - 租户隔离在审计层面得到保证
 * 
 * ### 数据完整性规则
 * - 审计信息一旦创建不可修改
 * - 版本号只能递增，不能回退
 * - 删除操作记录完整的原因和上下文
 * 
 * ### ID管理规则
 * - 默认使用EntityId作为唯一标识符
 * - 支持自定义ID类型（通过泛型参数）
 * - ID一旦创建不可修改
 * - 提供类型安全的ID比较和操作
 * 
 * @example
 * ```typescript
 * // 使用默认的EntityId
 * export class User extends BaseEntity {
 *   constructor(
 *     id: EntityId,
 *     private _email: string,
 *     auditInfo: Partial<AuditInfo>
 *   ) {
 *     super(id, auditInfo);
 *   }
 * }
 * 
 * // 使用自定义ID类型
 * export class Order extends BaseEntity<OrderNumber> {
 *   constructor(
 *     id: OrderNumber,
 *     private _customerId: EntityId,
 *     auditInfo: Partial<AuditInfo>
 *   ) {
 *     super(id, auditInfo);
 *   }
 * }
 * 
 * // 创建实体
 * const user = new User(
 *   EntityId.generate(),
 *   'user@example.com',
 *   { 
 *     createdBy: 'admin-456',
 *     createdByType: 'user',
 *     tenantId: 'tenant-123',
 *     lastOperationIp: '192.168.1.1'
 *   }
 * );
 * ```
 */
export abstract class BaseEntity<T = EntityId> {
  protected readonly _id: T;
  protected _auditInfo: AuditInfo;
  
  constructor(
    id: T, 
    auditInfo: Partial<AuditInfo> = {}
  ) {
    this._id = id;
    this._auditInfo = this.createInitialAuditInfo(auditInfo);
  }
  
  get id(): T { return this._id; }
  get auditInfo(): Readonly<AuditInfo> { return { ...this._auditInfo }; }
  
  // 审计信息访问器
  get createdAt(): Date { return this._auditInfo.createdAt; }
  get createdBy(): string { return this._auditInfo.createdBy; }
  get createdByType(): string { return this._auditInfo.createdByType; }
  get updatedAt(): Date { return this._auditInfo.updatedAt; }
  get updatedBy(): string { return this._auditInfo.updatedBy; }
  get updatedByType(): string { return this._auditInfo.updatedByType; }
  get version(): number { return this._auditInfo.version; }
  get tenantId(): string { return this._auditInfo.tenantId; }
  get deletedAt(): Date | undefined { return this._auditInfo.deletedAt; }
  get deletedBy(): string | undefined { return this._auditInfo.deletedBy; }
  get deletedByType(): string | undefined { return this._auditInfo.deletedByType; }
  get deleteReason(): string | undefined { return this._auditInfo.deleteReason; }
  get lastOperation(): string { return this._auditInfo.lastOperation; }
  get lastOperationIp(): string | undefined { return this._auditInfo.lastOperationIp; }
  get lastOperationUserAgent(): string | undefined { return this._auditInfo.lastOperationUserAgent; }
  get lastOperationSource(): string | undefined { return this._auditInfo.lastOperationSource; }
  
  // 状态检查
  get isDeleted(): boolean { return !!this._auditInfo.deletedAt; }
  get isActive(): boolean { return !this.isDeleted; }
  
  /**
   * 标记实体为已更新
   * 
   * 更新审计信息，包括更新时间、更新者、版本号等。
   * 版本号自动递增，支持乐观锁并发控制。
   * 
   * @param updateInfo - 更新信息
   */
  protected markAsUpdated(updateInfo: {
    updatedBy: string;
    updatedByType?: 'user' | 'system' | 'api' | 'migration';
    reason?: string;
    lastOperationIp?: string;
    lastOperationUserAgent?: string;
    lastOperationSource?: string;
  }): void {
    this._auditInfo = {
      ...this._auditInfo,
      updatedAt: new Date(),
      updatedBy: updateInfo.updatedBy,
      updatedByType: updateInfo.updatedByType || 'user',
      version: this._auditInfo.version + 1,
      lastOperation: 'update',
      lastOperationIp: updateInfo.lastOperationIp,
      lastOperationUserAgent: updateInfo.lastOperationUserAgent,
      lastOperationSource: updateInfo.lastOperationSource
    };
  }
  
  /**
   * 软删除实体
   * 
   * 标记实体为已删除，但保留数据用于审计和恢复。
   * 记录删除者、删除时间、删除原因等信息。
   * 
   * @param deleteInfo - 删除信息
   */
  protected markAsDeleted(deleteInfo: {
    deletedBy: string;
    deletedByType?: 'user' | 'system' | 'api' | 'migration';
    deleteReason?: string;
    lastOperationIp?: string;
    lastOperationUserAgent?: string;
    lastOperationSource?: string;
  }): void {
    this._auditInfo = {
      ...this._auditInfo,
      deletedAt: new Date(),
      deletedBy: deleteInfo.deletedBy,
      deletedByType: deleteInfo.deletedByType || 'user',
      deleteReason: deleteInfo.deleteReason,
      version: this._auditInfo.version + 1,
      lastOperation: 'delete',
      lastOperationIp: deleteInfo.lastOperationIp,
      lastOperationUserAgent: deleteInfo.lastOperationUserAgent,
      lastOperationSource: deleteInfo.lastOperationSource
    };
  }
  
  /**
   * 恢复已删除的实体
   * 
   * 从软删除状态恢复到活跃状态。
   * 记录恢复操作的相关信息。
   * 
   * @param restoreInfo - 恢复信息
   */
  protected markAsRestored(restoreInfo: {
    restoredBy: string;
    restoredByType?: 'user' | 'system' | 'api' | 'migration';
    restoreReason?: string;
    lastOperationIp?: string;
    lastOperationUserAgent?: string;
    lastOperationSource?: string;
  }): void {
    this._auditInfo = {
      ...this._auditInfo,
      deletedAt: undefined,
      deletedBy: undefined,
      deletedByType: undefined,
      deleteReason: undefined,
      updatedAt: new Date(),
      updatedBy: restoreInfo.restoredBy,
      updatedByType: restoreInfo.restoredByType || 'user',
      version: this._auditInfo.version + 1,
      lastOperation: 'restore',
      lastOperationIp: restoreInfo.lastOperationIp,
      lastOperationUserAgent: restoreInfo.lastOperationUserAgent,
      lastOperationSource: restoreInfo.lastOperationSource
    };
  }
  
  /**
   * 创建初始审计信息
   * 
   * 为新建实体创建完整的审计信息。
   * 如果未提供相关信息，使用默认值。
   * 
   * @param auditInfo - 部分审计信息
   * @returns 完整的审计信息
   */
  private createInitialAuditInfo(auditInfo: Partial<AuditInfo>): AuditInfo {
    const now = new Date();
    
    return {
      createdAt: auditInfo.createdAt || now,
      createdBy: auditInfo.createdBy || 'system',
      createdByType: auditInfo.createdByType || 'system',
      updatedAt: auditInfo.updatedAt || now,
      updatedBy: auditInfo.updatedBy || auditInfo.createdBy || 'system',
      updatedByType: auditInfo.updatedByType || auditInfo.createdByType || 'system',
      version: auditInfo.version || 1,
      tenantId: auditInfo.tenantId || 'default',
      deletedAt: auditInfo.deletedAt,
      deletedBy: auditInfo.deletedBy,
      deletedByType: auditInfo.deletedByType,
      deleteReason: auditInfo.deleteReason,
      lastOperation: auditInfo.lastOperation || 'create',
      lastOperationIp: auditInfo.lastOperationIp,
      lastOperationUserAgent: auditInfo.lastOperationUserAgent,
      lastOperationSource: auditInfo.lastOperationSource
    };
  }
}

/**
 * 基础聚合根类
 * 
 * 继承自 BaseEntity，提供领域事件管理能力。
 * 支持完整的审计追踪和事件驱动架构。
 * 默认使用EntityId作为唯一标识符类型。
 * 
 * @description 聚合根是领域驱动设计的核心概念，负责维护业务不变性
 * 和发布领域事件。继承此类的聚合根自动获得完整的审计追踪能力。
 * 
 * ## 业务规则
 * 
 * ### 领域事件规则
 * - 聚合根状态变更时自动发布领域事件
 * - 事件包含完整的审计信息和业务上下文
 * - 支持事件溯源和状态重建
 * - 事件发布后自动清理未提交事件列表
 * 
 * ### 业务不变性规则
 * - 聚合根负责维护业务规则的一致性
 * - 状态变更必须通过业务方法进行
 * - 违反业务规则时抛出领域异常
 * 
 * ### ID管理规则
 * - 默认使用EntityId作为唯一标识符
 * - 支持自定义ID类型（通过泛型参数）
 * - 提供类型安全的ID比较和操作
 * 
 * @example
 * ```typescript
 * // 使用默认的EntityId
 * export class User extends BaseAggregateRoot {
 *   constructor(
 *     id: EntityId,
 *     private _email: string,
 *     private _tenantId: string,
 *     auditInfo: Partial<AuditInfo>
 *   ) {
 *     super(id, auditInfo);
 *   }
 *   
 *   changeEmail(newEmail: string, updateInfo: UpdateInfo): void {
 *     // 业务规则验证
 *     if (!this.isValidEmail(newEmail)) {
 *       throw new InvalidEmailError(newEmail);
 *     }
 *     
 *     // 更新状态
 *     this._email = newEmail;
 *     this.markAsUpdated(updateInfo);
 *     
 *     // 发布领域事件
 *     this.addDomainEvent(new UserEmailChangedEvent(
 *       this.id,
 *       this._email,
 *       newEmail,
 *       this.auditInfo
 *     ));
 *   }
 * }
 * 
 * // 使用自定义ID类型
 * export class Order extends BaseAggregateRoot<OrderNumber> {
 *   constructor(
 *     id: OrderNumber,
 *     private _customerId: EntityId,
 *     auditInfo: Partial<AuditInfo>
 *   ) {
 *     super(id, auditInfo);
 *   }
 * }
 * ```
 */
export abstract class BaseAggregateRoot<T = EntityId> extends BaseEntity<T> {
  private _domainEvents: DomainEvent[] = [];
  
  /**
   * 添加领域事件
   * 
   * 将领域事件添加到未提交事件列表中。
   * 事件将在聚合根保存时自动发布。
   * 
   * @param event - 领域事件
   */
  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }
  
  /**
   * 获取所有未提交的领域事件
   * 
   * @returns 领域事件数组的副本
   */
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }
  
  /**
   * 获取未提交事件数量
   * 
   * @returns 未提交事件的数量
   */
  get uncommittedEventCount(): number {
    return this._domainEvents.length;
  }
  
  /**
   * 检查是否有未提交的事件
   * 
   * @returns 是否有未提交的事件
   */
  get hasUncommittedEvents(): boolean {
    return this._domainEvents.length > 0;
  }
  
  /**
   * 清除所有未提交的领域事件
   * 
   * 通常在事件发布后调用，清理已处理的事件。
   */
  clearDomainEvents(): void {
    this._domainEvents = [];
  }
  
  /**
   * 获取指定类型的领域事件
   * 
   * @param eventType - 事件类型
   * @returns 匹配的领域事件数组
   */
  getDomainEventsByType(eventType: string): DomainEvent[] {
    return this._domainEvents.filter(event => event.eventType === eventType);
  }
  
  /**
   * 检查是否包含指定类型的领域事件
   * 
   * @param eventType - 事件类型
   * @returns 是否包含该类型的事件
   */
  hasDomainEventOfType(eventType: string): boolean {
    return this._domainEvents.some(event => event.eventType === eventType);
  }
}

/**
 * 实体ID值对象
 * 
 * 统一管理所有实体的唯一标识符，使用 UUID v4 格式。
 * 提供类型安全和统一的ID管理能力。
 * 
 * @description 所有实体的唯一标识符都使用此值对象，确保ID的一致性和类型安全。
 * 支持UUID v4格式，提供完整的ID验证和比较功能。
 * 
 * ## 业务规则
 * 
 * ### ID生成规则
 * - 使用UUID v4格式生成唯一标识符
 * - ID一旦生成不可修改
 * - 支持从字符串创建ID（用于反序列化）
 * - 提供ID格式验证
 * 
 * ### 比较规则
 * - 基于字符串值进行相等性比较
 * - 支持排序和哈希
 * - 空值处理：null和undefined与任何ID都不相等
 * 
 * ### 序列化规则
 * - 支持JSON序列化和反序列化
 * - 字符串表示即为UUID字符串
 * - 支持数据库存储和检索
 * 
 * @example
 * ```typescript
 * // 生成新的实体ID
 * const userId = EntityId.generate();
 * console.log(userId.toString()); // "550e8400-e29b-41d4-a716-446655440000"
 * 
 * // 从字符串创建ID
 * const existingId = EntityId.fromString("550e8400-e29b-41d4-a716-446655440000");
 * 
 * // 比较ID
 * const isEqual = userId.equals(existingId);
 * 
 * // 在实体中使用
 * export class User extends BaseAggregateRoot<EntityId> {
 *   constructor(
 *     id: EntityId,
 *     private _email: string,
 *     auditInfo: Partial<AuditInfo>
 *   ) {
 *     super(id, auditInfo);
 *   }
 * }
 * ```
 */
export class EntityId extends BaseValueObject {
  private readonly _value: string;
  
  private constructor(value: string) {
    super(value);
    this._value = value;
  }
  
  /**
   * 生成新的实体ID
   * 
   * 使用UUID v4算法生成全局唯一标识符。
   * 
   * @returns 新的EntityId实例
   */
  static generate(): EntityId {
    return new EntityId(uuidv4());
  }
  
  /**
   * 从字符串创建实体ID
   * 
   * 验证字符串格式是否为有效的UUID v4格式。
   * 
   * @param value - UUID字符串
   * @returns EntityId实例
   * @throws InvalidEntityIdError 当字符串不是有效的UUID v4格式时
   */
  static fromString(value: string): EntityId {
    if (!EntityId.isValid(value)) {
      throw new InvalidEntityIdError(value);
    }
    return new EntityId(value);
  }
  
  /**
   * 验证字符串是否为有效的UUID v4格式
   * 
   * @param value - 待验证的字符串
   * @returns 是否为有效的UUID v4格式
   */
  static isValid(value: string): boolean {
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return typeof value === 'string' && uuidV4Regex.test(value);
  }
  
  /**
   * 安全地从字符串创建实体ID
   * 
   * 如果字符串无效，返回null而不是抛出异常。
   * 
   * @param value - UUID字符串
   * @returns EntityId实例或null
   */
  static tryFromString(value: string): EntityId | null {
    try {
      return EntityId.fromString(value);
    } catch {
      return null;
    }
  }
  
  /**
   * 获取ID的字符串值
   * 
   * @returns UUID字符串
   */
  get value(): string {
    return this._value;
  }
  
  /**
   * 比较两个EntityId是否相等
   * 
   * @param other - 另一个EntityId实例
   * @returns 是否相等
   */
  equals(other: EntityId | null | undefined): boolean {
    if (!other) return false;
    return this._value === other._value;
  }
  
  /**
   * 获取字符串表示
   * 
   * @returns UUID字符串
   */
  toString(): string {
    return this._value;
  }
  
  /**
   * 获取哈希值
   * 
   * 用于在Map、Set等数据结构中使用。
   * 
   * @returns 哈希值
   */
  hashCode(): number {
    let hash = 0;
    for (let i = 0; i < this._value.length; i++) {
      const char = this._value.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }
  
  /**
   * 比较两个EntityId的大小
   * 
   * 基于字符串值进行字典序比较。
   * 
   * @param other - 另一个EntityId实例
   * @returns 比较结果：负数表示小于，0表示相等，正数表示大于
   */
  compareTo(other: EntityId): number {
    return this._value.localeCompare(other._value);
  }
  
  /**
   * 检查ID是否为空
   * 
   * @returns 是否为空（永远不会为空，因为UUID总是有值）
   */
  isEmpty(): boolean {
    return false;
  }
  
  /**
   * 获取ID的简短表示
   * 
   * 返回前8个字符，用于日志和调试。
   * 
   * @returns 简短ID字符串
   */
  toShortString(): string {
    return this._value.substring(0, 8);
  }
}

/**
 * 无效实体ID异常
 * 
 * 当尝试创建无效格式的EntityId时抛出此异常。
 */
export class InvalidEntityIdError extends Error {
  constructor(value: string) {
    super(`Invalid EntityId format: "${value}". Expected UUID v4 format.`);
    this.name = 'InvalidEntityIdError';
  }
}

/**
 * 基础值对象
 * 
 * 所有值对象的基类，提供值对象的基本行为。
 * 值对象是不可变的，相等性基于值而非引用。
 * 
 * @description 值对象是领域驱动设计中的重要概念，表示没有概念标识的对象。
 * 值对象的相等性基于其属性值，而不是对象引用。
 * 
 * ## 业务规则
 * 
 * ### 不可变性规则
 * - 值对象一旦创建，其状态不可修改
 * - 所有属性都应该是只读的
 * - 状态变更应通过创建新实例实现
 * 
 * ### 相等性规则
 * - 相等性基于属性值比较，而非对象引用
 * - 相同类型且相同值的值对象被视为相等
 * - 不同类型但相同值的值对象被视为不相等
 * 
 * ### 验证规则
 * - 值对象创建时应进行完整性验证
 * - 无效值应抛出相应的领域异常
 * - 提供静态工厂方法进行安全创建
 * 
 * @example
 * ```typescript
 * export class Email extends BaseValueObject {
 *   private constructor(private readonly _value: string) {
 *     super(_value);
 *     if (!this.isValidEmail(_value)) {
 *       throw new InvalidEmailError(_value);
 *     }
 *   }
 *   
 *   static create(value: string): Email {
 *     return new Email(value);
 *   }
 *   
 *   get value(): string {
 *     return this._value;
 *   }
 *   
 *   private isValidEmail(email: string): boolean {
 *     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 *     return emailRegex.test(email);
 *   }
 * }
 * ```
 */
export abstract class BaseValueObject {
  protected constructor(protected readonly _value: any) {}
  
  /**
   * 比较两个值对象是否相等
   * 
   * @param other - 另一个值对象实例
   * @returns 是否相等
   */
  equals(other: BaseValueObject | null | undefined): boolean {
    if (!other) return false;
    if (this.constructor !== other.constructor) return false;
    return JSON.stringify(this._value) === JSON.stringify(other._value);
  }
  
  /**
   * 获取字符串表示
   * 
   * @returns 字符串表示
   */
  toString(): string {
    return JSON.stringify(this._value);
  }
  
  /**
   * 获取哈希值
   * 
   * @returns 哈希值
   */
  hashCode(): number {
    const str = JSON.stringify(this._value);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }
}
```

#### 1.5 错误处理机制

```typescript
/**
 * Core 未处理异常信息接口
 * 
 * 定义未处理异常的详细信息，包括异常原因、异常对象、时间戳等。
 */
export interface CoreUnhandledExceptionInfo {
  /** 异常原因（命令、查询、事件或Saga名称） */
  readonly cause: ICommand | IQuery | IEvent | string;
  /** 异常对象 */
  readonly exception: unknown;
  /** 异常发生时间 */
  readonly timestamp: Date;
  /** 租户ID */
  readonly tenantId?: string;
  /** 用户ID */
  readonly userId?: string;
  /** 请求ID */
  readonly requestId?: string;
  /** 关联ID */
  readonly correlationId?: string;
  /** 异常堆栈信息 */
  readonly stack?: string;
  /** 异常上下文信息 */
  readonly context?: Record<string, any>;
}

/**
 * Core 未处理异常总线
 * 
 * 处理所有未捕获的异常，提供统一的异常处理机制。
 * 支持异常日志记录、监控告警、重试机制等。
 */
@Injectable()
export class CoreUnhandledExceptionBus extends ObservableBus<CoreUnhandledExceptionInfo> {
  private readonly logger = new Logger(CoreUnhandledExceptionBus.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly monitoringService?: IMonitoringService,
  ) {
    super();
    this.subject$.subscribe((exceptionInfo) => this.handleException(exceptionInfo));
  }

  /**
   * 发布未处理异常
   * 
   * @param exceptionInfo 异常信息
   */
  publish(exceptionInfo: CoreUnhandledExceptionInfo): void {
    this.subject$.next(exceptionInfo);
  }

  /**
   * 处理异常
   * 
   * @param exceptionInfo 异常信息
   */
  private async handleException(exceptionInfo: CoreUnhandledExceptionInfo): Promise<void> {
    try {
      // 记录异常日志
      await this.logException(exceptionInfo);
      
      // 发送监控告警
      await this.sendAlert(exceptionInfo);
      
      // 记录性能指标
      await this.recordMetrics(exceptionInfo);
    } catch (error) {
      this.logger.error('Failed to handle unhandled exception', error);
    }
  }

  /**
   * 记录异常日志
   */
  private async logException(exceptionInfo: CoreUnhandledExceptionInfo): Promise<void> {
    const logData = {
      cause: this.getCauseDescription(exceptionInfo.cause),
      exception: exceptionInfo.exception,
      timestamp: exceptionInfo.timestamp,
      tenantId: exceptionInfo.tenantId,
      userId: exceptionInfo.userId,
      requestId: exceptionInfo.requestId,
      correlationId: exceptionInfo.correlationId,
      stack: exceptionInfo.stack,
      context: exceptionInfo.context,
    };

    this.logger.error('Unhandled exception occurred', logData);
  }

  /**
   * 发送监控告警
   */
  private async sendAlert(exceptionInfo: CoreUnhandledExceptionInfo): Promise<void> {
    if (!this.monitoringService) return;

    const alert = {
      type: 'UNHANDLED_EXCEPTION',
      severity: 'ERROR',
      message: `Unhandled exception in ${this.getCauseDescription(exceptionInfo.cause)}`,
      details: {
        cause: exceptionInfo.cause,
        exception: exceptionInfo.exception,
        tenantId: exceptionInfo.tenantId,
        userId: exceptionInfo.userId,
        timestamp: exceptionInfo.timestamp,
      },
    };

    await this.monitoringService.sendAlert(alert);
  }

  /**
   * 记录性能指标
   */
  private async recordMetrics(exceptionInfo: CoreUnhandledExceptionInfo): Promise<void> {
    if (!this.monitoringService) return;

    const metrics = {
      name: 'unhandled_exceptions_total',
      value: 1,
      tags: {
        cause_type: this.getCauseType(exceptionInfo.cause),
        tenant_id: exceptionInfo.tenantId || 'unknown',
        exception_type: this.getExceptionType(exceptionInfo.exception),
      },
    };

    await this.monitoringService.recordMetric(metrics);
  }

  /**
   * 获取异常原因描述
   */
  private getCauseDescription(cause: ICommand | IQuery | IEvent | string): string {
    if (typeof cause === 'string') {
      return cause;
    }
    
    const { constructor } = Object.getPrototypeOf(cause);
    return constructor?.name || 'Unknown';
  }

  /**
   * 获取异常原因类型
   */
  private getCauseType(cause: ICommand | IQuery | IEvent | string): string {
    if (typeof cause === 'string') {
      return 'string';
    }
    
    if ('commandId' in cause) {
      return 'command';
    }
    
    if ('queryId' in cause) {
      return 'query';
    }
    
    if ('eventId' in cause) {
      return 'event';
    }
    
    return 'unknown';
  }

  /**
   * 获取异常类型
   */
  private getExceptionType(exception: unknown): string {
    if (exception instanceof Error) {
      return exception.constructor.name;
    }
    
    return typeof exception;
  }

  /**
   * 将事件或命令映射为未处理异常信息
   */
  mapToUnhandledErrorInfo(
    eventOrCommand: IEvent | ICommand | string,
    exception: unknown,
    context?: Record<string, any>,
  ): CoreUnhandledExceptionInfo {
    return {
      cause: eventOrCommand,
      exception,
      timestamp: new Date(),
      tenantId: this.getCurrentTenantId(),
      userId: this.getCurrentUserId(),
      requestId: this.getCurrentRequestId(),
      correlationId: this.getCurrentCorrelationId(),
      stack: exception instanceof Error ? exception.stack : undefined,
      context,
    };
  }

  private getCurrentTenantId(): string | undefined {
    // 从当前上下文获取租户ID
    return undefined;
  }

  private getCurrentUserId(): string | undefined {
    // 从当前上下文获取用户ID
    return undefined;
  }

  private getCurrentRequestId(): string | undefined {
    // 从当前上下文获取请求ID
    return undefined;
  }

  private getCurrentCorrelationId(): string | undefined {
    // 从当前上下文获取关联ID
    return undefined;
  }
}
```

#### 1.6 发布者模式优化

```typescript
/**
 * Core 事件发布者接口
 * 
 * 定义事件发布的标准接口，支持多种发布策略。
 */
export interface ICoreEventPublisher<TEvent extends BaseDomainEvent = BaseDomainEvent> {
  /**
   * 发布单个事件
   * 
   * @param event 要发布的事件
   * @param dispatcherContext 分发器上下文
   * @param asyncContext 异步上下文
   */
  publish<T extends TEvent>(
    event: T,
    dispatcherContext?: any,
    asyncContext?: CoreAsyncContext,
  ): Promise<void>;
  
  /**
   * 发布多个事件
   * 
   * @param events 要发布的事件列表
   * @param dispatcherContext 分发器上下文
   * @param asyncContext 异步上下文
   */
  publishAll<T extends TEvent>(
    events: T[],
    dispatcherContext?: any,
    asyncContext?: CoreAsyncContext,
  ): Promise<void>;
}

/**
 * Core 事件发布者实现
 * 
 * 提供完整的事件发布功能，包括事件存储、事件总线发布、日志记录等。
 */
@Injectable()
export class CoreEventPublisher<TEvent extends BaseDomainEvent = BaseDomainEvent>
  implements ICoreEventPublisher<TEvent> {
  
  constructor(
    private readonly eventStore: IEventStore,
    private readonly eventBus: IEventBus<TEvent>,
    private readonly logger: PinoLoggerService,
    private readonly monitoringService?: IMonitoringService,
  ) {}

  /**
   * 发布单个事件
   */
  async publish<T extends TEvent>(
    event: T,
    dispatcherContext?: any,
    asyncContext?: CoreAsyncContext,
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 1. 验证事件
      await this.validateEvent(event);
      
      // 2. 保存到事件存储
      await this.eventStore.saveEvent(event);
      
      // 3. 发布到事件总线
      this.eventBus.publish(event, dispatcherContext, asyncContext);
      
      // 4. 记录日志
      await this.logEventPublished(event, asyncContext);
      
      // 5. 记录性能指标
      await this.recordPublishMetrics(event, Date.now() - startTime);
      
    } catch (error) {
      await this.handlePublishError(event, error, asyncContext);
      throw error;
    }
  }

  /**
   * 发布多个事件
   */
  async publishAll<T extends TEvent>(
    events: T[],
    dispatcherContext?: any,
    asyncContext?: CoreAsyncContext,
  ): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    const startTime = Date.now();
    
    try {
      // 1. 验证所有事件
      await Promise.all(events.map(event => this.validateEvent(event)));
      
      // 2. 批量保存到事件存储
      await this.eventStore.saveEvents(events);
      
      // 3. 批量发布到事件总线
      this.eventBus.publishAll(events, dispatcherContext, asyncContext);
      
      // 4. 记录日志
      await this.logEventsPublished(events, asyncContext);
      
      // 5. 记录性能指标
      await this.recordPublishAllMetrics(events, Date.now() - startTime);
      
    } catch (error) {
      await this.handlePublishAllError(events, error, asyncContext);
      throw error;
    }
  }

  /**
   * 验证事件
   */
  private async validateEvent(event: TEvent): Promise<void> {
    // 验证事件ID
    if (!event.eventId) {
      throw new Error('Event ID is required');
    }
    
    // 验证聚合ID
    if (!event.aggregateId) {
      throw new Error('Aggregate ID is required');
    }
    
    // 验证事件类型
    if (!event.eventType) {
      throw new Error('Event type is required');
    }
    
    // 验证租户ID（如果配置了多租户）
    if (this.configService.get('MULTI_TENANT_ENABLED') && !event.tenantId) {
      throw new Error('Tenant ID is required for multi-tenant mode');
    }
  }

  /**
   * 记录事件发布日志
   */
  private async logEventPublished(event: TEvent, asyncContext?: CoreAsyncContext): Promise<void> {
    this.logger.info('Event published', {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      tenantId: event.tenantId,
      version: event.version,
      timestamp: event.timestamp,
      contextId: asyncContext?.id,
      requestId: asyncContext?.requestId,
    });
  }

  /**
   * 记录批量事件发布日志
   */
  private async logEventsPublished(events: TEvent[], asyncContext?: CoreAsyncContext): Promise<void> {
    this.logger.info('Events published', {
      count: events.length,
      eventTypes: events.map(e => e.eventType),
      aggregateIds: events.map(e => e.aggregateId),
      tenantId: events[0]?.tenantId,
      contextId: asyncContext?.id,
      requestId: asyncContext?.requestId,
    });
  }

  /**
   * 记录发布性能指标
   */
  private async recordPublishMetrics(event: TEvent, duration: number): Promise<void> {
    if (!this.monitoringService) return;

    const metrics = {
      name: 'event_publish_duration_ms',
      value: duration,
      tags: {
        event_type: event.eventType,
        tenant_id: event.tenantId || 'unknown',
      },
    };

    await this.monitoringService.recordMetric(metrics);
  }

  /**
   * 记录批量发布性能指标
   */
  private async recordPublishAllMetrics(events: TEvent[], duration: number): Promise<void> {
    if (!this.monitoringService) return;

    const metrics = {
      name: 'events_publish_all_duration_ms',
      value: duration,
      tags: {
        event_count: events.length.toString(),
        tenant_id: events[0]?.tenantId || 'unknown',
      },
    };

    await this.monitoringService.recordMetric(metrics);
  }

  /**
   * 处理发布错误
   */
  private async handlePublishError(
    event: TEvent,
    error: unknown,
    asyncContext?: CoreAsyncContext,
  ): Promise<void> {
    this.logger.error('Failed to publish event', {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      error: error,
      contextId: asyncContext?.id,
    });

    // 发送错误告警
    if (this.monitoringService) {
      const alert = {
        type: 'EVENT_PUBLISH_ERROR',
        severity: 'ERROR',
        message: `Failed to publish event ${event.eventType}`,
        details: {
          eventId: event.eventId,
          eventType: event.eventType,
          error: error,
        },
      };

      await this.monitoringService.sendAlert(alert);
    }
  }

  /**
   * 处理批量发布错误
   */
  private async handlePublishAllError(
    events: TEvent[],
    error: unknown,
    asyncContext?: CoreAsyncContext,
  ): Promise<void> {
    this.logger.error('Failed to publish events', {
      count: events.length,
      eventTypes: events.map(e => e.eventType),
      error: error,
      contextId: asyncContext?.id,
    });

    // 发送错误告警
    if (this.monitoringService) {
      const alert = {
        type: 'EVENTS_PUBLISH_ALL_ERROR',
        severity: 'ERROR',
        message: `Failed to publish ${events.length} events`,
        details: {
          count: events.length,
          eventTypes: events.map(e => e.eventType),
          error: error,
        },
      };

      await this.monitoringService.sendAlert(alert);
    }
  }
}

/**
 * Core 命令发布者接口
 * 
 * 定义命令发布的标准接口。
 */
export interface ICoreCommandPublisher<TCommand extends ICommand = ICommand> {
  /**
   * 发布命令
   * 
   * @param command 要发布的命令
   * @param context 异步上下文
   */
  publish<T extends TCommand>(command: T, context?: CoreAsyncContext): Promise<void>;
}

/**
 * Core 命令发布者实现
 * 
 * 提供命令发布功能，包括命令验证、日志记录、性能监控等。
 */
@Injectable()
export class CoreCommandPublisher<TCommand extends ICommand = ICommand>
  implements ICoreCommandPublisher<TCommand> {
  
  constructor(
    private readonly commandBus: ICommandBus<TCommand>,
    private readonly logger: PinoLoggerService,
    private readonly monitoringService?: IMonitoringService,
  ) {}

  /**
   * 发布命令
   */
  async publish<T extends TCommand>(command: T, context?: CoreAsyncContext): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 1. 验证命令
      await this.validateCommand(command);
      
      // 2. 记录命令发布日志
      await this.logCommandPublished(command, context);
      
      // 3. 执行命令
      await this.commandBus.execute(command, context);
      
      // 4. 记录性能指标
      await this.recordCommandMetrics(command, Date.now() - startTime);
      
    } catch (error) {
      await this.handleCommandError(command, error, context);
      throw error;
    }
  }

  /**
   * 验证命令
   */
  private async validateCommand(command: TCommand): Promise<void> {
    // 验证命令ID
    if ('commandId' in command && !command.commandId) {
      throw new Error('Command ID is required');
    }
    
    // 验证命令类型
    const { constructor } = Object.getPrototypeOf(command);
    if (!constructor || !constructor.name) {
      throw new Error('Command type is required');
    }
  }

  /**
   * 记录命令发布日志
   */
  private async logCommandPublished(command: TCommand, context?: CoreAsyncContext): Promise<void> {
    const { constructor } = Object.getPrototypeOf(command);
    
    this.logger.info('Command published', {
      commandType: constructor?.name,
      commandId: 'commandId' in command ? command.commandId : undefined,
      tenantId: context?.tenantId,
      userId: context?.userId,
      contextId: context?.id,
      requestId: context?.requestId,
    });
  }

  /**
   * 记录命令性能指标
   */
  private async recordCommandMetrics(command: TCommand, duration: number): Promise<void> {
    if (!this.monitoringService) return;

    const { constructor } = Object.getPrototypeOf(command);
    
    const metrics = {
      name: 'command_execution_duration_ms',
      value: duration,
      tags: {
        command_type: constructor?.name || 'unknown',
      },
    };

    await this.monitoringService.recordMetric(metrics);
  }

  /**
   * 处理命令错误
   */
  private async handleCommandError(
    command: TCommand,
    error: unknown,
    context?: CoreAsyncContext,
  ): Promise<void> {
    const { constructor } = Object.getPrototypeOf(command);
    
    this.logger.error('Command execution failed', {
      commandType: constructor?.name,
      commandId: 'commandId' in command ? command.commandId : undefined,
      error: error,
      contextId: context?.id,
    });

    // 发送错误告警
    if (this.monitoringService) {
      const alert = {
        type: 'COMMAND_EXECUTION_ERROR',
        severity: 'ERROR',
        message: `Command execution failed: ${constructor?.name}`,
        details: {
          commandType: constructor?.name,
          error: error,
        },
      };

      await this.monitoringService.sendAlert(alert);
    }
  }
}
```

#### 1.7 CQRS 基础设施

#### 1.3 事件驱动基础设施

```typescript
// 基础领域事件
export abstract class BaseDomainEvent {
  constructor(
    public readonly eventId: string = uuidv4(),
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly timestamp: Date = new Date(),
    public readonly version: number = 1,
    public readonly tenantId?: string
  ) {}
}

// 事件处理器接口
export interface IEventHandler<TEvent extends BaseDomainEvent> {
  handle(event: TEvent): Promise<void>;
}

// 事件总线接口
export interface IEventBus {
  publish<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void>;
  publishAll<TEvent extends BaseDomainEvent>(events: TEvent[]): Promise<void>;
  subscribe<TEvent extends BaseDomainEvent>(
    eventType: string,
    handler: IEventHandler<TEvent>
  ): void;
}

// 事件总线实现
@Injectable()
export class EventBus implements IEventBus {
  private handlers: Map<string, IEventHandler<any>[]> = new Map();
  
  constructor(
    private logger: PinoLoggerService,
    private messageQueue?: IMessageQueue
  ) {}
  
  async publish<TEvent extends BaseDomainEvent>(event: TEvent): Promise<void> {
    try {
      // 发布到本地处理器
      const eventHandlers = this.handlers.get(event.eventType) || [];
      await Promise.all(eventHandlers.map(handler => handler.handle(event)));
      
      // 发布到消息队列（如果配置了）
      if (this.messageQueue) {
        await this.messageQueue.publish(`events.${event.eventType}`, event);
      }
      
      this.logger.debug('事件发布成功', LogContext.BUSINESS, {
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateId: event.aggregateId
      });
      
    } catch (error) {
      this.logger.error('事件发布失败', LogContext.BUSINESS, {
        eventType: event.eventType,
        eventId: event.eventId,
        aggregateId: event.aggregateId,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async publishAll<TEvent extends BaseDomainEvent>(events: TEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }
  
  subscribe<TEvent extends BaseDomainEvent>(
    eventType: string,
    handler: IEventHandler<TEvent>
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    
    this.handlers.get(eventType)!.push(handler);
    
    this.logger.debug('事件处理器注册成功', LogContext.BUSINESS, {
      eventType,
      handlerName: handler.constructor.name
    });
  }
}
```

### 1.4 事件存储完整实现

```typescript
/**
 * 事件存储接口
 * 
 * 提供完整的事件存储能力，支持事件版本控制、序列化和重放。
 */
export interface IEventStore {
  /**
   * 保存聚合根的事件
   * 
   * @param aggregateId - 聚合根ID
   * @param events - 事件列表
   * @param expectedVersion - 期望的版本号（乐观锁）
   */
  saveEvents(aggregateId: string, events: BaseDomainEvent[], expectedVersion: number): Promise<void>;
  
  /**
   * 获取聚合根的所有事件
   * 
   * @param aggregateId - 聚合根ID
   * @param fromVersion - 起始版本号
   */
  getEvents(aggregateId: string, fromVersion?: number): Promise<BaseDomainEvent[]>;
  
  /**
   * 根据事件类型获取事件
   * 
   * @param eventType - 事件类型
   * @param fromDate - 起始日期
   */
  getEventsByType(eventType: string, fromDate?: Date): Promise<BaseDomainEvent[]>;
  
  /**
   * 获取事件流
   * 
   * @param fromEventId - 起始事件ID
   * @param limit - 限制数量
   */
  getEventStream(fromEventId?: string, limit?: number): Promise<EventStreamResult>;
  
  /**
   * 删除聚合根的所有事件
   * 
   * @param aggregateId - 聚合根ID
   */
  deleteEvents(aggregateId: string): Promise<void>;
}

/**
 * 事件流结果
 */
export interface EventStreamResult {
  events: BaseDomainEvent[];
  nextEventId?: string;
  hasMore: boolean;
}

/**
 * 事件存储实现
 * 
 * 基于 PostgreSQL 实现的事件存储，支持完整的事件溯源功能。
 */
@Injectable()
export class EventStore implements IEventStore {
  constructor(
    private database: DatabaseService,
    private logger: PinoLoggerService,
    private config: ConfigService
  ) {}
  
  async saveEvents(
    aggregateId: string, 
    events: BaseDomainEvent[], 
    expectedVersion: number
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 开始事务
      await this.database.beginTransaction();
      
      // 检查当前版本
      const currentVersion = await this.getCurrentVersion(aggregateId);
      if (currentVersion !== expectedVersion) {
        throw new ConcurrencyError(
          `Expected version ${expectedVersion}, but current version is ${currentVersion}`
        );
      }
      
      // 保存事件
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const version = expectedVersion + i + 1;
        
        await this.database.query(
          `INSERT INTO event_store (event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            event.eventId,
            aggregateId,
            event.eventType,
            JSON.stringify(event),
            version,
            event.timestamp,
            event.tenantId || 'default'
          ]
        );
      }
      
      // 提交事务
      await this.database.commitTransaction();
      
      this.logger.info('事件保存成功', LogContext.BUSINESS, {
        aggregateId,
        eventCount: events.length,
        expectedVersion,
        duration: Date.now() - startTime
      });
      
    } catch (error) {
      // 回滚事务
      await this.database.rollbackTransaction();
      
      this.logger.error('事件保存失败', LogContext.BUSINESS, {
        aggregateId,
        eventCount: events.length,
        expectedVersion,
        duration: Date.now() - startTime,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async getEvents(aggregateId: string, fromVersion?: number): Promise<BaseDomainEvent[]> {
    try {
      const query = `
        SELECT event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id
        FROM event_store
        WHERE aggregate_id = $1
        ${fromVersion ? 'AND version >= $2' : ''}
        ORDER BY version ASC
      `;
      
      const params = fromVersion ? [aggregateId, fromVersion] : [aggregateId];
      const result = await this.database.query(query, params);
      
      return result.rows.map(row => this.deserializeEvent(row));
      
    } catch (error) {
      this.logger.error('获取事件失败', LogContext.BUSINESS, {
        aggregateId,
        fromVersion,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async getEventsByType(eventType: string, fromDate?: Date): Promise<BaseDomainEvent[]> {
    try {
      const query = `
        SELECT event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id
        FROM event_store
        WHERE event_type = $1
        ${fromDate ? 'AND timestamp >= $2' : ''}
        ORDER BY timestamp ASC
      `;
      
      const params = fromDate ? [eventType, fromDate] : [eventType];
      const result = await this.database.query(query, params);
      
      return result.rows.map(row => this.deserializeEvent(row));
      
    } catch (error) {
      this.logger.error('根据类型获取事件失败', LogContext.BUSINESS, {
        eventType,
        fromDate,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async getEventStream(fromEventId?: string, limit: number = 100): Promise<EventStreamResult> {
    try {
      const query = `
        SELECT event_id, aggregate_id, event_type, event_data, version, timestamp, tenant_id
        FROM event_store
        ${fromEventId ? 'WHERE event_id > $1' : ''}
        ORDER BY event_id ASC
        LIMIT $${fromEventId ? '2' : '1'}
      `;
      
      const params = fromEventId ? [fromEventId, limit] : [limit];
      const result = await this.database.query(query, params);
      
      const events = result.rows.map(row => this.deserializeEvent(row));
      const nextEventId = events.length > 0 ? events[events.length - 1].eventId : undefined;
      const hasMore = events.length === limit;
      
      return {
        events,
        nextEventId,
        hasMore
      };
      
    } catch (error) {
      this.logger.error('获取事件流失败', LogContext.BUSINESS, {
        fromEventId,
        limit,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async deleteEvents(aggregateId: string): Promise<void> {
    try {
      await this.database.query(
        'DELETE FROM event_store WHERE aggregate_id = $1',
        [aggregateId]
      );
      
      this.logger.info('事件删除成功', LogContext.BUSINESS, {
        aggregateId
      });
      
    } catch (error) {
      this.logger.error('事件删除失败', LogContext.BUSINESS, {
        aggregateId,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  private async getCurrentVersion(aggregateId: string): Promise<number> {
    const result = await this.database.query(
      'SELECT MAX(version) as version FROM event_store WHERE aggregate_id = $1',
      [aggregateId]
    );
    
    return result.rows[0]?.version || 0;
  }
  
  private deserializeEvent(row: any): BaseDomainEvent {
    const eventData = JSON.parse(row.event_data);
    return Object.assign(Object.create(BaseDomainEvent.prototype), eventData);
  }
}

/**
 * 并发错误
 * 
 * 当事件版本不匹配时抛出此异常。
 */
export class ConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConcurrencyError';
  }
}
```

### 1.5 Saga 模式基础设施

```typescript
/**
 * Saga 步骤接口
 * 
 * 定义 Saga 流程中的单个步骤。
 */
export interface ISagaStep {
  readonly stepId: string;
  readonly stepName: string;
  readonly compensationAction?: string;
  
  /**
   * 执行步骤
   */
  execute(context: SagaContext): Promise<SagaStepResult>;
  
  /**
   * 补偿操作
   */
  compensate(context: SagaContext): Promise<void>;
}

/**
 * Saga 步骤结果
 */
export interface SagaStepResult {
  success: boolean;
  data?: any;
  error?: Error;
  nextStepId?: string;
}

/**
 * Saga 上下文
 * 
 * 在 Saga 流程中传递的上下文信息。
 */
export class SagaContext {
  constructor(
    public readonly sagaId: string,
    public readonly correlationId: string,
    public readonly tenantId: string,
    public readonly data: Record<string, any> = {},
    public readonly metadata: Record<string, any> = {}
  ) {}
  
  /**
   * 设置数据
   */
  setData(key: string, value: any): void {
    this.data[key] = value;
  }
  
  /**
   * 获取数据
   */
  getData<T>(key: string): T | undefined {
    return this.data[key] as T;
  }
  
  /**
   * 设置元数据
   */
  setMetadata(key: string, value: any): void {
    this.metadata[key] = value;
  }
  
  /**
   * 获取元数据
   */
  getMetadata<T>(key: string): T | undefined {
    return this.metadata[key] as T;
  }
}

/**
 * Saga 管理器接口
 * 
 * 管理 Saga 流程的执行和补偿。
 */
export interface ISagaManager {
  /**
   * 开始 Saga 流程
   */
  startSaga(sagaDefinition: SagaDefinition, context: SagaContext): Promise<string>;
  
  /**
   * 执行下一步
   */
  executeNextStep(sagaId: string): Promise<SagaStepResult>;
  
  /**
   * 补偿 Saga 流程
   */
  compensateSaga(sagaId: string): Promise<void>;
  
  /**
   * 获取 Saga 状态
   */
  getSagaStatus(sagaId: string): Promise<SagaStatus>;
}

/**
 * Saga 定义
 */
export interface SagaDefinition {
  readonly sagaId: string;
  readonly sagaName: string;
  readonly steps: ISagaStep[];
  readonly timeout?: number;
  readonly retryPolicy?: RetryPolicy;
}

/**
 * Saga 状态
 */
export enum SagaStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated'
}

/**
 * 重试策略
 */
export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
}

/**
 * Saga 管理器实现
 * 
 * 基于事件驱动的 Saga 管理器，支持分布式事务处理。
 */
@Injectable()
export class SagaManager implements ISagaManager {
  constructor(
    private eventStore: IEventStore,
    private eventBus: IEventBus,
    private logger: PinoLoggerService,
    private database: DatabaseService
  ) {}
  
  async startSaga(sagaDefinition: SagaDefinition, context: SagaContext): Promise<string> {
    const sagaId = EntityId.generate().toString();
    
    try {
      // 保存 Saga 状态
      await this.saveSagaState(sagaId, {
        sagaId,
        definition: sagaDefinition,
        context,
        status: SagaStatus.PENDING,
        currentStepIndex: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // 发布 Saga 开始事件
      await this.eventBus.publish(new SagaStartedEvent(
        sagaId,
        sagaDefinition.sagaId,
        context
      ));
      
      // 开始执行第一步
      await this.executeNextStep(sagaId);
      
      this.logger.info('Saga 流程开始', LogContext.BUSINESS, {
        sagaId,
        sagaName: sagaDefinition.sagaName,
        correlationId: context.correlationId,
        tenantId: context.tenantId
      });
      
      return sagaId;
      
    } catch (error) {
      this.logger.error('Saga 流程开始失败', LogContext.BUSINESS, {
        sagaId,
        sagaName: sagaDefinition.sagaName,
        correlationId: context.correlationId,
        tenantId: context.tenantId,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async executeNextStep(sagaId: string): Promise<SagaStepResult> {
    try {
      const sagaState = await this.getSagaState(sagaId);
      if (!sagaState) {
        throw new Error(`Saga ${sagaId} not found`);
      }
      
      const { definition, context, currentStepIndex } = sagaState;
      
      if (currentStepIndex >= definition.steps.length) {
        // Saga 完成
        await this.completeSaga(sagaId);
        return { success: true };
      }
      
      const step = definition.steps[currentStepIndex];
      
      // 更新状态为运行中
      await this.updateSagaStatus(sagaId, SagaStatus.RUNNING);
      
      // 执行步骤
      const result = await step.execute(context);
      
      if (result.success) {
        // 步骤成功，继续下一步
        await this.updateSagaStepIndex(sagaId, currentStepIndex + 1);
        
        // 发布步骤完成事件
        await this.eventBus.publish(new SagaStepCompletedEvent(
          sagaId,
          step.stepId,
          result.data
        ));
        
        // 执行下一步
        if (result.nextStepId) {
          const nextStepIndex = definition.steps.findIndex(s => s.stepId === result.nextStepId);
          if (nextStepIndex !== -1) {
            await this.updateSagaStepIndex(sagaId, nextStepIndex);
          }
        }
        
        return await this.executeNextStep(sagaId);
        
      } else {
        // 步骤失败，开始补偿
        await this.compensateSaga(sagaId);
        return result;
      }
      
    } catch (error) {
      this.logger.error('Saga 步骤执行失败', LogContext.BUSINESS, {
        sagaId,
        error: error.message
      }, error);
      
      // 开始补偿
      await this.compensateSaga(sagaId);
      
      return {
        success: false,
        error
      };
    }
  }
  
  async compensateSaga(sagaId: string): Promise<void> {
    try {
      const sagaState = await this.getSagaState(sagaId);
      if (!sagaState) {
        throw new Error(`Saga ${sagaId} not found`);
      }
      
      const { definition, context, currentStepIndex } = sagaState;
      
      // 更新状态为补偿中
      await this.updateSagaStatus(sagaId, SagaStatus.COMPENSATING);
      
      // 从当前步骤开始向前补偿
      for (let i = currentStepIndex - 1; i >= 0; i--) {
        const step = definition.steps[i];
        
        if (step.compensationAction) {
          try {
            await step.compensate(context);
            
            this.logger.info('Saga 步骤补偿成功', LogContext.BUSINESS, {
              sagaId,
              stepId: step.stepId,
              stepName: step.stepName
            });
            
          } catch (compensationError) {
            this.logger.error('Saga 步骤补偿失败', LogContext.BUSINESS, {
              sagaId,
              stepId: step.stepId,
              stepName: step.stepName,
              error: compensationError.message
            }, compensationError);
            
            // 补偿失败，记录但继续
          }
        }
      }
      
      // 更新状态为已补偿
      await this.updateSagaStatus(sagaId, SagaStatus.COMPENSATED);
      
      // 发布 Saga 补偿完成事件
      await this.eventBus.publish(new SagaCompensatedEvent(sagaId, context));
      
      this.logger.info('Saga 流程补偿完成', LogContext.BUSINESS, {
        sagaId,
        sagaName: definition.sagaName
      });
      
    } catch (error) {
      this.logger.error('Saga 流程补偿失败', LogContext.BUSINESS, {
        sagaId,
        error: error.message
      }, error);
      
      await this.updateSagaStatus(sagaId, SagaStatus.FAILED);
      throw error;
    }
  }
  
  async getSagaStatus(sagaId: string): Promise<SagaStatus> {
    const sagaState = await this.getSagaState(sagaId);
    return sagaState?.status || SagaStatus.FAILED;
  }
  
  private async saveSagaState(sagaId: string, state: any): Promise<void> {
    await this.database.query(
      `INSERT INTO saga_state (saga_id, state_data, created_at, updated_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (saga_id) DO UPDATE SET
       state_data = $2, updated_at = $4`,
      [sagaId, JSON.stringify(state), state.createdAt, state.updatedAt]
    );
  }
  
  private async getSagaState(sagaId: string): Promise<any> {
    const result = await this.database.query(
      'SELECT state_data FROM saga_state WHERE saga_id = $1',
      [sagaId]
    );
    
    return result.rows[0]?.state_data ? JSON.parse(result.rows[0].state_data) : null;
  }
  
  private async updateSagaStatus(sagaId: string, status: SagaStatus): Promise<void> {
    await this.database.query(
      'UPDATE saga_state SET state_data = jsonb_set(state_data, \'{status}\', $2), updated_at = $3 WHERE saga_id = $1',
      [sagaId, JSON.stringify(status), new Date()]
    );
  }
  
  private async updateSagaStepIndex(sagaId: string, stepIndex: number): Promise<void> {
    await this.database.query(
      'UPDATE saga_state SET state_data = jsonb_set(state_data, \'{currentStepIndex}\', $2), updated_at = $3 WHERE saga_id = $1',
      [sagaId, stepIndex, new Date()]
    );
  }
  
  private async completeSaga(sagaId: string): Promise<void> {
    await this.updateSagaStatus(sagaId, SagaStatus.COMPLETED);
    
    const sagaState = await this.getSagaState(sagaId);
    if (sagaState) {
      await this.eventBus.publish(new SagaCompletedEvent(
        sagaId,
        sagaState.definition.sagaId,
        sagaState.context
      ));
    }
  }
}

/**
 * Saga 事件
 */
export class SagaStartedEvent extends BaseDomainEvent {
  constructor(
    public readonly sagaId: string,
    public readonly sagaDefinitionId: string,
    public readonly context: SagaContext
  ) {
    super(sagaId, 'SagaStarted');
  }
}

export class SagaStepCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly sagaId: string,
    public readonly stepId: string,
    public readonly data: any
  ) {
    super(sagaId, 'SagaStepCompleted');
  }
}

export class SagaCompensatedEvent extends BaseDomainEvent {
  constructor(
    public readonly sagaId: string,
    public readonly context: SagaContext
  ) {
    super(sagaId, 'SagaCompensated');
  }
}

export class SagaCompletedEvent extends BaseDomainEvent {
  constructor(
    public readonly sagaId: string,
    public readonly sagaDefinitionId: string,
    public readonly context: SagaContext
  ) {
    super(sagaId, 'SagaCompleted');
  }
}
```

### 1.6 消息队列集成

```typescript
/**
 * 消息队列接口
 * 
 * 提供异步消息处理能力，支持任务队列和事件发布。
 */
export interface IMessageQueue {
  /**
   * 发布消息
   */
  publish(queueName: string, message: any, options?: MessageOptions): Promise<void>;
  
  /**
   * 订阅消息
   */
  subscribe(queueName: string, handler: MessageHandler, options?: SubscribeOptions): Promise<void>;
  
  /**
   * 添加延迟任务
   */
  schedule(queueName: string, message: any, delay: number, options?: MessageOptions): Promise<void>;
  
  /**
   * 添加重复任务
   */
  scheduleRecurring(queueName: string, message: any, cron: string, options?: MessageOptions): Promise<void>;
  
  /**
   * 获取队列统计
   */
  getQueueStats(queueName: string): Promise<QueueStats>;
}

/**
 * 消息选项
 */
export interface MessageOptions {
  priority?: number;
  attempts?: number;
  backoff?: BackoffOptions;
  removeOnComplete?: number;
  removeOnFail?: number;
}

/**
 * 退避选项
 */
export interface BackoffOptions {
  type: 'fixed' | 'exponential';
  delay: number;
}

/**
 * 订阅选项
 */
export interface SubscribeOptions {
  concurrency?: number;
  removeOnComplete?: number;
  removeOnFail?: number;
}

/**
 * 消息处理器
 */
export type MessageHandler = (message: any) => Promise<void>;

/**
 * 队列统计
 */
export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

/**
 * Bull 消息队列实现
 * 
 * 基于 Bull 实现的消息队列，支持 Redis 后端。
 */
@Injectable()
export class BullMessageQueue implements IMessageQueue {
  private queues: Map<string, Queue> = new Map();
  
  constructor(
    private config: ConfigService,
    private logger: PinoLoggerService
  ) {}
  
  async publish(queueName: string, message: any, options?: MessageOptions): Promise<void> {
    try {
      const queue = await this.getQueue(queueName);
      
      const jobOptions: JobOptions = {
        priority: options?.priority || 0,
        attempts: options?.attempts || 3,
        backoff: options?.backoff ? {
          type: options.backoff.type,
          delay: options.backoff.delay
        } : undefined,
        removeOnComplete: options?.removeOnComplete || 100,
        removeOnFail: options?.removeOnFail || 50
      };
      
      await queue.add(message, jobOptions);
      
      this.logger.debug('消息发布成功', LogContext.BUSINESS, {
        queueName,
        messageId: message.id || 'unknown',
        priority: jobOptions.priority
      });
      
    } catch (error) {
      this.logger.error('消息发布失败', LogContext.BUSINESS, {
        queueName,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async subscribe(queueName: string, handler: MessageHandler, options?: SubscribeOptions): Promise<void> {
    try {
      const queue = await this.getQueue(queueName);
      
      const concurrency = options?.concurrency || 1;
      
      queue.process(concurrency, async (job) => {
        try {
          await handler(job.data);
          
          this.logger.debug('消息处理成功', LogContext.BUSINESS, {
            queueName,
            jobId: job.id,
            attempts: job.attemptsMade
          });
          
        } catch (error) {
          this.logger.error('消息处理失败', LogContext.BUSINESS, {
            queueName,
            jobId: job.id,
            attempts: job.attemptsMade,
            error: error.message
          }, error);
          
          throw error;
        }
      });
      
      this.logger.info('消息订阅成功', LogContext.BUSINESS, {
        queueName,
        concurrency
      });
      
    } catch (error) {
      this.logger.error('消息订阅失败', LogContext.BUSINESS, {
        queueName,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async schedule(queueName: string, message: any, delay: number, options?: MessageOptions): Promise<void> {
    try {
      const queue = await this.getQueue(queueName);
      
      const jobOptions: JobOptions = {
        delay,
        priority: options?.priority || 0,
        attempts: options?.attempts || 3,
        removeOnComplete: options?.removeOnComplete || 100,
        removeOnFail: options?.removeOnFail || 50
      };
      
      await queue.add(message, jobOptions);
      
      this.logger.debug('延迟任务添加成功', LogContext.BUSINESS, {
        queueName,
        delay,
        messageId: message.id || 'unknown'
      });
      
    } catch (error) {
      this.logger.error('延迟任务添加失败', LogContext.BUSINESS, {
        queueName,
        delay,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async scheduleRecurring(queueName: string, message: any, cron: string, options?: MessageOptions): Promise<void> {
    try {
      const queue = await this.getQueue(queueName);
      
      const jobOptions: JobOptions = {
        repeat: { cron },
        priority: options?.priority || 0,
        attempts: options?.attempts || 3,
        removeOnComplete: options?.removeOnComplete || 100,
        removeOnFail: options?.removeOnFail || 50
      };
      
      await queue.add(message, jobOptions);
      
      this.logger.debug('重复任务添加成功', LogContext.BUSINESS, {
        queueName,
        cron,
        messageId: message.id || 'unknown'
      });
      
    } catch (error) {
      this.logger.error('重复任务添加失败', LogContext.BUSINESS, {
        queueName,
        cron,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async getQueueStats(queueName: string): Promise<QueueStats> {
    try {
      const queue = await this.getQueue(queueName);
      
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaiting(),
        queue.getActive(),
        queue.getCompleted(),
        queue.getFailed(),
        queue.getDelayed()
      ]);
      
      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length
      };
      
    } catch (error) {
      this.logger.error('获取队列统计失败', LogContext.BUSINESS, {
        queueName,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  private async getQueue(queueName: string): Promise<Queue> {
    if (!this.queues.has(queueName)) {
      const redisConfig = this.config.getRedisConfig();
      
      const queue = new Queue(queueName, {
        redis: {
          host: redisConfig.host,
          port: redisConfig.port,
          password: redisConfig.password,
          db: redisConfig.db
        }
      });
      
      this.queues.set(queueName, queue);
    }
    
    return this.queues.get(queueName)!;
  }
}

/**
 * 消息队列装饰器
 * 
 * 简化消息队列的使用。
 */
export function QueueHandler(queueName: string, options?: SubscribeOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const messageQueue = this.messageQueue as IMessageQueue;
      
      // 订阅队列
      await messageQueue.subscribe(queueName, async (message) => {
        await originalMethod.apply(this, [message, ...args]);
      }, options);
    };
  };
}

export function QueuePublisher(queueName: string, options?: MessageOptions) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const messageQueue = this.messageQueue as IMessageQueue;
      const result = await originalMethod.apply(this, args);
      
      // 发布消息
      await messageQueue.publish(queueName, result, options);
      
      return result;
    };
  };
}
```

### 2. 多租户支持层 (Multi-Tenant Support)

#### 2.1 租户上下文管理

```typescript
// 租户上下文
export class TenantContext {
  constructor(
    public readonly tenantId: string,
    public readonly tenantType: TenantType,
    public readonly isolationStrategy: IsolationStrategy
  ) {}
  
  static fromRequest(request: any): TenantContext {
    const tenantId = request.headers['x-tenant-id'];
    const tenantType = request.headers['x-tenant-type'];
    const isolationStrategy = request.headers['x-isolation-strategy'];
    
    return new TenantContext(tenantId, tenantType, isolationStrategy);
  }
}

// 租户上下文装饰器
export function TenantContext() {
  return function (target: any, propertyKey: string, parameterIndex: number) {
    // 依赖注入配置
  };
}

// 租户隔离中间件
@Injectable()
export class TenantIsolationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantContext = TenantContext.fromRequest(req);
    req['tenantContext'] = tenantContext;
    next();
  }
}
```

#### 2.2 多层级数据隔离系统

```typescript
/**
 * 数据隔离层级枚举
 * 
 * 定义多层级数据隔离的层级结构，从高到低依次为：
 * 租户 -> 组织 -> 部门 -> 个人
 */
export enum IsolationLevel {
  TENANT = 'tenant',           // 租户级别隔离
  ORGANIZATION = 'organization', // 组织级别隔离
  DEPARTMENT = 'department',   // 部门级别隔离
  PERSONAL = 'personal',       // 个人级别隔离
  PUBLIC = 'public'           // 公共级别（无隔离）
}

/**
 * 数据敏感度枚举
 * 
 * 定义数据的不同敏感度级别，用于智能选择隔离策略。
 */
export enum DataSensitivity {
  PUBLIC = 'public',           // 公开数据
  INTERNAL = 'internal',       // 内部数据
  CONFIDENTIAL = 'confidential', // 机密数据
  RESTRICTED = 'restricted'    // 受限数据
}

/**
 * 数据隔离上下文
 * 
 * 包含完整的多层级隔离信息，支持智能感知和动态隔离策略。
 * 
 * @description 数据隔离上下文是智能隔离系统的核心，包含所有层级的隔离信息
 * 和智能感知能力，能够根据业务场景自动选择最适合的隔离策略。
 * 
 * ## 业务规则
 * 
 * ### 层级优先级规则
 * - 租户隔离具有最高优先级，所有数据必须属于某个租户
 * - 组织隔离在租户内部生效，支持多组织架构
 * - 部门隔离在组织内部生效，支持多部门架构
 * - 个人隔离在部门内部生效，保护个人隐私数据
 * 
 * ### 智能感知规则
 * - 根据数据敏感度自动选择隔离层级
 * - 根据用户权限动态调整隔离范围
 * - 根据业务场景智能选择隔离策略
 * - 支持跨层级的数据访问控制
 * 
 * @example
 * ```typescript
 * // 创建多层级隔离上下文
 * const isolationContext = new DataIsolationContext({
 *   tenantId: 'tenant-123',
 *   organizationId: 'org-456',
 *   departmentId: 'dept-789',
 *   userId: 'user-001',
 *   isolationLevel: IsolationLevel.DEPARTMENT,
 *   dataSensitivity: DataSensitivity.INTERNAL,
 *   accessPermissions: ['read', 'write']
 * });
 * 
 * // 智能感知隔离策略
 * const strategy = isolationContext.getOptimalIsolationStrategy();
 * ```
 */
export class DataIsolationContext {
  constructor(
    public readonly tenantId: EntityId,
    public readonly organizationId?: EntityId,
    public readonly departmentId?: EntityId,
    public readonly userId?: EntityId,
    public readonly isolationLevel: IsolationLevel = IsolationLevel.TENANT,
    public readonly dataSensitivity: DataSensitivity = DataSensitivity.INTERNAL,
    public readonly accessPermissions: string[] = [],
    public readonly customAttributes: Record<string, any> = {}
  ) {}
  
  /**
   * 获取最优隔离策略
   * 
   * 根据当前上下文智能选择最适合的隔离策略。
   * 
   * @returns 最优的隔离策略
   */
  getOptimalIsolationStrategy(): IIsolationStrategy {
    // 根据数据敏感度选择策略
    if (this.dataSensitivity === DataSensitivity.CONFIDENTIAL) {
      return new RowLevelSecurityStrategy(this);
    }
    
    // 根据隔离层级选择策略
    switch (this.isolationLevel) {
      case IsolationLevel.TENANT:
        return new TenantIsolationStrategy(this);
      case IsolationLevel.ORGANIZATION:
        return new OrganizationIsolationStrategy(this);
      case IsolationLevel.DEPARTMENT:
        return new DepartmentIsolationStrategy(this);
      case IsolationLevel.PERSONAL:
        return new PersonalIsolationStrategy(this);
      default:
        return new SharedIsolationStrategy(this);
    }
  }
  
  /**
   * 检查是否包含指定层级
   * 
   * @param level - 隔离层级
   * @returns 是否包含该层级
   */
  hasLevel(level: IsolationLevel): boolean {
    switch (level) {
      case IsolationLevel.TENANT:
        return !!this.tenantId;
      case IsolationLevel.ORGANIZATION:
        return !!this.organizationId;
      case IsolationLevel.DEPARTMENT:
        return !!this.departmentId;
      case IsolationLevel.PERSONAL:
        return !!this.userId;
      default:
        return true;
    }
  }
  
  /**
   * 获取隔离路径
   * 
   * 返回完整的隔离路径，用于数据查询和权限验证。
   * 
   * @returns 隔离路径数组
   */
  getIsolationPath(): string[] {
    const path: string[] = [];
    
    if (this.tenantId) {
      path.push(`tenant:${this.tenantId.toString()}`);
    }
    
    if (this.organizationId) {
      path.push(`org:${this.organizationId.toString()}`);
    }
    
    if (this.departmentId) {
      path.push(`dept:${this.departmentId.toString()}`);
    }
    
    if (this.userId) {
      path.push(`user:${this.userId.toString()}`);
    }
    
    return path;
  }
  
  /**
   * 创建子级隔离上下文
   * 
   * 基于当前上下文创建更细粒度的隔离上下文。
   * 
   * @param level - 目标隔离层级
   * @param additionalContext - 额外的上下文信息
   * @returns 新的隔离上下文
   */
  createSubContext(
    level: IsolationLevel,
    additionalContext: Partial<DataIsolationContext> = {}
  ): DataIsolationContext {
    return new DataIsolationContext(
      this.tenantId,
      level === IsolationLevel.ORGANIZATION ? additionalContext.organizationId : this.organizationId,
      level === IsolationLevel.DEPARTMENT ? additionalContext.departmentId : this.departmentId,
      level === IsolationLevel.PERSONAL ? additionalContext.userId : this.userId,
      level,
      additionalContext.dataSensitivity || this.dataSensitivity,
      additionalContext.accessPermissions || this.accessPermissions,
      { ...this.customAttributes, ...additionalContext.customAttributes }
    );
  }
}

/**
 * 智能隔离策略接口
 * 
 * 定义智能隔离策略的通用接口，支持多层级数据隔离。
 */
export interface IIsolationStrategy {
  /**
   * 获取隔离策略名称
   */
  readonly name: string;
  
  /**
   * 获取隔离上下文
   */
  readonly context: DataIsolationContext;
  
  /**
   * 应用数据隔离
   * 
   * @param query - 数据库查询对象
   * @returns 应用隔离后的查询对象
   */
  applyIsolation(query: any): any;
  
  /**
   * 验证数据访问权限
   * 
   * @param dataContext - 数据上下文
   * @param userContext - 用户上下文
   * @returns 是否有访问权限
   */
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean;
  
  /**
   * 获取隔离条件
   * 
   * @returns 隔离条件对象
   */
  getIsolationConditions(): Record<string, any>;
  
  /**
   * 检查是否需要跨层级访问
   * 
   * @param targetContext - 目标上下文
   * @returns 是否需要跨层级访问
   */
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean;
}

/**
 * 租户隔离策略
 * 
 * 实现租户级别的数据隔离，确保不同租户的数据完全隔离。
 */
export class TenantIsolationStrategy implements IIsolationStrategy {
  readonly name = 'tenant_isolation';
  
  constructor(public readonly context: DataIsolationContext) {}
  
  applyIsolation(query: any): any {
    return query.where('tenant_id', this.context.tenantId.toString());
  }
  
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    return dataContext.tenantId.equals(userContext.tenantId);
  }
  
  getIsolationConditions(): Record<string, any> {
    return {
      tenant_id: this.context.tenantId.toString()
    };
  }
  
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean {
    return !this.context.tenantId.equals(targetContext.tenantId);
  }
}

/**
 * 组织隔离策略
 * 
 * 实现组织级别的数据隔离，在租户内部按组织隔离数据。
 */
export class OrganizationIsolationStrategy implements IIsolationStrategy {
  readonly name = 'organization_isolation';
  
  constructor(public readonly context: DataIsolationContext) {}
  
  applyIsolation(query: any): any {
    return query
      .where('tenant_id', this.context.tenantId.toString())
      .where('organization_id', this.context.organizationId?.toString());
  }
  
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    // 必须属于同一租户
    if (!dataContext.tenantId.equals(userContext.tenantId)) {
      return false;
    }
    
    // 检查组织权限
    if (dataContext.organizationId && userContext.organizationId) {
      return dataContext.organizationId.equals(userContext.organizationId);
    }
    
    return true;
  }
  
  getIsolationConditions(): Record<string, any> {
    return {
      tenant_id: this.context.tenantId.toString(),
      organization_id: this.context.organizationId?.toString()
    };
  }
  
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean {
    return !this.context.tenantId.equals(targetContext.tenantId) ||
           (this.context.organizationId && targetContext.organizationId && 
            !this.context.organizationId.equals(targetContext.organizationId));
  }
}

/**
 * 部门隔离策略
 * 
 * 实现部门级别的数据隔离，在组织内部按部门隔离数据。
 */
export class DepartmentIsolationStrategy implements IIsolationStrategy {
  readonly name = 'department_isolation';
  
  constructor(public readonly context: DataIsolationContext) {}
  
  applyIsolation(query: any): any {
    return query
      .where('tenant_id', this.context.tenantId.toString())
      .where('organization_id', this.context.organizationId?.toString())
      .where('department_id', this.context.departmentId?.toString());
  }
  
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    // 必须属于同一租户
    if (!dataContext.tenantId.equals(userContext.tenantId)) {
      return false;
    }
    
    // 检查组织权限
    if (dataContext.organizationId && userContext.organizationId) {
      if (!dataContext.organizationId.equals(userContext.organizationId)) {
        return false;
      }
    }
    
    // 检查部门权限
    if (dataContext.departmentId && userContext.departmentId) {
      return dataContext.departmentId.equals(userContext.departmentId);
    }
    
    return true;
  }
  
  getIsolationConditions(): Record<string, any> {
    return {
      tenant_id: this.context.tenantId.toString(),
      organization_id: this.context.organizationId?.toString(),
      department_id: this.context.departmentId?.toString()
    };
  }
  
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean {
    return !this.context.tenantId.equals(targetContext.tenantId) ||
           (this.context.organizationId && targetContext.organizationId && 
            !this.context.organizationId.equals(targetContext.organizationId)) ||
           (this.context.departmentId && targetContext.departmentId && 
            !this.context.departmentId.equals(targetContext.departmentId));
  }
}

/**
 * 个人隔离策略
 * 
 * 实现个人级别的数据隔离，保护个人隐私数据。
 */
export class PersonalIsolationStrategy implements IIsolationStrategy {
  readonly name = 'personal_isolation';
  
  constructor(public readonly context: DataIsolationContext) {}
  
  applyIsolation(query: any): any {
    return query
      .where('tenant_id', this.context.tenantId.toString())
      .where('organization_id', this.context.organizationId?.toString())
      .where('department_id', this.context.departmentId?.toString())
      .where('user_id', this.context.userId?.toString());
  }
  
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    // 必须属于同一租户
    if (!dataContext.tenantId.equals(userContext.tenantId)) {
      return false;
    }
    
    // 检查组织权限
    if (dataContext.organizationId && userContext.organizationId) {
      if (!dataContext.organizationId.equals(userContext.organizationId)) {
        return false;
      }
    }
    
    // 检查部门权限
    if (dataContext.departmentId && userContext.departmentId) {
      if (!dataContext.departmentId.equals(userContext.departmentId)) {
        return false;
      }
    }
    
    // 检查个人权限
    if (dataContext.userId && userContext.userId) {
      return dataContext.userId.equals(userContext.userId);
    }
    
    return true;
  }
  
  getIsolationConditions(): Record<string, any> {
    return {
      tenant_id: this.context.tenantId.toString(),
      organization_id: this.context.organizationId?.toString(),
      department_id: this.context.departmentId?.toString(),
      user_id: this.context.userId?.toString()
    };
  }
  
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean {
    return !this.context.tenantId.equals(targetContext.tenantId) ||
           (this.context.organizationId && targetContext.organizationId && 
            !this.context.organizationId.equals(targetContext.organizationId)) ||
           (this.context.departmentId && targetContext.departmentId && 
            !this.context.departmentId.equals(targetContext.departmentId)) ||
           (this.context.userId && targetContext.userId && 
            !this.context.userId.equals(targetContext.userId));
  }
}

/**
 * 智能隔离策略工厂
 * 
 * 根据上下文智能选择最适合的隔离策略。
 */
export class SmartIsolationStrategyFactory {
  /**
   * 创建智能隔离策略
   * 
   * @param context - 数据隔离上下文
   * @returns 智能隔离策略
   */
  static create(context: DataIsolationContext): IIsolationStrategy {
    // 根据数据敏感度选择策略
    if (context.dataSensitivity === DataSensitivity.CONFIDENTIAL || 
        context.dataSensitivity === DataSensitivity.RESTRICTED) {
      return new RowLevelSecurityStrategy(context);
    }
    
    // 根据隔离层级选择策略
    switch (context.isolationLevel) {
      case IsolationLevel.TENANT:
        return new TenantIsolationStrategy(context);
      case IsolationLevel.ORGANIZATION:
        return new OrganizationIsolationStrategy(context);
      case IsolationLevel.DEPARTMENT:
        return new DepartmentIsolationStrategy(context);
      case IsolationLevel.PERSONAL:
        return new PersonalIsolationStrategy(context);
      default:
        return new SharedIsolationStrategy(context);
    }
  }
  
  /**
   * 创建多层级隔离策略
   * 
   * 支持同时应用多个层级的隔离策略。
   * 
   * @param contexts - 多个隔离上下文
   * @returns 组合隔离策略
   */
  static createMultiLevel(contexts: DataIsolationContext[]): IIsolationStrategy {
    return new MultiLevelIsolationStrategy(contexts);
  }
}

/**
 * 行级安全隔离策略
 * 
 * 实现基于行级安全的数据隔离，适用于高敏感度数据。
 */
export class RowLevelSecurityStrategy implements IIsolationStrategy {
  readonly name = 'row_level_security';
  
  constructor(public readonly context: DataIsolationContext) {}
  
  applyIsolation(query: any): any {
    // 应用行级安全策略
    const conditions = this.getIsolationConditions();
    
    Object.entries(conditions).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.where(key, value);
      }
    });
    
    return query;
  }
  
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    // 行级安全需要更严格的权限验证
    return this.validateStrictAccess(dataContext, userContext);
  }
  
  getIsolationConditions(): Record<string, any> {
    return {
      tenant_id: this.context.tenantId.toString(),
      organization_id: this.context.organizationId?.toString(),
      department_id: this.context.departmentId?.toString(),
      user_id: this.context.userId?.toString(),
      data_sensitivity: this.context.dataSensitivity
    };
  }
  
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean {
    // 行级安全策略不允许跨层级访问
    return false;
  }
  
  private validateStrictAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    // 实现严格的权限验证逻辑
    if (!dataContext.tenantId.equals(userContext.tenantId)) {
      return false;
    }
    
    // 检查用户是否有跨层级访问权限
    if (this.requiresCrossLevelAccess(dataContext)) {
      return userContext.accessPermissions.includes('cross_level_access');
    }
    
    return true;
  }
}

/**
 * 多层级隔离策略
 * 
 * 支持同时应用多个层级的隔离策略，实现复杂的隔离需求。
 */
export class MultiLevelIsolationStrategy implements IIsolationStrategy {
  readonly name = 'multi_level_isolation';
  
  constructor(
    public readonly contexts: DataIsolationContext[],
    public readonly context: DataIsolationContext = contexts[0]
  ) {}
  
  applyIsolation(query: any): any {
    // 应用所有层级的隔离条件
    this.contexts.forEach(ctx => {
      const strategy = SmartIsolationStrategyFactory.create(ctx);
      query = strategy.applyIsolation(query);
    });
    
    return query;
  }
  
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    // 所有层级都必须通过验证
    return this.contexts.every(ctx => {
      const strategy = SmartIsolationStrategyFactory.create(ctx);
      return strategy.validateAccess(dataContext, userContext);
    });
  }
  
  getIsolationConditions(): Record<string, any> {
    const conditions: Record<string, any> = {};
    
    this.contexts.forEach(ctx => {
      const strategy = SmartIsolationStrategyFactory.create(ctx);
      const ctxConditions = strategy.getIsolationConditions();
      Object.assign(conditions, ctxConditions);
    });
    
    return conditions;
  }
  
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean {
    // 检查是否有任何层级需要跨层级访问
    return this.contexts.some(ctx => {
      const strategy = SmartIsolationStrategyFactory.create(ctx);
      return strategy.requiresCrossLevelAccess(targetContext);
    });
  }
}

/**
 * 共享隔离策略
 * 
 * 实现共享数据访问，适用于公共数据。
 */
export class SharedIsolationStrategy implements IIsolationStrategy {
  readonly name = 'shared_isolation';
  
  constructor(public readonly context: DataIsolationContext) {}
  
  applyIsolation(query: any): any {
    // 共享数据不需要隔离
    return query;
  }
  
  validateAccess(dataContext: DataIsolationContext, userContext: DataIsolationContext): boolean {
    // 共享数据允许所有用户访问
    return true;
  }
  
  getIsolationConditions(): Record<string, any> {
    return {};
  }
  
  requiresCrossLevelAccess(targetContext: DataIsolationContext): boolean {
    return false;
  }
}
```

### 3. 数据访问层 (Data Access Layer)

#### 3.1 基础仓储接口

```typescript
// 基础仓储接口
export interface IBaseRepository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
  save(entity: TEntity): Promise<TEntity>;
  delete(id: TId): Promise<void>;
  exists(id: TId): Promise<boolean>;
}

// 分页查询接口
export interface IPaginatedRepository<TEntity, TId> extends IBaseRepository<TEntity, TId> {
  findPaginated(
    criteria: QueryCriteria,
    pagination: PaginationOptions
  ): Promise<PaginatedResult<TEntity>>;
}

// 事件存储接口
export interface IEventStore {
  saveEvents(aggregateId: string, events: BaseDomainEvent[], expectedVersion: number): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<BaseDomainEvent[]>;
  getEventsByType(eventType: string, fromDate?: Date): Promise<BaseDomainEvent[]>;
}
```

#### 3.2 工作单元模式

```typescript
// 工作单元接口
export interface IUnitOfWork {
  begin(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
  isActive(): boolean;
}

// 工作单元实现
@Injectable()
export class UnitOfWork implements IUnitOfWork {
  private _isActive = false;
  
  async begin(): Promise<void> {
    this._isActive = true;
    // 开始事务
  }
  
  async commit(): Promise<void> {
    if (!this._isActive) {
      throw new Error('No active transaction');
    }
    // 提交事务
    this._isActive = false;
  }
  
  async rollback(): Promise<void> {
    if (!this._isActive) {
      throw new Error('No active transaction');
    }
    // 回滚事务
    this._isActive = false;
  }
  
  isActive(): boolean {
    return this._isActive;
  }
}
```

### 4. 缓存层 (Caching Layer)

#### 4.1 缓存抽象

```typescript
// 缓存接口
export interface ICache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// 缓存装饰器
export function Cacheable(keyGenerator?: (args: any[]) => string, ttl?: number) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const cacheKey = keyGenerator ? keyGenerator(args) : `${propertyKey}:${JSON.stringify(args)}`;
      
      // 尝试从缓存获取
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      // 执行原方法并缓存结果
      const result = await originalMethod.apply(this, args);
      await this.cache.set(cacheKey, result, ttl);
      
      return result;
    };
  };
}
```

### 5. 日志和监控层 (Logging & Monitoring)

#### 5.1 结构化日志

```typescript
// 日志级别
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

// 日志上下文
export interface LogContext {
  tenantId?: string;
  userId?: string;
  requestId?: string;
  correlationId?: string;
  [key: string]: any;
}

// 日志服务接口
export interface ILogger {
  error(message: string, context?: LogContext, error?: Error): void;
  warn(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  debug(message: string, context?: LogContext): void;
  trace(message: string, context?: LogContext): void;
}

// 日志装饰器
export function LogExecution(level: LogLevel = LogLevel.INFO) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const context = {
        method: `${target.constructor.name}.${propertyKey}`,
        args: args
      };
      
      this.logger[level](`Executing ${context.method}`, context);
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        this.logger[level](`Completed ${context.method}`, {
          ...context,
          duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.logger.error(`Failed ${context.method}`, {
          ...context,
          duration,
          success: false
        }, error);
        
        throw error;
      }
    };
  };
}
```

#### 5.2 性能监控

```typescript
// 指标收集器
export interface IMetricsCollector {
  incrementCounter(name: string, labels?: Record<string, string>): void;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void;
  setGauge(name: string, value: number, labels?: Record<string, string>): void;
}

// 性能监控装饰器
export function MonitorPerformance(metricName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      
      try {
        const result = await originalMethod.apply(this, args);
        const duration = Date.now() - startTime;
        
        this.metricsCollector.recordHistogram(metricName, duration);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.metricsCollector.recordHistogram(`${metricName}_error`, duration);
        throw error;
      }
    };
  };
}
```

### 6. 配置管理层 (Configuration Management)

#### 6.1 配置服务

```typescript
// 配置接口
export interface IConfiguration {
  get<T>(key: string, defaultValue?: T): T;
  getRequired<T>(key: string): T;
  has(key: string): boolean;
  set(key: string, value: any): void;
}

// 配置装饰器
export function ConfigValue(key: string, defaultValue?: any) {
  return function (target: any, propertyKey: string) {
    Object.defineProperty(target, propertyKey, {
      get: function() {
        return this.configuration.get(key, defaultValue);
      }
    });
  };
}
```

### 7. Fastify 集成支持

```typescript
/**
 * Fastify 适配器
 * 
 * 将 NestJS 应用适配到 Fastify 服务器。
 */
@Injectable()
export class FastifyAdapter extends NestAdapter {
  constructor(
    private config: ConfigService,
    private logger: PinoLoggerService
  ) {
    super();
  }
  
  async createServer(): Promise<FastifyInstance> {
    const fastify = Fastify({
      logger: {
        level: this.config.getLoggingConfig().level,
        transport: this.config.getLoggingConfig().format === 'json' ? undefined : {
          target: 'pino-pretty'
        }
      },
      trustProxy: true,
      bodyLimit: this.config.getConfigValue('app').bodyLimit || 1048576,
      keepAliveTimeout: this.config.getConfigValue('app').keepAliveTimeout || 5000
    });
    
    // 注册插件
    await this.registerPlugins(fastify);
    
    // 注册中间件
    await this.registerMiddleware(fastify);
    
    return fastify;
  }
  
  private async registerPlugins(fastify: FastifyInstance): Promise<void> {
    // 注册 CORS 插件
    await fastify.register(require('@fastify/cors'), {
      origin: this.config.getConfigValue('app').cors?.origin || true,
      credentials: true
    });
    
    // 注册 Helmet 插件
    await fastify.register(require('@fastify/helmet'), {
      contentSecurityPolicy: false
    });
    
    // 注册 Rate Limit 插件
    await fastify.register(require('@fastify/rate-limit'), {
      max: this.config.getConfigValue('app').rateLimit?.max || 100,
      timeWindow: this.config.getConfigValue('app').rateLimit?.timeWindow || '1 minute'
    });
    
    // 注册 Swagger 插件
    if (this.config.getConfigValue('app').swagger?.enabled) {
      await fastify.register(require('@fastify/swagger'), {
        swagger: {
          info: {
            title: 'Aiofix-AI-SaaS API',
            description: 'Aiofix-AI-SaaS Platform API Documentation',
            version: '1.0.0'
          },
          host: this.config.getConfigValue('app').swagger.host,
          schemes: ['http', 'https'],
          consumes: ['application/json'],
          produces: ['application/json']
        }
      });
      
      await fastify.register(require('@fastify/swagger-ui'), {
        routePrefix: '/docs',
        uiConfig: {
          docExpansion: 'full',
          deepLinking: false
        }
      });
    }
    
    // 注册 WebSocket 插件
    if (this.config.getConfigValue('app').websocket?.enabled) {
      await fastify.register(require('@fastify/websocket'));
    }
  }
  
  private async registerMiddleware(fastify: FastifyInstance): Promise<void> {
    // 请求 ID 中间件
    fastify.addHook('onRequest', async (request, reply) => {
      request.id = request.headers['x-request-id'] as string || EntityId.generate().toString();
      reply.header('x-request-id', request.id);
    });
    
    // 租户上下文中间件
    fastify.addHook('onRequest', async (request, reply) => {
      const tenantId = request.headers['x-tenant-id'] as string;
      if (tenantId) {
        request.tenantContext = new TenantContext(
          tenantId,
          request.headers['x-tenant-type'] as string || 'standard',
          request.headers['x-isolation-strategy'] as string || 'database-per-tenant'
        );
      }
    });
    
    // 性能监控中间件
    fastify.addHook('onRequest', async (request, reply) => {
      request.startTime = Date.now();
    });
    
    fastify.addHook('onResponse', async (request, reply) => {
      const duration = Date.now() - request.startTime;
      
      this.logger.info('HTTP 请求完成', LogContext.HTTP, {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        duration,
        requestId: request.id,
        tenantId: request.tenantContext?.tenantId
      });
    });
    
    // 错误处理中间件
    fastify.setErrorHandler(async (error, request, reply) => {
      this.logger.error('HTTP 请求错误', LogContext.HTTP, {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        requestId: request.id,
        tenantId: request.tenantContext?.tenantId,
        error: error.message
      }, error);
      
      // 根据错误类型返回适当的响应
      if (error instanceof ValidationError) {
        reply.status(400).send({
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
      } else if (error instanceof UnauthorizedError) {
        reply.status(401).send({
          error: 'Unauthorized',
          message: 'Authentication required'
        });
      } else if (error instanceof ForbiddenError) {
        reply.status(403).send({
          error: 'Forbidden',
          message: 'Insufficient permissions'
        });
      } else if (error instanceof NotFoundError) {
        reply.status(404).send({
          error: 'Not Found',
          message: 'Resource not found'
        });
      } else {
        reply.status(500).send({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred'
        });
      }
    });
  }
}

/**
 * Fastify 模块
 * 
 * 提供 Fastify 集成配置。
 */
@Module({
  providers: [
    {
      provide: 'FASTIFY_ADAPTER',
      useClass: FastifyAdapter
    }
  ],
  exports: ['FASTIFY_ADAPTER']
})
export class FastifyModule {}
```

### 8. MongoDB 支持

```typescript
/**
 * MongoDB 适配器
 * 
 * 扩展数据库适配器以支持 MongoDB。
 */
@Injectable()
export class MongoDBAdapter implements IDatabaseAdapter {
  private client: MongoClient;
  private db: Db;
  
  constructor(
    private config: ConfigService,
    private logger: PinoLoggerService
  ) {}
  
  async connect(): Promise<void> {
    try {
      const mongoConfig = this.config.getMongoConfig();
      
      this.client = new MongoClient(mongoConfig.connectionString, {
        maxPoolSize: mongoConfig.maxPoolSize || 10,
        serverSelectionTimeoutMS: mongoConfig.serverSelectionTimeoutMS || 5000,
        socketTimeoutMS: mongoConfig.socketTimeoutMS || 45000,
        bufferMaxEntries: 0,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
      await this.client.connect();
      this.db = this.client.db(mongoConfig.database);
      
      this.logger.info('MongoDB 连接成功', LogContext.INFRASTRUCTURE, {
        database: mongoConfig.database,
        host: mongoConfig.host,
        port: mongoConfig.port
      });
      
    } catch (error) {
      this.logger.error('MongoDB 连接失败', LogContext.INFRASTRUCTURE, {
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        this.logger.info('MongoDB 连接关闭', LogContext.INFRASTRUCTURE);
      }
    } catch (error) {
      this.logger.error('MongoDB 连接关闭失败', LogContext.INFRASTRUCTURE, {
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async query(collection: string, filter: any, options?: QueryOptions): Promise<any[]> {
    try {
      const coll = this.db.collection(collection);
      const cursor = coll.find(filter, options);
      
      if (options?.limit) {
        cursor.limit(options.limit);
      }
      
      if (options?.skip) {
        cursor.skip(options.skip);
      }
      
      if (options?.sort) {
        cursor.sort(options.sort);
      }
      
      return await cursor.toArray();
      
    } catch (error) {
      this.logger.error('MongoDB 查询失败', LogContext.INFRASTRUCTURE, {
        collection,
        filter,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async insert(collection: string, document: any): Promise<any> {
    try {
      const coll = this.db.collection(collection);
      const result = await coll.insertOne(document);
      
      this.logger.debug('MongoDB 插入成功', LogContext.INFRASTRUCTURE, {
        collection,
        documentId: result.insertedId
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('MongoDB 插入失败', LogContext.INFRASTRUCTURE, {
        collection,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async update(collection: string, filter: any, update: any, options?: UpdateOptions): Promise<any> {
    try {
      const coll = this.db.collection(collection);
      const result = await coll.updateMany(filter, update, options);
      
      this.logger.debug('MongoDB 更新成功', LogContext.INFRASTRUCTURE, {
        collection,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('MongoDB 更新失败', LogContext.INFRASTRUCTURE, {
        collection,
        filter,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async delete(collection: string, filter: any): Promise<any> {
    try {
      const coll = this.db.collection(collection);
      const result = await coll.deleteMany(filter);
      
      this.logger.debug('MongoDB 删除成功', LogContext.INFRASTRUCTURE, {
        collection,
        deletedCount: result.deletedCount
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('MongoDB 删除失败', LogContext.INFRASTRUCTURE, {
        collection,
        filter,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async createIndex(collection: string, indexSpec: any, options?: IndexOptions): Promise<string> {
    try {
      const coll = this.db.collection(collection);
      const result = await coll.createIndex(indexSpec, options);
      
      this.logger.debug('MongoDB 索引创建成功', LogContext.INFRASTRUCTURE, {
        collection,
        indexName: result
      });
      
      return result;
      
    } catch (error) {
      this.logger.error('MongoDB 索引创建失败', LogContext.INFRASTRUCTURE, {
        collection,
        indexSpec,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async aggregate(collection: string, pipeline: any[]): Promise<any[]> {
    try {
      const coll = this.db.collection(collection);
      const cursor = coll.aggregate(pipeline);
      
      return await cursor.toArray();
      
    } catch (error) {
      this.logger.error('MongoDB 聚合查询失败', LogContext.INFRASTRUCTURE, {
        collection,
        pipeline,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async healthCheck(): Promise<HealthStatus> {
    try {
      await this.db.admin().ping();
      
      return {
        status: 'healthy',
        details: {
          database: 'mongodb',
          connected: true,
          timestamp: new Date()
        }
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          database: 'mongodb',
          connected: false,
          error: error.message,
          timestamp: new Date()
        }
      };
    }
  }
}

/**
 * MongoDB 配置接口
 */
export interface MongoDBConfig {
  connectionString: string;
  database: string;
  host: string;
  port: number;
  username?: string;
  password?: string;
  maxPoolSize?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
}

/**
 * MongoDB 模块
 * 
 * 提供 MongoDB 集成配置。
 */
@Module({
  providers: [
    {
      provide: 'MONGODB_ADAPTER',
      useClass: MongoDBAdapter
    }
  ],
  exports: ['MONGODB_ADAPTER']
})
export class MongoDBModule {}
```

### 9. 安全层 (Security Layer)

#### 7.1 权限检查

```typescript
// 权限装饰器
export function RequirePermission(permission: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const user = this.getCurrentUser();
      const tenantContext = this.getTenantContext();
      
      if (!await this.permissionService.hasPermission(user.id, permission, tenantContext.tenantId)) {
        throw new ForbiddenException(`Permission '${permission}' required`);
      }
      
      return originalMethod.apply(this, args);
    };
  };
}

// 租户隔离检查
export function RequireTenantIsolation() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const tenantContext = this.getTenantContext();
      
      if (!tenantContext) {
        throw new UnauthorizedException('Tenant context required');
      }
      
      return originalMethod.apply(this, args);
    };
  };
}
```

## 目录结构

```text
packages/core/
├── src/
│   ├── core/                      # 核心架构层
│   │   ├── cqrs/                  # CQRS 核心
│   │   │   ├── commands/          # 命令
│   │   │   │   ├── base/          # 基础命令
│   │   │   │   │   ├── base-command.ts
│   │   │   │   │   ├── command-handler.interface.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── handlers/      # 命令处理器
│   │   │   │   └── index.ts
│   │   │   ├── queries/           # 查询
│   │   │   │   ├── base/          # 基础查询
│   │   │   │   │   ├── base-query.ts
│   │   │   │   │   ├── base-query-result.ts
│   │   │   │   │   ├── query-handler.interface.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── handlers/      # 查询处理器
│   │   │   │   └── index.ts
│   │   │   ├── events/            # 事件
│   │   │   │   ├── base/          # 基础事件
│   │   │   │   │   ├── base-domain-event.ts
│   │   │   │   │   ├── event-handler.interface.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── handlers/      # 事件处理器
│   │   │   │   └── index.ts
│   │   │   ├── sagas/             # Saga
│   │   │   │   ├── saga.interface.ts
│   │   │   │   ├── core-saga.ts
│   │   │   │   ├── core-saga-manager.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── entities/              # 实体和值对象
│   │   │   ├── base/              # 基础实体
│   │   │   │   ├── base-entity.ts
│   │   │   │   ├── base-aggregate-root.ts
│   │   │   │   ├── audit-info.ts
│   │   │   │   └── index.ts
│   │   │   ├── value-objects/     # 值对象
│   │   │   └── index.ts
│   │   ├── decorators/            # 装饰器
│   │   │   ├── command-handler.decorator.ts
│   │   │   ├── query-handler.decorator.ts
│   │   │   ├── event-handler.decorator.ts
│   │   │   ├── saga.decorator.ts
│   │   │   ├── metadata.constants.ts
│   │   │   ├── metadata.interfaces.ts
│   │   │   ├── metadata.utils.ts
│   │   │   └── index.ts
│   │   ├── interfaces/            # 接口定义
│   │   │   ├── cqrs-bus.interface.ts
│   │   │   └── index.ts
│   │   ├── context/               # 上下文管理
│   │   │   ├── async-context.interface.ts
│   │   │   ├── async-context-provider.ts
│   │   │   ├── async-context-middleware.ts
│   │   │   ├── core-async-context.ts
│   │   │   ├── core-async-context-manager.ts
│   │   │   └── index.ts
│   │   ├── error/                 # 错误处理
│   │   │   ├── error-handling.interface.ts
│   │   │   ├── core-error-bus.ts
│   │   │   ├── core-exception-filter.ts
│   │   │   ├── error-classifiers.ts
│   │   │   ├── error-handlers.ts
│   │   │   ├── error-notifiers.ts
│   │   │   ├── error-recoveries.ts
│   │   │   └── index.ts
│   │   ├── monitoring/            # 性能监控
│   │   │   ├── performance-monitor.interface.ts
│   │   │   ├── core-performance-monitor.ts
│   │   │   ├── performance-monitor.decorator.ts
│   │   │   └── index.ts
│   │   ├── testing/               # 测试支持
│   │   │   ├── testing.interface.ts
│   │   │   ├── core-testing-module.ts
│   │   │   ├── core-test-base.ts
│   │   │   ├── core-test-utils.ts
│   │   │   ├── core-test-assertion.ts
│   │   │   ├── core-test-data-factory.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── infrastructure/            # 基础设施层
│   │   ├── database/              # 数据库
│   │   │   ├── mongodb/           # MongoDB
│   │   │   │   ├── mongodb.interface.ts
│   │   │   │   ├── mongodb-adapter.ts
│   │   │   │   ├── mongodb-module.ts
│   │   │   │   ├── mongodb.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── adapters/          # 其他数据库适配器
│   │   │   └── index.ts
│   │   ├── messaging/             # 消息系统
│   │   │   ├── queues/            # 消息队列
│   │   │   │   ├── message-queue.interface.ts
│   │   │   │   ├── bull-message-queue.ts
│   │   │   │   └── index.ts
│   │   │   ├── publishers/        # 发布器
│   │   │   │   ├── publisher.interface.ts
│   │   │   │   ├── core-command-publisher.ts
│   │   │   │   ├── core-event-publisher.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── storage/               # 存储
│   │   │   ├── cache/             # 缓存
│   │   │   │   ├── services/      # 缓存服务
│   │   │   │   └── strategies/    # 缓存策略
│   │   │   ├── event-store/       # 事件存储
│   │   │   │   ├── event-store.interface.ts
│   │   │   │   ├── core-event-store.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   ├── web/                   # Web 相关
│   │   │   ├── fastify/           # Fastify
│   │   │   │   ├── fastify.interface.ts
│   │   │   │   ├── fastify-adapter.ts
│   │   │   │   ├── fastify-module.ts
│   │   │   │   ├── fastify-plugin.ts
│   │   │   │   ├── fastify-middleware.ts
│   │   │   │   └── index.ts
│   │   │   ├── middleware/        # 中间件
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── application/               # 应用层
│   │   ├── services/              # 应用服务
│   │   ├── handlers/              # 处理器
│   │   ├── explorers/             # 模块探索器
│   │   │   ├── core-explorer.service.ts
│   │   │   ├── auto-registration.service.ts
│   │   │   ├── di-integration.service.ts
│   │   │   ├── module-scanner.service.ts
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── domain/                    # 领域层
│   │   ├── multi-tenant/          # 多租户
│   │   │   ├── context/           # 租户上下文
│   │   │   ├── isolation/         # 隔离策略
│   │   │   └── strategies/        # 隔离策略实现
│   │   ├── security/              # 安全
│   │   │   ├── permissions/       # 权限管理
│   │   │   └── validation/        # 安全验证
│   │   ├── validation/            # 验证
│   │   └── index.ts
│   ├── shared/                    # 共享层
│   │   ├── utils/                 # 工具函数
│   │   │   ├── common/            # 通用工具
│   │   │   ├── constants/         # 常量定义
│   │   │   └── types/             # 类型定义
│   │   ├── constants/             # 常量
│   │   ├── types/                 # 类型定义
│   │   ├── decorators/            # 通用装饰器
│   │   ├── interceptors/          # 拦截器
│   │   ├── configuration/         # 配置
│   │   ├── adapters/              # 适配器
│   │   ├── repositories/          # 仓储
│   │   └── index.ts
│   └── index.ts                   # 导出文件
├── tests/                         # 测试
│   ├── unit/                      # 单元测试
│   │   ├── architecture/
│   │   ├── decorators/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/               # 集成测试
│   │   ├── cqrs/
│   │   ├── multi-tenant/
│   │   ├── performance/
│   │   └── testing/
│   ├── e2e/                       # 端到端测试
│   │   ├── core-module.e2e-spec.ts
│   │   └── performance.e2e-spec.ts
│   └── fixtures/                  # 测试数据
│       ├── test-data/
│       └── mock-services/
├── docs/                          # 文档
│   ├── api/                       # API 文档
│   ├── examples/                  # 使用示例
│   └── migration/                 # 迁移指南
├── package.json
├── tsconfig.json
└── README.md
```

### 目录结构说明

#### 核心架构层 (`core/`)

- **cqrs/**: CQRS 核心实现，包括命令、查询、事件和 Saga
  - **commands/**: 命令定义和处理器
  - **queries/**: 查询定义和处理器
  - **events/**: 事件定义和处理器
  - **sagas/**: Saga 模式实现，用于分布式事务
- **entities/**: 基础实体和值对象
- **decorators/**: CQRS 装饰器，用于标记命令、查询、事件处理器
- **interfaces/**: 核心接口定义
- **context/**: 异步上下文管理，提供请求级别的上下文传递
- **error/**: 错误处理机制，包括错误分类、处理和恢复
- **monitoring/**: 性能监控和指标收集
- **testing/**: 测试支持工具和模拟对象

#### 基础设施层 (`infrastructure/`)

- **database/**: 数据库相关基础设施
  - **mongodb/**: MongoDB 集成，包括适配器、模块和类型定义
  - **adapters/**: 其他数据库适配器
- **messaging/**: 消息系统基础设施
  - **queues/**: 消息队列实现，基于 Bull
  - **publishers/**: 命令和事件发布器
- **storage/**: 存储基础设施
  - **cache/**: 缓存层，支持多种缓存策略
  - **event-store/**: 事件存储实现，支持事件溯源
- **web/**: Web 相关基础设施
  - **fastify/**: Fastify 集成，包括适配器、模块、插件和中间件
  - **middleware/**: 通用中间件

#### 应用层 (`application/`)

- **services/**: 应用服务
- **handlers/**: 处理器
- **explorers/**: 模块探索器，自动发现和注册模块

#### 领域层 (`domain/`)

- **multi-tenant/**: 多租户支持
- **security/**: 安全层，包括权限和验证
- **validation/**: 验证层

#### 共享层 (`shared/`)

- **utils/**: 工具函数，包括常量、类型和通用工具
- **constants/**: 常量定义
- **types/**: 类型定义
- **decorators/**: 通用装饰器
- **interceptors/**: 通用拦截器
- **configuration/**: 配置管理
- **adapters/**: 适配器
- **repositories/**: 仓储

### 目录结构变更说明

#### 主要变更

1. **分层架构重构**: 按照 Clean Architecture 和 DDD 原则重新组织目录结构
2. **核心层集中**: 将核心架构组件集中在 `core/` 目录下，包括 CQRS、实体、装饰器等
3. **基础设施分离**: 将基础设施相关组件分离到 `infrastructure/` 目录下
4. **应用层独立**: 创建独立的 `application/` 层，包含应用服务和处理器
5. **领域层明确**: 将领域相关组件集中在 `domain/` 层
6. **共享层统一**: 将通用组件集中在 `shared/` 层

#### 新的分层结构

- **core/**: 核心架构层，包含 CQRS、实体、装饰器、接口等核心组件
- **infrastructure/**: 基础设施层，包含数据库、消息系统、存储、Web 等基础设施
- **application/**: 应用层，包含应用服务、处理器、探索器等应用逻辑
- **domain/**: 领域层，包含多租户、安全、验证等领域概念
- **shared/**: 共享层，包含工具函数、常量、类型、装饰器等通用组件

#### 删除的目录

- 删除了混乱的 `architecture/` 目录，将其内容重新分配到各个分层中
- 删除了重复的根目录下的各种功能目录
- 删除了空的或冗余的目录结构

#### 优势

- **清晰的分层**: 每个层级职责明确，符合软件工程最佳实践
- **易于维护**: 功能边界清晰，便于定位和修改
- **可扩展性**: 新功能可以轻松添加到相应的层级
- **团队协作**: 不同团队可以专注于不同的层级
- **测试友好**: 每个层级可以独立进行测试

## 使用示例

### 1. 业务模块集成 Core 模块

```typescript
// 在业务模块中使用 Core 模块
import { 
  BaseAggregateRoot, 
  BaseDomainEvent, 
  AuditInfo,
  EntityId,
  CommandHandler,
  QueryHandler,
  EventsHandler,
  Saga,
  Cacheable,
  DataIsolation,
  PerformanceMonitor,
  CoreAsyncContext
} from '@aiofix/core';

// 用户邮箱变更事件
export class UserEmailChangedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly oldEmail: string,
    public readonly newEmail: string,
    public readonly auditInfo: AuditInfo
  ) {
    super(aggregateId, 'UserEmailChanged');
  }
}

// 用户聚合根
export class User extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private _email: string,
    private _name: string,
    private _tenantId: string,
    auditInfo: Partial<AuditInfo>
  ) {
    super(id, auditInfo);
  }
  
  /**
   * 更新用户邮箱
   * 
   * @param newEmail - 新邮箱地址
   * @param updateInfo - 更新信息，包含操作者等审计信息
   */
  @LogExecution()
  changeEmail(newEmail: string, updateInfo: {
    updatedBy: string;
    updatedByType?: 'user' | 'system' | 'api' | 'migration';
    reason?: string;
    lastOperationIp?: string;
    lastOperationUserAgent?: string;
    lastOperationSource?: string;
  }): void {
    // 业务规则验证
    if (!this.isValidEmail(newEmail)) {
      throw new InvalidEmailError(newEmail);
    }
    
    if (this._email === newEmail) {
      return; // 邮箱未变更，直接返回
    }
    
    const oldEmail = this._email;
    this._email = newEmail;
    
    // 更新审计信息
    this.markAsUpdated(updateInfo);
    
    // 发布领域事件
    this.addDomainEvent(new UserEmailChangedEvent(
      this.id,
      oldEmail,
      newEmail,
      this.auditInfo
    ));
  }
  
  /**
   * 软删除用户
   * 
   * @param deleteInfo - 删除信息
   */
  softDelete(deleteInfo: {
    deletedBy: string;
    deletedByType?: 'user' | 'system' | 'api' | 'migration';
    deleteReason?: string;
    lastOperationIp?: string;
    lastOperationUserAgent?: string;
    lastOperationSource?: string;
  }): void {
    if (this.isDeleted) {
      throw new UserAlreadyDeletedError(this.id);
    }
    
    this.markAsDeleted(deleteInfo);
    
    // 发布用户删除事件
    this.addDomainEvent(new UserDeletedEvent(
      this.id,
      this._email,
      this.auditInfo
    ));
  }
  
  /**
   * 恢复已删除的用户
   * 
   * @param restoreInfo - 恢复信息
   */
  restore(restoreInfo: {
    restoredBy: string;
    restoredByType?: 'user' | 'system' | 'api' | 'migration';
    restoreReason?: string;
    lastOperationIp?: string;
    lastOperationUserAgent?: string;
    lastOperationSource?: string;
  }): void {
    if (!this.isDeleted) {
      throw new UserNotDeletedError(this.id);
    }
    
    this.markAsRestored(restoreInfo);
    
    // 发布用户恢复事件
    this.addDomainEvent(new UserRestoredEvent(
      this.id,
      this._email,
      this.auditInfo
    ));
  }
  
  // 业务方法
  get email(): string { return this._email; }
  get name(): string { return this._name; }
  get tenantId(): string { return this._tenantId; }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 用户服务
@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private cache: CacheManagerService, // 使用自定义缓存服务
    private logger: PinoLoggerService, // 使用自定义日志服务
    private config: ConfigService, // 使用自定义配置服务
    private database: DatabaseService, // 使用自定义数据库服务
    private eventBus: IEventBus
  ) {}
  
  @RequirePermission('user:read')
  @Cacheable((args) => `user:${args[0].toString()}`, 300) // 5分钟缓存
  async getUserById(userId: EntityId): Promise<User> {
    return this.userRepository.findById(userId);
  }
  
  @RequirePermission('user:write')
  @LogExecution()
  async updateUserEmail(
    userId: EntityId, 
    newEmail: string,
    context: {
      currentUserId: EntityId;
      userIp?: string;
      userAgent?: string;
      source?: string;
    }
  ): Promise<void> {
    const user = await this.getUserById(userId);
    
    // 更新用户邮箱
    user.changeEmail(newEmail, {
      updatedBy: context.currentUserId.toString(),
      updatedByType: 'user',
      reason: '用户主动修改邮箱',
      lastOperationIp: context.userIp,
      lastOperationUserAgent: context.userAgent,
      lastOperationSource: context.source
    });
    
    // 保存聚合根
    await this.userRepository.save(user);
    
    // 发布领域事件
    await this.eventBus.publishAll(user.domainEvents);
    user.clearDomainEvents();
    
    // 清除缓存 - 使用自定义缓存服务
    const cacheKey = this.cache.keyFactory.createUser(
      context.currentUserId.toString(), 
      `profile:${userId.toString()}`
    );
    await this.cache.delete(cacheKey);
    
    this.logger.info('用户邮箱更新成功', LogContext.BUSINESS, {
      userId: userId.toString(),
      newEmail,
      updatedBy: context.currentUserId.toString(),
      tenantId: user.tenantId,
      operation: 'updateUserEmail',
      duration: Date.now() - startTime
    });
  }
  
  @RequirePermission('user:delete')
  @LogExecution()
  async deleteUser(
    userId: EntityId,
    context: {
      currentUserId: EntityId;
      deleteReason: string;
      userIp?: string;
      userAgent?: string;
      source?: string;
    }
  ): Promise<void> {
    const user = await this.getUserById(userId);
    
    // 软删除用户
    user.softDelete({
      deletedBy: context.currentUserId.toString(),
      deletedByType: 'user',
      deleteReason: context.deleteReason,
      lastOperationIp: context.userIp,
      lastOperationUserAgent: context.userAgent,
      lastOperationSource: context.source
    });
    
    // 保存聚合根
    await this.userRepository.save(user);
    
    // 发布领域事件
    await this.eventBus.publishAll(user.domainEvents);
    user.clearDomainEvents();
    
    // 清除缓存
    await this.cache.delete(`user:${userId.toString()}`);
    
    this.logger.info('用户删除成功', {
      userId: userId.toString(),
      deletedBy: context.currentUserId.toString(),
      deleteReason: context.deleteReason,
      tenantId: user.tenantId
    });
  }
}
```

### 2. CQRS 装饰器使用示例

```typescript
// 使用新的 CQRS 装饰器系统
import { 
  CommandHandler, 
  QueryHandler, 
  EventsHandler, 
  Saga,
  ICommandHandler,
  IQueryHandler,
  IEventHandler,
  BaseCommand,
  BaseQuery,
  BaseDomainEvent
} from '@aiofix/core';

// 创建用户命令
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly tenantId: string
  ) {
    super();
  }
}

// 获取用户查询
export class GetUserQuery extends BaseQuery {
  constructor(
    public readonly userId: string,
    public readonly tenantId: string
  ) {
    super();
  }
}

// 用户创建事件
export class UserCreatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly tenantId: string
  ) {
    super(aggregateId, 'UserCreated');
  }
}

// 命令处理器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: CreateUserCommand): Promise<User> {
    const user = new User(
      EntityId.generate(),
      command.email,
      command.name,
      command.tenantId,
      { createdBy: 'system', tenantId: command.tenantId }
    );

    await this.userRepository.save(user);
    
    // 发布事件
    await this.eventBus.publish(new UserCreatedEvent(
      user.id.toString(),
      user.email,
      user.name,
      user.tenantId
    ));

    return user;
  }
}

// 查询处理器
@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(query: GetUserQuery): Promise<User | null> {
    return await this.userRepository.findById(query.userId, query.tenantId);
  }
}

// 事件处理器
@EventsHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: PinoLoggerService
  ) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    this.logger.info('用户创建事件处理', {
      userId: event.aggregateId,
      email: event.email,
      tenantId: event.tenantId
    });

    // 发送欢迎邮件
    await this.emailService.sendWelcomeEmail(event.email, event.name);
  }
}

// Saga 示例
@Injectable()
export class UserOnboardingSaga {
  @Saga()
  userCreated = (events$: Observable<UserCreatedEvent>): Observable<ICommand> => {
    return events$.pipe(
      ofType(UserCreatedEvent),
      map(event => new SendWelcomeEmailCommand(event.email, event.name)),
      catchError(error => {
        this.logger.error('用户创建 Saga 错误', error);
        return of(new NotifyAdminCommand('用户创建失败', event));
      })
    );
  };
}
```

### 3. 性能监控使用示例

```typescript
// 使用性能监控装饰器
import { PerformanceMonitor, IPerformanceMonitor } from '@aiofix/core';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly performanceMonitor: IPerformanceMonitor
  ) {}

  @PerformanceMonitor('user_service.create_user', { service: 'user' })
  async createUser(userData: CreateUserData): Promise<User> {
    const timer = this.performanceMonitor.startTimer('user_creation', {
      tenantId: userData.tenantId
    });

    try {
      const user = await this.userRepository.create(userData);
      
      // 记录成功指标
      await this.performanceMonitor.recordCounter('users_created_total', 1, {
        tenantId: userData.tenantId
      });

      return user;
    } catch (error) {
      // 记录错误指标
      await this.performanceMonitor.recordCounter('user_creation_errors', 1, {
        tenantId: userData.tenantId,
        error_type: error.constructor.name
      });
      throw error;
    } finally {
      timer.stop();
    }
  }

  @PerformanceMonitor('user_service.get_user', { service: 'user' })
  async getUser(userId: string): Promise<User | null> {
    return await this.userRepository.findById(userId);
  }
}
```

### 4. 测试支持使用示例

```typescript
// 使用 Core 测试支持
import { 
  CoreTestingModule, 
  CoreTestUtils, 
  CoreTestBase 
} from '@aiofix/core';

describe('UserService', () => {
  let app: INestApplication;
  let userService: UserService;
  let commandBus: ICommandBus;
  let queryBus: IQueryBus;

  beforeAll(async () => {
    const module = await CoreTestingModule.createTestingModule({
      imports: [UserModule],
      providers: [UserService],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    userService = app.get<UserService>(UserService);
    commandBus = app.get<ICommandBus>(ICommandBus);
    queryBus = app.get<IQueryBus>(IQueryBus);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should create user with command', async () => {
    // 创建测试命令
    const command = CoreTestUtils.createMockCommand(
      new CreateUserCommand('test@example.com', 'Test User', 'tenant-123')
    );

    // 执行命令
    const result = await commandBus.execute(command);

    // 验证结果
    expect(result).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(result.name).toBe('Test User');
  });

  it('should get user with query', async () => {
    // 创建测试查询
    const query = CoreTestUtils.createMockQuery(
      new GetUserQuery('user-123', 'tenant-123')
    );

    // 执行查询
    const result = await queryBus.execute(query);

    // 验证结果
    expect(result).toBeDefined();
  });

  it('should handle user created event', async () => {
    // 创建测试事件
    const event = CoreTestUtils.createMockEvent(
      new UserCreatedEvent('user-123', 'test@example.com', 'Test User', 'tenant-123')
    );

    // 发布事件
    await eventBus.publish(event);

    // 等待事件处理完成
    await CoreTestUtils.waitFor(async () => {
      // 验证事件处理结果
      return true;
    });
  });
});
```

### 5. 多层级数据隔离使用示例

```typescript
// 多层级数据隔离的实际应用
import { 
  DataIsolationContext, 
  IsolationLevel, 
  DataSensitivity,
  SmartIsolationStrategyFactory 
} from '@aiofix/core';

// 创建不同层级的隔离上下文
const tenantContext = new DataIsolationContext(
  EntityId.fromString('tenant-123'),
  undefined, // 无组织限制
  undefined, // 无部门限制
  undefined, // 无用户限制
  IsolationLevel.TENANT,
  DataSensitivity.INTERNAL
);

const organizationContext = new DataIsolationContext(
  EntityId.fromString('tenant-123'),
  EntityId.fromString('org-456'),
  undefined, // 无部门限制
  undefined, // 无用户限制
  IsolationLevel.ORGANIZATION,
  DataSensitivity.INTERNAL
);

const departmentContext = new DataIsolationContext(
  EntityId.fromString('tenant-123'),
  EntityId.fromString('org-456'),
  EntityId.fromString('dept-789'),
  undefined, // 无用户限制
  IsolationLevel.DEPARTMENT,
  DataSensitivity.INTERNAL
);

const personalContext = new DataIsolationContext(
  EntityId.fromString('tenant-123'),
  EntityId.fromString('org-456'),
  EntityId.fromString('dept-789'),
  EntityId.fromString('user-001'),
  IsolationLevel.PERSONAL,
  DataSensitivity.CONFIDENTIAL
);

// 智能感知隔离策略
const tenantStrategy = SmartIsolationStrategyFactory.create(tenantContext);
const orgStrategy = SmartIsolationStrategyFactory.create(organizationContext);
const deptStrategy = SmartIsolationStrategyFactory.create(departmentContext);
const personalStrategy = SmartIsolationStrategyFactory.create(personalContext);

// 在业务实体中使用多层级隔离
export class Document extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private _title: string,
    private _content: string,
    private _isolationContext: DataIsolationContext,
    auditInfo: Partial<AuditInfo>
  ) {
    super(id, auditInfo);
  }
  
  /**
   * 获取文档的隔离上下文
   */
  get isolationContext(): DataIsolationContext {
    return this._isolationContext;
  }
  
  /**
   * 检查用户是否有访问权限
   */
  canAccess(userContext: DataIsolationContext): boolean {
    const strategy = SmartIsolationStrategyFactory.create(this._isolationContext);
    return strategy.validateAccess(this._isolationContext, userContext);
  }
  
  /**
   * 更新文档内容（需要权限验证）
   */
  updateContent(newContent: string, userContext: DataIsolationContext, updateInfo: UpdateInfo): void {
    // 验证访问权限
    if (!this.canAccess(userContext)) {
      throw new UnauthorizedAccessError('用户无权访问此文档');
    }
    
    // 检查是否需要跨层级访问权限
    const strategy = SmartIsolationStrategyFactory.create(this._isolationContext);
    if (strategy.requiresCrossLevelAccess(userContext)) {
      if (!userContext.accessPermissions.includes('cross_level_access')) {
        throw new InsufficientPermissionsError('需要跨层级访问权限');
      }
    }
    
    this._content = newContent;
    this.markAsUpdated(updateInfo);
    
    // 发布文档更新事件
    this.addDomainEvent(new DocumentContentUpdatedEvent(
      this.id,
      this._title,
      this._content,
      this.auditInfo
    ));
  }
  
  /**
   * 共享文档到其他层级
   */
  shareToLevel(targetLevel: IsolationLevel, userContext: DataIsolationContext): void {
    // 验证用户是否有共享权限
    if (!userContext.accessPermissions.includes('share_document')) {
      throw new InsufficientPermissionsError('需要文档共享权限');
    }
    
    // 创建目标层级的隔离上下文
    const targetContext = this._isolationContext.createSubContext(targetLevel);
    
    // 发布文档共享事件
    this.addDomainEvent(new DocumentSharedEvent(
      this.id,
      this._isolationContext,
      targetContext,
      this.auditInfo
    ));
  }
}

// 在服务中使用多层级隔离
@Injectable()
export class DocumentService {
  constructor(
    private documentRepository: DocumentRepository,
    private isolationService: DataIsolationService
  ) {}
  
  /**
   * 创建文档（自动应用隔离上下文）
   */
  async createDocument(
    title: string,
    content: string,
    isolationLevel: IsolationLevel,
    userContext: DataIsolationContext
  ): Promise<Document> {
    // 根据用户上下文创建文档的隔离上下文
    const documentContext = userContext.createSubContext(isolationLevel);
    
    // 创建文档实体
    const document = new Document(
      EntityId.generate(),
      title,
      content,
      documentContext,
      {
        createdBy: userContext.userId?.toString() || 'system',
        createdByType: 'user',
        tenantId: userContext.tenantId.toString(),
        lastOperationIp: userContext.customAttributes.userIp
      }
    );
    
    // 保存文档
    await this.documentRepository.save(document);
    
    return document;
  }
  
  /**
   * 查询文档（自动应用隔离策略）
   */
  async getDocuments(
    userContext: DataIsolationContext,
    filters: DocumentFilters = {}
  ): Promise<Document[]> {
    // 获取用户的隔离策略
    const strategy = SmartIsolationStrategyFactory.create(userContext);
    
    // 构建查询
    let query = this.documentRepository.createQuery();
    
    // 应用隔离条件
    query = strategy.applyIsolation(query);
    
    // 应用其他过滤条件
    if (filters.title) {
      query = query.where('title', 'like', `%${filters.title}%`);
    }
    
    if (filters.createdAfter) {
      query = query.where('created_at', '>=', filters.createdAfter);
    }
    
    // 执行查询
    return await query.execute();
  }
  
  /**
   * 跨层级查询文档
   */
  async getCrossLevelDocuments(
    userContext: DataIsolationContext,
    targetLevels: IsolationLevel[]
  ): Promise<Document[]> {
    // 验证用户是否有跨层级访问权限
    if (!userContext.accessPermissions.includes('cross_level_access')) {
      throw new InsufficientPermissionsError('需要跨层级访问权限');
    }
    
    // 创建多层级隔离策略
    const contexts = targetLevels.map(level => 
      userContext.createSubContext(level)
    );
    
    const multiLevelStrategy = SmartIsolationStrategyFactory.createMultiLevel(contexts);
    
    // 构建查询
    let query = this.documentRepository.createQuery();
    query = multiLevelStrategy.applyIsolation(query);
    
    return await query.execute();
  }
}

// 数据隔离服务
@Injectable()
export class DataIsolationService {
  /**
   * 验证数据访问权限
   */
  validateDataAccess(
    dataContext: DataIsolationContext,
    userContext: DataIsolationContext
  ): boolean {
    const strategy = SmartIsolationStrategyFactory.create(dataContext);
    return strategy.validateAccess(dataContext, userContext);
  }
  
  /**
   * 获取隔离条件
   */
  getIsolationConditions(context: DataIsolationContext): Record<string, any> {
    const strategy = SmartIsolationStrategyFactory.create(context);
    return strategy.getIsolationConditions();
  }
  
  /**
   * 检查跨层级访问需求
   */
  requiresCrossLevelAccess(
    dataContext: DataIsolationContext,
    userContext: DataIsolationContext
  ): boolean {
    const strategy = SmartIsolationStrategyFactory.create(dataContext);
    return strategy.requiresCrossLevelAccess(userContext);
  }
  
  /**
   * 智能选择隔离策略
   */
  getOptimalStrategy(context: DataIsolationContext): IIsolationStrategy {
    return SmartIsolationStrategyFactory.create(context);
  }
}

// 使用示例
async function example() {
  // 创建用户上下文
  const userContext = new DataIsolationContext(
    EntityId.fromString('tenant-123'),
    EntityId.fromString('org-456'),
    EntityId.fromString('dept-789'),
    EntityId.fromString('user-001'),
    IsolationLevel.DEPARTMENT,
    DataSensitivity.INTERNAL,
    ['read', 'write', 'share_document', 'cross_level_access']
  );
  
  // 创建文档服务
  const documentService = new DocumentService(
    new DocumentRepository(),
    new DataIsolationService()
  );
  
  // 创建部门级文档
  const document = await documentService.createDocument(
    '部门会议纪要',
    '会议内容...',
    IsolationLevel.DEPARTMENT,
    userContext
  );
  
  // 查询用户可访问的文档
  const documents = await documentService.getDocuments(userContext, {
    title: '会议'
  });
  
  // 跨层级查询文档
  const crossLevelDocs = await documentService.getCrossLevelDocuments(
    userContext,
    [IsolationLevel.ORGANIZATION, IsolationLevel.TENANT]
  );
  
  // 更新文档内容
  document.updateContent('更新后的内容', userContext, {
    updatedBy: userContext.userId!.toString(),
    updatedByType: 'user',
    reason: '内容更新'
  });
  
  // 共享文档到组织级别
  document.shareToLevel(IsolationLevel.ORGANIZATION, userContext);
}
```

### 3. EntityId 使用示例

```typescript
// 创建和使用 EntityId
import { EntityId, InvalidEntityIdError } from '@aiofix/core';

// 生成新的实体ID
const userId = EntityId.generate();
console.log(userId.toString()); // "550e8400-e29b-41d4-a716-446655440000"
console.log(userId.toShortString()); // "550e8400"

// 从字符串创建ID（用于反序列化）
const existingId = EntityId.fromString("550e8400-e29b-41d4-a716-446655440000");

// 安全创建ID（不会抛出异常）
const safeId = EntityId.tryFromString("invalid-uuid");
if (safeId) {
  console.log("ID创建成功");
} else {
  console.log("ID格式无效");
}

// 验证ID格式
const isValid = EntityId.isValid("550e8400-e29b-41d4-a716-446655440000"); // true
const isInvalid = EntityId.isValid("invalid-uuid"); // false

// 比较ID
const isEqual = userId.equals(existingId); // true
const comparison = userId.compareTo(existingId); // 0 (相等)

// 在Map和Set中使用
const userMap = new Map<EntityId, string>();
userMap.set(userId, "John Doe");

const userIdSet = new Set<EntityId>();
userIdSet.add(userId);

// 错误处理
try {
  const invalidId = EntityId.fromString("invalid-uuid");
} catch (error) {
  if (error instanceof InvalidEntityIdError) {
    console.log("ID格式无效:", error.message);
  }
}

// 在实体中使用
export class User extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private _email: string,
    private _name: string,
    auditInfo: Partial<AuditInfo>
  ) {
    super(id, auditInfo);
  }
  
  get id(): EntityId {
    return this._id;
  }
  
  // 业务方法
  changeName(newName: string, updateInfo: UpdateInfo): void {
    this._name = newName;
    this.markAsUpdated(updateInfo);
    
    // 发布领域事件
    this.addDomainEvent(new UserNameChangedEvent(
      this.id, // EntityId 类型
      this._name,
      newName,
      this.auditInfo
    ));
  }
}

// 在服务中使用
@Injectable()
export class UserService {
  async createUser(userData: CreateUserData): Promise<User> {
    // 生成新的用户ID
    const userId = EntityId.generate();
    
    // 创建用户实体
    const user = new User(
      userId,
      userData.email,
      userData.name,
      {
        createdBy: userData.createdBy.toString(),
        createdByType: 'user',
        tenantId: userData.tenantId,
        lastOperationIp: userData.userIp
      }
    );
    
    // 保存用户
    await this.userRepository.save(user);
    
    return user;
  }
  
  async getUserById(id: string): Promise<User | null> {
    try {
      const userId = EntityId.fromString(id);
      return await this.userRepository.findById(userId);
    } catch (error) {
      if (error instanceof InvalidEntityIdError) {
        return null;
      }
      throw error;
    }
  }
}
```

### 3. 配置和模块注册

```typescript
// Core 模块配置 - 集成自定义基础设施模块和新增功能
@Module({
  imports: [
    // 导入自定义基础设施模块
    LoggingModule.forRoot({
      config: {
        level: 'info',
        format: 'json',
        colorize: false,
        tenantId: true,
        userId: true,
        performance: true
      }
    }),
    ConfigModule, // 全局配置模块
    CacheModule.forRoot({
      config: {
        redis: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379', 10),
          password: process.env.REDIS_PASSWORD,
          db: parseInt(process.env.REDIS_DB || '0', 10)
        },
        memory: {
          defaultTtl: 300000,
          maxSize: 1000
        }
      }
    }),
    DatabaseModule.forRoot({
      config: {
        postgresql: {
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '5432', 10),
          username: process.env.DB_USERNAME || 'postgres',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_NAME || 'aiofix_core',
          schema: process.env.DB_SCHEMA || 'public'
        }
      }
    }),
    
    // 新增功能模块
    FastifyModule, // Fastify 集成
    MongoDBModule, // MongoDB 支持
  ],
  providers: [
    // 架构基础
    { provide: 'IEventBus', useClass: EventBus },
    { provide: 'ICommandBus', useClass: CommandBus },
    { provide: 'IQueryBus', useClass: QueryBus },
    
    // 事件存储
    { provide: 'IEventStore', useClass: EventStore },
    
    // Saga 模式
    { provide: 'ISagaManager', useClass: SagaManager },
    
    // 消息队列
    { provide: 'IMessageQueue', useClass: BullMessageQueue },
    
    // 多租户支持
    { provide: 'ITenantContextService', useClass: TenantContextService },
    { provide: 'IIsolationStrategyFactory', useClass: SmartIsolationStrategyFactory },
    
    // 数据访问
    { provide: 'IUnitOfWork', useClass: UnitOfWork },
    
    // 安全
    { provide: 'IPermissionService', useClass: PermissionService },
    { provide: 'IAuthService', useClass: AuthService },
  ],
  exports: [
    // 导出基础设施模块服务
    PinoLoggerService,
    ConfigService,
    CacheManagerService,
    DatabaseService,
    
    // 导出新增功能服务
    'FASTIFY_ADAPTER',
    'MONGODB_ADAPTER',
    
    // 导出架构基础服务
    'IEventBus',
    'ICommandBus', 
    'IQueryBus',
    'IEventStore',
    'ISagaManager',
    'IMessageQueue',
    'ITenantContextService',
    'IUnitOfWork',
    'IPermissionService',
    'IAuthService'
  ]
})
export class CoreModule {}
```

## 依赖关系

### Core 模块依赖

```text
Core 模块
├── 自定义基础设施模块依赖
│   ├── @aiofix/logging (结构化日志)
│   ├── @aiofix/config (配置管理)
│   ├── @aiofix/cache (多级缓存)
│   └── @aiofix/database (数据库抽象)
├── 第三方库依赖
│   ├── @nestjs/common
│   ├── @nestjs/core
│   ├── @nestjs/cqrs
│   ├── @nestjs/jwt
│   ├── @nestjs/passport
│   ├── class-validator
│   ├── class-transformer
│   ├── uuid
│   ├── moment
│   ├── fastify (高性能 HTTP 服务器)
│   ├── @fastify/cors (CORS 支持)
│   ├── @fastify/helmet (安全头)
│   ├── @fastify/rate-limit (限流)
│   ├── @fastify/swagger (API 文档)
│   ├── @fastify/websocket (WebSocket 支持)
│   ├── bull (任务队列)
│   ├── mongodb (MongoDB 驱动)
│   └── redis (Redis 客户端)
└── 开发依赖
    ├── @types/node
    ├── @types/bull
    ├── @types/mongodb
    ├── typescript
    ├── jest
    └── eslint
```

### 业务模块对 Core 模块的依赖

```text
业务模块 (如 identity, tenant-management 等)
├── @aiofix/core (主要依赖)
│   ├── 架构基础组件
│   │   ├── CQRS 基础设施
│   │   ├── 事件驱动架构
│   │   ├── 事件存储
│   │   └── Saga 模式
│   ├── 多租户支持
│   │   ├── 租户上下文管理
│   │   ├── 智能数据隔离
│   │   └── 多层级隔离策略
│   ├── 数据访问抽象
│   │   ├── 工作单元模式
│   │   ├── 仓储模式
│   │   └── 规约模式
│   ├── 安全组件
│   │   ├── 权限管理
│   │   ├── 认证授权
│   │   └── 租户隔离
│   ├── 消息队列
│   │   ├── 异步任务处理
│   │   ├── 事件发布订阅
│   │   └── 延迟任务
│   └── 服务器集成
│       ├── Fastify 适配器
│       └── MongoDB 支持
├── 基础设施模块 (通过 Core 模块间接使用)
│   ├── @aiofix/logging (日志记录)
│   ├── @aiofix/config (配置管理)
│   ├── @aiofix/cache (缓存管理)
│   └── @aiofix/database (数据库访问)
├── 其他业务模块 (通过 Core 模块协调)
└── 第三方库 (通过 Core 模块统一管理)
```

## 业务模块集成示例

### 1. 业务模块配置

```typescript
// 业务模块 (如 identity 模块) 的配置
@Module({
  imports: [
    // 导入 Core 模块，自动获得所有基础设施能力
    CoreModule,
    
    // 业务特定的模块
    UserModule,
    RoleModule,
    PermissionModule
  ],
  providers: [
    // 业务服务
    UserService,
    RoleService,
    PermissionService
  ]
})
export class IdentityModule {}
```

### 2. 业务服务使用 Core 模块能力

```typescript
@Injectable()
export class UserService {
  constructor(
    // 通过 Core 模块获得的基础设施服务
    private logger: PinoLoggerService,
    private cache: CacheManagerService,
    private config: ConfigService,
    private database: DatabaseService,
    
    // 通过 Core 模块获得的架构组件
    private eventBus: IEventBus,
    private tenantContext: ITenantContextService,
    private isolationStrategy: IIsolationStrategyFactory,
    
    // 业务特定的依赖
    private userRepository: UserRepository
  ) {}
  
  async createUser(userData: CreateUserData): Promise<User> {
    const startTime = Date.now();
    
    try {
      // 使用配置服务获取配置
      const maxUsersPerTenant = this.config.getConfigValue('app').maxUsersPerTenant;
      
      // 使用租户上下文
      const tenantId = this.tenantContext.getCurrentTenantId();
      
      // 使用隔离策略
      const isolationContext = new DataIsolationContext(
        EntityId.fromString(tenantId),
        undefined,
        undefined,
        undefined,
        IsolationLevel.TENANT
      );
      
      // 创建用户实体
      const userId = EntityId.generate();
      const user = new User(
        userId,
        userData.email,
        userData.name,
        tenantId,
        {
          createdBy: userData.createdBy,
          createdByType: 'user',
          tenantId: tenantId,
          lastOperationIp: userData.userIp
        }
      );
      
      // 保存到数据库
      await this.userRepository.save(user);
      
      // 缓存用户信息
      const cacheKey = this.cache.keyFactory.createUser(
        tenantId,
        `profile:${userId.toString()}`
      );
      await this.cache.set(cacheKey, user, { 
        ttl: 3600000, // 1小时
        strategy: CacheStrategy.LRU 
      });
      
      // 发布领域事件
      await this.eventBus.publishAll(user.domainEvents);
      user.clearDomainEvents();
      
      // 记录结构化日志
      this.logger.info('用户创建成功', LogContext.BUSINESS, {
        userId: userId.toString(),
        email: userData.email,
        tenantId: tenantId,
        operation: 'createUser',
        duration: Date.now() - startTime,
        createdBy: userData.createdBy
      });
      
      return user;
      
    } catch (error) {
      // 错误日志记录
      this.logger.error('用户创建失败', LogContext.BUSINESS, {
        email: userData.email,
        tenantId: this.tenantContext.getCurrentTenantId(),
        operation: 'createUser',
        duration: Date.now() - startTime,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async getUserById(userId: string): Promise<User | null> {
    try {
      const entityId = EntityId.fromString(userId);
      const tenantId = this.tenantContext.getCurrentTenantId();
      
      // 尝试从缓存获取
      const cacheKey = this.cache.keyFactory.createUser(
        tenantId,
        `profile:${userId}`
      );
      
      let user = await this.cache.get<User>(cacheKey);
      
      if (!user) {
        // 缓存未命中，从数据库获取
        user = await this.userRepository.findById(entityId);
        
        if (user) {
          // 缓存用户信息
          await this.cache.set(cacheKey, user, { 
            ttl: 3600000,
            strategy: CacheStrategy.LRU 
          });
        }
      }
      
      // 记录缓存命中率
      this.logger.debug('用户查询完成', LogContext.BUSINESS, {
        userId: userId,
        tenantId: tenantId,
        operation: 'getUserById',
        cacheHit: !!user
      });
      
      return user;
      
    } catch (error) {
      if (error instanceof InvalidEntityIdError) {
        this.logger.warn('无效的用户ID格式', LogContext.BUSINESS, {
          userId: userId,
          tenantId: this.tenantContext.getCurrentTenantId(),
          operation: 'getUserById'
        });
        return null;
      }
      
      this.logger.error('用户查询失败', LogContext.BUSINESS, {
        userId: userId,
        tenantId: this.tenantContext.getCurrentTenantId(),
        operation: 'getUserById',
        error: error.message
      }, error);
      
      throw error;
    }
  }
}
```

### 3. 配置管理示例

```typescript
// 使用自定义配置服务
@Injectable()
export class SystemConfigService {
  constructor(private config: ConfigService) {}
  
  getDatabaseConfig() {
    return this.config.getDatabaseConfig();
  }
  
  getCacheConfig() {
    return this.config.getRedisConfig();
  }
  
  getLoggingConfig() {
    return this.config.getLoggingConfig();
  }
  
  isProduction() {
    return this.config.isProduction();
  }
  
  getFeatureFlags() {
    return this.config.getConfigValue('app').featureFlags;
  }
}
```

### 4. 缓存使用示例

```typescript
@Injectable()
export class CacheService {
  constructor(private cache: CacheManagerService) {}
  
  async cacheUserPermissions(userId: string, permissions: string[]) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    const cacheKey = this.cache.keyFactory.createUser(
      tenantId,
      `permissions:${userId}`
    );
    
    await this.cache.set(cacheKey, permissions, {
      ttl: 1800000, // 30分钟
      strategy: CacheStrategy.LRU,
      tags: ['user', 'permissions']
    });
  }
  
  async invalidateUserCache(userId: string) {
    const tenantId = this.tenantContext.getCurrentTenantId();
    
    // 按模式清除缓存
    await this.cache.invalidateByPattern(`user:${tenantId}:${userId}:*`);
    
    // 按标签清除缓存
    await this.cache.invalidateByTags(['user', 'permissions']);
  }
}
```

### 5. Saga 模式使用示例

```typescript
// 订单处理 Saga
@Injectable()
export class OrderProcessingSaga {
  constructor(
    private sagaManager: ISagaManager,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private inventoryService: InventoryService,
    private notificationService: NotificationService
  ) {}
  
  async processOrder(orderId: string, tenantId: string): Promise<string> {
    const sagaDefinition: SagaDefinition = {
      sagaId: 'order-processing',
      sagaName: '订单处理流程',
      steps: [
        new ValidateOrderStep(this.orderService),
        new ReserveInventoryStep(this.inventoryService),
        new ProcessPaymentStep(this.paymentService),
        new ConfirmOrderStep(this.orderService),
        new SendNotificationStep(this.notificationService)
      ],
      timeout: 300000, // 5分钟超时
      retryPolicy: {
        maxRetries: 3,
        retryDelay: 5000,
        backoffMultiplier: 2
      }
    };
    
    const context = new SagaContext(
      EntityId.generate().toString(),
      orderId,
      tenantId,
      { orderId },
      { startTime: new Date() }
    );
    
    return await this.sagaManager.startSaga(sagaDefinition, context);
  }
}

// 验证订单步骤
export class ValidateOrderStep implements ISagaStep {
  readonly stepId = 'validate-order';
  readonly stepName = '验证订单';
  readonly compensationAction = 'cancel-order';
  
  constructor(private orderService: OrderService) {}
  
  async execute(context: SagaContext): Promise<SagaStepResult> {
    try {
      const orderId = context.getData<string>('orderId');
      const order = await this.orderService.validateOrder(orderId);
      
      context.setData('order', order);
      
      return {
        success: true,
        data: { orderId: order.id, status: 'validated' }
      };
    } catch (error) {
      return {
        success: false,
        error
      };
    }
  }
  
  async compensate(context: SagaContext): Promise<void> {
    const orderId = context.getData<string>('orderId');
    await this.orderService.cancelOrder(orderId, 'Saga compensation');
  }
}

// 预留库存步骤
export class ReserveInventoryStep implements ISagaStep {
  readonly stepId = 'reserve-inventory';
  readonly stepName = '预留库存';
  readonly compensationAction = 'release-inventory';
  
  constructor(private inventoryService: InventoryService) {}
  
  async execute(context: SagaContext): Promise<SagaStepResult> {
    try {
      const order = context.getData<any>('order');
      await this.inventoryService.reserveInventory(order.items);
      
      return {
        success: true,
        data: { reserved: true }
      };
    } catch (error) {
      return {
        success: false,
        error
      };
    }
  }
  
  async compensate(context: SagaContext): Promise<void> {
    const order = context.getData<any>('order');
    await this.inventoryService.releaseInventory(order.items);
  }
}
```

### 6. 消息队列使用示例

```typescript
@Injectable()
export class EmailService {
  constructor(
    private messageQueue: IMessageQueue,
    private logger: PinoLoggerService
  ) {}
  
  // 发送邮件（异步）
  async sendEmailAsync(emailData: EmailData): Promise<void> {
    await this.messageQueue.publish('email-send', emailData, {
      priority: 1,
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
  
  // 延迟发送邮件
  async sendDelayedEmail(emailData: EmailData, delay: number): Promise<void> {
    await this.messageQueue.schedule('email-send', emailData, delay, {
      priority: 2
    });
  }
  
  // 定时发送邮件
  async sendScheduledEmail(emailData: EmailData, cron: string): Promise<void> {
    await this.messageQueue.scheduleRecurring('email-send', emailData, cron, {
      priority: 3
    });
  }
  
  // 邮件处理器
  @QueueHandler('email-send', { concurrency: 5 })
  async handleEmailSend(emailData: EmailData): Promise<void> {
    try {
      // 实际发送邮件逻辑
      await this.sendEmail(emailData);
      
      this.logger.info('邮件发送成功', LogContext.BUSINESS, {
        to: emailData.to,
        subject: emailData.subject
      });
    } catch (error) {
      this.logger.error('邮件发送失败', LogContext.BUSINESS, {
        to: emailData.to,
        subject: emailData.subject,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  private async sendEmail(emailData: EmailData): Promise<void> {
    // 实际的邮件发送实现
  }
}
```

### 7. Fastify 集成使用示例

```typescript
// 主应用配置
@Module({
  imports: [
    CoreModule,
    // 其他业务模块
  ]
})
export class AppModule {}

// 启动应用
async function bootstrap() {
  const app = await NestFactory.create(AppModule, new FastifyAdapter());
  
  // 配置全局前缀
  app.setGlobalPrefix('api/v1');
  
  // 启动应用
  await app.listen(3000, '0.0.0.0');
  console.log('Application is running on: http://localhost:3000');
}

bootstrap();
```

### 8. MongoDB 使用示例

```typescript
@Injectable()
export class DocumentService {
  constructor(
    @Inject('MONGODB_ADAPTER') private mongoAdapter: MongoDBAdapter,
    private logger: PinoLoggerService
  ) {}
  
  async createDocument(document: Document): Promise<Document> {
    try {
      const result = await this.mongoAdapter.insert('documents', {
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      this.logger.info('文档创建成功', LogContext.BUSINESS, {
        documentId: result.insertedId,
        title: document.title
      });
      
      return { ...document, id: result.insertedId };
    } catch (error) {
      this.logger.error('文档创建失败', LogContext.BUSINESS, {
        title: document.title,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async searchDocuments(query: any, options?: QueryOptions): Promise<Document[]> {
    try {
      const documents = await this.mongoAdapter.query('documents', query, options);
      
      this.logger.debug('文档搜索完成', LogContext.BUSINESS, {
        query,
        resultCount: documents.length
      });
      
      return documents;
    } catch (error) {
      this.logger.error('文档搜索失败', LogContext.BUSINESS, {
        query,
        error: error.message
      }, error);
      
      throw error;
    }
  }
  
  async aggregateDocuments(pipeline: any[]): Promise<any[]> {
    try {
      const result = await this.mongoAdapter.aggregate('documents', pipeline);
      
      this.logger.debug('文档聚合查询完成', LogContext.BUSINESS, {
        pipeline,
        resultCount: result.length
      });
      
      return result;
    } catch (error) {
      this.logger.error('文档聚合查询失败', LogContext.BUSINESS, {
        pipeline,
        error: error.message
      }, error);
      
      throw error;
    }
  }
}
```

## 版本管理策略

### 1. 语义化版本

- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 2. 向后兼容性

- 保持 API 的向后兼容性
- 废弃的 API 提供迁移指南
- 提供兼容性检查工具

### 3. 升级策略

- 提供自动化升级脚本
- 详细的升级文档和迁移指南
- 分阶段升级支持

## 测试策略

### 1. 单元测试

- 每个组件都有对应的单元测试
- 测试覆盖率要求 90% 以上
- 使用 Mock 对象隔离依赖

### 2. 集成测试

- 测试组件间的集成
- 测试与外部系统的集成
- 端到端的功能测试

### 3. 性能测试

- 基准性能测试
- 负载测试
- 内存泄漏检测

## 文档和维护

### 1. API 文档

- 自动生成的 API 文档
- 使用示例和最佳实践
- 迁移指南和升级说明

### 2. 代码质量

- ESLint 和 Prettier 配置
- 代码审查流程
- 自动化 CI/CD 流水线

### 3. 监控和告警

- 性能监控
- 错误追踪
- 使用统计

#### 1.8 性能监控系统

```typescript
/**
 * 性能监控接口
 * 
 * 定义性能监控的标准接口，支持指标收集、告警、报告等功能。
 */
export interface IPerformanceMonitor {
  /**
   * 记录性能指标
   * 
   * @param name 指标名称
   * @param value 指标值
   * @param tags 标签
   */
  recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
  
  /**
   * 记录直方图指标
   * 
   * @param name 指标名称
   * @param value 指标值
   * @param tags 标签
   */
  recordHistogram(name: string, value: number, tags?: Record<string, string>): Promise<void>;
  
  /**
   * 记录计数器指标
   * 
   * @param name 指标名称
   * @param increment 增量值
   * @param tags 标签
   */
  recordCounter(name: string, increment: number = 1, tags?: Record<string, string>): Promise<void>;
  
  /**
   * 记录计时器
   * 
   * @param name 计时器名称
   * @param duration 持续时间（毫秒）
   * @param tags 标签
   */
  recordTimer(name: string, duration: number, tags?: Record<string, string>): Promise<void>;
  
  /**
   * 开始计时
   * 
   * @param name 计时器名称
   * @param tags 标签
   * @returns 计时器实例
   */
  startTimer(name: string, tags?: Record<string, string>): ITimer;
  
  /**
   * 发送告警
   * 
   * @param alert 告警信息
   */
  sendAlert(alert: AlertInfo): Promise<void>;
  
  /**
   * 获取性能报告
   * 
   * @param timeRange 时间范围
   * @returns 性能报告
   */
  getPerformanceReport(timeRange: TimeRange): Promise<PerformanceReport>;
}

/**
 * 计时器接口
 */
export interface ITimer {
  /**
   * 停止计时并记录指标
   */
  stop(): void;
  
  /**
   * 获取当前持续时间
   */
  getDuration(): number;
}

/**
 * 告警信息接口
 */
export interface AlertInfo {
  /** 告警类型 */
  readonly type: string;
  /** 严重程度 */
  readonly severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  /** 告警消息 */
  readonly message: string;
  /** 详细信息 */
  readonly details?: Record<string, any>;
  /** 时间戳 */
  readonly timestamp: Date;
  /** 租户ID */
  readonly tenantId?: string;
}

/**
 * 时间范围接口
 */
export interface TimeRange {
  /** 开始时间 */
  readonly start: Date;
  /** 结束时间 */
  readonly end: Date;
}

/**
 * 性能报告接口
 */
export interface PerformanceReport {
  /** 报告时间范围 */
  readonly timeRange: TimeRange;
  /** 指标统计 */
  readonly metrics: MetricStatistics[];
  /** 告警统计 */
  readonly alerts: AlertStatistics;
  /** 性能趋势 */
  readonly trends: PerformanceTrend[];
}

/**
 * 指标统计接口
 */
export interface MetricStatistics {
  /** 指标名称 */
  readonly name: string;
  /** 平均值 */
  readonly average: number;
  /** 最小值 */
  readonly min: number;
  /** 最大值 */
  readonly max: number;
  /** 总数 */
  readonly count: number;
  /** 百分位数 */
  readonly percentiles: Record<string, number>;
}

/**
 * 告警统计接口
 */
export interface AlertStatistics {
  /** 总告警数 */
  readonly total: number;
  /** 按严重程度分组 */
  readonly bySeverity: Record<string, number>;
  /** 按类型分组 */
  readonly byType: Record<string, number>;
}

/**
 * 性能趋势接口
 */
export interface PerformanceTrend {
  /** 指标名称 */
  readonly name: string;
  /** 趋势方向 */
  readonly direction: 'UP' | 'DOWN' | 'STABLE';
  /** 变化百分比 */
  readonly changePercentage: number;
  /** 趋势数据点 */
  readonly dataPoints: DataPoint[];
}

/**
 * 数据点接口
 */
export interface DataPoint {
  /** 时间戳 */
  readonly timestamp: Date;
  /** 值 */
  readonly value: number;
}

/**
 * Core 性能监控器
 * 
 * 提供完整的性能监控功能，包括指标收集、告警、报告等。
 */
@Injectable()
export class CorePerformanceMonitor implements IPerformanceMonitor {
  private readonly metrics = new Map<string, MetricData>();
  private readonly timers = new Map<string, TimerData>();
  private readonly alerts: AlertInfo[] = [];

  constructor(
    private readonly logger: PinoLoggerService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 记录性能指标
   */
  async recordMetric(
    name: string,
    value: number,
    tags: Record<string, string> = {},
  ): Promise<void> {
    const key = this.getMetricKey(name, tags);
    const metric = this.metrics.get(key) || { name, tags, values: [], count: 0, sum: 0 };
    
    metric.values.push(value);
    metric.count++;
    metric.sum += value;
    
    this.metrics.set(key, metric);
    
    // 记录日志
    this.logger.debug('Metric recorded', {
      name,
      value,
      tags,
      count: metric.count,
      average: metric.sum / metric.count,
    });
  }

  /**
   * 记录直方图指标
   */
  async recordHistogram(
    name: string,
    value: number,
    tags: Record<string, string> = {},
  ): Promise<void> {
    await this.recordMetric(`${name}_histogram`, value, tags);
  }

  /**
   * 记录计数器指标
   */
  async recordCounter(
    name: string,
    increment: number = 1,
    tags: Record<string, string> = {},
  ): Promise<void> {
    await this.recordMetric(`${name}_counter`, increment, tags);
  }

  /**
   * 记录计时器
   */
  async recordTimer(
    name: string,
    duration: number,
    tags: Record<string, string> = {},
  ): Promise<void> {
    await this.recordMetric(`${name}_timer`, duration, tags);
  }

  /**
   * 开始计时
   */
  startTimer(name: string, tags: Record<string, string> = {}): ITimer {
    const startTime = Date.now();
    const timerId = `${name}_${Date.now()}_${Math.random()}`;
    
    const timer: ITimer = {
      stop: () => {
        const duration = Date.now() - startTime;
        this.recordTimer(name, duration, tags);
      },
      getDuration: () => Date.now() - startTime,
    };
    
    return timer;
  }

  /**
   * 发送告警
   */
  async sendAlert(alert: AlertInfo): Promise<void> {
    this.alerts.push(alert);
    
    // 记录告警日志
    this.logger.warn('Alert sent', {
      type: alert.type,
      severity: alert.severity,
      message: alert.message,
      details: alert.details,
      timestamp: alert.timestamp,
      tenantId: alert.tenantId,
    });
    
    // 根据严重程度决定是否立即处理
    if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
      await this.handleCriticalAlert(alert);
    }
  }

  /**
   * 获取性能报告
   */
  async getPerformanceReport(timeRange: TimeRange): Promise<PerformanceReport> {
    const metrics = this.calculateMetricStatistics(timeRange);
    const alerts = this.calculateAlertStatistics(timeRange);
    const trends = this.calculatePerformanceTrends(timeRange);
    
    return {
      timeRange,
      metrics,
      alerts,
      trends,
    };
  }

  /**
   * 计算指标统计
   */
  private calculateMetricStatistics(timeRange: TimeRange): MetricStatistics[] {
    const statistics: MetricStatistics[] = [];
    
    for (const [key, metric] of this.metrics) {
      if (metric.values.length === 0) continue;
      
      const sortedValues = [...metric.values].sort((a, b) => a - b);
      const average = metric.sum / metric.count;
      const min = sortedValues[0];
      const max = sortedValues[sortedValues.length - 1];
      
      // 计算百分位数
      const percentiles: Record<string, number> = {};
      const percentilesToCalculate = [50, 90, 95, 99];
      
      for (const p of percentilesToCalculate) {
        const index = Math.ceil((p / 100) * sortedValues.length) - 1;
        percentiles[`p${p}`] = sortedValues[index];
      }
      
      statistics.push({
        name: metric.name,
        average,
        min,
        max,
        count: metric.count,
        percentiles,
      });
    }
    
    return statistics;
  }

  /**
   * 计算告警统计
   */
  private calculateAlertStatistics(timeRange: TimeRange): AlertStatistics {
    const filteredAlerts = this.alerts.filter(
      alert => alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end
    );
    
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    
    for (const alert of filteredAlerts) {
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      byType[alert.type] = (byType[alert.type] || 0) + 1;
    }
    
    return {
      total: filteredAlerts.length,
      bySeverity,
      byType,
    };
  }

  /**
   * 计算性能趋势
   */
  private calculatePerformanceTrends(timeRange: TimeRange): PerformanceTrend[] {
    // 简化的趋势计算，实际实现会更复杂
    const trends: PerformanceTrend[] = [];
    
    for (const [key, metric] of this.metrics) {
      if (metric.values.length < 2) continue;
      
      const firstHalf = metric.values.slice(0, Math.floor(metric.values.length / 2));
      const secondHalf = metric.values.slice(Math.floor(metric.values.length / 2));
      
      const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
      
      const changePercentage = ((secondAvg - firstAvg) / firstAvg) * 100;
      
      let direction: 'UP' | 'DOWN' | 'STABLE';
      if (Math.abs(changePercentage) < 5) {
        direction = 'STABLE';
      } else if (changePercentage > 0) {
        direction = 'UP';
      } else {
        direction = 'DOWN';
      }
      
      trends.push({
        name: metric.name,
        direction,
        changePercentage,
        dataPoints: metric.values.map((value, index) => ({
          timestamp: new Date(timeRange.start.getTime() + (index * 60000)), // 假设每分钟一个数据点
          value,
        })),
      });
    }
    
    return trends;
  }

  /**
   * 处理严重告警
   */
  private async handleCriticalAlert(alert: AlertInfo): Promise<void> {
    // 发送紧急通知
    this.logger.error('Critical alert received', {
      type: alert.type,
      message: alert.message,
      details: alert.details,
    });
    
    // 这里可以集成外部告警系统，如邮件、短信、Slack等
  }

  /**
   * 获取指标键
   */
  private getMetricKey(name: string, tags: Record<string, string>): string {
    const tagString = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}:${value}`)
      .join(',');
    
    return tagString ? `${name}[${tagString}]` : name;
  }
}

/**
 * 性能监控装饰器
 * 
 * 为方法添加性能监控功能。
 * 
 * @param name 监控名称
 * @param tags 标签
 * 
 * @example
 * ```typescript
 * @PerformanceMonitor('user_service.create_user', { service: 'user' })
 * async createUser(userData: CreateUserData): Promise<User> {
 *   // 方法实现
 * }
 * ```
 */
export const PerformanceMonitor = (
  name: string,
  tags: Record<string, string> = {},
): MethodDecorator => {
  return (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const performanceMonitor = this.performanceMonitor as IPerformanceMonitor;
      const timer = performanceMonitor.startTimer(name, tags);
      
      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        // 记录错误指标
        await performanceMonitor.recordCounter(`${name}_errors`, 1, tags);
        throw error;
      } finally {
        timer.stop();
      }
    };
    
    return descriptor;
  };
};
```

#### 1.9 测试支持系统

```typescript
/**
 * Core 测试模块
 * 
 * 提供完整的测试支持，包括测试工具、模拟对象、测试数据生成等。
 */
export class CoreTestingModule {
  /**
   * 创建测试模块
   * 
   * @param moduleMetadata 模块元数据
   * @returns 测试模块
   */
  static createTestingModule(moduleMetadata: TestingModuleMetadata): TestingModule {
    return Test.createTestingModule({
      ...moduleMetadata,
      imports: [
        ...(moduleMetadata.imports || []),
        CoreModule.forRoot({
          // 测试配置
          eventStore: new InMemoryEventStore(),
          sagaManager: new InMemorySagaManager(),
          messageQueue: new InMemoryMessageQueue(),
          cacheService: new InMemoryCacheService(),
          databaseAdapter: new InMemoryDatabaseAdapter(),
          performanceMonitor: new InMemoryPerformanceMonitor(),
        }),
      ],
    });
  }

  /**
   * 创建集成测试模块
   * 
   * @param moduleMetadata 模块元数据
   * @returns 测试模块
   */
  static createIntegrationTestingModule(moduleMetadata: TestingModuleMetadata): TestingModule {
    return Test.createTestingModule({
      ...moduleMetadata,
      imports: [
        ...(moduleMetadata.imports || []),
        CoreModule.forRoot({
          // 集成测试配置
          eventStore: new TestEventStore(),
          sagaManager: new TestSagaManager(),
          messageQueue: new TestMessageQueue(),
          cacheService: new TestCacheService(),
          databaseAdapter: new TestDatabaseAdapter(),
          performanceMonitor: new TestPerformanceMonitor(),
        }),
      ],
    });
  }
}

/**
 * Core 测试工具类
 * 
 * 提供各种测试工具和辅助方法。
 */
export class CoreTestUtils {
  /**
   * 创建模拟命令
   * 
   * @param command 命令实例
   * @returns 模拟命令
   */
  static createMockCommand<T extends ICommand>(command: T): T {
    return {
      ...command,
      commandId: 'test-command-id',
      timestamp: new Date(),
    };
  }

  /**
   * 创建模拟查询
   * 
   * @param query 查询实例
   * @returns 模拟查询
   */
  static createMockQuery<T extends IQuery>(query: T): T {
    return {
      ...query,
      queryId: 'test-query-id',
      timestamp: new Date(),
    };
  }

  /**
   * 创建模拟事件
   * 
   * @param event 事件实例
   * @returns 模拟事件
   */
  static createMockEvent<T extends BaseDomainEvent>(event: T): T {
    return {
      ...event,
      eventId: 'test-event-id',
      timestamp: new Date(),
    };
  }

  /**
   * 创建模拟实体ID
   * 
   * @returns 模拟实体ID
   */
  static createMockEntityId(): EntityId {
    return new EntityId('test-entity-id');
  }

  /**
   * 创建模拟审计信息
   * 
   * @param overrides 覆盖属性
   * @returns 模拟审计信息
   */
  static createMockAuditInfo(overrides: Partial<AuditInfo> = {}): AuditInfo {
    return {
      createdAt: new Date(),
      createdBy: 'test-user',
      createdByType: 'user',
      updatedAt: new Date(),
      updatedBy: 'test-user',
      updatedByType: 'user',
      version: 1,
      tenantId: 'test-tenant',
      ...overrides,
    };
  }

  /**
   * 创建模拟数据隔离上下文
   * 
   * @param overrides 覆盖属性
   * @returns 模拟数据隔离上下文
   */
  static createMockDataIsolationContext(
    overrides: Partial<DataIsolationContext> = {},
  ): DataIsolationContext {
    return {
      tenantId: 'test-tenant',
      organizationId: 'test-org',
      departmentId: 'test-dept',
      userId: 'test-user',
      isolationLevel: IsolationLevel.TENANT,
      dataSensitivity: DataSensitivity.INTERNAL,
      accessPermissions: ['read', 'write'],
      customAttributes: {},
      ...overrides,
    };
  }

  /**
   * 创建模拟异步上下文
   * 
   * @param overrides 覆盖属性
   * @returns 模拟异步上下文
   */
  static createMockAsyncContext(
    overrides: Partial<CoreAsyncContext> = {},
  ): CoreAsyncContext {
    return new CoreAsyncContext(
      'test-context-id',
      'test-tenant',
      'test-user',
      'test-org',
      'test-dept',
      'test-request-id',
      'test-correlation-id',
      ...overrides,
    );
  }

  /**
   * 等待异步操作完成
   * 
   * @param ms 等待时间（毫秒）
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 等待条件满足
   * 
   * @param condition 条件函数
   * @param timeout 超时时间（毫秒）
   * @param interval 检查间隔（毫秒）
   */
  static async waitFor(
    condition: () => boolean | Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100,
  ): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await this.wait(interval);
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  }

  /**
   * 创建测试数据生成器
   * 
   * @param template 数据模板
   * @returns 数据生成器
   */
  static createDataGenerator<T>(template: T): () => T {
    return () => {
      // 简单的数据生成逻辑，实际实现会更复杂
      return JSON.parse(JSON.stringify(template));
    };
  }

  /**
   * 创建批量测试数据
   * 
   * @param generator 数据生成器
   * @param count 数量
   * @returns 批量数据
   */
  static createBatchData<T>(generator: () => T, count: number): T[] {
    return Array.from({ length: count }, generator);
  }
}

/**
 * 测试基类
 * 
 * 为测试类提供通用功能。
 */
export abstract class CoreTestBase {
  protected app: INestApplication;
  protected moduleRef: ModuleRef;

  /**
   * 设置测试环境
   */
  async setup(): Promise<void> {
    // 子类实现
  }

  /**
   * 清理测试环境
   */
  async teardown(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
  }

  /**
   * 获取服务实例
   * 
   * @param token 服务令牌
   * @returns 服务实例
   */
  protected getService<T>(token: string | Type<T>): T {
    return this.moduleRef.get(token);
  }

  /**
   * 创建测试用户
   * 
   * @param overrides 覆盖属性
   * @returns 测试用户
   */
  protected createTestUser(overrides: any = {}): any {
    return {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User',
      tenantId: 'test-tenant',
      ...overrides,
    };
  }

  /**
   * 创建测试租户
   * 
   * @param overrides 覆盖属性
   * @returns 测试租户
   */
  protected createTestTenant(overrides: any = {}): any {
    return {
      id: 'test-tenant-id',
      name: 'Test Tenant',
      domain: 'test.example.com',
      ...overrides,
    };
  }
}
```

## 总结

Core 模块作为 Aiofix-AI-SaaS 平台的基础架构库，提供了：

### 1. **统一的架构基础**

- **Clean Architecture**: 清晰的分层架构和依赖倒置
- **CQRS**: 完整的命令查询职责分离，支持装饰器自动注册
- **Event Sourcing**: 事件存储和状态重建能力
- **Event-Driven Architecture**: 异步事件处理机制
- **Saga 模式**: 分布式事务处理能力，支持 RxJS 和装饰器

### 2. **丰富的功能组件**

- **多租户支持**: 智能感知的多层级数据隔离
- **审计追踪**: 完整的实体生命周期管理
- **消息队列**: 异步任务处理和事件发布订阅
- **缓存管理**: 多级缓存和智能缓存策略
- **配置管理**: 类型安全的配置管理
- **日志监控**: 结构化日志和性能监控

### 3. **完善的开发支持**

- **装饰器系统**: 完整的 CQRS 装饰器支持（@CommandHandler、@QueryHandler、@EventsHandler、@Saga）
- **自动发现机制**: CoreExplorerService 自动发现和注册处理器
- **异步上下文**: CoreAsyncContext 支持请求级别的上下文管理
- **错误处理**: CoreUnhandledExceptionBus 统一的异常处理机制
- **性能监控**: CorePerformanceMonitor 完整的性能指标收集和告警
- **测试支持**: CoreTestingModule 和 CoreTestUtils 完整的测试工具

### 4. **强大的扩展能力**

- **模块配置**: 支持 forRoot 和 forRootAsync 配置
- **发布者模式**: 增强的事件和命令发布者，支持验证、日志、监控
- **Fastify 集成**: 高性能 HTTP 服务器支持
- **MongoDB 支持**: 文档数据库集成
- **插件机制**: 灵活的扩展点
- **微服务就绪**: 为未来微服务化奠定基础

### 5. **企业级特性**

- **高可用性**: 支持集群和负载均衡
- **可观测性**: 完整的监控、追踪和性能分析能力
- **安全性**: 权限管理和数据隔离
- **性能优化**: 缓存、连接池、异步处理、性能监控
- **质量保证**: 完整的测试支持和工具

### 6. **参考 @nestjs/cqrs 的优势**

- **装饰器驱动**: 简化 CQRS 组件的注册和使用
- **自动发现**: 减少手动配置，提高开发效率
- **类型安全**: 完整的 TypeScript 类型定义和泛型支持
- **异步上下文**: 支持请求级别的上下文传递
- **错误处理**: 统一的异常处理和监控
- **性能监控**: 内置的性能指标收集和告警机制
- **测试支持**: 完整的测试工具和模拟对象

通过 Core 模块，我们可以确保整个平台的技术架构一致性，提高开发效率，降低维护成本，为构建高质量的 SaaS 平台奠定坚实的基础。Core 模块不仅提供了完整的架构基础，还集成了所有必要的企业级功能，使业务模块能够专注于业务逻辑的实现，而无需关心基础设施的复杂性。

参考 @nestjs/cqrs 的优秀设计，我们的 Core 模块在保持企业级特性的同时，也具备了易用性和开发效率的优势，为团队提供了最佳的开发生态。
