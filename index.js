'use strict';

const express = require('express');
const mastodonClient = require('./mastodon-client');
const processStatus = require('./process-status');

const app = express();

app.use(express.static('public'))

app.get("/check", async (req, res) => {
  console.log('checking...');

  const statuses = await mastodonClient.getStatuses();
  
  let mentionsSent = 0

  for (const status of statuses) {
    mentionsSent += await processStatus(status);
  }
  
  console.log(`Mentions sent: ${mentionsSent}`);
  
  res.sendStatus(204);
});

app.listen(process.env.PORT, () => console.log(`Listening on ${process.env.PORT}.`));
