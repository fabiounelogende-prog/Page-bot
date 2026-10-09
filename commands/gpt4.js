const axios = require('axios');

module.exports = {
  name: 'gpt4',
  description: 'Ask a question to GPT-4',
  author: 'Célestin',

  async execute(senderId, args, pageAccessToken, sendMessage) {
    const prompt = args.join(' ').trim();

    if (!prompt) {
      return sendMessage(
        senderId,
        { text: '💬 Pose une question !\n\nExemple : gpt4 explique-moi la programmation.' },
        pageAccessToken
      );
    }

    try {
      const apiUrl = 'https://deku-rest-api-3ijr.onrender.com/gpt4';

      console.log(`[GPT4] Question reçue de ${senderId}`);

      const response = await axios.get(apiUrl, {
        params: {
          prompt,
          uid: senderId
        },
        timeout: 60000
      });

      const data = response.data;

      const text =
        typeof data === 'string'
          ? data
          : data?.gpt4 || data?.response || data?.message || data?.result;

      if (typeof text !== 'string' || !text.trim()) {
        console.error('[GPT4] Réponse API inattendue :', data);

        return sendMessage(
          senderId,
          { text: '⚠️ L’API IA a renvoyé une réponse vide ou inattendue. Réessaie plus tard.' },
          pageAccessToken
        );
      }

      const maxMessageLength = 1900;
      const messages = splitMessageIntoChunks(text.trim(), maxMessageLength);

      for (const message of messages) {
        await sendMessage(
          senderId,
          { text: message },
          pageAccessToken
        );
      }

      console.log(`[GPT4] Réponse envoyée à ${senderId}`);

    } catch (error) {
      console.error(
        '[GPT4] Erreur :',
        error.response?.data || error.message
      );

      await sendMessage(
        senderId,
        {
          text: '❌ Impossible de contacter GPT-4 pour le moment. Réessaie dans quelques instants.'
        },
        pageAccessToken
      );
    }
  }
};

function splitMessageIntoChunks(message, chunkSize) {
  const chunks = [];

  for (let i = 0; i < message.length; i += chunkSize) {
    chunks.push(message.slice(i, i + chunkSize));
  }

  return chunks;
}
