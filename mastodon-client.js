'use strict';

const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// See https://www.npmjs.com/package/mastodon#usage for options.
const client = new require('mastodon')({
  access_token: process.env.TOKEN,
  timeout_ms: 60 * 1000,
  api_url: 'https://mastodon.social/api/v1/'
});

function getId() {
  return new Promise((resolve, reject) => {
    client.get('/accounts/verify_credentials', (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data.id);
    });
  });
}

function getNewStatuses(clientId, sinceId) {
  const query = sinceId ? `?since_id=${sinceId}` : '';
  
  return new Promise((resolve, reject) => {
    client.get(`accounts/${clientId}/statuses${query}`, (err, data) => {
      if (err) {
        return reject(err);
      }

      resolve(data);
    });
  });
}

async function getLastReadStatus() {
  try {
    const id = (await readFile('.data/last-read-status.txt', 'utf8')).trim();
    
    console.log(`Last read status: ${id}`);
    
    return id;
  } catch (e) {
    console.warn('No ID read.');
    return null;
  }
}

async function writeLastReadStatus(id) {
  console.log(`Saving last read status as: ${id}`);
  await writeFile('.data/last-read-status.txt', id);
}

exports.getStatuses = async function getStatuses() {
  const clientId = await getId();
  const lastReadStatusId = await getLastReadStatus();
  const newStatuses = await getNewStatuses(clientId, lastReadStatusId);
  
  newStatuses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (newStatuses.length) {
     await writeLastReadStatus(newStatuses[0].id);
  }

  return newStatuses;
}
