declare namespace jasmine {
  interface Matchers<T> {
    toBe(expected: any): boolean;
    toBeNull(): boolean;
    toBeTruthy(): boolean;
    toBeFalse(): boolean;
    toBeTrue(): boolean;
    toHaveBeenCalled(): boolean;
    toHaveBeenCalledWith(...args: any[]): boolean;
    toEqual(expected: any): boolean;
  }
}

interface JasmineSpyCallData {
  args: any[];
}

interface JasmineSpyCalls {
  all(): JasmineSpyCallData[];
  mostRecent(): JasmineSpyCallData;
  first(): JasmineSpyCallData;
  count(): number;
  reset(): void;
}

declare namespace jasmine {
  interface Spy {
    calls: JasmineSpyCalls;
  }
} 