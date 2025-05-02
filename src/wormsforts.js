import { EmbedBuilder } from "discord.js";
import * as util from "./util.js";

export default class ServerBrowserWF {
  constructor(client, channels) {
    this.client = client;
    this.server = "wormsforts.ms2.openspy.net";
    this.name = "wormsforts";
    this.query = [
      "hostname",
      "hostport",
      "gamename",
      "gamever",
      "gamemode",
      "groupid",
      "gametype",
      "mapname",
      "GS.SchemeChanging",
      "maxplayers",
      "numplayers",
      "password",
      "timestamp",
      "val",
      "country",
      // "publicip",
      // "publicport",
      "privateip",
      "localport",
      "firewall",
      "backend_id"
    ];
    this.hostport = 5911;
    this.channels = channels;

    this.list = [];
    this.data = [];
    this.servers = [];
    this.stats = { servers: 0, players: 0 };

    this.load();
  }

  async load() {
    this.loop(true);
  }

  async loop(now) {
    setTimeout(async () => {

      let fetchData = await util.gslist(this.name, this.query, this.server) || [];
      let servers = [];
      let players = [];

      // if (fetchData.length > 0) {
      //   console.log("GSLIST", fetchData);
      // }

      for (const item of fetchData) {
        if (!this.list.includes(item.hash)) {
          console.log(`New Server: ${this.name} ${item.ip}:${item.port}`)
          let server = {
            ip:           item.ip,
            port:         item.port,
            id:           Number(item.fields.backend_id.split(':')[1]),
            date:         item.date,
            hash:         item.hash,
            portcheck:    await util.checkPort(this.hostport, item.ip),
            // publicip:     util.getPublicIP(Number(item.fields.publicip)),
            // publicport:   item.fields.publicport,
            localip:      item.fields.privateip,
            // localip0:     item.fields.localip0,
            localport:    item.fields.localport,
            firewall:     Boolean(Number(item.fields.firewall)),
            // hostport:     Number(item.fields.hostport),
            name:         item.fields.hostname.replaceAll('`',''),
            ver:          Number(item.fields.gamever),
            mode:         item.fields.gamemode,
            group:        item.fields.groupid,
            map:          item.fields.mapname.replaceAll('`',''),
            // mapLabel:     this.getMapLabel(item.fields.landscape),
            // type:         item.fields.gametype,
            // typeLabel:    this.getTypeLabel(item.fields.subgametype),
            // schemeChanging: item.fields["GS.SchemeChanging"],
            // styleLabel:   this.getStyleLabel(item.fields.scheme),
            numPlayers:   Number(item.fields.numplayers),
            maxPlayers:   Number(item.fields.maxplayers),
            password:     Boolean(Number(item.fields.password)),
            timestamp:    Number(item.fields.timestamp),
            val:          Number(item.fields.val),
            country:      item.fields.country,
            fields:       item.fields
          };
          console.log(server);

          let channel = this.channels[server.fields.groupid]
          let embeds = await this.makeEmbeds(server);
          this.client.channels.cache.get(channel).send({ embeds: embeds });

          this.list.push(server.hash);
          this.data.push(server);
        } else {
          console.log(`Old Server: ${this.name} ${item.ip}:${item.port}`)
        }
        servers.push(item.hash);
        players.push(item.hostname);
      }

      this.list = this.list.slice(-10)
      this.data = this.data.slice(-10)
      // this.servers = servers;
      this.stats.servers = servers.length;
      this.stats.players = players.length;

      this.loop();
    }, now ? 0 : 15000);
  }

  async makeEmbeds(server) {
    let s = server;

    let embed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle(`${s.password ? ':lock: ' : ''}${s.name} (${s.numPlayers}/${s.maxPlayers})`)
      .setFooter({ text: String(s.id) })
      .setTimestamp(s.date);
    let countryFlag = `:flag_${s.country.toLowerCase()}:`;
    let fields = [
      { name: 'Name',            value: s.name                            },
      { name: 'Map',             value: s.map                             },
      // { name: 'SchemeChanging',  value: s.schemeChanging                  },
      { name: 'Players',         value: `${s.numPlayers}/${s.maxPlayers}` },
      { name: 'Password',        value: s.password ? ':lock: yes' : 'no'  },
      { name: 'Timestamp',       value: String(s.timestamp)               },
      { name: 'Val',             value: String(s.val)                     },
      { name: 'Version',         value: String(s.ver)                     },
      { name: 'Mode',            value: s.mode                            },
      { name: 'Country',         value: `${countryFlag} ${s.country}`     },
      { name: 'IP & Port',       value: `${s.ip}:${s.port}`               },
      { name: 'Local IP & Port', value: `${s.localip}:${s.localport}`     },
      { name: 'Firewall',        value: s.firewall ? 'yes' : 'no'         },
      // { name: 'Port is', value: s.portcheck ? 'open' : ':warning: closed' },
    ]
    for (const f of fields) {
      embed.addFields({ name: f.name, value: f.value, inline: true });
    }

    let embed2 = new EmbedBuilder()
      .setColor(s.portcheck ? '#2ECC71' : '#E74C3C')
      .setDescription(`Port ${this.hostport} is ${s.portcheck ? 'open' : 'closed'} on ${s.ip}`);

    return [embed, embed2];
  }
}
