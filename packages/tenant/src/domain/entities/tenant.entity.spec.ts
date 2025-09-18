/**
 * 租户实体测试
 *
 * @description 测试租户实体的功能
 * @since 1.0.0
 */

import {
  Tenant,
  TenantType,
  TenantStatus,
  IsolationStrategy,
} from './tenant.entity';
import { EntityId } from '@aiofix/core';
import { AuditInfoBuilder } from '@aiofix/core';

describe('Tenant', () => {
  let tenantId: EntityId;
  let auditInfo: any;

  beforeEach(() => {
    tenantId = EntityId.generate();
    auditInfo = new AuditInfoBuilder()
      .withCreatedBy('system')
      .withTenantId('system')
      .build();
  });

  describe('构造函数', () => {
    it('应该正确创建租户实体', () => {
      const tenant = new Tenant(
        tenantId,
        'test-tenant',
        '测试租户',
        'test.example.com',
        TenantType.BASIC,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.TRIAL,
        {
          maxUsers: 100,
          enabledFeatures: ['feature1', 'feature2'],
        },
        auditInfo,
      );

      expect(tenant.id).toBe(tenantId);
      expect(tenant.code).toBe('test-tenant');
      expect(tenant.name).toBe('测试租户');
      expect(tenant.domain).toBe('test.example.com');
      expect(tenant.type).toBe(TenantType.BASIC);
      expect(tenant.isolationStrategy).toBe(
        IsolationStrategy.ROW_LEVEL_SECURITY,
      );
      expect(tenant.status).toBe(TenantStatus.TRIAL);
      expect(tenant.configuration.maxUsers).toBe(100);
      expect(tenant.configuration.enabledFeatures).toEqual([
        'feature1',
        'feature2',
      ]);
    });

    it('应该使用默认状态创建租户', () => {
      const tenant = new Tenant(
        tenantId,
        'default-tenant',
        '默认租户',
        'default.example.com',
        TenantType.FREE,
        IsolationStrategy.SCHEMA_PER_TENANT,
        undefined,
        {},
        auditInfo,
      );

      expect(tenant.status).toBe(TenantStatus.TRIAL);
    });

    it('应该发布租户创建事件', () => {
      const tenant = new Tenant(
        tenantId,
        'event-tenant',
        '事件租户',
        'event.example.com',
        TenantType.PROFESSIONAL,
        IsolationStrategy.DATABASE_PER_TENANT,
        TenantStatus.ACTIVE,
        {},
        auditInfo,
      );

      expect(tenant.domainEvents).toHaveLength(1);
      expect(tenant.domainEvents[0].eventType).toBe('TenantCreated');
    });
  });

  describe('状态检查', () => {
    let tenant: Tenant;

    beforeEach(() => {
      tenant = new Tenant(
        tenantId,
        'status-tenant',
        '状态租户',
        'status.example.com',
        TenantType.BASIC,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.ACTIVE,
        {},
        auditInfo,
      );
    });

    it('应该正确检查活跃状态', () => {
      expect(tenant.isActive).toBe(true);
      expect(tenant.isSuspended).toBe(false);
      expect(tenant.isTrial).toBe(false);
      expect(tenant.isExpired).toBe(false);
      expect(tenant.canOperate).toBe(true);
    });

    it('应该正确检查试用状态', () => {
      const trialTenant = new Tenant(
        EntityId.generate(),
        'trial-tenant',
        '试用租户',
        'trial.example.com',
        TenantType.FREE,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.TRIAL,
        {},
        auditInfo,
      );

      expect(trialTenant.isTrial).toBe(true);
      expect(trialTenant.canOperate).toBe(true);
    });

    it('应该正确检查暂停状态', () => {
      const suspendedTenant = new Tenant(
        EntityId.generate(),
        'suspended-tenant',
        '暂停租户',
        'suspended.example.com',
        TenantType.BASIC,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.SUSPENDED,
        {},
        auditInfo,
      );

      expect(suspendedTenant.isSuspended).toBe(true);
      expect(suspendedTenant.canOperate).toBe(false);
    });
  });

  describe('业务方法', () => {
    let tenant: Tenant;
    let initialEventCount: number;

    beforeEach(() => {
      tenant = new Tenant(
        tenantId,
        'business-tenant',
        '业务租户',
        'business.example.com',
        TenantType.PROFESSIONAL,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.TRIAL,
        {},
        auditInfo,
      );
      initialEventCount = tenant.domainEvents.length;
    });

    it('应该能够激活租户', () => {
      tenant.activate('管理员激活');

      expect(tenant.status).toBe(TenantStatus.ACTIVE);
      expect(tenant.domainEvents).toHaveLength(initialEventCount + 1);
      expect(tenant.domainEvents[initialEventCount].eventType).toBe(
        'TenantStatusChanged',
      );
    });

    it('应该能够暂停租户', () => {
      tenant.suspend('违反服务条款');

      expect(tenant.status).toBe(TenantStatus.SUSPENDED);
      expect(tenant.domainEvents).toHaveLength(initialEventCount + 1);
    });

    it('应该能够更新租户配置', () => {
      const newConfig = {
        maxUsers: 200,
        enabledFeatures: ['newFeature'],
      };

      tenant.updateConfiguration(newConfig);

      expect(tenant.configuration.maxUsers).toBe(200);
      expect(tenant.configuration.enabledFeatures).toContain('newFeature');
      expect(tenant.domainEvents).toHaveLength(initialEventCount + 1);
      expect(tenant.domainEvents[initialEventCount].eventType).toBe(
        'TenantConfigurationUpdated',
      );
    });

    it('应该发布状态变更事件', () => {
      tenant.activate();
      expect(tenant.domainEvents[initialEventCount].eventType).toBe(
        'TenantStatusChanged',
      );
    });

    it('应该发布配置更新事件', () => {
      tenant.updateConfiguration({ maxUsers: 150 });
      expect(tenant.domainEvents[initialEventCount].eventType).toBe(
        'TenantConfigurationUpdated',
      );
    });
  });

  describe('配置查询', () => {
    it('应该返回配置的最大用户数', () => {
      const tenant = new Tenant(
        tenantId,
        'config-tenant',
        '配置租户',
        'config.example.com',
        TenantType.BASIC,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.ACTIVE,
        { maxUsers: 75 },
        auditInfo,
      );

      expect(tenant.getMaxUsers()).toBe(75);
    });

    it('应该返回类型默认的最大用户数', () => {
      const tenant = new Tenant(
        tenantId,
        'default-config-tenant',
        '默认配置租户',
        'default-config.example.com',
        TenantType.ENTERPRISE,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.ACTIVE,
        {},
        auditInfo,
      );

      expect(tenant.getMaxUsers()).toBe(10000);
    });

    it('应该正确检查功能启用状态', () => {
      const tenant = new Tenant(
        tenantId,
        'feature-tenant',
        '功能租户',
        'feature.example.com',
        TenantType.PROFESSIONAL,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.ACTIVE,
        { enabledFeatures: ['ai-analysis', 'advanced-reporting'] },
        auditInfo,
      );

      expect(tenant.isFeatureEnabled('ai-analysis')).toBe(true);
      expect(tenant.isFeatureEnabled('basic-feature')).toBe(false);
    });

    it('应该返回正确的API频率限制', () => {
      const tenant = new Tenant(
        tenantId,
        'api-tenant',
        'API租户',
        'api.example.com',
        TenantType.ENTERPRISE,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.ACTIVE,
        { apiRateLimit: 50000 },
        auditInfo,
      );

      expect(tenant.getApiRateLimit()).toBe(50000);
    });

    it('应该返回类型默认的存储限制', () => {
      const tenant = new Tenant(
        tenantId,
        'storage-tenant',
        '存储租户',
        'storage.example.com',
        TenantType.BASIC,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.ACTIVE,
        {},
        auditInfo,
      );

      expect(tenant.getMaxStorage()).toBe(1000);
    });
  });

  describe('边界情况', () => {
    it('应该拒绝空的租户代码', () => {
      expect(() => {
        new Tenant(
          tenantId,
          '',
          '空代码租户',
          'empty.example.com',
          TenantType.FREE,
          IsolationStrategy.ROW_LEVEL_SECURITY,
          TenantStatus.TRIAL,
          {},
          auditInfo,
        );
      }).toThrow('租户代码不能为空');
    });

    it('应该拒绝无效的域名格式', () => {
      expect(() => {
        new Tenant(
          tenantId,
          'invalid-domain',
          '无效域名租户',
          'invalid-domain',
          TenantType.FREE,
          IsolationStrategy.ROW_LEVEL_SECURITY,
          TenantStatus.TRIAL,
          {},
          auditInfo,
        );
      }).toThrow('租户域名格式无效');
    });

    it('应该拒绝激活已删除的租户', () => {
      const tenant = new Tenant(
        tenantId,
        'deleted-tenant',
        '已删除租户',
        'deleted.example.com',
        TenantType.FREE,
        IsolationStrategy.ROW_LEVEL_SECURITY,
        TenantStatus.DELETED,
        {},
        auditInfo,
      );

      expect(() => {
        tenant.activate();
      }).toThrow('无法激活已删除的租户');
    });
  });
});
