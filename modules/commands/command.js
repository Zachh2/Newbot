const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
    name: "cmd",
    version: "1.1.0",
    hasPermssion: 2,
    credits: "Mirai Team | Modified by Jonell Magallanes",
    description: "Manage/Control all bot modules",
    usePrefix: true,
    commandCategory: "Admin",
    usages: "[load/unload/loadAll/unloadAll/info/share/install] [name module]",
    cooldowns: 5,
    dependencies: {
        "fs-extra": "",
        "child_process": "",
        "path": ""
    }
};

const loadCommand = function ({ moduleList, threadID, messageID }) {
    const { execSync } = global.nodemodule["child_process"];
    const { writeFileSync, unlinkSync, readFileSync } = global.nodemodule["fs-extra"];
    const { join } = global.nodemodule["path"];
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + "/utils/log");

    var errorList = [];
    delete require["resolve"][require["resolve"](configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 2), "utf8");

    for (const nameModule of moduleList) {
        try {
            const dirModule = __dirname + "/" + nameModule + ".js";
            delete require["cache"][require["resolve"](dirModule)];
            const command = require(dirModule);
            global.client.commands.delete(nameModule);
            if (!command.config || !command.run || !command.config.commandCategory) throw new Error("Module is malformed!");

            global.client["eventRegistered"] = global.client["eventRegistered"].filter(info => info != command.config.name);

            if (command.config.dependencies && typeof command.config.dependencies == "object") {
                const listPackage = JSON.parse(readFileSync("./package.json")).dependencies,
                    listbuiltinModules = require("module")["builtinModules"];
                for (const packageName in command.config.dependencies) {
                    var tryLoadCount = 0, loadSuccess = false, error;
                    const moduleDir = join(global.client.mainPath, "nodemodules", "node_modules", packageName);
                    try {
                        if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName))
                            global.nodemodule[packageName] = require(packageName);
                        else global.nodemodule[packageName] = require(moduleDir);
                    } catch {
                        logger.loader("Not found package " + packageName + " support for module " + command.config.name + " installing...", "warn");
                        const insPack = {};
                        insPack.stdio = "inherit";
                        insPack.env = process.env;
                        insPack.shell = true;
                        insPack.cwd = join(global.client.mainPath, "nodemodules");
                        execSync(
                            "npm --package-lock false --save install " +
                                packageName +
                                (command.config.dependencies[packageName] == "*" || command.config.dependencies[packageName] == ""
                                    ? ""
                                    : "@" + command.config.dependencies[packageName]),
                            insPack
                        );
                        for (tryLoadCount = 1; tryLoadCount <= 3; tryLoadCount++) {
                            require["cache"] = {};
                            try {
                                if (listPackage.hasOwnProperty(packageName) || listbuiltinModules.includes(packageName))
                                    global.nodemodule[packageName] = require(packageName);
                                else global.nodemodule[packageName] = require(moduleDir);
                                loadSuccess = true;
                                break;
                            } catch (erorr) {
                                error = erorr;
                            }
                            if (loadSuccess || !error) break;
                        }
                        if (!loadSuccess || error)
                            throw "Unable to load package " + packageName + " for module " + command.config.name + ", error: " + error + " " + error["stack"];
                    }
                }
                logger.loader("Successfully downloaded the entire package for the module " + command.config.name);
            }

            if (command.config.envConfig && typeof command.config.envConfig == "Object")
                try {
                    for (const [key, value] of Object.entries(command.config.envConfig)) {
                        if (typeof global.configModule[command.config.name] == undefined) global.configModule[command.config.name] = {};
                        if (typeof configValue[command.config.name] == undefined) configValue[command.config.name] = {};
                        if (typeof configValue[command.config.name][key] !== undefined)
                            global.configModule[command.config.name][key] = configValue[command.config.name][key];
                        else global.configModule[command.config.name][key] = value || "";
                        if (typeof configValue[command.config.name][key] == undefined) configValue[command.config.name][key] = value || "";
                    }
                    logger.loader("Loaded config " + command.config.name);
                } catch (error) {
                    throw new Error("Failed to load config module, error: " + JSON.stringify(error));
                }

            if (command["onLoad"])
                try {
                    const onLoads = {};
                    onLoads["configValue"] = configValue;
                    command["onLoad"](onLoads);
                } catch (error) {
                    throw new Error("Unable to onLoad module, error: " + JSON.stringify(error));
                }

            if (command.handleEvent) global.client.eventRegistered.push(command.config.name);

            (global.config.commandDisabled.includes(nameModule + ".js") || configValue.commandDisabled.includes(nameModule + ".js")) &&
                (configValue.commandDisabled.splice(configValue.commandDisabled.indexOf(nameModule + ".js"), 1),
                global.config.commandDisabled.splice(global.config.commandDisabled.indexOf(nameModule + ".js"), 1));

            global.client.commands.set(command.config.name, command);
            logger.loader("Loaded command " + command.config.name + "!");
        } catch (error) {
            errorList.push("- " + nameModule + " reason:" + error + " at " + error["stack"]);
        }
    }

    if (errorList.length != 0) api.sendMessage("Modules that had problems loading: " + errorList.join(" "), threadID, messageID);
    api.sendMessage("✅ 𝗟𝗼𝗮𝗱𝗲𝗱 " + (moduleList.length - errorList.length) + " module(s)", threadID, messageID);

    writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
    unlinkSync(configPath + ".temp");
    return;
};

const unloadModule = function ({ moduleList, threadID, messageID }) {
    const { writeFileSync, unlinkSync } = global.nodemodule["fs-extra"];
    const { configPath, mainPath, api } = global.client;
    const logger = require(mainPath + "/utils/log");

    delete require.cache[require.resolve(configPath)];
    var configValue = require(configPath);
    writeFileSync(configPath + ".temp", JSON.stringify(configValue, null, 4), "utf8");

    for (const nameModule of moduleList) {
        global.client.commands.delete(nameModule);
        global.client.eventRegistered = global.client.eventRegistered.filter(item => item !== nameModule);
        configValue["commandDisabled"].push(`${nameModule}.js`);
        global.config["commandDisabled"].push(`${nameModule}.js`);
        logger.loader(`Unloaded command ${nameModule}!`);
    }

    writeFileSync(configPath, JSON.stringify(configValue, null, 4), "utf8");
    unlinkSync(configPath + ".temp");

    return api.sendMessage(`❌ 𝗨𝗻𝗹𝗼𝗮𝗱𝗲𝗱 ${moduleList.length} module(s)`, threadID, messageID);
};

module.exports.run = async function ({ event, args, api }) {
    const { readdirSync, readFileSync, writeFileSync } = global.nodemodule["fs-extra"];
    const { threadID, messageID } = event;
    var moduleList = args.splice(1, args.length);

    switch (args[0]) {
        case "load": {
            if (moduleList.length == 0) return api.sendMessage("⚠️ 𝗠𝗼𝗱𝘂𝗹𝗲 𝗻𝗮𝗺𝗲 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗲 𝗲𝗺𝗽𝘁𝘆!", threadID, messageID);
            else return loadCommand({ moduleList, threadID, messageID });
        }
        case "unload": {
            if (moduleList.length == 0) return api.sendMessage("⚠️ 𝗠𝗼𝗱𝘂𝗹𝗲 𝗻𝗮𝗺𝗲 𝗰𝗮𝗻𝗻𝗼𝘁 𝗯𝗲 𝗲𝗺𝗽𝘁𝘆!", threadID, messageID);
            else return unloadModule({ moduleList, threadID, messageID });
        }
        case "loadAll": {
       const wait = await      api.sendMessage("⏳ Reloading All Modules....", threadID, () => {
                moduleList = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes("example"));
                moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
                loadCommand({ moduleList, threadID, messageID });
                api.editMessage("✅ 𝗦𝘂𝗰𝗰𝗲𝘀𝘀\n━━━━━━━━━━━━━━━━━━\nReloaded all modules commands.", wait.messageID, threadID);
            });
            break;
        }
        case "unloadAll": {
            moduleList = readdirSync(__dirname).filter(file => file.endsWith(".js") && !file.includes("example") && !file.includes("command"));
            moduleList = moduleList.map(item => item.replace(/\.js/g, ""));
            return unloadModule({ moduleList, threadID, messageID });
        }
        case "info": {
            const command = global.client.commands.get(moduleList.join("") || "");
            if (!command) return api.sendMessage("⚠️ 𝗧𝗵𝗲 𝗺𝗼𝗱𝘂𝗹𝗲 𝘆𝗼𝘂 𝗲𝗻𝘁𝗲𝗿𝗲𝗱 𝗱𝗼𝗲𝘀 𝗻𝗼𝘁 𝗲𝘅𝗶𝘀𝘁!", threadID, messageID);

            const { name, version, hasPermssion, credits, cooldowns, dependencies } = command.config;
            return api.sendMessage(
                "━━━━━━━━━━━━━━━━━━\n" +
                "📦 𝗠𝗼𝗱𝘂𝗹𝗲 𝗜𝗻𝗳𝗼\n" +
                "━━━━━━━━━━━━━━━━━━\n" +
                "📝 𝗡𝗮𝗺𝗲: " + name + "\n" +
                "👤 𝗖𝗿𝗲𝗱𝗶𝘁𝘀: " + credits + "\n" +
                "📌 𝗩𝗲𝗿𝘀𝗶𝗼𝗻: " + version + "\n" +
                "🔐 𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻: " + (hasPermssion == 0 ? "User" : hasPermssion == 1 ? "Admin" : "Bot operator") + "\n" +
                "⏱️ 𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: " + cooldowns + "s\n" +
                "📦 𝗣𝗮𝗰𝗸𝗮𝗴𝗲𝘀: " + (Object.keys(dependencies || {})).join(", ") || "None",
                threadID,
                messageID
            );
        }
        case "share": {
            if (!moduleList[0]) return api.sendMessage("⚠️ 𝗣𝗹𝗲𝗮𝘀𝗲 𝗽𝗿𝗼𝘃𝗶𝗱𝗲 𝗮 𝗰𝗼𝗺𝗺𝗮𝗻𝗱 𝗻𝗮𝗺𝗲 𝘁𝗼 𝘀𝗵𝗮𝗿𝗲.", threadID, messageID);
            const filePath = path.join(__dirname, `${moduleList[0]}.js`);
            if (!fs.existsSync(filePath)) return api.sendMessage("⚠️ 𝗖𝗼𝗺𝗺𝗮𝗻𝗱 𝗻𝗼𝘁 𝗳𝗼𝘂𝗻𝗱.", threadID, messageID);

            const code = readFileSync(filePath, "utf8");
            return api.sendMessage(
                "━━━━━━━━━━━━━━━━━━\n" +
                "📤 𝗦𝗵𝗮𝗿𝗲𝗱 𝗖𝗼𝗺𝗺𝗮𝗻𝗱\n" +
                "━━━━━━━━━━━━━━━━━━\n" +
                "📝 𝗡𝗮𝗺𝗲: " + moduleList[0] + "\n\n" +
                code,
                threadID,
                messageID
            );
        }
        case "install": {
            if (moduleList.length < 2) return api.sendMessage("⚠️ Usage: ?cmd install <name> <code>", threadID, messageID);
            const cmdName = moduleList[0];
            const code = args.slice(2).join(" ");
            const filePath = path.join(__dirname, `${cmdName}.js`);
            try {
                writeFileSync(filePath, code, "utf8");
                return api.sendMessage(
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "✅ 𝗠𝗼𝗱𝘂𝗹𝗲 𝗜𝗻𝘀𝘁𝗮𝗹𝗹𝗲𝗱\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "📝 𝗡𝗮𝗺𝗲: " + cmdName,
                    threadID,
                    messageID
                );
            } catch (e) {
                return api.sendMessage(
                    "━━━━━━━━━━━━━━━━━━\n" +
                    "❌ 𝗜𝗻𝘀𝘁𝗮𝗹𝗹 𝗘𝗿𝗿𝗼𝗿\n" +
                    "━━━━━━━━━━━━━━━━━━\n" +
                    e.message,
                    threadID,
                    messageID
                );
            }
        }
        default: {
            return api.sendMessage("⚠️ 𝗜𝗻𝘃𝗮𝗹𝗶𝗱 𝗰𝗼𝗺𝗺𝗮𝗻𝗱. Usage: ?cmd load/unload/loadAll/unloadAll/info/share/install", threadID, messageID);
        }
    }
};