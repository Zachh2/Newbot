const fs = require("fs-extra");
const path = require('path');
const { execSync, spawn } = require('child_process');
const config = require("./config.json");
const { join } = path;
const express = require("express");
const session = require("express-session");
const WebSocket = require("ws");
const os = require("os");

const listPackage = JSON.parse(fs.readFileSync('./package.json')).dependencies;
const login = require("fbvibex");
const moment = require("moment-timezone");
const logger = require("./utils/log.js");
const chalk = require("chalk");
const pkg = require('./package.json');
const { setupAPIRoutes } = require("./utils/apis.js");

const app = express();
const PORT = process.env.PORT || 5000;
const startTime = Date.now();

console.log(chalk.bold.dim(` ${pkg.name}`.toUpperCase() + `(v${pkg.version})`));
logger.log(`Getting Started!`, "STARTER");

global.utils = require("./utils");
global.loading = require("./utils/log.js");
global.nodemodule = new Object();
global.config = new Object();
global.configModule = new Object();
global.moduleData = new Array();
global.language = new Object();
global.account = new Object();

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise);
  console.error('Reason:', reason);
});

global.client = new Object({
  commands: new Map(),
  events: new Map(),
  cooldowns: new Map(),
  eventRegistered: new Array(),
  handleSchedule: new Array(),
  handleReaction: new Array(),
  handleReply: new Array(),
  mainPath: process.cwd(),
  configPath: new String(),
  getTime: function(option) {
    switch (option) {
      case "seconds":
        return `${moment.tz("Asia/Manila").format("ss")}`;
      case "minutes":
        return `${moment.tz("Asia/Manila").format("mm")}`;
      case "hours":
        return `${moment.tz("Asia/Manila").format("HH")}`;
      case "date":
        return `${moment.tz("Asia/Manila").format("DD")}`;
      case "month":
        return `${moment.tz("Asia/Manila").format("MM")}`;
      case "year":
        return `${moment.tz("Asia/Manila").format("YYYY")}`;
      case "fullHour":
        return `${moment.tz("Asia/Manila").format("HH:mm:ss")}`;
      case "fullYear":
        return `${moment.tz("Asia/Manila").format("DD/MM/YYYY")}`;
      case "fullTime":
        return `${moment.tz("Asia/Manila").format("HH:mm:ss DD/MM/YYYY")}`;
    }
  },
  timeStart: Date.now()
});

global.data = new Object({
  threadInfo: new Map(),
  threadData: new Map(),
  userName: new Map(),
  userBanned: new Map(),
  threadBanned: new Map(),
  commandBanned: new Map(),
  threadAllowNSFW: new Array(),
  allUserID: new Array(),
  allCurrenciesID: new Array(),
  allThreadID: new Array()
});

const { getThemeColors } = require("./utils/log");
const { main, secondary, tertiary, html } = getThemeColors();
fs.readFile('./includes/cover/html.json', 'utf8', (err, data) => {
  if (err) return console.error(err);
  const res = JSON.parse(data);
  res.THEME_COLOR = html;
  fs.writeFile('./includes/cover/html.json', JSON.stringify(res, null, 2));
});

var configValue;
try {
  global.client.configPath = path.join(global.client.mainPath, "config.json");
  configValue = require(global.client.configPath);
  logger.loader("Found config.json file!");
} catch (e) {
  return logger.loader('"config.json" file not found."', "error");
}

try {
  for (const key in configValue) global.config[key] = configValue[key];
  logger.loader("Config Loaded!");
} catch (e) {
  return logger.loader("Can't load file config!", "error")
}

for (const property in listPackage) {
  try {
    global.nodemodule[property] = require(property)
  } catch (e) { }
}

const langFile = (fs.readFileSync(`${__dirname}/languages/${global.config.language || "en"}.lang`, {
  encoding: 'utf-8'
})).split(/\r?\n|\r/);
const langData = langFile.filter(item => item.indexOf('#') != 0 && item != '');
for (const item of langData) {
  const getSeparator = item.indexOf('=');
  const itemKey = item.slice(0, getSeparator);
  const itemValue = item.slice(getSeparator + 1, item.length);
  const head = itemKey.slice(0, itemKey.indexOf('.'));
  const key = itemKey.replace(head + '.', '');
  const value = itemValue.replace(/\\n/gi, '\n');
  if (typeof global.language[head] == "undefined") global.language[head] = new Object();
  global.language[head][key] = value;
}

global.getText = function(...args) {
  const langText = global.language;
  if (!langText.hasOwnProperty(args[0])) {
    throw new Error(`${__filename} - Not found key language: ${args[0]}`);
  }
  var text = langText[args[0]][args[1]];
  if (typeof text === 'undefined') {
    throw new Error(`${__filename} - Not found key text: ${args[1]}`);
  }
  for (var i = args.length - 1; i > 0; i--) {
    const regEx = RegExp(`%${i}`, 'g');
    text = text.replace(regEx, args[i + 1]);
  }
  return text;
};

var appState;
try {
  var appStateFile = path.resolve(path.join(global.client.mainPath, config.APPSTATEPATH || "appstate.json"));
  appState = ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && (fs.readFileSync(appStateFile, 'utf8'))[0] != "[" && config.encryptSt) 
    ? JSON.parse(global.utils.decryptState(fs.readFileSync(appStateFile, 'utf8'), (process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER))) 
    : require(appStateFile);
  logger.loader("Found the bot's appstate.")
} catch (e) {
  logger.loader("Can't find the bot's appstate.", "error");
}

let isBotRunning = false;
let currentBotProcess = null;
let currentListenMqtt = null;

function reloadAllModules() {
  try {
    Object.keys(require.cache).forEach(key => {
      if (key.includes('/modules/commands/') || key.includes('/modules/events/')) {
        delete require.cache[key];
      }
    });
    
    global.client.commands.clear();
    global.client.events.clear();
    global.client.eventRegistered = [];
    
    const commandsPath = `${global.client.mainPath}/modules/commands`;
    const listCommand = fs.readdirSync(commandsPath).filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
    console.log(tertiary(`\n` + `──RELOADING COMMANDS─●`));
    for (const command of listCommand) {
      try {
        const module = require(`${commandsPath}/${command}`);
        const { config } = module;

        if (!config?.name) {
          try {
            throw new Error(`[ COMMAND ] ${command} command has no name property or empty!`);
          } catch (error) {
            console.log(chalk.red(error.message));
            continue;
          }
        }
        if (!config?.commandCategory) {
          try {
            throw new Error(`[ COMMAND ] ${command} commandCategory is empty!`);
          } catch (error) {
            console.log(chalk.red(error.message));
            continue;
          }
        }

        if (!config?.hasOwnProperty('usePrefix')) {
          console.log(`Command`, chalk.hex("#ff0000")(command) + ` does not have the "usePrefix" property.`);
          continue;
        }

        if (global.client.commands.has(config.name || '')) {
          console.log(chalk.red(`[ COMMAND ] ${chalk.hex("#FFFF00")(command)} Module is already loaded!`));
          continue;
        }
        const { dependencies, envConfig } = config;
        
        if (dependencies) {
          Object.entries(dependencies).forEach(([reqDependency, _]) => {
            if (listPackage[reqDependency]) return;

              try {
                execSync(`npm --package-lock false --save install ${reqDependency}`, {
                  stdio: 'inherit',
                  env: process.env,
                  shell: true,
                  cwd: join(__dirname, 'node_modules')
                });
                require.cache = {};
              } catch (error) {
                const errorMessage = `[PACKAGE] Failed to install package ${reqDependency} for module`;
                global.loading.err(chalk.hex('#ff7100')(errorMessage), 'LOADED');
              }
          });
        }

        if (envConfig) {
          const moduleName = config.name;
          global.configModule[moduleName] = global.configModule[moduleName] || {};
          global.config[moduleName] = global.config[moduleName] || {};
          for (const envConfigKey in envConfig) {
            global.configModule[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
            global.config[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
          }
          var configPath = require('./config.json');
          configPath[moduleName] = envConfig;
          fs.writeFileSync(global.client.configPath, JSON.stringify(configPath, null, 4), 'utf-8');
        }

        if (module.onLoad) {
          const moduleData = { api: global.client.api };
          try {
            module.onLoad(moduleData);
          } catch (error) {
            const errorMessage = "Unable to load the onLoad function of the module."
            throw new Error(errorMessage, 'error');
          }
        }

        if (module.handleEvent) global.client.eventRegistered.push(config.name);
        global.client.commands.set(config.name, module);
        try {
          global.loading.log(`${main(`RELOADED`)} ${secondary(config.name)} success`, "COMMAND");
        } catch (err) {
          console.error("An error occurred while logging the command:", err);
        }
      } catch (error) {
        global.loading.err(`${chalk.hex('#ff7100')(`RELOADED`)} ${chalk.hex("#FFFF00")(command)} fail ` + error, "COMMAND");
      }
    }
    
    const events = fs.readdirSync(path.join(global.client.mainPath, 'modules/events')).filter(ev => ev.endsWith('.js') && !global.config.eventDisabled.includes(ev));
    console.log(tertiary(`\n` + `──RELOADING EVENTS─●`));
    for (const ev of events) {
      try {
        const event = require(path.join(global.client.mainPath, 'modules/events', ev));
        const { config, onLoad, run } = event;
        if (!config || !config.name || !run) {
          global.loading.err(`${chalk.hex('#ff7100')(`RELOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is not in the correct format. `, "EVENT");
          continue;
        }

        if (global.client.events.has(config.name)) {
          global.loading.err(`${chalk.hex('#ff7100')(`RELOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is already loaded!`, "EVENT");
          continue;
        }
        
        if (config.dependencies) {
          const missingDeps = Object.keys(config.dependencies).filter(dep => !global.nodemodule[dep]);
          if (missingDeps.length) {
            const depsToInstall = missingDeps.map(dep => `${dep}${config.dependencies[dep] ? '@' + config.dependencies[dep] : ''}`).join(' ');
            if (depsToInstall) {
            execSync(`npm install --no-package-lock --no-save ${depsToInstall}`, {
              stdio: 'inherit',
              env: process.env,
              shell: true,
              cwd: path.join(__dirname, 'node_modules')
            });
            }
            Object.keys(require.cache).forEach(key => delete require.cache[key]);
          }
        }
        
        if (config.envConfig) {
          const configModule = global.configModule[config.name] || (global.configModule[config.name] = {});
          const configData = global.config[config.name] || (global.config[config.name] = {});
          for (const evt in config.envConfig) {
            configModule[evt] = configData[evt] = config.envConfig[evt] || '';
          }
          fs.writeFileSync(global.client.configPath, JSON.stringify({
            ...require(global.client.configPath),
            [config.name]: config.envConfig
          }, null, 2));
        }
        
        if (onLoad) {
          const eventData = { api: global.client.api };
          onLoad(eventData);
        }
        
        global.client.events.set(config.name, event);
        global.loading.log(`${main(`RELOADED`)} ${secondary(config.name)} success`, "EVENT");
      }
      catch (err) {
        global.loading.err(`${chalk.hex("#ff0000")('ERROR!')} ${secondary(ev)} failed with error: ${err.message}` + `\n`, "EVENT");
      }
    }
    
    logger.loader(`Reloaded ${global.client.commands.size} commands and ${global.client.events.size} events successfully`);
  } catch (err) {
    logger.loader("Failed to reload modules: " + err, "error");
  }
}

function refreshMQTT() {
  try {
    if (currentListenMqtt && typeof currentListenMqtt.stop === 'function') {
      currentListenMqtt.stop();
      currentListenMqtt = null;
      logger.loader("MQTT connection stopped.");
    }
    
    if (global.client && global.client.api) {
      const listener = require('./includes/listen')({ api: global.client.api });
      currentListenMqtt = global.client.api.listenMqtt(async (error, event) => {
        console.log(event);
        if (error) {
          if (error.error === 'Not logged in.' || error.error === 'Not logged in') {
            logger.log("Your bot account has been logged out or checkpointed!", 'LOGIN_ERROR');
            return process.exit(1);
          }
          console.log(error);
          return process.exit(0);
        }
        return listener(event);
      });
      logger.loader("MQTT connection refreshed!");
    }
  } catch (err) {
    logger.loader("Failed to refresh MQTT: " + err, "error");
  }
}

global.restart = function(type) {
  if (type === 1) {
    console.log(chalk.green("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.yellow("🔄 RESTARTING BOT..."));
    console.log(chalk.green("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.cyan("📦 Reloading all modules..."));
    reloadAllModules();
    console.log(chalk.cyan("🔌 Refreshing MQTT connection..."));
    refreshMQTT();
    console.log(chalk.green("✅ Bot restarted successfully!"));
    console.log(chalk.green("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
  } else if (type === 2) {
    console.log(chalk.red("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    console.log(chalk.red("🛑 SHUTTING DOWN BOT..."));
    console.log(chalk.red("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"));
    if (currentListenMqtt && typeof currentListenMqtt.stop === 'function') {
      currentListenMqtt.stop();
    }
    if (global.client && global.client.api) {
      global.client.api.logout();
    }
    console.log(chalk.red("MQTT connection stopped. Bot is shutting down."));
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  } else {
    console.log(chalk.red("Invalid option. Use: global.restart(1) for restart, global.restart(2) for shutdown"));
  }
};

function onBot() {
  if (isBotRunning) {
    logger.loader("Bot is already running, skipping duplicate start.", "warning");
    return;
  }
  
  isBotRunning = true;
  
  let loginData = { appState: appState };
  
  login(loginData, {
    advancedProtection: true,
    updatePresence: true,
    autoMarkRead: true,
    online: true,
    autoMarkDelivery: true,
    autoRotateSession: true,
  }, async (err, api) => {
    let getTheInfo = api;
    if (err) {
      if (err.error == 'Error retrieving userID. This can be caused by a lot of things, including getting blocked by Facebook for logging in from an unknown location. Try logging in with a browser to verify.') {
        console.log(err.error)
        process.exit(0)
      } else {
        console.log(err)
        return process.exit(0)
      }
    }
    
    const custom = require('./custom');
    custom({ api });
    const startOnlinePresence = require('./utils/online');
    const onlinePresence = startOnlinePresence();
    const fbstate = api.getAppState();
    api.setOptions(global.config.FCAOption);

    let d = api.getAppState();
    d = JSON.stringify(d, null, '\x09');
    
    const raw = {
      trs:{},
    };
    
    if ((process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER) && global.config.encryptSt) {
      d = await global.utils.encryptState(d, process.env.REPL_OWNER || process.env.PROCESSOR_IDENTIFIER);
      fs.writeFileSync(appStateFile, d)
    } else {
      fs.writeFileSync(appStateFile, d)
    }
    
    global.account.cookie = fbstate.map(i => i = i.key + "=" + i.value).join(";");
    global.client.api = api
global.config.version = config.version;

try {
  const usersDataPath = path.join(__dirname, 'includes/database/data/usersData.json');

  if (!global.data.userBanned) global.data.userBanned = new Map();

  if (fs.existsSync(usersDataPath)) {
    const usersData = JSON.parse(fs.readFileSync(usersDataPath, "utf8"));

    let count = 0;

    for (const [userID, data] of Object.entries(usersData)) {
      if (data.banned === true) {
        global.data.userBanned.set(userID, {
          reason: data.banReason || "No reason",
          bannedAt: data.bannedAt || Date.now()
        });
        count++;
      }
    }

    console.log("✅ Loaded banned users:", count);
  }

} catch (err) {
  console.error("❌ Failed to load banned users:", err);
}

    (async () => {
        const commandsPath = `${global.client.mainPath}/modules/commands`;
        const listCommand = fs.readdirSync(commandsPath).filter(command => command.endsWith('.js') && !command.includes('example') && !global.config.commandDisabled.includes(command));
        console.log(tertiary(`\n` + `──LOADING COMMANDS─●`));
        for (const command of listCommand) {
          try {
            const module = require(`${commandsPath}/${command}`);
            const { config } = module;

            if (!config?.name) {
              try {
                throw new Error(`[ COMMAND ] ${command} command has no name property or empty!`);
              } catch (error) {
                console.log(chalk.red(error.message));
                continue;
              }
            }
            if (!config?.commandCategory) {
              try {
                throw new Error(`[ COMMAND ] ${command} commandCategory is empty!`);
              } catch (error) {
                console.log(chalk.red(error.message));
                continue;
              }
            }

            if (!config?.hasOwnProperty('usePrefix')) {
              console.log(`Command`, chalk.hex("#ff0000")(command) + ` does not have the "usePrefix" property.`);
              continue;
            }

            if (global.client.commands.has(config.name || '')) {
              console.log(chalk.red(`[ COMMAND ] ${chalk.hex("#FFFF00")(command)} Module is already loaded!`));
              continue;
            }
            const { dependencies, envConfig } = config;
            
            if (dependencies) {
              Object.entries(dependencies).forEach(([reqDependency, _]) => {
                if (listPackage[reqDependency]) return;

                  try {
                    execSync(`npm --package-lock false --save install ${reqDependency}`, {
                      stdio: 'inherit',
                      env: process.env,
                      shell: true,
                      cwd: join(__dirname, 'node_modules')
                    });
                    require.cache = {};
                  } catch (error) {
                    const errorMessage = `[PACKAGE] Failed to install package ${reqDependency} for module`;
                    global.loading.err(chalk.hex('#ff7100')(errorMessage), 'LOADED');
                  }
              });
            }

            if (envConfig) {
              const moduleName = config.name;
              global.configModule[moduleName] = global.configModule[moduleName] || {};
              global.config[moduleName] = global.config[moduleName] || {};
              for (const envConfigKey in envConfig) {
                global.configModule[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
                global.config[moduleName][envConfigKey] = global.config[moduleName][envConfigKey] ?? envConfig[envConfigKey];
              }
              var configPath = require('./config.json');
              configPath[moduleName] = envConfig;
              fs.writeFileSync(global.client.configPath, JSON.stringify(configPath, null, 4), 'utf-8');
            }

            if (module.onLoad) {
              const moduleData = { api: api };
              try {
                module.onLoad(moduleData);
              } catch (error) {
                const errorMessage = "Unable to load the onLoad function of the module."
                throw new Error(errorMessage, 'error');
              }
            }

            if (module.handleEvent) global.client.eventRegistered.push(config.name);
            global.client.commands.set(config.name, module);
            try {
              global.loading.log(`${main(`LOADED`)} ${secondary(config.name)} success`, "COMMAND");
            } catch (err) {
              console.error("An error occurred while logging the command:", err);
            }
          } catch (error) {
            global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(command)} fail ` + error, "COMMAND");
          }
        }
      })();

      (async () => {
        const events = fs.readdirSync(path.join(global.client.mainPath, 'modules/events')).filter(ev => ev.endsWith('.js') && !global.config.eventDisabled.includes(ev));
        console.log(tertiary(`\n` + `──LOADING EVENTS─●`));
        for (const ev of events) {
          try {
            const event = require(path.join(global.client.mainPath, 'modules/events', ev));
            const { config, onLoad, run } = event;
            if (!config || !config.name || !run) {
              global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is not in the correct format. `, "EVENT");
              continue;
            }

            if (global.client.events.has(config.name)) {
              global.loading.err(`${chalk.hex('#ff7100')(`LOADED`)} ${chalk.hex("#FFFF00")(ev)} Module is already loaded!`, "EVENT");
              continue;
            }
            
            if (config.dependencies) {
              const missingDeps = Object.keys(config.dependencies).filter(dep => !global.nodemodule[dep]);
              if (missingDeps.length) {
                const depsToInstall = missingDeps.map(dep => `${dep}${config.dependencies[dep] ? '@' + config.dependencies[dep] : ''}`).join(' ');
                if (depsToInstall) {
                execSync(`npm install --no-package-lock --no-save ${depsToInstall}`, {
                  stdio: 'inherit',
                  env: process.env,
                  shell: true,
                  cwd: path.join(__dirname, 'node_modules')
                });
                }
                Object.keys(require.cache).forEach(key => delete require.cache[key]);
              }
            }
            
            if (config.envConfig) {
              const configModule = global.configModule[config.name] || (global.configModule[config.name] = {});
              const configData = global.config[config.name] || (global.config[config.name] = {});
              for (const evt in config.envConfig) {
                configModule[evt] = configData[evt] = config.envConfig[evt] || '';
              }
              fs.writeFileSync(global.client.configPath, JSON.stringify({
                ...require(global.client.configPath),
                [config.name]: config.envConfig
              }, null, 2));
            }
            
            if (onLoad) {
              const eventData = { api: api };
              await onLoad(eventData);
            }
            
            global.client.events.set(config.name, event);
            global.loading.log(`${main(`LOADED`)} ${secondary(config.name)} success`, "EVENT");
          }
          catch (err) {
            global.loading.err(`${chalk.hex("#ff0000")('ERROR!')} ${secondary(ev)} failed with error: ${err.message}` + `\n`, "EVENT");
          }
        }
      })();
    
    console.log(tertiary(`\n` + `──BOT START─● `));
    global.loading.log(`${main(`[ SUCCESS ]`)} Loaded ${secondary(`${global.client.commands.size}`)} commands and ${secondary(`${global.client.events.size}`)} events successfully`, "LOADED");
    global.loading.log(`${main(`[ TIMESTART ]`)} Launch time: ${((Date.now() - global.client.timeStart) / 1000).toFixed()}s`, "LOADED");
    global.utils.complete({ raw });

    if (fs.existsSync('./threadID.json')) {
            const data = JSON.parse(fs.readFileSync('./threadID.json', 'utf8'));
            if (data.threadID) {
                api.sendMessage("✅ 𝗥𝗲𝘀𝘁𝗮𝗿𝘁𝗲𝗱 𝗦𝘂𝗰𝗰𝗲𝘀𝘀𝗳𝘂𝗹𝗹𝘆\n━━━━━━━━━━━━━━━━━━\nBot has been Fully Restarted!", data.threadID, (err) => {
                    if (err) {
                        console.error("Failed to send message:", err);
                    } else {
                        console.log("Restart message sent successfully.");
                        fs.unlinkSync('./threadID.json');
                        console.log("threadID.json has been deleted.");
                    }
                });
            }
    }      
    
    const listener = require('./includes/listen')({ api });
    currentListenMqtt = api.listenMqtt(async (error, event) => {
console.log(event);
      if (error) {
        if (error.error === 'Not logged in.' || error.error === 'Not logged in') {
          logger.log("Your bot account has been logged out or checkpointed!", 'LOGIN_ERROR');
          return process.exit(1);
        }
        console.log(error);
        return process.exit(0);
      }
      return listener(event);
    });
  });
}

function restartBot() {
  if (currentBotProcess) {
    currentBotProcess.kill();
    currentBotProcess = null;
  }
  
  isBotRunning = false;
  
  setTimeout(() => {
    currentBotProcess = spawn(process.argv[0], [__filename], {
      detached: false,
      stdio: 'inherit',
      env: process.env
    });
    
    currentBotProcess.on('exit', (code) => {
      console.log(`Bot process exited with code ${code}`);
      currentBotProcess = null;
      isBotRunning = false;
    });
    
    currentBotProcess.on('error', (err) => {
      console.error('Failed to start bot process:', err);
      currentBotProcess = null;
      isBotRunning = false;
    });
    
    process.exit();
  }, 1000);
}

const diskusage = require('diskusage');

if (!fs.existsSync("./panel.json")) {
    fs.writeFileSync("./panel.json", JSON.stringify({
        username: "admin",
        pass: "admin123"
    }, null, 4));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: "zach_core_secret_99",
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, 
        maxAge: 24 * 60 * 60 * 1000 
    }
}));

const authMiddleware = (req, res, next) => {
    const publicPaths = ["/login", "/api/auth/login"];
    if (publicPaths.includes(req.path) || req.session.authenticated) {
        return next();
    }
    res.redirect("/login");
};

app.use(authMiddleware);
app.use(express.static(path.join(__dirname, "public")));

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "login.html"));
});

app.post("/api/auth/login", (req, res) => {
    const { username, pass } = req.body;
    try {
        const configPanel = JSON.parse(fs.readFileSync("./panel.json", "utf8"));
        if (username === configPanel.username && pass === configPanel.pass) {
            req.session.authenticated = true;
            return res.json({ success: true });
        }
        res.status(401).json({ success: false });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

app.get("/api/auth/logout", (req, res) => {
    req.session.destroy();
    res.sendStatus(200);
});

app.use(authMiddleware);

setupAPIRoutes(app, { 
    global, 
    fs, 
    path, 
    os, 
    diskusage, 
    startTime,
    restartBot 
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/filemanagement", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "filemanager.html"));
});

app.get("/terminal", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "terminal.html"));
});

const server = app.listen(PORT, () => {
    console.log(`ZACH_CORE Backend running on http://localhost:${PORT}`);
});

const wss = new WebSocket.Server({ server });
const clients = new Set();

const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  originalLog(...args);

  const msg = args.join(" ");

  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
};

console.error = (...args) => {
  originalError(...args);

  const msg = args.join(" ");

  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send("ERROR: " + msg);
    }
  });
};

wss.on("connection", (ws) => {
  clients.add(ws);

  ws.send("🟢 Connected to bot console");

  ws.on("message", (message) => {
    const cmd = message.toString().trim();

    if (!cmd) return;

    console.log("CMD:", cmd);

    const { exec } = require("child_process");

    exec(cmd, (err, stdout, stderr) => {
      if (err) {
        return ws.send("ERROR: " + err.message);
      }

      if (stdout) ws.send(stdout);
      if (stderr) ws.send(stderr);
    });
  });

  ws.on("close", () => {
    clients.delete(ws);
  });
});
 
wss.on("connection", (ws) => {
    ws.send("Connected to Terminal WS");
    ws.on("message", (message) => {
        const cmd = message.toString();
        if (cmd === "SIGINT_EXEC") {
            if (global.client && global.client.api) {
                ws.send("Cannot kill bot from here");
            } else {
                ws.send("Bot not running");
            }
        } else if (cmd === "restart") {
            ws.send("Restarting bot...");
            restartBot();
        }
    });
});

(async () => {
  try {
    console.log(tertiary(`\n` + `──DATABASE─●`));
    global.loading.log(`${main(`[ CONNECT ]`)} Connected to JSON database successfully!`, "DATABASE");
    onBot();
  } catch (error) {
    global.loading.err(`${main(`[ CONNECT ]`)} Failed to connect to the JSON database: ` + error, "DATABASE");
  }
})();