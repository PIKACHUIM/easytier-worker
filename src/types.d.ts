/// <reference types="hono/jsx" />

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [tagName: string]: any;
    }
  }
}

export {};