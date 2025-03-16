// Déclarations de types pour Jest
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeCloseTo(expected: number, precision?: number): R;
      toBeNull(): R;
      toBe(expected: any): R;
      toHaveBeenCalledWith(...args: any[]): R;
      toHaveBeenCalled(): R;
      toBeDefined(): R;
      not: Matchers<R>;
    }

    interface Mock<T = any, Y extends any[] = any> {
      mockReturnValue(value: T): this;
      mockImplementation(fn: (...args: Y) => T): this;
      mockResolvedValue(value: Partial<T>): this;
      mockReturnThis(): this;
    }

    interface SpyInstance<T = any, Y extends any[] = any> {
      mockImplementationOnce(fn: (...args: Y) => T): this;
    }
  }

  function describe(name: string, fn: () => void): void;
  function beforeEach(fn: () => void): void;
  function it(name: string, fn: () => void | Promise<void>): void;
  function test(name: string, fn: () => void | Promise<void>): void;
  
  interface ExpectStatic {
    <T>(actual: T): jest.Matchers<void>;
    objectContaining(expected: any): any;
  }
  
  const expect: ExpectStatic;
  function fail(message?: string): void;
  
  const jest: {
    fn: <T = any, Y extends any[] = any>() => jest.Mock<T, Y>;
    spyOn: <T, M extends keyof T>(object: T, method: M) => jest.SpyInstance;
    clearAllMocks: () => void;
    mock: (path: string, factory?: () => any) => void;
  };
}

// Déclarations pour les mocks Express
declare module 'express' {
  interface Response {
    status: jest.Mock;
    json: jest.Mock;
  }
}

export {}; 