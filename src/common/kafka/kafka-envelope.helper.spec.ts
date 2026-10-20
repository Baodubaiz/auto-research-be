import { describe, it, expect } from '@jest/globals';
import {
  sanitizeKafkaPayload,
  buildKafkaRequestEnvelope,
} from './kafka-envelope.helper';
import { DEFAULT_AI_MODEL } from './kafka.constants';

describe('KafkaEnvelopeHelper', () => {
  describe('sanitizeKafkaPayload', () => {
    it('should return primitive values as is', () => {
      expect(sanitizeKafkaPayload('string')).toBe('string');
      expect(sanitizeKafkaPayload(123)).toBe(123);
      expect(sanitizeKafkaPayload(true)).toBe(true);
      expect(sanitizeKafkaPayload(null)).toBeNull();
    });

    it('should remove undefined keys from object', () => {
      const input = {
        title: 'Machine Learning',
        subtitle: undefined,
        count: 0,
        active: false,
      };

      const result = sanitizeKafkaPayload(input);
      expect(result).toEqual({
        title: 'Machine Learning',
        count: 0,
        active: false,
      });
      expect('subtitle' in result).toBe(false);
    });

    it('should recursively clean nested objects and arrays', () => {
      const input = {
        meta: {
          id: 'doc-1',
          draft: undefined,
          tags: ['ai', undefined, 'rag'],
        },
        items: [
          { name: 'Item 1', missing: undefined },
          { name: 'Item 2', value: 42 },
        ],
      };

      const result = sanitizeKafkaPayload(input);
      expect(result).toEqual({
        meta: {
          id: 'doc-1',
          tags: ['ai', undefined, 'rag'],
        },
        items: [{ name: 'Item 1' }, { name: 'Item 2', value: 42 }],
      });
    });
  });

  describe('buildKafkaRequestEnvelope', () => {
    it('should apply defaults for model_id, language and session_id', () => {
      const result = buildKafkaRequestEnvelope({
        eventType: 'generate_proposals',
        userId: 'user-001',
        documentId: 'doc-999',
      });

      expect(result).toEqual({
        event_type: 'generate_proposals',
        user_id: 'user-001',
        document_id: 'doc-999',
        model_id: DEFAULT_AI_MODEL,
        language: 'Vietnamese',
        session_id: 'default',
      });
    });

    it('should support conv_id instead of document_id and custom model/language', () => {
      const result = buildKafkaRequestEnvelope(
        {
          eventType: 'outer_chatbot',
          userId: 'user-002',
          convId: 'conv-555',
          sessionId: 'sess-abc',
          modelId: 'gpt-4o',
          language: 'English',
          jobId: 'job-123',
        },
        {
          user_message: 'Hello AI',
          filter: undefined,
        },
      );

      expect(result).toEqual({
        event_type: 'outer_chatbot',
        user_id: 'user-002',
        conv_id: 'conv-555',
        session_id: 'sess-abc',
        model_id: 'gpt-4o',
        language: 'English',
        job_id: 'job-123',
        user_message: 'Hello AI',
      });
      expect('filter' in result).toBe(false);
    });
  });
});
