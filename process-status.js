'use strict';

const cheerio = require('cheerio');
const rawSendWebmention = require('send-webmention');

function sendWebmention(source, target, ua) {
  return new Promise((resolve, reject) => {
    rawSendWebmention(source, target, ua, (err, result) => err ? reject(err) : resolve(result));
  }); 
}

module.exports = async function processStatus({ content, url, visibility }) {
  if (visibility !== 'public') {
    return 0;
  }
  
  const $ = cheerio.load(content);
  const links = [...new Set($('a').toArray().map(a => $(a).attr('href')))]; // Dedupes.
  
  let mentionsSent = 0;

  await Promise.all(links.map(async link => {
    if (!link) {
      return;
    }
    
    console.log(`Checking link for webmention endpoint: ${link}`);
    
    const { success } = await sendWebmention(url, link, 'mastodon-webmention-relay');
    
    if (success) {
      console.log(`Webmention sent for: ${link}`);
      mentionsSent++;
    } else {
      console.log(`Link does not support webmentions: ${link}`);
    }
  }));
  
  return mentionsSent;
};
