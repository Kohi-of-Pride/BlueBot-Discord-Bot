const { Client, Events, GatewayIntentBits, Guilds, EmbedBuilder, MessageManager, Embed, Collection, GuildMember, GuildHubType, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'changelog',
  description: 'Searches the changelog',
  aliases: ['ch'],
  async execute(message, args) {
    const userInteractionIdentifier = `${message.author.id}-${message.id}`;

    const allowedRole = '1050806922275725403';
    const allowedChannelId = '962377198315130941';

    const allowedChannel = message.channel
    const userRoles = message.author.roles.cache;

    // Check if it's outside the specified channel
    if (allowedChannel.id !== allowedChannelId && !userRoles.has(allowedRole)) {
      return message.reply('BlueBot commands are to be used in <#962377198315130941>!');
    }

    // Check if the user has an ongoing interaction and cancel it
    if (chatCommandCollectorMap.has(userInteractionIdentifier)) {
      const previousCollector = chatCommandCollectorMap.get(userInteractionIdentifier);
      previousCollector.stop('New search initiated.');
    }

    const keywords = args.slice(0);

    const channelId = '894665380939825232';
    const channel = message.guild.channels.cache.get(channelId);

    if (!channelId) {
      return message.reply('Invalid channel option');
    }
    if (!channel || !channel.isTextBased()) {
      return message.reply('Invalid channel');
    }


    const batchSize = 100;
    const messages = await fetchMessagesFromChannel(channel, batchSize);

    const matchingMessages = messages.filter((message) => {
      const messageContent = message.content || ''; // Ensure messageContent is defined
      const matchedKeywords = keywords.filter(keyword => messageContent.toLowerCase().includes(keyword.toLowerCase()));
      return matchedKeywords.length > 0;
    });

    console.log('Matching messages:', matchingMessages); // Log the matching messages 

    const resultsPerPage = 5;
    const totalPages = Math.ceil(matchingMessages.length / resultsPerPage);

    if (totalPages < 1) {
      return message.reply('No results found.');
    }

    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      const startIdx = i * resultsPerPage;
      const endIdx = startIdx + resultsPerPage;
      const paginatedMessages = matchingMessages.slice(startIdx, endIdx);

      // Embed
      const embed = new EmbedBuilder()
        .setColor('#4744fc')
        .setTitle(`<:ShinyBlueBooster:1180372859726606446> Search Results for "${keywords.join(', ')}" ${channelOption === 'all' ? 'in All Channels' : `in ${channel.name}`}`)
        .setDescription(`Page ${i + 1}/${totalPages} | Found ${matchingMessages.length} results.`)
        .setTimestamp()
        .setFooter({ text: 'Courtesy of BlueBot', iconURL: 'https://file.coffee/u/AxY92MvPybbSh4IoIsdhP.png' });

      const beginnerRecommendedMessages = [];
      const recommendedMessages = [];
      const beginnerMessages = [];
      const otherMessages = [];

      paginatedMessages.forEach((message, index) => {
        const searchResult = {
          name: extractFirstLine(message.content),
          messagelink: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
          reactions: countReactions(message),
        };

        const link = `[BUILD HERE](${searchResult.messagelink})`;
        const firstLine = searchResult.name;

        // Split search keywords into individual words
        const searchKeywords = keywords.map(keyword => keyword.toLowerCase());

        // Check if any word from searchKeywords matches with any part of any word in messageContent
        const matchedKeywords = searchKeywords.filter(keyword =>
          message.content.toLowerCase().includes(keyword)
        );

        const messageField = {
          name: '\u200B',
          value: `**「${firstLine || '\u200B'}」**\n ▸Matched Keywords: **${matchedKeywords.length > 0 ? matchedKeywords.join(', ') : 'None'}**\n**▸${link} - [${searchResult.reactions - 1 || '0'}] <:Like:1183573343627137087>**`,
        };

        otherMessages.push(messageField);

      });

      // Concatenate beginnerRecommended messages at the top, followed by recommended, beginner, and other messages
      const finalFields = beginnerRecommendedMessages.concat(recommendedMessages, beginnerMessages, otherMessages);

      // Add an extra empty field after each message
      const fieldsWithEmptyFields = finalFields.reduce((acc, messageField, index) => {
        acc.push(messageField);
        if (index < finalFields.length - 1) {
          acc.push({ name: '\u200B', value: '\u200B' });
        }
        return acc;
      }, []);

      embed.addFields(fieldsWithEmptyFields);
      pages.push(embed);
    }

    const selectMenuOptions = pages.map((_, i) => ({
      label: `Page ${i + 1}`,
      value: i.toString(),
    }));

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('pageSelect')
      .setPlaceholder('Select a Page')
      .addOptions(selectMenuOptions);

    const row = new ActionRowBuilder()
      .addComponents(selectMenu);

    message.reply({
      embeds: [pages[0]],
      components: [row],
    }).then(async () => {
      const collector = message.channel.createMessageComponentCollector({
        filter: i => i.customId === 'pageSelect' && i.author.id === message.author.id,
        time: 120000,
      });

      // Store the collector in a Map using the userInteractionIdentifier as the key
      chatCommandCollectorMap.set(message.author.id, collector);

      collector.on('collect', async (i) => {
        const selectedPage = parseInt(i.values[0]);
        const selectedEmbed = pages[selectedPage];

        row.components[0].setDisabled(false);

        i.update({
          embeds: [selectedEmbed],
          components: [row],
        });
      });

      collector.on('end', () => {
        row.components[0].setDisabled(true);
        message.editReply({ components: [row] });
        // Remove the collector from the Map when it ends
        chatCommandCollectorMap.delete(message.author.id);
      });
    }).catch(error => {
      console.error(error);
      message.reply('An error occurred while sending the initial message.');
    });
  },
};

const chatCommandCollectorMap = new Map();


function extractFirstLine(content) {
  if (!content) {
    console.error('Content is undefined or null.');
    return null;  
  }

  console.log('Content:', content);
  return content.split('\n')[0];
}

async function fetchMessagesFromChannel(channel, batchSize) {
  let allMessages = [];

  let lastMessageId = null;

  while (true) {
    const options = { limit: batchSize, before: lastMessageId };
    const messages = await channel.messages.fetch(options);

    if (messages.size === 0) {
      // No more messages
      break;
    }

    lastMessageId = messages.last().id;
    allMessages.push(...messages.values());

    // Ensure we don't exceed Discord's rate limits
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  return allMessages;
}