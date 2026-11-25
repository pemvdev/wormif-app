declare module 'node:crypto' {
  export function timingSafeEqual(a: ArrayBufferView, b: ArrayBufferView): boolean;
}
