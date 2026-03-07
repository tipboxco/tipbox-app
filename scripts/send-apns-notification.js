#!/usr/bin/env node

/**
 * APNs Push Notification Sender
 *
 * Usage:
 *   node scripts/send-apns-notification.js <device-token> [notification-type]
 *
 * Example:
 *   node scripts/send-apns-notification.js abc123def456... POST_LIKED
 */

const jwt = require('jsonwebtoken');
const fs = require('fs');
const https = require('https');
const path = require('path');

// APNs Configuration
const APNS_KEY_ID = '53YG4845C6'; // From filename AuthKey_53YG4845C6.p8
const APNS_TEAM_ID = '9H8PCH2MDS'; // From eas.json - Apple Team ID
const APNS_KEY_PATH = path.join(__dirname, '../AuthKey_53YG4845C6.p8');
const APNS_BUNDLE_ID = 'app.tipbox.ios';
// Environment can be overridden with --production flag
const APNS_ENVIRONMENT = process.argv.includes('--production') ? 'production' : 'development';

// APNs server
const APNS_SERVER = APNS_ENVIRONMENT === 'production'
  ? 'api.push.apple.com'
  : 'api.development.push.apple.com';

/**
 * Generate JWT token for APNs authentication
 */
function generateJWT() {
  try {
    const authKey = fs.readFileSync(APNS_KEY_PATH, 'utf8');

    const token = jwt.sign(
      {
        iss: APNS_TEAM_ID,
        iat: Math.floor(Date.now() / 1000),
      },
      authKey,
      {
        algorithm: 'ES256',
        header: {
          alg: 'ES256',
          kid: APNS_KEY_ID,
        },
      }
    );

    return token;
  } catch (error) {
    console.error('❌ Failed to generate JWT:', error.message);
    process.exit(1);
  }
}

/**
 * Sample notification payloads
 */
const NOTIFICATION_SAMPLES = {
  POST_LIKED: {
    aps: {
      alert: {
        title: 'New Like',
        body: 'Someone liked your post!',
      },
      sound: 'default',
      badge: 1,
    },
    type: 'POST_LIKED',
    userId: 'user123',
    username: 'johndoe',
    avatar: 'https://i.pravatar.cc/150?img=1',
    postId: 'post123',
    data: {
      postContent: 'This is a test post content',
    },
    createdAt: new Date().toISOString(),
    read: false,
  },
  TIPS_RECEIVED: {
    aps: {
      alert: {
        title: 'TIPS Received',
        body: 'You received 50 TIPS!',
      },
      sound: 'default',
      badge: 1,
    },
    type: 'TIPS_RECEIVED',
    userId: 'user456',
    username: 'alice',
    avatar: 'https://i.pravatar.cc/150?img=2',
    data: {
      amount: 50,
      senderUsername: 'alice',
    },
    createdAt: new Date().toISOString(),
    read: false,
  },
  DM_REQUEST_RECEIVED: {
    aps: {
      alert: {
        title: 'Message Request',
        body: 'bob sent you a message request',
      },
      sound: 'default',
      badge: 1,
    },
    type: 'DM_REQUEST_RECEIVED',
    userId: 'user789',
    username: 'bob',
    avatar: 'https://i.pravatar.cc/150?img=3',
    threadId: 'thread123',
    data: {
      message: "Hey! Let's connect.",
    },
    createdAt: new Date().toISOString(),
    read: false,
  },
};

/**
 * Send APNs notification
 */
function sendNotification(deviceToken, payload) {
  return new Promise((resolve, reject) => {
    const jwtToken = generateJWT();
    const payloadString = JSON.stringify(payload);

    const options = {
      hostname: APNS_SERVER,
      port: 443,
      path: `/3/device/${deviceToken}`,
      method: 'POST',
      headers: {
        'authorization': `bearer ${jwtToken}`,
        'apns-topic': APNS_BUNDLE_ID,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'apns-expiration': '0',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payloadString),
      },
    };

    console.log('📤 Sending notification to APNs...');
    console.log('Server:', APNS_SERVER);
    console.log('Device Token:', deviceToken);
    console.log('Payload:', JSON.stringify(payload, null, 2));

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Notification sent successfully!');
          resolve({ success: true, statusCode: res.statusCode });
        } else {
          console.error('❌ Failed to send notification');
          console.error('Status Code:', res.statusCode);
          console.error('Response:', data);
          reject(new Error(`APNs returned status ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(payloadString);
    req.end();
  });
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node scripts/send-apns-notification.js <device-token> [notification-type]');
    console.log('');
    console.log('Available notification types:');
    Object.keys(NOTIFICATION_SAMPLES).forEach(type => {
      console.log(`  - ${type}`);
    });
    console.log('');
    console.log('Example:');
    console.log('  node scripts/send-apns-notification.js abc123def456 POST_LIKED');
    process.exit(1);
  }

  const deviceToken = args[0];
  const notificationType = args[1] || 'POST_LIKED';

  if (!NOTIFICATION_SAMPLES[notificationType]) {
    console.error(`❌ Unknown notification type: ${notificationType}`);
    console.log('Available types:', Object.keys(NOTIFICATION_SAMPLES).join(', '));
    process.exit(1);
  }

  try {
    await sendNotification(deviceToken, NOTIFICATION_SAMPLES[notificationType]);
  } catch (error) {
    console.error('❌ Failed to send notification:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { sendNotification, generateJWT };
