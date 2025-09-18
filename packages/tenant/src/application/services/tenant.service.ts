/**
 * 租户应用服务
 *
 * @description 租户管理的应用服务，封装租户相关的业务逻辑和用例
 * 遵循Clean Architecture的应用层职责
 *
 * ## 业务规则
 *
 * ### 租户创建规则
 * - 租户代码必须全局唯一
 * - 租户域名必须全局唯一
 * - 新创建的租户默认为试用状态
 * - 创建时必须指定隔离策略
 *
 * ### 租户状态管理规则
 * - 只有活跃和试用状态的租户可以操作
 * - 暂停的租户可以恢复为活跃状态
 * - 删除的租户不能恢复为其他状态
 * - 状态变更需要记录原因和操作者
 *
 * ### 租户配置管理规则
 * - 配置变更需要验证合法性
 * - 某些配置变更需要租户确认
 * - 配置降级需要特殊权限
 * - 配置变更需要记录审计日志
 *
 * @example
 * ```typescript
 * @Controller('tenants')
 * export class TenantController {
 *   constructor(private readonly tenantService: TenantService) {}
 *
 *   @Post()
 *   async createTenant(@Body() dto: CreateTenantDto) {
 *     const command = new CreateTenantCommand(
 *       dto.code,
 *       dto.name,
 *       dto.domain,
 *       dto.type,
 *       dto.isolationStrategy,
 *       dto.configuration
 *     );
 *     return this.tenantService.createTenant(command);
 *   }
 *
 *   @Put(':id/activate')
 *   async activateTenant(@Param('id') id: string, @Body() dto: ActivateTenantDto) {
 *     const command = new ActivateTenantCommand(EntityId.fromString(id), dto.reason);
 *     return this.tenantService.activateTenant(command);
 *   }
 * }
 * ```
 *
 * @since 1.0.0
 */

import { Injectable } from '@nestjs/common';
import { EntityId } from '@aiofix/core';
import {
  Tenant,
  TenantType,
  TenantStatus,
  IsolationStrategy,
  ITenantConfiguration,
} from '../../domain/entities/tenant.entity';
import { ITenantRepository } from '../../domain/repositories/tenant.repository.interface';

/**
 * 创建租户命令
 */
export interface ICreateTenantCommand {
  code: string;
  name: string;
  domain: string;
  type: TenantType;
  isolationStrategy: IsolationStrategy;
  configuration?: ITenantConfiguration;
  createdBy: string;
}

/**
 * 更新租户命令
 */
export interface IUpdateTenantCommand {
  id: EntityId;
  name?: string;
  domain?: string;
  configuration?: Partial<ITenantConfiguration>;
  updatedBy: string;
}

/**
 * 激活租户命令
 */
export interface IActivateTenantCommand {
  id: EntityId;
  reason: string;
  activatedBy: string;
}

/**
 * 暂停租户命令
 */
export interface ISuspendTenantCommand {
  id: EntityId;
  reason: string;
  suspendedBy: string;
}

/**
 * 租户应用服务
 */
@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    // private readonly eventBus: IEventBus, // 需要注入事件总线
    // private readonly logger: ILoggerService, // 需要注入日志服务
  ) {}

  /**
   * 创建租户
   */
  async createTenant(command: ICreateTenantCommand): Promise<Tenant> {
    // 验证租户代码唯一性
    const existingByCode = await this.tenantRepository.findByCode(command.code);
    if (existingByCode) {
      throw new Error(`租户代码 ${command.code} 已存在`);
    }

    // 验证租户域名唯一性
    const existingByDomain = await this.tenantRepository.findByDomain(
      command.domain,
    );
    if (existingByDomain) {
      throw new Error(`租户域名 ${command.domain} 已存在`);
    }

    // 创建租户实体
    const tenant = new Tenant(
      EntityId.generate(),
      command.code,
      command.name,
      command.domain,
      command.type,
      command.isolationStrategy,
      TenantStatus.TRIAL, // 新租户默认为试用状态
      command.configuration || {},
      {
        createdBy: command.createdBy,
        tenantId: 'system', // 系统级操作
      },
    );

    // 保存租户
    const savedTenant = await this.tenantRepository.save(tenant);

    // 发布领域事件
    // await this.eventBus.publishAll(tenant.domainEvents);
    // tenant.clearDomainEvents();

    return savedTenant;
  }

  /**
   * 更新租户信息
   */
  async updateTenant(command: IUpdateTenantCommand): Promise<Tenant> {
    // 获取租户
    const tenant = await this.tenantRepository.findById(command.id);
    if (!tenant) {
      throw new Error(`租户 ${command.id.toString()} 不存在`);
    }

    // 检查租户状态
    if (!tenant.canOperate) {
      throw new Error(`租户 ${tenant.code} 当前状态不允许更新操作`);
    }

    // 如果更新域名，检查唯一性
    if (command.domain && command.domain !== tenant.domain) {
      const existingByDomain = await this.tenantRepository.findByDomain(
        command.domain,
      );
      if (existingByDomain && !existingByDomain.id.equals(tenant.id)) {
        throw new Error(`租户域名 ${command.domain} 已存在`);
      }
    }

    // 更新配置
    if (command.configuration) {
      tenant.updateConfiguration(command.configuration);
    }

    // 保存更新
    const updatedTenant = await this.tenantRepository.update(tenant);

    // 发布领域事件
    // await this.eventBus.publishAll(tenant.domainEvents);
    // tenant.clearDomainEvents();

    return updatedTenant;
  }

  /**
   * 激活租户
   */
  async activateTenant(command: IActivateTenantCommand): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(command.id);
    if (!tenant) {
      throw new Error(`租户 ${command.id.toString()} 不存在`);
    }

    // 激活租户
    tenant.activate(command.reason);

    // 保存更新
    const activatedTenant = await this.tenantRepository.update(tenant);

    // 发布领域事件
    // await this.eventBus.publishAll(tenant.domainEvents);
    // tenant.clearDomainEvents();

    return activatedTenant;
  }

  /**
   * 暂停租户
   */
  async suspendTenant(command: ISuspendTenantCommand): Promise<Tenant> {
    const tenant = await this.tenantRepository.findById(command.id);
    if (!tenant) {
      throw new Error(`租户 ${command.id.toString()} 不存在`);
    }

    // 暂停租户
    tenant.suspend(command.reason);

    // 保存更新
    const suspendedTenant = await this.tenantRepository.update(tenant);

    // 发布领域事件
    // await this.eventBus.publishAll(tenant.domainEvents);
    // tenant.clearDomainEvents();

    return suspendedTenant;
  }

  /**
   * 根据ID获取租户
   */
  async getTenantById(id: EntityId): Promise<Tenant | null> {
    return this.tenantRepository.findById(id);
  }

  /**
   * 根据代码获取租户
   */
  async getTenantByCode(code: string): Promise<Tenant | null> {
    return this.tenantRepository.findByCode(code);
  }

  /**
   * 根据域名获取租户
   */
  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findByDomain(domain);
  }

  /**
   * 查询租户列表
   */
  async queryTenants(
    options: ITenantQueryOptions,
  ): Promise<ITenantQueryResult> {
    return this.tenantRepository.findMany(options);
  }

  /**
   * 获取租户统计信息
   */
  async getTenantStatistics(): Promise<{
    total: number;
    byStatus: Record<TenantStatus, number>;
    byType: Record<TenantType, number>;
    byIsolationStrategy: Record<IsolationStrategy, number>;
  }> {
    return this.tenantRepository.getStatistics();
  }

  /**
   * 检查租户代码可用性
   */
  async isCodeAvailable(code: string): Promise<boolean> {
    return !(await this.tenantRepository.existsByCode(code));
  }

  /**
   * 检查租户域名可用性
   */
  async isDomainAvailable(domain: string): Promise<boolean> {
    return !(await this.tenantRepository.existsByDomain(domain));
  }

  /**
   * 批量激活租户
   */
  async batchActivateTenants(
    ids: EntityId[],
    reason: string,
    activatedBy: string,
  ): Promise<number> {
    let activatedCount = 0;

    for (const id of ids) {
      try {
        await this.activateTenant({
          id,
          reason,
          activatedBy,
        });
        activatedCount++;
      } catch (error) {
        // 记录错误但继续处理其他租户
        console.error(`激活租户 ${id.toString()} 失败:`, error);
      }
    }

    return activatedCount;
  }

  /**
   * 批量暂停租户
   */
  async batchSuspendTenants(
    ids: EntityId[],
    reason: string,
    suspendedBy: string,
  ): Promise<number> {
    let suspendedCount = 0;

    for (const id of ids) {
      try {
        await this.suspendTenant({
          id,
          reason,
          suspendedBy,
        });
        suspendedCount++;
      } catch (error) {
        // 记录错误但继续处理其他租户
        console.error(`暂停租户 ${id.toString()} 失败:`, error);
      }
    }

    return suspendedCount;
  }

  /**
   * 清理过期的试用租户
   */
  async cleanupExpiredTrials(daysExpired: number = 30): Promise<number> {
    return this.tenantRepository.cleanupExpiredTrials(daysExpired);
  }
}
