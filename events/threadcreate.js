const { Client, Events, GatewayIntentBits, Guilds, EmbedBuilder, MessageManager, Embed, Collection, GuildMember, GuildHubType, AuditLogEvent } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.ThreadCreate,
  on: true,
  execute: async (thread) => {
    // This is the build submission forum channel ID - if the channel changes in the future, copy the id and switch this one out.
    const forumChannelId = '1128094906649415741';
    // The Build Submission role ID
    const roleId = '929867712606388274'; 

    if (thread.parentId !== forumChannelId) {
      return;
    }

    try {
      // Ensure that the bot is a member of the thread
      await thread.join();

      // Fetch messages in the thread to get the initial message
      const messages = await thread.messages.fetch({ limit: 1 });

      // Check if any message is found - hopefully, yes. Otherwise, someone somehow broke discord
      if (messages.size > 0) {
        const initialMessage = messages.first();

        // React to the thread's initial message with the three reactions. Order them as desired.
        const emojis = ['<:yes:989564439323893860>', '<:neutral:1050815690485026878>', '<:no:989564459976626267>'];

        for (const emoji of emojis) {
          await initialMessage.react(emoji);
        }

        // Pin the initial message of the thread
        await initialMessage.pin();

        // Mention the role
        const role = thread.guild.roles.cache.get(roleId);

        if (role) {
          await thread.send({ content: `<@&${roleId}>` });
        } else {
          console.log(`Role with ID ${roleId} not found.`);
        }

      } else {
        console.log('No messages found in the thread.');
      }

    } catch (error) {
      console.error('Error handling ThreadCreate event:', error);
    }
  }
};
