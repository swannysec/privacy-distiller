/**
 * Mock privacy policy texts for testing
 */

export const SAMPLE_PRIVACY_POLICY = `
Privacy Policy

Last Updated: January 1, 2024

1. Information We Collect
We collect personal information including your name, email address, phone number, and location data when you use our services.

2. How We Use Your Information
We use your information to provide services, improve our platform, and send marketing communications. We may share your data with third-party partners for advertising purposes.

3. Data Sharing
We share your personal information with:
- Analytics providers
- Advertising networks
- Social media platforms
- Government agencies when required by law

4. Data Retention
We retain your personal information indefinitely unless you request deletion.

5. Your Rights
You may request access to your data by contacting us. We will respond within 90 days.

6. Children's Privacy
Our services are not intended for children under 13.

7. Changes to This Policy
We may update this policy at any time without notice.

8. Contact Us
For questions, email privacy@example.com
`;

export const RISKY_PRIVACY_POLICY = `
Privacy Policy

We collect everything about you including biometric data, health information, financial records, and browsing history.

We sell your data to anyone who pays us. We track your location 24/7. We share your information with data brokers, advertisers, and government agencies worldwide.

We never delete your data. You have no rights. We can change this policy without telling you.
`;

export const GOOD_PRIVACY_POLICY = `
Privacy Policy - Last Updated: January 1, 2024

1. Information We Collect
We collect only the minimum information necessary: email address for account creation.

2. How We Use Your Information
We use your email only to provide the service you requested. We never use it for marketing without explicit opt-in consent.

3. Data Sharing
We do not share, sell, or rent your personal information to third parties. Period.

4. Data Retention
We delete your data within 30 days of account deletion.

5. Your Rights
You can access, correct, or delete your data at any time through your account settings.

6. Security
We use industry-standard encryption (AES-256) to protect your data.

7. Changes to This Policy
We will notify you 30 days before any material changes to this policy.

8. Contact
privacy@example.com - We respond within 48 hours.
`;

export const TERMS_OF_SERVICE = `
Terms of Service

By using this service, you agree to arbitration and waive your right to sue. You grant us unlimited rights to any content you upload. We can terminate your account at any time for any reason without refund.
`;

export const MOCK_LLM_RESPONSES = {
  summary: {
    brief: 'This privacy policy describes data collection practices for a web service.',
    detailed: 'The policy covers personal information collection, data usage for service provision and marketing, third-party data sharing, and user rights regarding data access.',
    full: 'Comprehensive privacy policy explaining all aspects of data handling practices.',
  },
  risks: [
    {
      category: 'Data Collection',
      severity: 'high',
      description: 'Collects extensive personal information including location data',
      impact: 'Your movements can be tracked continuously',
    },
    {
      category: 'Third-Party Sharing',
      severity: 'high',
      description: 'Shares data with advertising networks and analytics providers',
      impact: 'Your information may be used for targeted advertising',
    },
    {
      category: 'Data Retention',
      severity: 'medium',
      description: 'Retains data indefinitely unless deletion requested',
      impact: 'Your data persists even if you stop using the service',
    },
  ],
  keyTerms: [
    {
      term: 'Personal Information',
      definition: 'Data that can identify you, including name, email, phone number',
    },
    {
      term: 'Third-Party Partners',
      definition: 'External companies that receive your data for advertising and analytics',
    },
    {
      term: 'Data Retention',
      definition: 'How long your information is kept on file',
    },
  ],
};

export const EMPTY_POLICY = '';

export const VERY_SHORT_POLICY = 'We collect data.';

export const MALFORMED_POLICY = '<script>alert("xss")</script>This policy has HTML';
