const fs = require('fs');
const path = require('path');
const { Client, Events, GatewayIntentBits, Guilds, EmbedBuilder, MessageManager, Embed, Collection, GuildMember, GuildHubType, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('search')
    .setDescription('Searches the catalogue')
    .addStringOption(option =>
      option.setName('channel')
        .setDescription('Select a channel to search in')
        .setRequired(true)
        .addChoices(
          { name: 'Archer', value: 'archer' },
          { name: 'Warrior', value: 'warrior' },
          { name: 'Shaman', value: 'shaman' },
          { name: 'Mage', value: 'mage' },
          { name: 'Assassin', value: 'assassin' },
          { name: 'All Channels', value: 'all' },
        )
    )
    .addStringOption(option =>
      option.setName('keyword')
        .setDescription('Enter the keywords to search for, separated by spaces')
        .setRequired(true)
    ),
  async execute(interaction) {
    const userInteractionIdentifier = `${interaction.user.id}-${interaction.id}`;

    await interaction.deferReply({ fetchReply: true });
    const channelOption = interaction.options.getString('channel');
    const keywords = interaction.options.getString('keyword').split(' ');

    const allowedRole = '1103119794275897347'; 
    const allowedChannelId = '962377198315130941';

    const allowedChannel = interaction.channel
    const userRoles = interaction.member.roles.cache;

    // Check if it's outside the specified channel
    if (allowedChannel.id !== allowedChannelId && !userRoles.has(allowedRole)) {
        return interaction.followUp('BlueBot commands are to be used in <#962377198315130941>!');
    }
    
    // Check if the user has an ongoing interaction and cancel it
    if (slashCommandCollectorMap.has(interaction.user.id)) {
      const previousCollector = slashCommandCollectorMap.get(interaction.user.id);
      previousCollector.stop('New search initiated.');
    }

    const channelMappings = {
      'archer': '1016896287007842415',
      'warrior': '1016896349301653616',
      'shaman': '1016896429584814240',
      'mage': '1016896363461611550',
      'assassin': '1016896402082758738',
    };

    let channelsToSearch = [];

    const channelId = channelMappings[channelOption];
    const channel = interaction.guild.channels.cache.get(channelId);

    if (channelOption === 'all') {
      channelsToSearch = Object.values(channelMappings).map(channelId => interaction.guild.channels.cache.get(channelId));
    } else {
      if (!channelId) {
        return interaction.followUp('Invalid channel option');
      }
      if (!channel || !channel.isTextBased()) {
        return interaction.followUp('Invalid channel');
      }
      channelsToSearch.push(channel);
    }

    const batchSize = 100;
    const messages = await fetchMessagesFromDiscord(channelsToSearch, batchSize);

    const matchingMessages = messages.filter((message) => {
      const messageContent = message.content || ''; // Ensure messageContent is defined
      const matchedKeywords = keywords.filter(keyword => messageContent.toLowerCase().includes(keyword.toLowerCase()));
      return matchedKeywords.length > 0;
    });

    console.log('Matching messages:', matchingMessages); // Log the matching messages

    const sortedMessages = matchingMessages.sort((a, b) => {
      const aRecommended = a.content.toLowerCase().includes('recommended');
      const bRecommended = b.content.toLowerCase().includes('recommended');
      const aBeginner = a.content.toLowerCase().includes('beginner');
      const bBeginner = b.content.toLowerCase().includes('beginner');

      // Prioritize messages containing both "recommended" and "beginner friendly"
      if (aRecommended && aBeginner && !bRecommended && !bBeginner) {
        return -1; // a comes first
      } else if (!aRecommended && !aBeginner && bRecommended && bBeginner) {
        return 1; // b comes first
      }

      // Sort by recommended and beginner status
      if ((aRecommended && bRecommended) || (aBeginner && bBeginner)) {
        return 0; // No change in order
      } else if (aRecommended || aBeginner) {
        return -1; // a comes first
      } else if (bRecommended || bBeginner) {
        return 1; // b comes first
      }

      return 0; // No change in order
    });

    const resultsPerPage = 5;
    const totalPages = Math.ceil(sortedMessages.length / resultsPerPage);

    if (totalPages < 1) {
      return interaction.followUp('No results found.');
    }

    const pages = [];
    for (let i = 0; i < totalPages; i++) {
      const startIdx = i * resultsPerPage;
      const endIdx = startIdx + resultsPerPage;
      const paginatedMessages = matchingMessages.slice(startIdx, endIdx);

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

    interaction.followUp({
      embeds: [pages[0]],
      components: [row],
    }).then(async () => {
      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.customId === 'pageSelect' && i.user.id === interaction.user.id,
        time: 120000,
      });

      // Store the collector in a Map using the userInteractionIdentifier as the key
      slashCommandCollectorMap.set(interaction.user.id, collector);

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
        interaction.editReply({ components: [row] });
        // Remove the collector from the Map when it ends
        slashCommandCollectorMap.delete(interaction.user.id);
      });
    }).catch(error => {
      console.error(error);
      interaction.followUp('An error occurred while sending the initial message.');
    });
  },
};

const slashCommandCollectorMap = new Map();


function extractFirstLine(content) {
  if (!content) {
    console.error('Content is undefined or null.');
    return null;  
  }

  console.log('Content:', content);
  return content.split('\n')[0];
}

async function fetchMessagesFromDiscord(channels, batchSize) {
  let allMessages = [];

  for (const channel of channels) {
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
  }

  return allMessages;
}

function countReactions(message) {
  return message.reactions.cache.reduce((count, reaction) => count + reaction.count, 0);
}