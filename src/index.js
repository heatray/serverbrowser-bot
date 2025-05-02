import { readFileSync } from 'node:fs';
import { default as jsonc } from 'strip-json-comments';
import { Client, Events, GatewayIntentBits } from "discord.js";
import ServerBrowserW3 from "./worms3.js";
import ServerBrowserWF from "./wormsforts.js";
import ServerBrowserW4 from "./worms4.js";

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const config = JSON.parse(jsonc(readFileSync('config.json', 'utf-8')));

client.on(Events.ClientReady, readyClient => {
  console.log(`Logged in as ${readyClient.user.tag}!`);
  // checkForUpdates();
});

client.login(config.discordToken)
.then(() => {
  client.sbW3 = new ServerBrowserW3(client, config.channels);
  client.sbWF = new ServerBrowserWF(client, config.channels);
  client.sbW4 = new ServerBrowserW4(client, config.channels);
})
.catch(console.error);
