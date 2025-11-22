
import { createLogger } from '../src/logger';

console.log('\n--- Testing JSON Format ---');
const jsonLogger = createLogger('info', 'json', false);
jsonLogger.info('Hello JSON World');
jsonLogger.error(new Error('Test Error in JSON (Object only)'));
jsonLogger.error('Test Error in JSON (Message + Object)', new Error('Details'));

console.log('\n--- Testing Text Format (Default) ---');
const textLogger = createLogger('info', 'text', false);
textLogger.info('Hello Text World');
textLogger.error(new Error('Test Error in Text (Object only)'));
textLogger.error('Test Error in Text (Message + Object)', new Error('Details'));

console.log('\n--- Testing File Logging (Mock) ---');
// Note: We are not actually checking file output here, just ensuring no crash
const fileLogger = createLogger('info', 'text', true);
fileLogger.info('Hello File World');
console.log('File logging initialized without error');
