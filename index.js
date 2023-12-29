const { Client, Events, GatewayIntentBits, Guilds, EmbedBuilder, MessageManager, Embed, Collection, GuildMember, GuildHubType, AuditLogEvent, REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildEmojisAndStickers,
  ],
});

client.commands = new Collection();
client.chatCommands = new Collection();

// Grab all the command files from the commands directory you created earlier
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);
const commands = [];

for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
  }
}


const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command.', ephemeral: true });
  }
});

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// and deploy your commands!
(async () => {
  try {

    console.log(`Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands in the guild with the current set
    const data = await rest.put(
      Routes.applicationCommands('1171309086646730802'), // <------------ REPLACE THIS WITH YOUR BOT'S ID
      { body: commands },
    );

    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    // And of course, make sure you catch and log any errors!
    console.error(error);
  }
})();

// Chat command handler
const chatCommandFoldersPath = path.join(__dirname, 'chatcommands');
const chatCommandFolders = fs.readdirSync(chatCommandFoldersPath);

for (const folder of chatCommandFolders) {
  const chatCommandsPath = path.join(chatCommandFoldersPath, folder);
  const chatCommandFiles = fs.readdirSync(chatCommandsPath).filter(file => file.endsWith('.js'));
  for (const file of chatCommandFiles) {
    const filePath = path.join(chatCommandsPath, file);
    const chatCommand = require(filePath);

    if ('execute' in chatCommand) {
      // Add the primary command name to the map
      client.chatCommands.set(chatCommand.name, chatCommand);

      // Add aliases to the map
      if (chatCommand.aliases && Array.isArray(chatCommand.aliases)) {
        for (const alias of chatCommand.aliases) {
          client.chatCommands.set(alias, chatCommand);
        }
      }
    } else {
      console.log(`[WARNING] The chat command at ${filePath} is missing a required "execute" property.`);
    }
  }
}

client.on('messageCreate', async (message) => {
  // Check if the message is a command with the appropriate prefix
  if (message.content.startsWith('b!')) {
    const args = message.content.slice('b!'.length).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    const chatCommand = client.chatCommands.get(commandName);
    if (!chatCommand) return;

    try {
      await chatCommand.execute(message, args);
    } catch (error) {
      console.error(error);
      await message.reply('There was an error while executing this command.');
    }
  }
});

client.login(process.env.DISCORD_TOKEN)
