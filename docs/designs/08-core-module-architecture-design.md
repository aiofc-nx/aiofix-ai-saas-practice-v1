# Core模块架构设计方案

## 概述

Core模块是Aiofix-AI-SaaS平台的核心基础架构库，为整个平台提供统一的架构基础、通用功能和横切关注点。本设计方案基于Clean Architecture + CQRS + 事件溯源（ES）+ 事件驱动架构（EDA）的原则，提供完整的企业级功能支持。

## 设计原则

### 1. Clean Architecture分层原则

- **关注点分离**：每个层级职责明确，边界清晰
- **依赖倒置**：高层模块不依赖低层模块，都依赖抽象
- **单一职责**：每个组件只负责一个职责
- **开闭原则**：对扩展开放，对修改封闭

### 2. 横切关注点统一管理

- **通用功能集中**：所有层级都会用到的功能统一管理
- **代码复用最大化**：避免重复实现相同功能
- **配置统一**：提供一致的配置和使用方式
- **标准化接口**：定义统一的接口规范

### 3. 企业级特性支持

- **多租户架构**：支持多层级数据隔离
- **审计追踪**：完整的操作记录和追踪
- **性能监控**：全面的性能指标收集
- **错误处理**：统一的错误处理机制

## 当前架构结构

### 整体分层架构

```text
packages/core/src/
├── 🌐 common/              # 通用功能层 (横切关注点)
│   ├── context/            # 上下文管理
│   ├── decorators/         # 装饰器系统
│   ├── error-handling/     # 错误处理
│   ├── errors/            # 错误类型
│   ├── testing/           # 测试工具
│   └── utils/             # 工具函数
├── 🏛️ domain/              # 领域层
│   └── entities/          # 领域实体
├── 🔧 application/         # 应用层
│   ├── cqrs/              # CQRS实现
│   └── explorers/         # 模块探索器
├── 🏗️ infrastructure/      # 基础设施层
│   ├── database/          # 数据库集成
│   ├── messaging/         # 消息传递
│   ├── monitoring/        # 性能监控
│   ├── storage/           # 存储管理
│   └── web/              # Web集成
└── index.ts               # 统一导出
```

### 架构优势

1. **层次清晰**：每个层级职责明确，符合Clean Architecture原则
2. **横切关注点集中**：通用功能统一管理，避免重复
3. **易于维护**：功能边界清晰，便于定位和修改
4. **可扩展性强**：新功能可以轻松添加到相应层级
5. **测试友好**：每个层级可以独立进行测试

## 详细模块设计

### 1. 通用功能层 (Common Layer)

通用功能层是Core模块的核心，包含所有层级都会使用的横切关注点。

#### 1.1 上下文管理 (Context Management)

```typescript
// 异步上下文管理
export class CoreAsyncContext {
  constructor(
    public readonly id: string,
    public readonly tenantId?: string,
    public readonly userId?: string,
    public readonly organizationId?: string,
    public readonly departmentId?: string,
    public readonly requestId?: string,
    public readonly correlationId?: string,
  ) {}
}

// 上下文管理器
export class CoreAsyncContextManager {
  static of<T extends object>(target: T): CoreAsyncContext | undefined
  static create(options?: ContextOptions): CoreAsyncContext
  attachTo<T extends object>(target: T): void
}
```

**功能特性**：

- 🔄 跨异步操作的上下文传递
- 🌐 支持多租户上下文隔离
- 📊 请求链路追踪能力
- 🔗 完整的生命周期管理

#### 1.2 装饰器系统 (Decorator System)

```typescript
// CQRS装饰器
@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  async execute(command: CreateUserCommand): Promise<void> {
    // 实现逻辑
  }
}

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  async execute(query: GetUserQuery): Promise<User> {
    // 实现逻辑
  }
}

@EventHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // 实现逻辑
  }
}

@Saga()
export class UserOnboardingSaga {
  userCreated = (events$: Observable<UserCreatedEvent>): Observable<ICommand> => {
    // Saga逻辑
  }
}
```

**功能特性**：

- 🎯 自动注册CQRS组件
- 📝 元数据管理和工具
- 🔧 依赖注入集成
- 🚀 开发效率提升

#### 1.3 错误处理系统 (Error Handling)

```typescript
// 统一错误总线
export class CoreErrorBus {
  async publish(error: IErrorInfo): Promise<void>
  subscribe(handler: IErrorHandler): void
  getStatistics(): IErrorStatistics
}

// 异常过滤器
export class CoreExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void
}

// 错误分类器、处理器、通知器
export class ErrorClassifiers { /* 错误分类逻辑 */ }
export class ErrorHandlers { /* 错误处理逻辑 */ }
export class ErrorNotifiers { /* 错误通知逻辑 */ }
```

**功能特性**：

- 🚨 统一错误处理机制
- 📊 错误统计和分析
- 🔔 智能错误通知
- 🛡️ 自动错误恢复

#### 1.4 错误类型定义 (Error Types)

```typescript
// 基础错误类
export abstract class BaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly category: ErrorCategory,
    public readonly context?: IErrorContext,
    public readonly metadata?: IErrorMetadata,
  ) {}
}

// 业务错误类
export class BusinessRuleViolationError extends BaseError
export class ValidationError extends BaseError
export class UnauthorizedError extends BaseError
export class ForbiddenError extends BaseError
export class NotFoundError extends BaseError
```

**功能特性**：

- 📋 完整的错误类型体系
- 🏷️ 错误分类和编码
- 📊 错误上下文信息
- 🔍 错误追踪和分析

#### 1.5 测试工具 (Testing Utilities)

```typescript
// 测试模块
export class CoreTestingModule {
  static createTestingModule(metadata: TestingModuleMetadata): TestingModule
}

// 测试工具
export class CoreTestUtils {
  static createMockCommand<T>(command: T): T
  static createMockQuery<T>(query: T): T
  static createMockEvent<T>(event: T): T
  static waitFor(condition: () => boolean, timeout?: number): Promise<void>
}

// 测试基类
export abstract class CoreTestBase {
  protected app: INestApplication
  async setup(): Promise<void>
  async teardown(): Promise<void>
}
```

**功能特性**：

- 🧪 完整的测试支持工具
- 🎭 模拟对象和数据生成
- ⚡ 异步测试工具
- 🏗️ 测试环境搭建

#### 1.6 工具函数 (Utilities)

```typescript
// 工具函数集合
export class CoreUtils {
  // TODO: 实现通用工具函数
  // - 数据转换工具
  // - 验证工具
  // - 格式化工具
  // - 加密解密工具
}
```

### 2. 领域层 (Domain Layer)

#### 2.1 实体系统 (Entity System)

```typescript
// 基础实体类
export abstract class BaseEntity<T = EntityId> {
  protected readonly _id: T
  protected _auditInfo: AuditInfo
  
  constructor(id: T, auditInfo: Partial<AuditInfo> = {})
  
  get id(): T
  get auditInfo(): Readonly<AuditInfo>
  
  protected markAsUpdated(updateInfo: UpdateInfo): void
  protected markAsDeleted(deleteInfo: DeleteInfo): void
  protected markAsRestored(restoreInfo: RestoreInfo): void
}

// 聚合根类
export abstract class BaseAggregateRoot<T = EntityId> extends BaseEntity<T> {
  private _domainEvents: DomainEvent[] = []
  
  protected addDomainEvent(event: DomainEvent): void
  get domainEvents(): DomainEvent[]
  clearDomainEvents(): void
}

// 实体ID值对象
export class EntityId extends BaseValueObject {
  static generate(): EntityId
  static fromString(value: string): EntityId
  static isValid(value: string): boolean
  
  equals(other: EntityId): boolean
  toString(): string
  compareTo(other: EntityId): number
}

// 基础值对象
export abstract class BaseValueObject {
  equals(other: BaseValueObject): boolean
  toString(): string
  hashCode(): number
}
```

**功能特性**：

- 🏗️ 完整的DDD实体体系
- 📋 审计追踪支持
- 🔄 领域事件管理
- 🆔 类型安全的ID管理

### 3. 应用层 (Application Layer)

#### 3.1 CQRS实现 (CQRS Implementation)

```typescript
// 命令系统
export abstract class BaseCommand {
  readonly commandId: string = uuidv4()
  readonly timestamp: Date = new Date()
}

export interface ICommandHandler<T extends BaseCommand> {
  execute(command: T): Promise<any>
}

// 查询系统
export abstract class BaseQuery {
  readonly queryId: string = uuidv4()
  readonly timestamp: Date = new Date()
}

export interface IQueryHandler<T extends BaseQuery> {
  execute(query: T): Promise<any>
}

// 事件系统
export abstract class BaseDomainEvent {
  constructor(
    public readonly eventId: string,
    public readonly aggregateId: string,
    public readonly eventType: string,
    public readonly timestamp: Date,
    public readonly version: number,
    public readonly tenantId?: string
  ) {}
}

export interface IEventHandler<T extends BaseDomainEvent> {
  handle(event: T): Promise<void>
}

// Saga系统
export interface ISaga {
  readonly sagaId: string
  readonly sagaName: string
}

export interface ISagaManager {
  startSaga(definition: SagaDefinition, context: SagaContext): Promise<string>
  executeNextStep(sagaId: string): Promise<SagaStepResult>
  compensateSaga(sagaId: string): Promise<void>
}
```

**功能特性**：

- ⚡ 完整的CQRS支持
- 🎯 命令查询分离
- 📡 事件驱动架构
- 🔄 Saga分布式事务

#### 3.2 模块探索器 (Module Explorers)

```typescript
// 核心探索服务
export class CoreExplorerService {
  explore(): ExplorationResult
  private exploreCommands(): CommandHandler[]
  private exploreQueries(): QueryHandler[]
  private exploreEvents(): EventHandler[]
  private exploreSagas(): Saga[]
}

// 自动注册服务
export class AutoRegistrationService {
  registerHandlers(): void
  registerSagas(): void
}
```

**功能特性**：

- 🔍 自动发现CQRS组件
- 🚀 自动注册机制
- 🔧 依赖注入集成
- 📊 模块统计信息

### 4. 基础设施层 (Infrastructure Layer)

#### 4.1 数据库集成 (Database Integration)

```typescript
// MongoDB集成
export class MongoDBAdapter implements IDatabaseAdapter {
  async connect(): Promise<void>
  async query(collection: string, filter: any): Promise<any[]>
  async insert(collection: string, document: any): Promise<any>
  async update(collection: string, filter: any, update: any): Promise<any>
  async delete(collection: string, filter: any): Promise<any>
}

export interface MongoDBConfig {
  connectionString: string
  database: string
  maxPoolSize?: number
  serverSelectionTimeoutMS?: number
}
```

**功能特性**：

- 🗄️ MongoDB数据库支持
- 🔌 数据库适配器模式
- 🏊 连接池管理
- 📊 健康检查支持

#### 4.2 消息传递 (Messaging)

```typescript
// 消息队列接口
export interface IMessageQueue {
  publish(queueName: string, message: any, options?: MessageOptions): Promise<void>
  subscribe(queueName: string, handler: MessageHandler): Promise<void>
  schedule(queueName: string, message: any, delay: number): Promise<void>
}

// 消息接口
export interface IMessage {
  readonly id: string
  readonly type: string
  readonly payload: any
  readonly timestamp: Date
  readonly priority: MessagePriority
}
```

**功能特性**：

- 📨 异步消息处理
- ⏰ 延迟任务支持
- 🔄 消息重试机制
- 📊 队列统计监控

#### 4.3 性能监控 (Performance Monitoring)

```typescript
// 性能监控接口
export interface IPerformanceMonitor {
  recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>
  startTimer(name: string, tags?: Record<string, string>): ITimer
  getMetrics(): Promise<IPerformanceMetrics[]>
}

// 性能监控实现
export class CorePerformanceMonitor implements IPerformanceMonitor {
  // 实现性能监控逻辑
}

// 性能监控装饰器
export function MonitorMethod(metricName: string): MethodDecorator
export function MonitorClass(prefix: string): ClassDecorator
```

**功能特性**：

- 📊 实时性能监控
- ⏱️ 方法执行时间统计
- 🏷️ 自定义标签支持
- 📈 性能趋势分析

#### 4.4 存储管理 (Storage Management)

```typescript
// 事件存储
export interface IEventStore {
  saveEvent(event: BaseDomainEvent): Promise<void>
  saveEvents(events: BaseDomainEvent[]): Promise<void>
  getEvents(aggregateId: string, fromVersion?: number): Promise<BaseDomainEvent[]>
  getEventsByType(eventType: string, fromDate?: Date): Promise<BaseDomainEvent[]>
}

export class CoreEventStore implements IEventStore {
  // 事件存储实现
}
```

**功能特性**：

- 📚 事件溯源支持
- 🔄 事件重放能力
- 📊 事件统计分析
- 🗄️ 持久化存储

#### 4.5 Web集成 (Web Integration)

```typescript
// Fastify适配器
export class FastifyAdapter {
  createServer(): Promise<FastifyInstance>
  private registerPlugins(fastify: FastifyInstance): Promise<void>
  private registerMiddleware(fastify: FastifyInstance): Promise<void>
}

// Fastify接口定义
export interface FastifyConfig {
  port: number
  host: string
  cors?: CorsOptions
  helmet?: HelmetOptions
  rateLimit?: RateLimitOptions
}
```

**功能特性**：

- 🚀 高性能HTTP服务器
- 🛡️ 安全中间件集成
- 🔒 CORS和安全头支持
- 📊 请求限流保护

## 技术栈和依赖

### 核心技术栈

- **Node.js**: 运行时环境
- **TypeScript**: 开发语言，提供类型安全
- **NestJS**: 企业级框架，依赖注入和模块化
- **RxJS**: 响应式编程，支持Saga模式

### 数据库和存储

- **MongoDB**: 文档数据库，灵活的数据模型
- **Redis**: 缓存和会话存储
- **Event Store**: 事件溯源存储

### 消息和队列

- **Bull**: Redis队列，异步任务处理
- **Event Bus**: 内存事件总线

### Web和网络

- **Fastify**: 高性能HTTP服务器
- **WebSocket**: 实时通信支持

### 测试和质量

- **Jest**: 测试框架
- **ESLint**: 代码质量检查
- **Prettier**: 代码格式化

### 监控和日志

- **Pino**: 高性能日志库
- **Prometheus**: 指标收集（可选）

## 使用示例

### 1. 基本CQRS使用

```typescript
// 定义命令
export class CreateUserCommand extends BaseCommand {
  constructor(
    public readonly email: string,
    public readonly name: string,
    public readonly tenantId: string
  ) {
    super()
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
    )

    await this.userRepository.save(user)
    
    // 发布领域事件
    await this.eventBus.publishAll(user.domainEvents)
    user.clearDomainEvents()

    return user
  }
}

// 事件处理器
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler implements IEventHandler<UserCreatedEvent> {
  constructor(private readonly emailService: EmailService) {}

  async handle(event: UserCreatedEvent): Promise<void> {
    await this.emailService.sendWelcomeEmail(event.email, event.name)
  }
}
```

### 2. 实体和聚合根使用

```typescript
// 用户聚合根
export class User extends BaseAggregateRoot {
  constructor(
    id: EntityId,
    private _email: string,
    private _name: string,
    private _tenantId: string,
    auditInfo: Partial<AuditInfo>
  ) {
    super(id, auditInfo)
  }
  
  changeEmail(newEmail: string, updateInfo: UpdateInfo): void {
    if (!this.isValidEmail(newEmail)) {
      throw new ValidationError('Invalid email format')
    }
    
    const oldEmail = this._email
    this._email = newEmail
    this.markAsUpdated(updateInfo)
    
    // 发布领域事件
    this.addDomainEvent(new UserEmailChangedEvent(
      this.id,
      oldEmail,
      newEmail,
      this.auditInfo
    ))
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
}
```

### 3. 性能监控使用

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly performanceMonitor: IPerformanceMonitor
  ) {}

  @MonitorMethod('user_service.create_user')
  async createUser(userData: CreateUserData): Promise<User> {
    const timer = this.performanceMonitor.startTimer('user_creation', {
      tenantId: userData.tenantId
    })

    try {
      const user = await this.userRepository.create(userData)
      
      await this.performanceMonitor.recordMetric('users_created_total', 1, {
        tenantId: userData.tenantId
      })

      return user
    } finally {
      timer.stop()
    }
  }
}
```

### 4. 测试支持使用

```typescript
describe('UserService', () => {
  let app: INestApplication
  let userService: UserService

  beforeAll(async () => {
    const module = await CoreTestingModule.createTestingModule({
      imports: [UserModule],
      providers: [UserService],
    }).compile()

    app = module.createNestApplication()
    await app.init()
    userService = app.get<UserService>(UserService)
  })

  afterAll(async () => {
    await app.close()
  })

  it('should create user successfully', async () => {
    const command = CoreTestUtils.createMockCommand(
      new CreateUserCommand('test@example.com', 'Test User', 'tenant-123')
    )

    const result = await userService.createUser(command)

    expect(result).toBeDefined()
    expect(result.email).toBe('test@example.com')
  })
})
```

## 配置和部署

### 1. 模块配置

```typescript
@Module({
  imports: [
    CoreModule.forRoot({
      database: {
        mongodb: {
          connectionString: process.env.MONGODB_URL,
          database: process.env.MONGODB_DATABASE,
        }
      },
      cache: {
        redis: {
          host: process.env.REDIS_HOST,
          port: parseInt(process.env.REDIS_PORT),
        }
      },
      messaging: {
        queue: {
          redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
          }
        }
      }
    })
  ]
})
export class AppModule {}
```

### 2. 环境配置

```env
# 数据库配置
MONGODB_URL=mongodb://localhost:27017
MONGODB_DATABASE=aiofix_core

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379

# 应用配置
APP_PORT=3000
APP_HOST=0.0.0.0

# 日志配置
LOG_LEVEL=info
LOG_FORMAT=json
```

## 质量保证

### 1. 测试策略

- **单元测试**: 每个组件都有对应的单元测试，覆盖率要求90%以上
- **集成测试**: 测试组件间的集成和外部系统集成
- **端到端测试**: 完整的功能流程测试

### 2. 代码质量

- **TypeScript**: 严格类型检查，使用强类型
- **ESLint**: 代码规范检查和最佳实践
- **Prettier**: 统一的代码格式化
- **Husky**: Git钩子，确保代码质量

### 3. 性能监控

- **指标收集**: 自动收集性能指标和业务指标
- **告警机制**: 异常情况自动告警
- **性能分析**: 定期性能分析和优化

## 扩展和维护

### 1. 扩展机制

- **插件系统**: 支持第三方插件扩展
- **中间件机制**: 灵活的中间件支持
- **事件机制**: 基于事件的扩展点
- **配置驱动**: 通过配置控制功能开关

### 2. 版本管理

- **语义化版本**: 遵循SemVer版本规范
- **向后兼容**: 保持API的向后兼容性
- **迁移指南**: 提供详细的升级指南
- **废弃通知**: 提前通知API废弃计划

### 3. 文档维护

- **API文档**: 自动生成的完整API文档
- **架构文档**: 详细的架构设计文档
- **使用指南**: 完整的使用示例和最佳实践
- **更新日志**: 详细的版本更新记录

## 未来规划

### 1. 微服务支持

- **服务发现**: 自动服务注册和发现
- **负载均衡**: 智能负载均衡策略
- **熔断器**: 服务故障隔离机制
- **分布式追踪**: 跨服务的请求追踪

### 2. 云原生支持

- **容器化**: Docker容器支持
- **Kubernetes**: K8s部署和管理
- **云服务集成**: 主流云服务商集成
- **弹性扩缩容**: 自动扩缩容机制

### 3. AI功能增强

- **智能监控**: AI驱动的异常检测
- **自动优化**: 基于AI的性能优化
- **智能运维**: AI辅助的运维决策
- **预测分析**: 基于历史数据的预测

## 总结

Core模块作为Aiofix-AI-SaaS平台的基础架构库，提供了：

### 核心价值

1. **统一的架构基础**: 基于Clean Architecture的清晰分层
2. **完整的CQRS支持**: 装饰器驱动的命令查询分离
3. **事件驱动架构**: 完整的事件处理和Saga支持
4. **横切关注点管理**: 统一的错误处理、监控、测试支持
5. **企业级特性**: 多租户、审计、性能监控等

### 架构优势

1. **清晰的职责分离**: 每个层级职责明确，易于维护
2. **高度的可扩展性**: 支持插件和中间件扩展
3. **完善的测试支持**: 全面的测试工具和框架
4. **优秀的开发体验**: 装饰器驱动，简化开发流程
5. **生产就绪**: 完整的监控、日志、错误处理机制

通过Core模块，我们建立了一个坚实的技术基础，为构建高质量、可维护、可扩展的SaaS平台奠定了基础。这个设计方案完全基于当前的实际代码结构，真实反映了我们的架构现状和未来发展方向。
