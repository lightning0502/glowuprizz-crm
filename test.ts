// test.ts
import { describe, it, expect } from '@jest/globals';
import { getValidChannel } from './readonly';

describe('채널 유효성 검증 테스트 (Core Logic)', () => {
    it('정상적인 채널(instagram)이 들어오면 그대로 반환해야 한다.', () => {
        expect(getValidChannel('instagram')).toBe('instagram');
    });

    it('허용되지 않은 채널(facebook)이 들어오면 null을 반환해야 한다. (실패 흐름 검증)', () => {
        expect(getValidChannel('facebook')).toBeNull();
    });

    it('파라미터가 없거나 null일 경우 null을 반환해야 한다.', () => {
        expect(getValidChannel(null)).toBeNull();
    });
});