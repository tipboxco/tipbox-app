export const API_CONFIG = { // Environment variable'dan al (öncelikli)
    BASE_URL: 'https://api-test.tipbox.co',
    MEDIA_URL: 'http://10.5.49.228:9000',
    TIMEOUT: 10000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
}

export type ApiConfig = typeof API_CONFIG;
