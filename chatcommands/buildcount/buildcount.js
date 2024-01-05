const { Client, Events, GatewayIntentBits, Guilds, EmbedBuilder, MessageManager, Embed, Collection, GuildMember, GuildHubType, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'buildcount',
  description: 'Displays the number of builds in each channel',
  aliases: ['bc'],
  async execute(message) {

    const allowedRole = '1158914668400746526'; 
    const allowedChannelId = '962377198315130941';

    const allowedChannel = message.channel
    const userRoles = message.author.roles.cache;

    // Check if it's outside the specified channel
    if (allowedChannel.id !== allowedChannelId && !userRoles.has(allowedRole)) {
        return message.reply('BlueBot commands are to be used in <#962377198315130941>!');
    }
    
    const embed = new EmbedBuilder()
      .setColor('#4744fc')
      .setTitle('「Build Count For The Build Catalogues」')
      .setDescription('<:hourglass:1183124566327959622> Fetching the builds... This may take a while! ')
      .setTimestamp()
      .setFooter({ text: 'Courtesy of BlueBot', iconURL: `${message.author.avatarURL()}` });

    const sentMessage = await message.channel.send({ embeds: [embed] });

    const channelMappings = {
      'archer': { id: '874053828008366081', emoji: '<:bow:1148632746726527089>' },
      'warrior': { id: '874141655643586660', emoji: '<:spear:1148632926754443327>' },
      'shaman': { id: '874141675256172634', emoji: '<:relik:1148632897532743680>' },
      'mage':  { id: '1016896363461611550', emoji: '<:wand:1148632863848280085>'},
      'assassin': { id: '1016896402082758738', emoji: '<:dagger:1148632788522782730>'},
    };

    const buildLinks = [
      'https://wynnbuilder.github.io',
      'https://hppeng-wynn.github.io',
    ];

    const results = [];

    let totalBuildCount = 0;

    for (const channelOption of Object.keys(channelMappings)) {
      const { id, emoji } = channelMappings[channelOption];
      const channel = message.guild.channels.cache.get(id);

      if (!channel || !channel.isTextBased()) {
        results.push({ channelOption, count: 0 });
        continue;
      }

      const batchSize = 100;
      const messages = await fetchMessagesFromChannel(channel, batchSize);
      const count = messages.filter(message =>
        buildLinks.some(link => message.content.includes(link))
      ).length;

      totalBuildCount += count;
      results.push({ channelOption, count });
    }

    const fields = results.map(({ channelOption, count }) => ({
      name: `${channelMappings[channelOption].emoji} ${channelOption.charAt(0).toUpperCase() + channelOption.slice(1)}`,
      value: `▸ ${count} Builds`,
      inline: false,
    }));

    // Add empty fields between each channel's result
    for (let i = 1; i < fields.length; i += 2) {
      fields.splice(i, 0, { name: '\u200B', value: '\u200B', inline: true });
    }

    // Add an empty field above the first field
    fields.unshift({ name: '\u200B', value: '\u200B', inline: true });

    embed.setDescription(`As of this instance,**「Blue's Builds」**has a total number of**「${totalBuildCount}」**builds <:blueprint:1175890815252451428>`);
    embed.addFields(fields);

    sentMessage.edit({ embeds: [embed] });
  },
};

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
