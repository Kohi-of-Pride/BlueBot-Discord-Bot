const { Client, Events, GatewayIntentBits, Guilds, EmbedBuilder, MessageManager, Embed, Collection, GuildMember, GuildHubType, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('developer')
    .setDescription('Information regarding the developer.'),
  async execute(interaction) {
    await interaction.deferReply({ fetchReply: true });

    const embed = new EmbedBuilder()
    .setColor('#b00b1e')
    .setThumbnail('https://storage.ko-fi.com/cdn/useruploads/0fafd357-7ed7-40ff-a964-7e7d884638a0.png')
    .setTitle("—「Regarding The Developer」—")
    .setDescription(":wave: Greetings!\n\n\n<:coffee_2_512:1181746652017598534> I'm **Arturia**,  **Kohi, **or** Coffee K.Q.** (K and Q both stand for coffee) and I am a writer and pixel artist. \n\n\n✦ I rewrote BlueBot from scratch at Blue's request. I realized that the bot is more complex in the praxis than in the theory. If you like BlueBot, come and visit me on Ko-fi! :pray:\n\n\n✦ If you want to examine the source code, click on the github button below. \n\n\nI bid you farewell and ask you to remember:\n\n✦『 The Glorious Black Hole Always Wins 』✦\n­")
    .setTimestamp()
    .setFooter({ text: 'Courtesy of Arturia', iconURL: 'https://file.coffee/u/MOpK69aMpMRVia9m4iBIY.png' });

    const github = new ButtonBuilder()
      .setLabel('Source code at Github')
      .setEmoji(':githubmark:1181858863507578921')
      .setURL('https://github.com/Kohi-of-Pride/BlueBot-Discord-Bot')
      .setStyle(ButtonStyle.Link)
      .setDisabled(false);

    const kofi = new ButtonBuilder()
      .setLabel('Support me on Ko-Fi')
      .setEmoji(':kofi:1181858468576108604')
      .setURL('https://ko-fi.com/coffeekq')
      .setStyle(ButtonStyle.Link)
      .setDisabled(false);

    const cookie = new ButtonBuilder()
      .setEmoji('🍪')
      .setURL('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
      .setStyle(ButtonStyle.Link)
      .setDisabled(false);

    const row = new ActionRowBuilder()
      .addComponents(github, kofi, cookie);
    
    interaction.editReply({ 
      embeds: [embed],
      components: [row]
    });
  }
}