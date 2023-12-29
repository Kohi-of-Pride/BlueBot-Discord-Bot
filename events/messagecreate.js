const { Client, Events, GatewayIntentBits, Guilds, EmbedBuilder, MessageManager, Embed, Collection, GuildMember, GuildHubType} = require('discord.js');

module.exports = {
  name: Events.MessageCreate,
  on: true,
  execute: async (message) => {
    // Check if the message is sent in any of our class channels - for convenience's sake, keep the channel ids in the same order as the server
    const allowedChannels = ['1016896287007842415', '1016896349301653616', '1016896429584814240', '1016896363461611550', '1016896402082758738'];

    if (!allowedChannels.includes(message.channel.id)) {
      return;
    }

    try {
      // React with the specified emoji. If you want to use a server emoji, input it instead
      await message.react('<:Like:1183573343627137087>');
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  }
};
