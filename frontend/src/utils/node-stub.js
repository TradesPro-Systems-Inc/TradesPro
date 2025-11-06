// Node.js module stub for browser compatibility
// These modules are Node.js-only and should not be used in browser code
// This stub prevents bundling errors when server-only code is imported

// Stub for fs module
export const readFileSync = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Node Stub] fs.readFileSync is not available in browser. This code should not run in the browser.');
  }
  throw new Error('fs.readFileSync is not available in browser environment');
};

export const writeFileSync = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Node Stub] fs.writeFileSync is not available in browser.');
  }
  throw new Error('fs.writeFileSync is not available in browser environment');
};

// Stub for crypto module  
export const createHash = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Node Stub] crypto.createHash is not available in browser. Use Web Crypto API instead.');
  }
  throw new Error('crypto.createHash is not available in browser environment. Use Web Crypto API instead.');
};

export const createVerify = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Node Stub] crypto.createVerify is not available in browser.');
  }
  throw new Error('crypto.createVerify is not available in browser environment');
};

export const createSign = () => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[Node Stub] crypto.createSign is not available in browser.');
  }
  throw new Error('crypto.createSign is not available in browser environment');
};

// Stub for vm module
export const createContext = () => {
  throw new Error('vm.createContext is not available in browser environment');
};

export const runInContext = () => {
  throw new Error('vm.runInContext is not available in browser environment');
};

// Stub for path module
export const resolve = () => {
  throw new Error('path.resolve is not available in browser environment');
};

export const join = () => {
  throw new Error('path.join is not available in browser environment');
};

// Stub for os module
export const platform = 'browser';
export const arch = 'unknown';

// Default export as empty object
export default {
  readFileSync,
  writeFileSync,
  createHash,
  createVerify,
  createSign,
  createContext,
  runInContext,
  resolve,
  join,
  platform,
  arch
};


