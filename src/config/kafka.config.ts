import { registerAs } from '@nestjs/config';

export default registerAs('kafka', () => {
  const isLocal =
    process.env.IS_LOCAL === 'true' || process.env.NODE_ENV !== 'production';
  const suffix = isLocal ? '_local' : '';

  const rawBrokers =
    process.env.KAFKA || process.env.KAFKA_BROKERS || '167.254.70.125:9092';
  const brokers = rawBrokers.split(',').map((b) => b.trim());

  return {
    isLocal,
    brokers,
    clientId: process.env.KAFKA_CLIENT_ID || 'autoresearch-backend',
    groupId: process.env.KAFKA_GROUP_ID || 'autoresearch-group',
    ssl: process.env.KAFKA_SSL === 'true',
    topics: {
      document_setup: {
        request: `document_setup_request${suffix}`,
        response: `document_setup_response${suffix}`,
      },
      write_report: {
        request: `write_section_request${suffix}`,
        response: `write_section_response${suffix}`,
      },
      chatbot: {
        request: `chatbot_request${suffix}`,
        response: `chatbot_response${suffix}`,
      },
      enhancement: {
        request: `enhancement_request${suffix}`,
        response: `enhancement_response${suffix}`,
      },
    },
  };
});
