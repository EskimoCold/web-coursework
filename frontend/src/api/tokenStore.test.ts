import { describe, expect, it } from 'vitest';

import { tokenStore } from './tokenStore';

describe('tokenStore', () => {
  it('should return null initially', () => {
    tokenStore.clearAccessToken();
    expect(tokenStore.getAccessToken()).toBeNull();
  });

  it('should set and get access token', () => {
    tokenStore.setAccessToken('test-token-123');
    expect(tokenStore.getAccessToken()).toBe('test-token-123');
  });

  it('should clear access token', () => {
    tokenStore.setAccessToken('test-token-456');
    expect(tokenStore.getAccessToken()).toBe('test-token-456');
    tokenStore.clearAccessToken();
    expect(tokenStore.getAccessToken()).toBeNull();
  });

  it('should handle null token', () => {
    tokenStore.setAccessToken(null);
    expect(tokenStore.getAccessToken()).toBeNull();
  });
});

