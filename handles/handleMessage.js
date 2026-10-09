const fs = require('fs');
const path = require('path');
const request = require('request');
const { sendMessage } = require('./sendMessage');

const commands = new Map();

// Chargement des commandes
const commandsPath = path.join(__dirname, '../commands');

const commandFiles = fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = require(path.join(commandsPath, file));

    if (command && command.name && typeof command.execute === 'function') {
      commands.set(command.name.toLowerCase(), command);

      if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
          commands.set(alias.toLowerCase(), command);
        }
      }

      console.log(`Commande chargée : ${command.name}`);
    } else {
      console.warn(`Commande ignorée : ${file}`);
    }
  } catch (error) {
    console.error(`Erreur de chargement ${file}:`, error.message);
  }
}

// Configuration des commandes Messenger
async function setupCommands(pageAccessToken) {
  const commandsData = {
    commands: [
      {
        locale: 'default',
        commands: Array.from(
          new Set(commands.values())
        ).map(command => ({
          name: command.name,
          description: `${command.description || 'Commande Messenger'}`
            .slice(0, 200)
        }))
      }
    ]
  };

  return new Promise((resolve, reject) => {
    request({
      uri: 'https://graph.facebook.com/v21.0/me/messenger_profile',
      qs: { access_token: pageAccessToken },
      method: 'POST',
      json: commandsData
    }, (error, response, body) => {
      if (error) {
        console.error('Erreur Messenger Profile :', error.message);
        return reject(error);
      }

      if (response.statusCode === 200) {
        console.log('Commandes Messenger configurées.');
        return resolve(body);
      }

      const apiError = new Error(
        body?.error?.message || 'Échec de configuration des commandes.'
      );

      console.error('Erreur Meta :', apiError.message);
      return reject(apiError);
    });
  });
}

// Traitement des messages reçus
async function handleMessage(event, pageAccessToken) {
  try {
    const senderId = event?.sender?.id;
    const message = event?.message;

    if (!senderId || !message) return;

    // Ignorer les messages sans texte
    if (typeof message.text !== 'string' || !message.text.trim()) {
      return;
    }

    const messageText = message.text.trim();
    const args = messageText.split(/\s+/);
    const commandName = args.shift().toLowerCase();

    console.log(
      `Message reçu de ${senderId} : ${messageText}`
    );

    // Recherche de la commande
    const command = commands.get(commandName);

    if (!command) {
      console.log(`Aucune commande trouvée : ${commandName}`);
      return;
    }

    console.log(`Exécution de la commande : ${command.name}`);

    await command.execute(
      senderId,
      args,
      pageAccessToken,
      sendMessage
    );

  } catch (error) {
    console.error('Erreur handleMessage :', error);

    if (event?.sender?.id) {
      try {
        await sendMessage(
          event.sender.id,
          {
            text: 'Une erreur est survenue pendant le traitement de ta commande.'
          },
          pageAccessToken
        );
      } catch (sendError) {
        console.error('Erreur envoi du message :', sendError);
      }
    }
  }
}

module.exports = {
  handleMessage,
  setupCommands
};
