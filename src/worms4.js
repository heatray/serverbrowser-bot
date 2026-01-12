import { EmbedBuilder } from "discord.js";
import * as util from "./util.js";

export default class ServerBrowserW4 {
  constructor(client, channels) {
    this.client = client;
    this.server = "worms4.ms4.openspy.net";
    this.name = "worms4";
    this.query = [
      "hostname",
      "hostport",
      "gamename",
      "gamever",
      "gamemode",
      "mapname",
      "landscape",
      "seed",
      // "gametype",
      "subgametype",
      "scheme",
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
            // groupid:      item.fields.groupid
            name:         item.fields.hostname,
            ver:          Number(item.fields.gamever),
            mode:         item.fields.gamemode,
            map:          item.fields.landscape,
            mapLabel:     this.getMapLabel(item.fields.landscape),
            seed:         Number(item.fields.seed),
            type:         this.getType(item.fields.subgametype),
            typeLabel:    this.getTypeLabel(item.fields.subgametype),
            style:        item.fields.scheme.replaceAll('`',''),
            styleLabel:   this.getStyleLabel(item.fields.scheme),
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
      .setColor(s.portcheck ? '#2ECC71' : '#E74C3C')
      .setAuthor({ name: `[${s.type}] ${s.mapLabel}` })
      .setTitle(`${s.password ? ':lock: ' : ''}${s.name} (${s.numPlayers}/${s.maxPlayers})`)
      .setDescription(`:${s.portcheck ? 'white_check_mark' : 'no_entry'}: Port ${this.hostport} is ${s.portcheck ? 'open' : 'closed'} on ${s.ip}`)
      .setFooter({ text: String(s.id) })
      .setTimestamp(s.date);
    if (this.getMapImage(s.map)) {
      let imageBaseUrl = `https://heatray.github.io/serverbrowser-bot/${this.name}`;
      let image = encodeURI(this.getMapImage(s.map));
      embed.setThumbnail(`${imageBaseUrl}/${image}.webp`);
    }
    let countryFlag = `:flag_${s.country.toLowerCase()}:`;
    let fields = [
      { name: 'Name',            value: s.name                            },
      { name: 'Map',             value: s.mapLabel                        },
      { name: 'Seed',            value: String(s.seed)                    },
      { name: 'Type',            value: s.typeLabel                       },
      { name: 'Style',           value: s.styleLabel                      },
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

    return [embed];
  }

  getMapLabel(id) {
    return {
      "Multi.WormwigsBigRigJig":       "Wormwigs Big Rig Jig",
      "Multi.WormwigsBigRigJig.S":     "Wormwigs Big Rig Jig",
      "Multi.ThisGameDoesDragon":      "This Game Does Dragon",
      "Multi.ThisGameDoesDragon.S":    "This Game Does Dragon",
      "Multi.RiverBoatHarbour":        "Riverboat Harbour",
      "Multi.RiverBoatHarbour.S":      "Riverboat Harbour",
      "Multi.DesertOasis":             "Desert Oasis",
      "Multi.DesertOasis.S":           "Desert Oasis",
      "Multi.Tutorial1":               "Worminkle University",
      "Multi.Tutorial1.S":             "Worminkle University",
      "Multi.Tutorial2":               "Unsporting Behaviour",
      "Multi.Tutorial2.S":             "Unsporting Behaviour",
      "Multi.Tutorial3":               "Mike's Secret Laboratory",
      "Multi.Tutorial3.S":             "Mike's Secret Laboratory",
      "Multi.DinerMight":              "Diner Might",
      "Multi.DinerMight.S":            "Diner Might",
      "Multi.BridgeThieves":           "Sneaky Bridge Thieves Inc.",
      "Multi.BridgeThieves.S":         "Sneaky Bridge Thieves Inc.",
      "Multi.Saboteurs":               "Building Site Saboteurs",
      "Multi.Saboteurs.S":             "Building Site Saboteurs",
      "Multi.CrateEscape":             "The Crate Escape",
      "Multi.CrateEscape.S":           "The Crate Escape",
      "Multi.DestructAndServe":        "Destruct And Serve",
      "Multi.DestructAndServe.S":      "Destruct And Serve",
      "Multi.StormTheCastle":          "Storm The Castle",
      "Multi.StormTheCastle.S":        "Storm The Castle",
      "Multi.WindyWizard":             "The Windy Wizard",
      "Multi.WindyWizard.S":           "The Windy Wizard",
      "Multi.RobInTheHood":            "Rob In The Hood",
      "Multi.RobInTheHood.S":          "Rob In The Hood",
      "Multi.JoustAboutIt":            "Joust About It",
      "Multi.JoustAboutIt.S":          "Joust About It",
      "Multi.NiceToSiege":             "Nice To Siege You",
      "Multi.NiceToSiege.S":           "Nice To Siege You",
      "Multi.MineAllMine":             "Mine All Mine",
      "Multi.MineAllMine.S":           "Mine All Mine",
      "Multi.GhostHill":               "Ghost Hill Graveyard",
      "Multi.GhostHill.S":             "Ghost Hill Graveyard",
      "Multi.TinCanWally":             "Tin Can Wally",
      "Multi.TinCanWally.S":           "Tin Can Wally",
      "Multi.DoomCanyon":              "Doom Canyon",
      "Multi.DoomCanyon.S":            "Doom Canyon",
      "Multi.HighNoon":                "High Noon Hijinx",
      "Multi.HighNoon.S":              "High Noon Hijinx",
      "Multi.TurkishDelights":         "Turkish Delights",
      "Multi.TurkishDelights.S":       "Turkish Delights",
      "Multi.NoRoomForError":          "No Room For Error",
      "Multi.NoRoomForError.S":        "No Room For Error",
      "Multi.CarpetCapers":            "Carpet Capers",
      "Multi.CarpetCapers.S":          "Carpet Capers",
      "Multi.GibbonTake":              "Gibbon Take",
      "Multi.GibbonTake.S":            "Gibbon Take",
      "Multi.TraitorousWaters":        "Traitorous Waters",
      "Multi.TraitorousWaters.S":      "Traitorous Waters",
      "Multi.FastFoodDino":            "Fast Food Dino",
      "Multi.FastFoodDino.S":          "Fast Food Dino",
      "Multi.Escape":                  "Escape From Tree-Rex",
      "Multi.Escape.S":                "Escape From Tree-Rex",
      "Multi.ChuteToVictory":          "Chute To Victory",
      "Multi.ChuteToVictory.S":        "Chute To Victory",
      "Multi.LandWormsForgot":         "The Land That Worms Forgot",
      "Multi.LandWormsForgot.S":       "The Land That Worms Forgot",
      "Multi.ValleyOfDinoWorms":       "Valley Of The Dinoworms",
      "Multi.ValleyOfDinoWorms.S":     "Valley Of The Dinoworms",
      "Multi.Hold":                    "Hold Until Reworked",
      "Multi.Hold.S":                  "Hold Until Reworked",
      "Multi.ReSubmission":            "Re-Submission",
      "Multi.ReSubmission.S":          "Re-Submission",
      "Multi.Multi.BUILDING":          "<Random> Construction",
      "Multi.Survivor.BUILDING":       "<Random> Construction",
      "Multi.Multi.CAMELOT":           "<Random> Camelot",
      "Multi.Survivor.CAMELOT":        "<Random> Camelot",
      "Multi.Multi.WILDWEST":          "<Random> Wild West",
      "Multi.Survivor.WILDWEST":       "<Random> Wild West",
      "Multi.Multi.ARABIAN":           "<Random> Arabian",
      "Multi.Survivor.ARABIAN":        "<Random> Arabian",
      "Multi.Multi.PREHSTORIC":        "<Random> Prehistoric",
      "Multi.Survivor.PREHISTORIC":    "<Random> Prehistoric",
      "Multi.Fort.BUILDING":           "Construction",
      "Multi.Destruction.BUILDING":    "Construction",
      "Multi.Statue.BUILDING":         "Construction",
      "Multi.Fort.CAMELOT":            "Camelot",
      "Multi.Destruction.CAMELOT":     "Camelot",
      "Multi.Statue.CAMELOT":          "Camelot",
      "Multi.Fort.WILDWEST":           "Wild West",
      "Multi.Destruction.WILDWEST":    "Wild West",
      "Multi.Statue.WILDWEST":         "Wild West",
      "Multi.Fort.ARABIAN":            "Arabian",
      "Multi.Destruction.ARABIAN":     "Arabian",
      "Multi.Statue.ARABIAN":          "Arabian",
      "Multi.Fort.PREHISTORIC":        "Prehistoric",
      "Multi.Destruction.PREHISTORIC": "Prehistoric",
      "Multi.Statue.PREHISTORIC":      "Prehistoric",
    }[id] || id;
  }

  getMapImage(id) {
    return {
      "Demo.Mission":                  "MineAllMine",
      "Demo.Multiplayer":              "DoomCanyon",
      "Multi.BridgeThieves":           "SneakyBridgeThieves",
      "Multi.BridgeThieves.S":         "SneakyBridgeThieves",
      "Multi.CarpetCapers":            "CarpetCapers",
      "Multi.CarpetCapers.S":          "CarpetCapers",
      "Multi.ChuteToVictory":          "ChuteToVictory",
      "Multi.ChuteToVictory.S":        "ChuteToVictory",
      "Multi.CrateEscape":             "TheCrateEscape",
      "Multi.CrateEscape.S":           "TheCrateEscape",
      "Multi.DesertOasis":             "Challenge10",
      "Multi.DesertOasis.S":           "Challenge10",
      "Multi.DestructAndServe":        "DestructAndServe",
      "Multi.DestructAndServe.S":      "DestructAndServe",
      "Multi.Destruction.ARABIAN":     "Level ARABIAN",
      "Multi.Destruction.BUILDING":    "Level BUILDING",
      "Multi.Destruction.CAMELOT":     "Level CAMELOT",
      "Multi.Destruction.PREHISTORIC": "Level PREHISTORIC",
      "Multi.Destruction.WILDWEST":    "Level WILDWEST",
      "Multi.DinerMight":              "DinerMight",
      "Multi.DinerMight.S":            "DinerMight",
      "Multi.DoomCanyon":              "DoomCanyon",
      "Multi.DoomCanyon.S":            "DoomCanyon",
      "Multi.Escape":                  "EscapeFromTreeRex",
      "Multi.Escape.S":                "EscapeFromTreeRex",
      "Multi.FastFoodDino":            "FastFoodDino",
      "Multi.FastFoodDino.S":          "FastFoodDino",
      "Multi.Fort.ARABIAN":            "Level ARABIAN",
      "Multi.Fort.BUILDING":           "Level BUILDING",
      "Multi.Fort.CAMELOT":            "Level CAMELOT",
      "Multi.Fort.PREHISTORIC":        "Level PREHISTORIC",
      "Multi.Fort.WILDWEST":           "Level WILDWEST",
      "Multi.GhostHill":               "GhostHillGraveyard",
      "Multi.GhostHill.S":             "GhostHillGraveyard",
      "Multi.GibbonTake":              "GibbonTake",
      "Multi.GibbonTake.S":            "GibbonTake",
      "Multi.HighNoon":                "HighNoonHiJinx",
      "Multi.HighNoon.S":              "HighNoonHiJinx",
      "Multi.Hold":                    "Deathmatch05",
      "Multi.Hold.S":                  "Deathmatch05",
      "Multi.JoustAboutIt":            "JoustAboutIt",
      "Multi.JoustAboutIt.S":          "JoustAboutIt",
      "Multi.LandWormsForgot":         "TheLandThatWormsForgot",
      "Multi.LandWormsForgot.S":       "TheLandThatWormsForgot",
      "Multi.MineAllMine":             "MineAllMine",
      "Multi.MineAllMine.S":           "MineAllMine",
      "Multi.Multi.ARABIAN":           "Random_Arabian",
      "Multi.Multi.BUILDING":          "Random_Construction",
      "Multi.Multi.CAMELOT":           "Random_Camelot",
      "Multi.Multi.PREHSTORIC":        "Random_Prehistoric",
      "Multi.Multi.WILDWEST":          "Random_WildWest",
      "Multi.NiceToSiege":             "NiceToSiegeYou",
      "Multi.NiceToSiege.S":           "NiceToSiegeYou",
      "Multi.NoRoomForError":          "NoRoomForError",
      "Multi.NoRoomForError.S":        "NoRoomForError",
      "Multi.ReSubmission":            "Deathmatch10",
      "Multi.ReSubmission.S":          "Deathmatch10",
      "Multi.RiverBoatHarbour":        "RiverBoatHarbour",
      "Multi.RiverBoatHarbour.S":      "RiverBoatHarbour",
      "Multi.RobInTheHood":            "RobInTheHood",
      "Multi.RobInTheHood.S":          "RobInTheHood",
      "Multi.Saboteurs":               "BuildingSiteSaboteurs",
      "Multi.Saboteurs.S":             "BuildingSiteSaboteurs",
      "Multi.Statue.ARABIAN":          "Level ARABIAN",
      "Multi.Statue.BUILDING":         "Level BUILDING",
      "Multi.Statue.CAMELOT":          "Level CAMELOT",
      "Multi.Statue.PREHISTORIC":      "Level PREHISTORIC",
      "Multi.Statue.WILDWEST":         "Level WILDWEST",
      "Multi.StormTheCastle":          "StormTheCastle",
      "Multi.StormTheCastle.S":        "StormTheCastle",
      "Multi.Survivor.ARABIAN":        "Random_Arabian",
      "Multi.Survivor.BUILDING":       "Random_Construction",
      "Multi.Survivor.CAMELOT":        "Random_Camelot",
      "Multi.Survivor.PREHISTORIC":    "Random_Prehistoric",
      "Multi.Survivor.WILDWEST":       "Random_WildWest",
      "Multi.ThisGameDoesDragon":      "Challenge06",
      "Multi.ThisGameDoesDragon.S":    "Challenge06",
      "Multi.TinCanWally":             "TinCanWally",
      "Multi.TinCanWally.S":           "TinCanWally",
      "Multi.TraitorousWaters":        "TraitorousWaters",
      "Multi.TraitorousWaters.S":      "TraitorousWaters",
      "Multi.TurkishDelights":         "TurkishDelights",
      "Multi.TurkishDelights.S":       "TurkishDelights",
      "Multi.Tutorial1":               "Tutorial01",
      "Multi.Tutorial1.S":             "Tutorial01",
      "Multi.Tutorial2":               "Tutorial02",
      "Multi.Tutorial2.S":             "Tutorial02",
      "Multi.Tutorial3":               "Tutorial03",
      "Multi.Tutorial3.S":             "Tutorial03",
      "Multi.ValleyOfDinoWorms":       "ValleyOfTheDinoWorms",
      "Multi.ValleyOfDinoWorms.S":     "ValleyOfTheDinoWorms",
      "Multi.WindyWizard":             "TheWindyWizard",
      "Multi.WindyWizard.S":           "TheWindyWizard",
      "Multi.WormwigsBigRigJig":       "WormWigsBigRigJig",
      "Multi.WormwigsBigRigJig.S":     "WormWigsBigRigJig",
      "Online.Multiplayer":            "Challenge06",
    }[id];
  }

  getType(id) {
    return {
      "Fort":        "HL",
      "Destruction": "DS",
      "Statue":      "SD",
      "Survivor":    "SV",
    }[id] || "DM";
  }

  getTypeLabel(id) {
    return {
      "Fort":        "Homelands",
      "Destruction": "Destruction",
      "Statue":      "Statue Defend",
      "Survivor":    "Survivor",
    }[id] || "Deathmatch";
  }

  getStyleLabel(id) {
    return {
      "FE.Scheme.Beginner":            "Beginner",
      "FE.Scheme.Standard":            "Standard",
      "FE.Scheme.Pro":                 "Pro",
      "FE.Scheme.Bng":                 "BnG",
      "FE.Scheme.Shopping":            "Shopping",
      "FE.Scheme.Allaction":           "All Action",
      "FE.Scheme.Strategy":            "Strategy",
      "FETXT.Scheme.Rootnshoot":       "Root 'n' Shoot",
      "FETXT.Scheme.MegaPower":        "Mega Powers",
      "FETXT.Scheme.HolyGrail":        "Holy Grail",
      "FETXT.Scheme.Mystery":          "It's a Mystery",
      "FETXT.Scheme.Darksider":        "Darksider",
      "FETXT.Scheme.Thekitchensink":   "The Kitchen Sink",
      "FETXT.Scheme.MultiDestruction": "Destruction",
    }[id] || "<Custom> " + id.replaceAll('`','');
  }
}
