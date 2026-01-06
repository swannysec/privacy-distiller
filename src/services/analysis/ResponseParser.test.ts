import { describe, it, expect } from 'vitest';
import { ResponseParser } from './ResponseParser.js';

describe('ResponseParser', () => {
  describe('parsePrivacyRights', () => {
    it('should parse valid JSON with all fields', () => {
      const response = JSON.stringify({
        links: [
          { label: 'Privacy Settings', url: 'https://example.com/settings', purpose: 'settings' }
        ],
        contacts: [
          { type: 'email', value: 'privacy@example.com', purpose: 'Privacy inquiries' }
        ],
        procedures: [
          { right: 'deletion', title: 'Delete Your Data', steps: ['Step 1', 'Step 2'] }
        ],
        timeframes: ['30 days for data requests']
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links).toHaveLength(1);
      expect(result!.contacts).toHaveLength(1);
      expect(result!.procedures).toHaveLength(1);
      expect(result!.timeframes).toHaveLength(1);
      expect(result!.hasActionableInfo).toBe(true);
    });

    it('should return null for invalid JSON', () => {
      const result = ResponseParser.parsePrivacyRights('not valid json');

      expect(result).toBeNull();
    });

    it('should return null when no JSON object found', () => {
      const result = ResponseParser.parsePrivacyRights('just some text without braces');

      expect(result).toBeNull();
    });

    it('should handle markdown code blocks in response', () => {
      const response = '```json\n' + JSON.stringify({
        links: [{ label: 'Test', url: 'https://example.com', purpose: 'general' }],
        contacts: [],
        procedures: [],
        timeframes: []
      }) + '\n```';

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links).toHaveLength(1);
    });

    it('should filter out non-http/https URLs', () => {
      const response = JSON.stringify({
        links: [
          { label: 'Valid HTTPS', url: 'https://example.com', purpose: 'general' },
          { label: 'Valid HTTP', url: 'http://example.com', purpose: 'general' },
          { label: 'Invalid FTP', url: 'ftp://example.com', purpose: 'general' },
          { label: 'Invalid JavaScript', url: 'javascript:alert(1)', purpose: 'general' },
          { label: 'Invalid Data', url: 'data:text/html,<script>', purpose: 'general' }
        ],
        contacts: [],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links).toHaveLength(2);
      expect(result!.links[0].url).toBe('https://example.com');
      expect(result!.links[1].url).toBe('http://example.com');
    });

    it('should normalize invalid link purposes to "other"', () => {
      const response = JSON.stringify({
        links: [
          { label: 'Test', url: 'https://example.com', purpose: 'invalid-purpose' }
        ],
        contacts: [],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links[0].purpose).toBe('other');
    });

    it('should accept valid link purposes', () => {
      const validPurposes = ['settings', 'data-request', 'opt-out', 'deletion', 'general', 'other'];
      
      for (const purpose of validPurposes) {
        const response = JSON.stringify({
          links: [{ label: 'Test', url: 'https://example.com', purpose }],
          contacts: [],
          procedures: [],
          timeframes: []
        });

        const result = ResponseParser.parsePrivacyRights(response);

        expect(result).not.toBeNull();
        expect(result!.links[0].purpose).toBe(purpose);
      }
    });

    it('should normalize invalid contact types to "email"', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [
          { type: 'invalid-type', value: 'contact@example.com', purpose: 'General' }
        ],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.contacts[0].type).toBe('email');
    });

    it('should accept valid contact types', () => {
      const validTypes = ['email', 'address', 'phone', 'form', 'dpo'];
      
      for (const type of validTypes) {
        const response = JSON.stringify({
          links: [],
          contacts: [{ type, value: 'test-value', purpose: 'Test' }],
          procedures: [],
          timeframes: []
        });

        const result = ResponseParser.parsePrivacyRights(response);

        expect(result).not.toBeNull();
        expect(result!.contacts[0].type).toBe(type);
      }
    });

    it('should normalize invalid procedure rights to "other"', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [
          { right: 'invalid-right', title: 'Test', steps: ['Step 1'] }
        ],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.procedures[0].right).toBe('other');
    });

    it('should accept valid procedure rights', () => {
      const validRights = ['access', 'deletion', 'portability', 'opt-out', 'correction', 'objection', 'other'];
      
      for (const right of validRights) {
        const response = JSON.stringify({
          links: [],
          contacts: [],
          procedures: [{ right, title: 'Test', steps: ['Step 1'] }],
          timeframes: []
        });

        const result = ResponseParser.parsePrivacyRights(response);

        expect(result).not.toBeNull();
        expect(result!.procedures[0].right).toBe(right);
      }
    });

    it('should set hasActionableInfo to true when links exist', () => {
      const response = JSON.stringify({
        links: [{ label: 'Test', url: 'https://example.com', purpose: 'general' }],
        contacts: [],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.hasActionableInfo).toBe(true);
    });

    it('should set hasActionableInfo to true when contacts exist', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [{ type: 'email', value: 'test@example.com', purpose: 'Test' }],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.hasActionableInfo).toBe(true);
    });

    it('should set hasActionableInfo to true when procedures exist', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [{ right: 'deletion', title: 'Delete', steps: ['Step 1'] }],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.hasActionableInfo).toBe(true);
    });

    it('should set hasActionableInfo to false when only timeframes exist', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [],
        timeframes: ['30 days']
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.hasActionableInfo).toBe(false);
    });

    it('should set hasActionableInfo to false when all arrays are empty', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.hasActionableInfo).toBe(false);
    });

    it('should handle empty arrays gracefully', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links).toEqual([]);
      expect(result!.contacts).toEqual([]);
      expect(result!.procedures).toEqual([]);
      expect(result!.timeframes).toEqual([]);
    });

    it('should handle missing arrays as empty', () => {
      const response = JSON.stringify({});

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links).toEqual([]);
      expect(result!.contacts).toEqual([]);
      expect(result!.procedures).toEqual([]);
      expect(result!.timeframes).toEqual([]);
    });

    it('should filter out links with empty or missing URLs', () => {
      const response = JSON.stringify({
        links: [
          { label: 'Valid', url: 'https://example.com', purpose: 'general' },
          { label: 'Empty URL', url: '', purpose: 'general' },
          { label: 'Missing URL', purpose: 'general' },
          { label: 'Whitespace URL', url: '   ', purpose: 'general' }
        ],
        contacts: [],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links).toHaveLength(1);
      expect(result!.links[0].label).toBe('Valid');
    });

    it('should filter out contacts with empty or missing values', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [
          { type: 'email', value: 'valid@example.com', purpose: 'Test' },
          { type: 'email', value: '', purpose: 'Test' },
          { type: 'email', purpose: 'Test' },
          { type: 'email', value: '   ', purpose: 'Test' }
        ],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.contacts).toHaveLength(1);
      expect(result!.contacts[0].value).toBe('valid@example.com');
    });

    it('should filter out procedures with empty steps', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [
          { right: 'deletion', title: 'Valid', steps: ['Step 1', 'Step 2'] },
          { right: 'deletion', title: 'Empty steps', steps: [] },
          { right: 'deletion', title: 'No steps' }
        ],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.procedures).toHaveLength(1);
      expect(result!.procedures[0].title).toBe('Valid');
    });

    it('should filter out empty strings from steps', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [
          { right: 'deletion', title: 'Test', steps: ['Step 1', '', '   ', 'Step 2'] }
        ],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.procedures[0].steps).toHaveLength(2);
      expect(result!.procedures[0].steps).toEqual(['Step 1', 'Step 2']);
    });

    it('should filter out empty strings from timeframes', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [],
        timeframes: ['30 days', '', '   ', '60 days']
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.timeframes).toHaveLength(2);
      expect(result!.timeframes).toEqual(['30 days', '60 days']);
    });

    it('should include procedure requirements when present', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [
          { 
            right: 'deletion', 
            title: 'Delete Data', 
            steps: ['Submit request'],
            requirements: ['Valid ID', 'Account verification']
          }
        ],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.procedures[0].requirements).toEqual(['Valid ID', 'Account verification']);
    });

    it('should provide default label for links without one', () => {
      const response = JSON.stringify({
        links: [{ url: 'https://example.com', purpose: 'general' }],
        contacts: [],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links[0].label).toBe('Privacy Link');
    });

    it('should provide default purpose for contacts without one', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [{ type: 'email', value: 'test@example.com' }],
        procedures: [],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.contacts[0].purpose).toBe('Privacy inquiries');
    });

    it('should provide default title for procedures without one', () => {
      const response = JSON.stringify({
        links: [],
        contacts: [],
        procedures: [{ right: 'deletion', steps: ['Step 1'] }],
        timeframes: []
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.procedures[0].title).toBe('Privacy Procedure');
    });

    it('should trim whitespace from all string values', () => {
      const response = JSON.stringify({
        links: [{ label: '  Trimmed Label  ', url: '  https://example.com  ', purpose: 'general' }],
        contacts: [{ type: 'email', value: '  test@example.com  ', purpose: '  Trimmed Purpose  ' }],
        procedures: [{ right: 'deletion', title: '  Trimmed Title  ', steps: ['  Trimmed Step  '] }],
        timeframes: ['  Trimmed Timeframe  ']
      });

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links[0].label).toBe('Trimmed Label');
      expect(result!.links[0].url).toBe('https://example.com');
      expect(result!.contacts[0].value).toBe('test@example.com');
      expect(result!.contacts[0].purpose).toBe('Trimmed Purpose');
      expect(result!.procedures[0].title).toBe('Trimmed Title');
      expect(result!.procedures[0].steps[0]).toBe('Trimmed Step');
      expect(result!.timeframes[0]).toBe('Trimmed Timeframe');
    });

    it('should extract JSON from response with surrounding text', () => {
      const response = `Here is the extracted information:
      
      ${JSON.stringify({
        links: [{ label: 'Test', url: 'https://example.com', purpose: 'general' }],
        contacts: [],
        procedures: [],
        timeframes: []
      })}
      
      I hope this helps!`;

      const result = ResponseParser.parsePrivacyRights(response);

      expect(result).not.toBeNull();
      expect(result!.links).toHaveLength(1);
    });
  });
});
