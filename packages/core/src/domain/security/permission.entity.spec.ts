/**
 * 权限实体测试
 *
 * @description 测试权限实体的核心功能和业务规则
 * @since 1.0.0
 */

import {
  Permission,
  PermissionScope,
  PermissionType,
  PermissionStatus,
} from './permission.entity';
import { EntityId } from '../entities/value-objects/entity-id';
import { AuditInfoBuilder } from '../entities/base/audit-info';

describe('Permission', () => {
  let permissionId: EntityId;
  let auditInfo: any;

  beforeEach(() => {
    permissionId = EntityId.generate();
    auditInfo = new AuditInfoBuilder()
      .withCreatedBy('admin-001')
      .withTenantId('system')
      .build();
  });

  describe('构造函数', () => {
    it('应该正确创建权限实体', () => {
      const permission = new Permission(
        permissionId,
        'document:read',
        '文档读取权限',
        '允许读取文档内容',
        PermissionScope.RESOURCE,
        PermissionType.DATA,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );

      expect(permission.id).toBe(permissionId);
      expect(permission.code).toBe('document:read');
      expect(permission.name).toBe('文档读取权限');
      expect(permission.description).toBe('允许读取文档内容');
      expect(permission.scope).toBe(PermissionScope.RESOURCE);
      expect(permission.type).toBe(PermissionType.DATA);
      expect(permission.status).toBe(PermissionStatus.ACTIVE);
    });

    it('应该使用默认状态创建权限', () => {
      const permission = new Permission(
        permissionId,
        'document:read',
        '文档读取权限',
        '允许读取文档内容',
        PermissionScope.RESOURCE,
        PermissionType.DATA,
        undefined,
        [],
        {},
        auditInfo,
      );

      expect(permission.status).toBe(PermissionStatus.ACTIVE);
    });
  });

  describe('状态检查', () => {
    let permission: Permission;

    beforeEach(() => {
      permission = new Permission(
        permissionId,
        'document:read',
        '文档读取权限',
        '允许读取文档内容',
        PermissionScope.RESOURCE,
        PermissionType.DATA,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );
    });

    it('应该正确检查活跃状态', () => {
      expect(permission.isActive).toBe(true);
      expect(permission.isDisabled).toBe(false);
      expect(permission.isDeprecated).toBe(false);
    });

    it('应该正确检查禁用状态', () => {
      permission.disable('测试禁用');
      expect(permission.isDisabled).toBe(true);
      expect(permission.isActive).toBe(false);
    });

    it('应该正确检查废弃状态', () => {
      permission.deprecate('测试废弃', 'document:read:v2');
      expect(permission.isDeprecated).toBe(true);
      expect(permission.isActive).toBe(false);
    });
  });

  describe('业务方法', () => {
    let permission: Permission;

    beforeEach(() => {
      permission = new Permission(
        permissionId,
        'document:read',
        '文档读取权限',
        '允许读取文档内容',
        PermissionScope.RESOURCE,
        PermissionType.DATA,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );
    });

    it('应该能够禁用权限', () => {
      permission.disable('安全原因');
      expect(permission.status).toBe(PermissionStatus.DISABLED);
      expect(permission.metadata.disableReason).toBe('安全原因');
      expect(permission.metadata.disabledAt).toBeDefined();
    });

    it('应该能够启用权限', () => {
      permission.disable('测试');
      permission.enable();
      expect(permission.status).toBe(PermissionStatus.ACTIVE);
      expect(permission.metadata.disableReason).toBeUndefined();
      expect(permission.metadata.enabledAt).toBeDefined();
    });

    it('应该能够废弃权限', () => {
      permission.deprecate('功能升级', 'document:read:v2');
      expect(permission.status).toBe(PermissionStatus.DEPRECATED);
      expect(permission.metadata.deprecationReason).toBe('功能升级');
      expect(permission.metadata.replacementPermission).toBe(
        'document:read:v2',
      );
    });
  });

  describe('依赖管理', () => {
    let permission: Permission;

    beforeEach(() => {
      permission = new Permission(
        permissionId,
        'document:write',
        '文档写入权限',
        '允许写入文档内容',
        PermissionScope.RESOURCE,
        PermissionType.DATA,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );
    });

    it('应该能够添加依赖权限', () => {
      permission.addDependency('document:read');
      expect(permission.dependencies).toContain('document:read');
      expect(permission.dependsOn('document:read')).toBe(true);
    });

    it('应该能够移除依赖权限', () => {
      permission.addDependency('document:read');
      permission.removeDependency('document:read');
      expect(permission.dependencies).not.toContain('document:read');
      expect(permission.dependsOn('document:read')).toBe(false);
    });

    it('应该防止重复添加相同依赖', () => {
      permission.addDependency('document:read');
      permission.addDependency('document:read');
      expect(
        permission.dependencies.filter((d) => d === 'document:read'),
      ).toHaveLength(1);
    });

    it('应该防止循环依赖', () => {
      expect(() => {
        permission.addDependency('document:write');
      }).toThrow('添加依赖 document:write 会造成循环依赖');
    });
  });

  describe('权限层级', () => {
    it('应该正确计算权限层级', () => {
      const permission1 = new Permission(
        EntityId.generate(),
        'system',
        '系统权限',
        '系统级权限',
        PermissionScope.SYSTEM,
        PermissionType.MANAGEMENT,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );

      const permission2 = new Permission(
        EntityId.generate(),
        'system:admin:user',
        '用户管理权限',
        '管理用户的权限',
        PermissionScope.SYSTEM,
        PermissionType.MANAGEMENT,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );

      expect(permission1.getHierarchyLevel()).toBe(1);
      expect(permission2.getHierarchyLevel()).toBe(3);
    });

    it('应该正确获取父权限代码', () => {
      const permission = new Permission(
        permissionId,
        'system:admin:user',
        '用户管理权限',
        '管理用户的权限',
        PermissionScope.SYSTEM,
        PermissionType.MANAGEMENT,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );

      expect(permission.getParentPermissionCode()).toBe('system:admin');
    });

    it('应该正确检查父子关系', () => {
      const parentPermission = new Permission(
        EntityId.generate(),
        'document',
        '文档权限',
        '文档相关权限',
        PermissionScope.RESOURCE,
        PermissionType.DATA,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );

      const childPermission = new Permission(
        EntityId.generate(),
        'document:read',
        '文档读取权限',
        '读取文档的权限',
        PermissionScope.RESOURCE,
        PermissionType.DATA,
        PermissionStatus.ACTIVE,
        [],
        {},
        auditInfo,
      );

      expect(childPermission.isChildOf('document')).toBe(true);
      expect(parentPermission.isParentOf('document:read')).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该拒绝空的权限代码', () => {
      expect(() => {
        new Permission(
          permissionId,
          '',
          '权限名称',
          '权限描述',
          PermissionScope.RESOURCE,
          PermissionType.DATA,
          PermissionStatus.ACTIVE,
          [],
          {},
          auditInfo,
        );
      }).toThrow('权限代码不能为空');
    });

    it('应该拒绝过长的权限代码', () => {
      const longCode = 'a'.repeat(101);
      expect(() => {
        new Permission(
          permissionId,
          longCode,
          '权限名称',
          '权限描述',
          PermissionScope.RESOURCE,
          PermissionType.DATA,
          PermissionStatus.ACTIVE,
          [],
          {},
          auditInfo,
        );
      }).toThrow('权限代码长度不能超过100个字符');
    });

    it('应该拒绝无效的权限代码格式', () => {
      expect(() => {
        new Permission(
          permissionId,
          'invalid:code:',
          '权限名称',
          '权限描述',
          PermissionScope.RESOURCE,
          PermissionType.DATA,
          PermissionStatus.ACTIVE,
          [],
          {},
          auditInfo,
        );
      }).toThrow('权限代码只能包含字母、数字、冒号和下划线');
    });

    it('应该拒绝过深的权限层级', () => {
      expect(() => {
        new Permission(
          permissionId,
          'level1:level2:level3:level4:level5:level6',
          '权限名称',
          '权限描述',
          PermissionScope.RESOURCE,
          PermissionType.DATA,
          PermissionStatus.ACTIVE,
          [],
          {},
          auditInfo,
        );
      }).toThrow('权限层级不能超过5级');
    });
  });
});
