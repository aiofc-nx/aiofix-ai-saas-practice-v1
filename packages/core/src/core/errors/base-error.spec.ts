/**
 * BaseError 测试
 *
 * 测试基础错误类的功能，包括错误信息、元数据、上下文、序列化等。
 *
 * @description 基础错误类的单元测试
 * @since 1.0.0
 */

import {
  BaseError,
  BusinessError,
  SystemError,
  ValidationError,
  AuthorizationError,
  NetworkError,
} from './base-error';
import { ErrorCategory, ErrorSeverity, CommonErrorCodes } from './error.types';
import { IErrorContext, IErrorMetadata } from './error.types';

/**
 * 测试用的具体错误类
 */
class TestError extends BaseError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.UNK_UNKNOWN_ERROR,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<import('./error.types').IErrorInfo> = {},
  ) {
    super(message, code, category, severity, metadata, context, info);
  }
}

/**
 * 测试用的具体业务错误类
 */
class TestBusinessError extends BusinessError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<import('./error.types').IErrorInfo> = {},
  ) {
    super(message, code, severity, metadata, context, info);
  }
}

/**
 * 测试用的具体系统错误类
 */
class TestSystemError extends SystemError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.SYS_INTERNAL_ERROR,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<import('./error.types').IErrorInfo> = {},
  ) {
    super(message, code, severity, metadata, context, info);
  }
}

/**
 * 测试用的具体验证错误类
 */
class TestValidationError extends ValidationError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.VAL_INVALID_INPUT,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<import('./error.types').IErrorInfo> = {},
  ) {
    super(message, code, severity, metadata, context, info);
  }
}

/**
 * 测试用的具体授权错误类
 */
class TestAuthorizationError extends AuthorizationError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.AUTH_UNAUTHORIZED,
    severity: ErrorSeverity = ErrorSeverity.HIGH,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<import('./error.types').IErrorInfo> = {},
  ) {
    super(message, code, severity, metadata, context, info);
  }
}

/**
 * 测试用的具体网络错误类
 */
class TestNetworkError extends NetworkError {
  constructor(
    message: string,
    code: string = CommonErrorCodes.NET_CONNECTION_TIMEOUT,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    metadata: Partial<IErrorMetadata> = {},
    context: Partial<IErrorContext> = {},
    info: Partial<import('./error.types').IErrorInfo> = {},
  ) {
    super(message, code, severity, metadata, context, info);
  }
}

let testContext: Partial<IErrorContext>;
let testMetadata: Partial<IErrorMetadata>;

beforeEach(() => {
  testContext = {
    tenantId: 'tenant-123',
    userId: 'user-456',
    requestId: 'req-789',
    correlationId: 'corr-101',
    causationId: 'cause-202',
    userAgent: 'TestAgent/1.0',
    ipAddress: '192.168.1.1',
    timestamp: new Date(),
    source: 'SYSTEM',
  };

  testMetadata = {
    code: CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
    severity: ErrorSeverity.MEDIUM,
    recoverable: true,
    retryable: false,
    loggable: true,
    alertable: false,
    monitorable: true,
    tags: ['entity', 'not-found'],
    description: 'Test error description',
    solution: 'Test error solution',
  };
});

describe('BaseError', () => {
  describe('构造函数', () => {
    it('应该正确创建基础错误', () => {
      const error = new TestError(
        'Test error message',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        testMetadata,
        testContext,
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
      expect(error.category).toBe(ErrorCategory.BUSINESS);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.metadata).toEqual(expect.objectContaining(testMetadata));
      expect(error.context).toEqual(expect.objectContaining(testContext));
    });

    it('应该使用默认值创建错误', () => {
      const error = new TestError('Simple error message');

      expect(error.message).toBe('Simple error message');
      expect(error.code).toBe(CommonErrorCodes.UNK_UNKNOWN_ERROR);
      expect(error.category).toBe(ErrorCategory.UNKNOWN);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.metadata).toBeDefined();
      expect(error.context).toBeDefined();
    });

    it('应该正确设置错误名称', () => {
      const error = new TestError('Test error');
      expect(error.name).toBe('TestError');
    });

    it('应该正确设置堆栈跟踪', () => {
      const error = new TestError('Test error');
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('TestError');
    });
  });

  describe('错误信息获取', () => {
    it('应该正确获取错误信息', () => {
      const error = new TestError('Test error message');
      expect(error.getMessage()).toBe('Test error message');
    });

    it('应该正确获取错误代码', () => {
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
      );
      expect(error.getCode()).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
    });

    it('应该正确获取错误类别', () => {
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
      );
      expect(error.getCategory()).toBe(ErrorCategory.BUSINESS);
    });

    it('应该正确获取错误严重性', () => {
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.HIGH,
      );
      expect(error.getSeverity()).toBe(ErrorSeverity.HIGH);
    });

    it('应该正确获取错误元数据', () => {
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        testMetadata,
      );
      expect(error.getMetadata()).toEqual(
        expect.objectContaining(testMetadata),
      );
    });

    it('应该正确获取错误上下文', () => {
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        testMetadata,
        testContext,
      );
      expect(error.getContext()).toEqual(expect.objectContaining(testContext));
    });
  });

  describe('错误链', () => {
    it('应该正确设置错误原因', () => {
      const cause = new Error('Original error');
      const error = new TestError('Test error');
      error.setCause(cause);

      expect(error.getCause()).toBe(cause);
      expect(error.cause).toBe(cause);
    });

    it('应该正确获取错误链', () => {
      const cause1 = new Error('Root cause');
      const cause2 = new TestError('Intermediate error');
      cause2.setCause(cause1);
      const error = new TestError('Top error');
      error.setCause(cause2);

      const chain = error.getErrorChain();
      expect(chain).toHaveLength(3);
      expect(chain[0]).toBe(error);
      expect(chain[1]).toBe(cause2);
      expect(chain[2]).toBe(cause1);
    });

    it('应该正确处理没有原因的错误链', () => {
      const error = new TestError('Test error');
      const chain = error.getErrorChain();
      expect(chain).toHaveLength(1);
      expect(chain[0]).toBe(error);
    });
  });

  describe('错误验证', () => {
    it('应该正确验证错误是否可恢复', () => {
      const recoverableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { recoverable: true },
      );
      const nonRecoverableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { recoverable: false },
      );

      expect(recoverableError.isRecoverable()).toBe(true);
      expect(nonRecoverableError.isRecoverable()).toBe(false);
    });

    it('应该正确验证错误是否可重试', () => {
      const retryableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { retryable: true },
      );
      const nonRetryableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { retryable: false },
      );

      expect(retryableError.isRetryable()).toBe(true);
      expect(nonRetryableError.isRetryable()).toBe(false);
    });

    it('应该正确验证错误是否可记录', () => {
      const loggableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { loggable: true },
      );
      const nonLoggableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { loggable: false },
      );

      expect(loggableError.isLoggable()).toBe(true);
      expect(nonLoggableError.isLoggable()).toBe(false);
    });

    it('应该正确验证错误是否可告警', () => {
      const alertableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { alertable: true },
      );
      const nonAlertableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { alertable: false },
      );

      expect(alertableError.isAlertable()).toBe(true);
      expect(nonAlertableError.isAlertable()).toBe(false);
    });

    it('应该正确验证错误是否可监控', () => {
      const monitorableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { monitorable: true },
      );
      const nonMonitorableError = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { monitorable: false },
      );

      expect(monitorableError.isMonitorable()).toBe(true);
      expect(nonMonitorableError.isMonitorable()).toBe(false);
    });
  });

  describe('错误标签', () => {
    it('应该正确检查错误标签', () => {
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { tags: ['entity', 'not-found', 'user'] },
      );

      expect(error.hasTag('entity')).toBe(true);
      expect(error.hasTag('not-found')).toBe(true);
      expect(error.hasTag('user')).toBe(true);
      expect(error.hasTag('invalid')).toBe(false);
    });

    it('应该正确获取所有标签', () => {
      const tags = ['entity', 'not-found', 'user'];
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        { tags },
      );

      expect(error.getTags()).toEqual(tags);
    });

    it('应该正确处理空标签', () => {
      const error = new TestError('Test error');
      expect(error.getTags()).toEqual([]);
      expect(error.hasTag('any')).toBe(false);
    });
  });

  describe('错误序列化', () => {
    it('应该正确序列化为JSON', () => {
      const error = new TestError(
        'Test error message',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        testMetadata,
        testContext,
      );

      const json = error.toJSON();
      expect(json.message).toBe('Test error message');
      expect(json.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
      expect(json.category).toBe(ErrorCategory.BUSINESS);
      expect(json.severity).toBe(ErrorSeverity.MEDIUM);
      expect(json.metadata).toEqual(expect.objectContaining(testMetadata));
      expect(json.context).toEqual(expect.objectContaining(testContext));
      expect(json.name).toBe('TestError');
      expect(json.timestamp).toBeDefined();
    });

    it('应该正确序列化为字符串', () => {
      const error = new TestError('Test error message');
      const str = error.toString();

      expect(str).toContain('TestError');
      expect(str).toContain('Test error message');
    });

    it('应该正确序列化错误链', () => {
      const cause = new Error('Original error');
      const error = new TestError('Test error');
      error.setCause(cause);

      const json = error.toJSON();
      expect(json.cause).toBeDefined();
      expect((json.cause as Error).message).toBe('Original error');
    });
  });

  describe('错误比较', () => {
    it('应该正确比较相同类型的错误', () => {
      const error1 = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
      );
      const error2 = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
      );

      expect(error1.isSameType(error2)).toBe(true);
    });

    it('应该正确比较不同类型的错误', () => {
      const error1 = new TestBusinessError('Test error');
      const error2 = new TestSystemError('Test error');

      expect(error1.isSameType(error2)).toBe(false);
    });

    it('应该正确比较不同严重性的错误', () => {
      const error1 = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.HIGH,
      );
      const error2 = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
      );

      expect(error1.isSameSeverity(error2)).toBe(false);
    });
  });

  describe('错误摘要', () => {
    it('应该正确获取错误摘要', () => {
      const error = new TestError(
        'Test error message',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        testMetadata,
        testContext,
      );

      const summary = error.getSummary();
      expect(summary.message).toBe('Test error message');
      expect(summary.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
      expect(summary.category).toBe(ErrorCategory.BUSINESS);
      expect(summary.severity).toBe(ErrorSeverity.MEDIUM);
      expect(summary.recoverable).toBe(true);
      expect(summary.retryable).toBe(false);
      expect(summary.tags).toEqual(['entity', 'not-found']);
    });
  });

  describe('边界情况', () => {
    it('应该处理空消息', () => {
      const error = new TestError('');
      expect(error.message).toBe('');
      expect(error.getMessage()).toBe('');
    });

    it('应该处理特殊字符消息', () => {
      const specialMessage = 'Error with special chars: @#$%^&*()';
      const error = new TestError(specialMessage);
      expect(error.message).toBe(specialMessage);
    });

    it('应该处理长消息', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new TestError(longMessage);
      expect(error.message).toBe(longMessage);
    });

    it('应该处理null和undefined元数据', () => {
      const error = new TestError(
        'Test error',
        CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
        ErrorCategory.BUSINESS,
        ErrorSeverity.MEDIUM,
        undefined,
        undefined,
      );
      expect(error.metadata).toBeDefined();
      expect(error.context).toBeDefined();
    });
  });
});

describe('BusinessError', () => {
  it('应该正确创建业务错误', () => {
    const error = new TestBusinessError(
      'Business error message',
      CommonErrorCodes.BIZ_ENTITY_NOT_FOUND,
      ErrorSeverity.MEDIUM,
      testMetadata,
      testContext,
    );

    expect(error.message).toBe('Business error message');
    expect(error.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
    expect(error.category).toBe(ErrorCategory.BUSINESS);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.name).toBe('TestBusinessError');
  });

  it('应该使用默认值创建业务错误', () => {
    const error = new TestBusinessError('Business error message');

    expect(error.message).toBe('Business error message');
    expect(error.code).toBe(CommonErrorCodes.BIZ_ENTITY_NOT_FOUND);
    expect(error.category).toBe(ErrorCategory.BUSINESS);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });
});

describe('SystemError', () => {
  it('应该正确创建系统错误', () => {
    const error = new TestSystemError(
      'System error message',
      CommonErrorCodes.SYS_INTERNAL_ERROR,
      ErrorSeverity.HIGH,
      testMetadata,
      testContext,
    );

    expect(error.message).toBe('System error message');
    expect(error.code).toBe(CommonErrorCodes.SYS_INTERNAL_ERROR);
    expect(error.category).toBe(ErrorCategory.SYSTEM);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.name).toBe('TestSystemError');
  });

  it('应该使用默认值创建系统错误', () => {
    const error = new TestSystemError('System error message');

    expect(error.message).toBe('System error message');
    expect(error.code).toBe(CommonErrorCodes.SYS_INTERNAL_ERROR);
    expect(error.category).toBe(ErrorCategory.SYSTEM);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });
});

describe('ValidationError', () => {
  it('应该正确创建验证错误', () => {
    const error = new TestValidationError(
      'Validation error message',
      CommonErrorCodes.VAL_INVALID_INPUT,
      ErrorSeverity.MEDIUM,
      testMetadata,
      testContext,
    );

    expect(error.message).toBe('Validation error message');
    expect(error.code).toBe(CommonErrorCodes.VAL_INVALID_INPUT);
    expect(error.category).toBe(ErrorCategory.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.name).toBe('TestValidationError');
  });

  it('应该使用默认值创建验证错误', () => {
    const error = new TestValidationError('Validation error message');

    expect(error.message).toBe('Validation error message');
    expect(error.code).toBe(CommonErrorCodes.VAL_INVALID_INPUT);
    expect(error.category).toBe(ErrorCategory.VALIDATION);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });
});

describe('AuthorizationError', () => {
  it('应该正确创建授权错误', () => {
    const error = new TestAuthorizationError(
      'Authorization error message',
      CommonErrorCodes.AUTH_UNAUTHORIZED,
      ErrorSeverity.HIGH,
      testMetadata,
      testContext,
    );

    expect(error.message).toBe('Authorization error message');
    expect(error.code).toBe(CommonErrorCodes.AUTH_UNAUTHORIZED);
    expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
    expect(error.name).toBe('TestAuthorizationError');
  });

  it('应该使用默认值创建授权错误', () => {
    const error = new TestAuthorizationError('Authorization error message');

    expect(error.message).toBe('Authorization error message');
    expect(error.code).toBe(CommonErrorCodes.AUTH_UNAUTHORIZED);
    expect(error.category).toBe(ErrorCategory.AUTHORIZATION);
    expect(error.severity).toBe(ErrorSeverity.HIGH);
  });
});

describe('NetworkError', () => {
  it('应该正确创建网络错误', () => {
    const error = new TestNetworkError(
      'Network error message',
      CommonErrorCodes.NET_CONNECTION_TIMEOUT,
      ErrorSeverity.MEDIUM,
      testMetadata,
      testContext,
    );

    expect(error.message).toBe('Network error message');
    expect(error.code).toBe(CommonErrorCodes.NET_CONNECTION_TIMEOUT);
    expect(error.category).toBe(ErrorCategory.NETWORK);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
    expect(error.name).toBe('TestNetworkError');
  });

  it('应该使用默认值创建网络错误', () => {
    const error = new TestNetworkError('Network error message');

    expect(error.message).toBe('Network error message');
    expect(error.code).toBe(CommonErrorCodes.NET_CONNECTION_TIMEOUT);
    expect(error.category).toBe(ErrorCategory.NETWORK);
    expect(error.severity).toBe(ErrorSeverity.MEDIUM);
  });
});
