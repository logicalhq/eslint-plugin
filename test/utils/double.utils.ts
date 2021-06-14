import { DeepPartial } from 'ts-essentials';

export type Double<T> = {
  [k in keyof T]: T[k];
};

export interface DoubleState {
  dirty: Set<string | symbol>;
}

export const Doubles = new WeakMap<any, DoubleState>();

// eslint-disable-next-line @typescript-eslint/ban-types
export const buildProxyHandler = <T extends object>(): ProxyHandler<T> => ({
  get(target: Double<T>, property: string | symbol): unknown {
    return (target as Record<string, unknown>)[
      typeof property === 'symbol' ? property.toString() : property
    ];
  },
  set(
    target: Double<T>,
    property: string | symbol,
    value: unknown,
    receiver: unknown
  ): boolean {
    (target as Record<string, unknown>)[
      typeof property === 'symbol' ? property.toString() : property
    ] = value;
    Doubles.get(receiver)?.dirty.add(property);
    return true;
  },
  ownKeys(target: Double<T>) {
    return Reflect.ownKeys(target);
  }
});

export function makeDouble<T>(stub: DeepPartial<T>): Double<T> {
  const rstub = stub as Record<string, unknown>;
  const proxy = new Proxy<Double<T>>(
    stub as Double<T>,
    buildProxyHandler<Double<T>>()
  );
  const rproxy = proxy as Record<string, unknown>;

  Doubles.set(proxy, {
    dirty: new Set()
  });

  Object.keys(rstub).forEach(name => {
    if (
      rstub[name] != null &&
      (typeof rstub[name] === 'object' || typeof rstub[name] === 'function') &&
      !Array.isArray(rstub[name])
    ) {
      rproxy[name] = makeDouble(rstub[name]);
      return;
    }
    rproxy[name] = rstub[name];
  });

  return proxy;
}

export const double = <T>(
  stub: DeepPartial<T> = {} as DeepPartial<T>
): T & Double<T> => makeDouble<T>(stub);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace jest {
    interface Matchers<R> {
      toHaveDirtyProperty(property: string): R;
    }
    interface Expect {
      toHaveDirtyProperty<T>(property: string): JestMatchers<T>;
    }
  }
}

export function toHaveDirtyProperty(
  value: unknown,
  property: string
): jest.CustomMatcherResult {
  const pass = Doubles.get(value)?.dirty.has(property) ?? false;
  const message = pass
    ? () => `expected double not to have the dirty property "${property}"`
    : () => `expected double to have the dirty property "${property}"`;

  return {
    message,
    pass
  };
}

expect.extend({ toHaveDirtyProperty });
