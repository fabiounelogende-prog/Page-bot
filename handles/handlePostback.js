const { sendMessage } = require('./sendMessage');

async function handlePostback(event, pageAccessToken) {
  try {
    const senderId = event?.sender?.id;
    const payload = event?.postback?.payload;

    if (!senderId) {
      console.error('Postback reçu sans identifiant utilisateur.');
      return;
    }

    console.log(`Postback reçu : ${payload || 'Aucun payload'}`);

    await sendMessage(
      senderId,
      {
        text: `Tu as envoyé un postback avec le payload : ${payload || 'inconnu'}`
      },
      pageAccessToken
    );

  } catch (error) {
    console.error('Erreur handlePostback :', error);
  }
}

module.exports = { handlePostback };
