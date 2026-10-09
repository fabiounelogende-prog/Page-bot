const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { handleMessage, setupCommands } = require('./handles/handleMessage');
const { handlePostback } = require('./handles/handlePostback');

const app = express();
app.use(bodyParser.json());

const VERIFY_TOKEN = 'pagebot';

const PAGE_ACCESS_TOKEN = fs.readFileSync('token.txt', 'utf8').trim();

// Vérification du webhook Meta
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('WEBHOOK_VERIFIED');
    return res.status(200).send(challenge);
  }

  console.log('Échec de vérification du webhook');
  return res.sendStatus(403);
});

// Réception des événements Messenger
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(entry => {
      if (!entry.messaging) return;

      entry.messaging.forEach(event => {
        if (event.message) {
          handleMessage(event, PAGE_ACCESS_TOKEN);
        } else if (event.postback) {
          handlePostback(event, PAGE_ACCESS_TOKEN);
        }
      });

      setupCommands(PAGE_ACCESS_TOKEN);
    });

    return res.status(200).send('EVENT_RECEIVED');
  }

  return res.sendStatus(404);
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
