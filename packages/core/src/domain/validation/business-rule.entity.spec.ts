/**
 * 业务规则实体测试
 *
 * @description 测试业务规则实体的核心功能和验证逻辑
 * @since 1.0.0
 */

import {
  BusinessRule,
  RuleType,
  RuleScope,
  RuleStatus,
} from './business-rule.entity';
import { EntityId } from '../entities/value-objects/entity-id';
import { AuditInfoBuilder } from '../entities/base/audit-info';

describe('BusinessRule', () => {
  let ruleId: EntityId;
  let auditInfo: any;

  beforeEach(() => {
    ruleId = EntityId.generate();
    auditInfo = new AuditInfoBuilder()
      .withCreatedBy('admin-001')
      .withTenantId('system')
      .build();
  });

  describe('构造函数', () => {
    it('应该正确创建业务规则实体', () => {
      const validationFunction = (value: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      };

      const rule = new BusinessRule(
        ruleId,
        'user:email:format',
        '邮箱格式验证',
        '验证邮箱地址格式是否正确',
        RuleType.FORMAT_VALIDATION,
        RuleScope.FIELD,
        validationFunction,
        RuleStatus.ACTIVE,
        1,
        0,
        [],
        {},
        auditInfo,
      );

      expect(rule.id).toBe(ruleId);
      expect(rule.code).toBe('user:email:format');
      expect(rule.name).toBe('邮箱格式验证');
      expect(rule.description).toBe('验证邮箱地址格式是否正确');
      expect(rule.type).toBe(RuleType.FORMAT_VALIDATION);
      expect(rule.scope).toBe(RuleScope.FIELD);
      expect(rule.status).toBe(RuleStatus.ACTIVE);
    });

    it('应该使用默认值创建规则', () => {
      const validationFunction = (value: any): boolean => true;

      const rule = new BusinessRule(
        ruleId,
        'test:rule',
        '测试规则',
        '测试规则描述',
        RuleType.BUSINESS_LOGIC,
        RuleScope.ENTITY,
        validationFunction,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        auditInfo,
      );

      expect(rule.status).toBe(RuleStatus.ACTIVE);
      expect(rule.ruleVersion).toBe(1);
      expect(rule.priority).toBe(0);
      expect(rule.dependencies).toHaveLength(0);
    });
  });

  describe('状态检查', () => {
    let rule: BusinessRule;

    beforeEach(() => {
      const validationFunction = (value: any): boolean => true;
      rule = new BusinessRule(
        ruleId,
        'test:rule',
        '测试规则',
        '测试规则描述',
        RuleType.BUSINESS_LOGIC,
        RuleScope.ENTITY,
        validationFunction,
        RuleStatus.ACTIVE,
        1,
        0,
        [],
        {},
        auditInfo,
      );
    });

    it('应该正确检查活跃状态', () => {
      expect(rule.isActive).toBe(true);
      expect(rule.isDisabled).toBe(false);
      expect(rule.isTesting).toBe(false);
      expect(rule.isDeprecated).toBe(false);
    });

    it('应该正确检查禁用状态', () => {
      rule.disable('测试禁用');
      expect(rule.isDisabled).toBe(true);
      expect(rule.isActive).toBe(false);
    });

    it('应该正确检查测试状态', () => {
      rule.setTesting();
      expect(rule.isTesting).toBe(true);
      expect(rule.isActive).toBe(false);
    });

    it('应该正确检查废弃状态', () => {
      rule.deprecate('测试废弃', 'test:rule:v2');
      expect(rule.isDeprecated).toBe(true);
      expect(rule.isActive).toBe(false);
    });
  });

  describe('验证功能', () => {
    let emailRule: BusinessRule;

    beforeEach(() => {
      const emailValidationFunction = (value: string): boolean => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      };

      emailRule = new BusinessRule(
        ruleId,
        'user:email:format',
        '邮箱格式验证',
        '验证邮箱地址格式是否正确',
        RuleType.FORMAT_VALIDATION,
        RuleScope.FIELD,
        emailValidationFunction,
        RuleStatus.ACTIVE,
        1,
        0,
        [],
        {},
        auditInfo,
      );
    });

    it('应该正确验证有效邮箱', async () => {
      const result = await emailRule.validateValue('user@example.com');
      expect(result).toBe(true);
    });

    it('应该正确验证无效邮箱', async () => {
      const result = await emailRule.validateValue('invalid-email');
      expect(result).toBe(false);
    });

    it('应该返回详细验证结果', async () => {
      const result = await emailRule.validateWithDetails('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('应该返回失败的详细验证结果', async () => {
      const result = await emailRule.validateWithDetails('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('规则 user:email:format 验证失败');
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it('应该拒绝在非活跃状态下验证', async () => {
      emailRule.disable('测试');
      await expect(emailRule.validateValue('user@example.com')).rejects.toThrow(
        '规则 user:email:format 未激活，无法执行验证',
      );
    });
  });

  describe('依赖管理', () => {
    let rule: BusinessRule;

    beforeEach(() => {
      const validationFunction = (value: any): boolean => true;
      rule = new BusinessRule(
        ruleId,
        'user:create',
        '用户创建规则',
        '用户创建时的验证规则',
        RuleType.BUSINESS_LOGIC,
        RuleScope.ENTITY,
        validationFunction,
        RuleStatus.ACTIVE,
        1,
        0,
        [],
        {},
        auditInfo,
      );
    });

    it('应该能够添加依赖规则', () => {
      rule.addDependency('user:email:format');
      expect(rule.dependencies).toContain('user:email:format');
    });

    it('应该能够移除依赖规则', () => {
      rule.addDependency('user:email:format');
      rule.removeDependency('user:email:format');
      expect(rule.dependencies).not.toContain('user:email:format');
    });

    it('应该防止循环依赖', () => {
      expect(() => {
        rule.addDependency('user:create');
      }).toThrow('添加依赖 user:create 会造成循环依赖');
    });
  });

  describe('优先级管理', () => {
    let rule: BusinessRule;

    beforeEach(() => {
      const validationFunction = (value: any): boolean => true;
      rule = new BusinessRule(
        ruleId,
        'test:rule',
        '测试规则',
        '测试规则描述',
        RuleType.BUSINESS_LOGIC,
        RuleScope.ENTITY,
        validationFunction,
        RuleStatus.ACTIVE,
        1,
        5,
        [],
        {},
        auditInfo,
      );
    });

    it('应该正确获取优先级', () => {
      expect(rule.priority).toBe(5);
    });

    it('应该能够更新优先级', () => {
      rule.updatePriority(10);
      expect(rule.priority).toBe(10);
    });

    it('应该拒绝无效的优先级', () => {
      expect(() => {
        rule.updatePriority(-1);
      }).toThrow('优先级必须在0-1000之间');

      expect(() => {
        rule.updatePriority(1001);
      }).toThrow('优先级必须在0-1000之间');
    });
  });

  describe('边界情况', () => {
    it('应该拒绝空的规则代码', () => {
      const validationFunction = (value: any): boolean => true;

      expect(() => {
        new BusinessRule(
          ruleId,
          '',
          '规则名称',
          '规则描述',
          RuleType.BUSINESS_LOGIC,
          RuleScope.ENTITY,
          validationFunction,
          RuleStatus.ACTIVE,
          1,
          0,
          [],
          {},
          auditInfo,
        );
      }).toThrow('规则代码不能为空');
    });

    it('应该拒绝过长的规则代码', () => {
      const validationFunction = (value: any): boolean => true;
      const longCode = 'a'.repeat(101);

      expect(() => {
        new BusinessRule(
          ruleId,
          longCode,
          '规则名称',
          '规则描述',
          RuleType.BUSINESS_LOGIC,
          RuleScope.ENTITY,
          validationFunction,
          RuleStatus.ACTIVE,
          1,
          0,
          [],
          {},
          auditInfo,
        );
      }).toThrow('规则代码长度不能超过100个字符');
    });

    it('应该拒绝无效的规则代码格式', () => {
      const validationFunction = (value: any): boolean => true;

      expect(() => {
        new BusinessRule(
          ruleId,
          'invalid:code:',
          '规则名称',
          '规则描述',
          RuleType.BUSINESS_LOGIC,
          RuleScope.ENTITY,
          validationFunction,
          RuleStatus.ACTIVE,
          1,
          0,
          [],
          {},
          auditInfo,
        );
      }).toThrow('规则代码只能包含字母、数字、冒号、下划线和连字符');
    });

    it('应该拒绝非函数的验证函数', () => {
      expect(() => {
        new BusinessRule(
          ruleId,
          'test:rule',
          '规则名称',
          '规则描述',
          RuleType.BUSINESS_LOGIC,
          RuleScope.ENTITY,
          'not a function' as any,
          RuleStatus.ACTIVE,
          1,
          0,
          [],
          {},
          auditInfo,
        );
      }).toThrow('验证函数必须是一个函数');
    });
  });
});
