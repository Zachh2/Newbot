const path = require('path');
const fs = require('fs-extra');
const cron = require("node-cron");


function setupAPIRoutes(app, { global, fs, path, os, diskusage, startTime, restartBot }) {

app.get("/api/system/stats", async (req, res) => {
  try {
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    const freeMem = Math.round(os.freemem() / 1024 / 1024);
    const usedMem = totalMem - freeMem;
    const usagePercent = Math.round((usedMem / totalMem) * 100);

    let totalDisk = 0;
    let freeDisk = 0;
    let usedDisk = 0;

    try {
      const disk = await diskusage.check("/");
      totalDisk = Math.round(disk.total / 1024 / 1024 / 1024);
      freeDisk = Math.round(disk.free / 1024 / 1024 / 1024);
      usedDisk = totalDisk - freeDisk;
    } catch (err) {
      console.warn("Disk check failed:", err.message);
    }

    let status = "good";
    if (usagePercent > 85) status = "critical";
    else if (usagePercent > 60) status = "average";

    res.json({
      memory: {
        total: totalMem,
        free: freeMem,
        used: usedMem,
        usagePercent
      },
      storage: `${usedDisk} GB / ${totalDisk} GB`,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      os: `${os.type()} ${os.release()} (${os.arch()})`,
      botActive: !!(global.client && global.client.api),
      status
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/api/db/status", (req, res) => {
  try {
    const threadsDataPath = path.join(__dirname, "..", "includes", "database", "data", "threadsData.json");
    const usersDataPath = path.join(__dirname, "..", "includes", "database", "data", "usersData.json");
    const deletedPath = path.join(__dirname, "..", "includes", "database", "data", "deletedThreads.json");

    let dbConnected = false;
    let totalThreads = 0;
    let totalUsers = 0;

    let deletedThreads = {};

    // ✅ LOAD DELETED THREADS
    if (fs.existsSync(deletedPath)) {
      try {
        const raw = fs.readFileSync(deletedPath, "utf8").trim();
        deletedThreads = raw ? JSON.parse(raw) : {};
      } catch {
        deletedThreads = {};
      }
    }

    if (fs.existsSync(threadsDataPath) && fs.existsSync(usersDataPath)) {
      dbConnected = true;

      try {
        const threadsRaw = fs.readFileSync(threadsDataPath, "utf8").trim();
        const usersRaw = fs.readFileSync(usersDataPath, "utf8").trim();

        const threadsData = threadsRaw ? JSON.parse(threadsRaw) : {};
        const usersData = usersRaw ? JSON.parse(usersRaw) : {};

        // ✅ FILTER VALID + NOT DELETED THREADS
        totalThreads = Object.entries(threadsData).filter(([threadID, data]) => {
          if (deletedThreads[threadID]) return false;
          if (!data || typeof data !== "object") return false;
          if (!data.threadInfo) return false;
          return true;
        }).length;

        totalUsers = Object.keys(usersData || {}).length;

      } catch (parseErr) {
        console.warn("JSON parse error:", parseErr.message);
      }
    }

    res.json({
      totalThreads,
      totalUsers,
      DBConnected: dbConnected,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({
      totalThreads: 0,
      totalUsers: 0,
      DBConnected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
   app.get('/api/thread/list', async (req, res) => {
  try {
    const threadsDataPath = path.join(__dirname, '..', 'includes', 'database', 'data', 'threadsData.json');
    const deletedPath = path.join(__dirname, '..', 'includes', 'database', 'data', 'deletedThreads.json');

    let deletedThreads = {};

    if (fs.existsSync(deletedPath)) {
      try {
        const raw = fs.readFileSync(deletedPath, 'utf8').trim();
        deletedThreads = raw ? JSON.parse(raw) : {};
      } catch {
        deletedThreads = {};
      }
    }

    let threadsMap = new Map();
    let source = "database";

    // =========================
    // ✅ LOAD DATABASE FIRST
    // =========================
    if (fs.existsSync(threadsDataPath)) {
      try {
        const raw = fs.readFileSync(threadsDataPath, 'utf8').trim();

        if (raw) {
          const threadsData = JSON.parse(raw);

          for (const [threadID, data] of Object.entries(threadsData)) {

            if (deletedThreads[threadID]) continue;
            if (!data?.threadInfo) continue;

            threadsMap.set(threadID, {
              threadID,
              name: data.threadInfo.threadName || "Unknown",
              participants: data.threadInfo.participantIDs?.length || 0,
              isGroup: data.threadInfo.isGroup || false,
              emoji: data.threadInfo.emoji || null,
              adminCount: data.threadInfo.adminIDs?.length || 0,
              createdAt: data.createTime?.timestamp || null,
              source: "database"
            });
          }
        }
      } catch (err) {
        console.log("⚠️ JSON corrupted, skipping database");
      }
    }

    // =========================
    // ✅ FETCH LIVE (OVERRIDE DB)
    // =========================
    if (global.client?.api) {
      try {
        const api = global.client.api;
        const threadList = await api.getThreadList(100, null, ["INBOX"]);

        for (const t of threadList) {

          if (deletedThreads[t.threadID]) continue;

          // 🔥 ALWAYS OVERRIDE (live = more accurate)
          threadsMap.set(t.threadID, {
            threadID: t.threadID,
            name: t.name || "Unknown",
            participants: t.participantIDs?.length || 0,
            isGroup: t.isGroup || false,
            emoji: t.emoji || null,
            adminCount: t.adminIDs?.length || 0,
            createdAt: t.timestamp || null,
            source: "live"
          });
        }

        source = "live+database";

      } catch (err) {
        console.log("⚠️ Live fetch failed:", err.message);
      }
    }

    const threads = Array.from(threadsMap.values());

    res.json({
      success: true,
      totalThreads: threads.length,
      threads,
      source,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("THREAD LIST ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
  app.get('/api/thread/send', async (req, res) => {
  try {
    const threadID = req.query.id;
    const message = req.query.message;

    if (!threadID) {
      return res.status(400).json({ success: false, error: "Thread ID is required" });
    }

    if (!message) {
      return res.status(400).json({ success: false, error: "Message is required" });
    }

    if (!global.client?.api) {
      return res.status(503).json({ success: false, error: "Bot API not ready" });
    }

    // =========================
    // 🔥 LOAD DELETED THREADS
    // =========================
    const deletedPath = path.join(__dirname, '..', 'includes', 'database', 'data', 'deletedThreads.json');

    let deletedThreads = {};

    if (fs.existsSync(deletedPath)) {
      try {
        const raw = fs.readFileSync(deletedPath, 'utf8').trim();
        deletedThreads = raw ? JSON.parse(raw) : {};
      } catch {
        deletedThreads = {};
      }
    }

    // ❌ BLOCK deleted
    if (deletedThreads[threadID]) {
      return res.status(403).json({
        success: false,
        error: "Thread is marked as deleted"
      });
    }

    // =========================
    // 🔥 OPTIONAL LIVE CHECK (SAFE)
    // =========================
    try {
      await new Promise((resolve, reject) => {
        global.client.api.getThreadInfo(threadID, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    } catch {
      return res.status(404).json({
        success: false,
        error: "Thread not accessible / invalid"
      });
    }

    // =========================
    // 🔥 SEND MESSAGE
    // =========================
    global.client.api.sendMessage(message, threadID, (err, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "Message sent",
        threadID,
        messageID: info?.messageID || null
      });
    });

  } catch (error) {
    console.error("SEND ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
  app.get("/api/threads/announcement", async (req, res) => {
  try {
    const message = req.query.message;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    if (!global.client?.api) {
      return res.status(503).json({
        success: false,
        error: "Bot API not ready"
      });
    }

    const threadsDataPath = path.join(__dirname, '..', 'includes', 'database', 'data', 'threadsData.json');
    const deletedPath = path.join(__dirname, '..', 'includes', 'database', 'data', 'deletedThreads.json');

    let deletedThreads = {};
    let threadsSet = new Set();

    // =========================
    // 🔥 LOAD DELETED
    // =========================
    if (fs.existsSync(deletedPath)) {
      try {
        const raw = fs.readFileSync(deletedPath, 'utf8').trim();
        deletedThreads = raw ? JSON.parse(raw) : {};
      } catch {
        deletedThreads = {};
      }
    }

    // =========================
    // 🔥 LOAD JSON THREADS
    // =========================
    if (fs.existsSync(threadsDataPath)) {
      try {
        const raw = fs.readFileSync(threadsDataPath, 'utf8').trim();

        if (raw) {
          const data = JSON.parse(raw);

          for (const [id, t] of Object.entries(data)) {
            if (deletedThreads[id]) continue;
            if (!t?.threadInfo?.isGroup) continue;

            threadsSet.add(id);
          }
        }
      } catch {
        console.log("⚠️ JSON corrupted");
      }
    }

    // =========================
    // 🔥 FETCH LIVE THREADS (IMPORTANT)
    // =========================
    try {
      const threadList = await global.client.api.getThreadList(100, null, ["INBOX"]);

      for (const t of threadList) {
        if (deletedThreads[t.threadID]) continue;
        if (!t.isGroup) continue;

        threadsSet.add(t.threadID);
      }

    } catch (err) {
      console.log("⚠️ Live fetch failed:", err.message);
    }

    const threadIDs = Array.from(threadsSet);

    if (!threadIDs.length) {
      return res.json({
        success: true,
        message: "No valid threads",
        totalThreads: 0
      });
    }

    let successCount = 0;
    let failCount = 0;
    const failedThreads = [];

    // =========================
    // 🔥 CONTROLLED SENDING
    // =========================
    for (const threadID of threadIDs) {
      try {
        await new Promise(resolve => {
          global.client.api.sendMessage(message, threadID, (err) => {
            if (err) {
              failCount++;
              failedThreads.push(threadID);
            } else {
              successCount++;
            }
            resolve();
          });
        });

        await new Promise(r => setTimeout(r, 400));

      } catch {
        failCount++;
        failedThreads.push(threadID);
      }
    }

    res.json({
      success: true,
      message: "Announcement sent",
      totalThreads: threadIDs.length,
      successCount,
      failCount,
      failedThreads
    });

  } catch (error) {
    console.error("ANNOUNCE ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
   app.post('/api/thread/send', async (req, res) => {
  try {
    const { id, message } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: "Thread ID is required"
      });
    }

    if (!message) {
      return res.status(400).json({
        success: false,
        error: "Message is required"
      });
    }

    if (!global.client || !global.client.api) {
      return res.status(503).json({
        success: false,
        error: "Bot API not ready"
      });
    }

    // =========================
    // 🔥 VALIDATE THREAD FROM JSON
    // =========================
    const threadsDataPath = path.join(
      __dirname,
      '..',
      'includes',
      'database',
      'data',
      'threadsData.json'
    );

    let existsInDB = false;

    if (fs.existsSync(threadsDataPath)) {
      try {
        const raw = fs.readFileSync(threadsDataPath, 'utf8').trim();

        if (raw) {
          const data = JSON.parse(raw);
          existsInDB = !!data[id];
        }
      } catch (err) {
        console.log("⚠️ JSON corrupted, skipping validation");
      }
    }

    // optional strict mode
    if (!existsInDB) {
      return res.status(404).json({
        success: false,
        error: "Thread not found in database"
      });
    }

    // =========================
    // 🔥 SEND MESSAGE
    // =========================
    global.client.api.sendMessage(message, id, (err, info) => {
      if (err) {
        return res.status(500).json({
          success: false,
          error: err.message
        });
      }

      res.json({
        success: true,
        message: "Message sent successfully",
        threadID: id,
        messageID: info?.messageID || null
      });
    });

  } catch (error) {
    console.error("POST SEND ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

    app.get("/api/system/restart", async (req, res) => {
        try {
            const action = req.query.action;
            
            if (!action) {
                return res.status(400).json({
                    success: false,
                    error: "Action is required. Use action=1 for restart or action=2 for shutdown",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (action === "1") {
                global.restart = 1;
                res.json({
                    success: true,
                    message: "Bot is restarting...",
                    action: "restart",
                    timestamp: new Date().toISOString()
                });
                setTimeout(() => {
                    process.exit(1);
                }, 2000);
            } else if (action === "2") {
                global.restart = 2;
                res.json({
                    success: true,
                    message: "Bot is shutting down...",
                    action: "shutdown",
                    timestamp: new Date().toISOString()
                });
                setTimeout(() => {
                    process.exit(0);
                }, 2000);
            } else {
                res.status(400).json({
                    success: false,
                    error: "Invalid action. Use action=1 for restart or action=2 for shutdown",
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.delete("/api/db/user/delete", (req, res) => {
        try {
            const userID = req.query.id;
            
            if (!userID) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');
            
            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
            
            if (!usersData[userID]) {
                return res.status(404).json({
                    success: false,
                    error: "User not found in database",
                    timestamp: new Date().toISOString()
                });
            }
            
            delete usersData[userID];
            
            fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));
            
            if (global.data.userBanned && global.data.userBanned.has(userID)) {
                global.data.userBanned.delete(userID);
            }
            
            res.json({
                success: true,
                message: "User deleted successfully from database",
                userID: userID,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.delete("/api/db/thread/delete", (req, res) => {
  try {
    const threadID = req.query.id;

    if (!threadID) {
      return res.status(400).json({
        success: false,
        error: "Thread ID is required"
      });
    }

    const basePath = path.join(__dirname, '..', 'includes', 'database', 'data');
    const threadsDataPath = path.join(basePath, 'threadsData.json');
    const deletedPath = path.join(basePath, 'deletedThreads.json');

    // =========================
    // 🔥 SAFE LOAD THREAD DATA
    // =========================
    let threadsData = {};

    if (fs.existsSync(threadsDataPath)) {
      try {
        const raw = fs.readFileSync(threadsDataPath, 'utf8').trim();
        threadsData = raw ? JSON.parse(raw) : {};
      } catch {
        threadsData = {};
      }
    }

    if (!threadsData[threadID]) {
      return res.status(404).json({
        success: false,
        error: "Thread not found in database"
      });
    }

    // =========================
    // 🔥 DELETE FROM MAIN DB
    // =========================
    delete threadsData[threadID];

    fs.writeFileSync(threadsDataPath, JSON.stringify(threadsData, null, 2));

    // =========================
    // 🔥 ADD TO BLOCK LIST
    // =========================
    let deletedThreads = {};

    if (fs.existsSync(deletedPath)) {
      try {
        const raw = fs.readFileSync(deletedPath, 'utf8').trim();
        deletedThreads = raw ? JSON.parse(raw) : {};
      } catch {
        deletedThreads = {};
      }
    }

    deletedThreads[threadID] = {
      deletedAt: Date.now()
    };

    fs.writeFileSync(deletedPath, JSON.stringify(deletedThreads, null, 2));

    // =========================
    // 🔥 CLEAR MEMORY
    // =========================
    global.data?.threadBanned?.delete(threadID);
    global.data?.threadInfo?.delete(threadID);
    global.data?.threadData?.delete(threadID);

    res.json({
      success: true,
      message: "Thread permanently deleted",
      threadID
    });

  } catch (error) {
    console.error("DELETE ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

   app.get("/api/users/list", async (req, res) => {
  try {
    const usersDataPath = path.join(__dirname, '..', 'includes', 'database', 'data', 'usersData.json');

    if (!fs.existsSync(usersDataPath)) {
      return res.status(404).json({
        success: false,
        error: "Users database not found"
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const startIndex = (page - 1) * limit;

    // =========================
    // 🔥 SAFE JSON LOAD
    // =========================
    let usersData = {};

    try {
      const raw = fs.readFileSync(usersDataPath, 'utf8').trim();
      usersData = raw ? JSON.parse(raw) : {};
    } catch {
      return res.status(500).json({
        success: false,
        error: "Invalid usersData.json"
      });
    }

    const usersArray = Object.entries(usersData);
    const totalUsers = usersArray.length;
    const totalPages = Math.ceil(totalUsers / limit);

    const paginatedUsers = usersArray.slice(startIndex, startIndex + limit);

    // =========================
    // 🔥 FETCH USER INFO IN PARALLEL (FAST)
    // =========================
    const users = await Promise.all(
      paginatedUsers.map(async ([userID, data]) => {
        let name = userID;
        let profilePicture = null;

        try {
          if (global.client && global.client.api) {
            const userInfo = await global.client.api.getUserInfo(userID);

            name = userInfo[userID]?.name || userID;
            profilePicture = userInfo[userID]?.profileUrl || null;
          }
        } catch {
          // fallback
        }

        return {
          userID,
          name,
          profilePicture,
          money: data.money || 0,
          exp: data.exp || 0,
          createTime: data.createTime?.timestamp || null,
          lastUpdate: data.lastUpdate || null,
          isBanned: global.data?.userBanned?.has(userID) || false
        };
      })
    );

    res.json({
      success: true,
      totalUsers,
      currentPage: page,
      totalPages,
      limit,
      users,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("USER LIST ERROR:", error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
    app.get("/api/users/ban", (req, res) => {
        try {
            const userID = req.query.id;
            const reason = req.query.reason || "No reason provided";

            if (!userID) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                    timestamp: new Date().toISOString()
                });
            }

            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');

            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found"
                });
            }

            const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));

            if (!usersData[userID]) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            usersData[userID].banned = true;
            usersData[userID].banReason = reason;
            usersData[userID].bannedAt = Date.now();

            fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));

            if (!global.data.userBanned) global.data.userBanned = new Map();

            global.data.userBanned.set(userID, {
                bannedAt: usersData[userID].bannedAt,
                reason
            });

            res.json({
                success: true,
                message: "User banned permanently",
                userID,
                reason
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.get("/api/users/unban", (req, res) => {
        try {
            const userID = req.query.id;

            if (!userID) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required"
                });
            }

            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');

            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found"
                });
            }

            let usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));

            if (!usersData[userID]) {
                return res.status(404).json({
                    success: false,
                    error: "User not found"
                });
            }

            delete usersData[userID].banned;
            delete usersData[userID].banReason;
            delete usersData[userID].bannedAt;

            fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));

            if (global.data.userBanned) {
                global.data.userBanned.delete(userID);
            }

            res.json({
                success: true,
                message: "User fully unbanned",
                userID
            });

        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message
            });
        }
    });

    app.post("/api/users/moneyset", (req, res) => {
        try {
            const { id, amount } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (amount === undefined || amount === null) {
                return res.status(400).json({
                    success: false,
                    error: "Amount is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');
            
            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
            
            if (!usersData[id]) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            usersData[id].money = parseInt(amount);
            usersData[id].lastUpdate = Date.now();
            
            fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));
            
            res.json({
                success: true,
                message: "Money updated successfully",
                userID: id,
                newMoney: usersData[id].money,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.post("/api/users/exp-set", (req, res) => {
        try {
            const { id, amount } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (amount === undefined || amount === null) {
                return res.status(400).json({
                    success: false,
                    error: "Amount is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');
            
            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
            
            if (!usersData[id]) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            usersData[id].exp = parseInt(amount);
            usersData[id].lastUpdate = Date.now();
            
            fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));
            
            res.json({
                success: true,
                message: "Experience updated successfully",
                userID: id,
                newExp: usersData[id].exp,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.post("/api/users/add-money", (req, res) => {
        try {
            const { id, amount } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (!amount || isNaN(parseInt(amount))) {
                return res.status(400).json({
                    success: false,
                    error: "Valid amount is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');
            
            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
            
            if (!usersData[id]) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            usersData[id].money = (usersData[id].money || 0) + parseInt(amount);
            usersData[id].lastUpdate = Date.now();
            
            fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));
            
            res.json({
                success: true,
                message: `Added ${amount} money to user`,
                userID: id,
                newMoney: usersData[id].money,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.post("/api/users/add-exp", (req, res) => {
        try {
            const { id, amount } = req.body;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: "User ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (!amount || isNaN(parseInt(amount))) {
                return res.status(400).json({
                    success: false,
                    error: "Valid amount is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');
            
            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
            
            if (!usersData[id]) {
                return res.status(404).json({
                    success: false,
                    error: "User not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            usersData[id].exp = (usersData[id].exp || 0) + parseInt(amount);
            usersData[id].lastUpdate = Date.now();
            
            fs.writeFileSync(usersDataPath, JSON.stringify(usersData, null, 4));
            
            res.json({
                success: true,
                message: `Added ${amount} experience to user`,
                userID: id,
                newExp: usersData[id].exp,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.get("/api/users/currencies", (req, res) => {
        try {
            const userID = req.query.id;
            const usersDataPath = path.join(__dirname, '..', 'includes/database/data/usersData.json');
            
            if (!fs.existsSync(usersDataPath)) {
                return res.status(404).json({
                    success: false,
                    error: "Users database not found",
                    timestamp: new Date().toISOString()
                });
            }
            
            const usersData = JSON.parse(fs.readFileSync(usersDataPath, 'utf8'));
            
            if (userID) {
                const user = usersData[userID];
                if (!user) {
                    return res.status(404).json({
                        success: false,
                        error: "User not found",
                        timestamp: new Date().toISOString()
                    });
                }
                
                res.json({
                    success: true,
                    userID: userID,
                    money: user.money || 0,
                    exp: user.exp || 0,
                    createTime: user.createTime?.timestamp || null,
                    lastUpdate: user.lastUpdate || null,
                    timestamp: new Date().toISOString()
                });
            } else {
                const users = [];
                for (const [id, data] of Object.entries(usersData)) {
                    users.push({
                        userID: id,
                        money: data.money || 0,
                        exp: data.exp || 0
                    });
                }
                
                res.json({
                    success: true,
                    totalUsers: users.length,
                    users: users,
                    timestamp: new Date().toISOString()
                });
            }
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.get("/api/thread/ban", async (req, res) => {
        try {
            const threadID = req.query.id;
            const reason = req.query.reason || "No reason provided";
            
            if (!threadID) {
                return res.status(400).json({
                    success: false,
                    error: "Thread ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (!global.data.threadBanned) {
                global.data.threadBanned = new Map();
            }
            
            global.data.threadBanned.set(threadID, {
                bannedAt: Date.now(),
                reason: reason
            });
            
            res.json({
                success: true,
                message: "Thread banned successfully",
                threadID: threadID,
                reason: reason,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.get("/api/thread/unban", async (req, res) => {
        try {
            const threadID = req.query.id;
            
            if (!threadID) {
                return res.status(400).json({
                    success: false,
                    error: "Thread ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (!global.data.threadBanned || !global.data.threadBanned.has(threadID)) {
                return res.status(404).json({
                    success: false,
                    error: "Thread is not banned",
                    timestamp: new Date().toISOString()
                });
            }
            
            global.data.threadBanned.delete(threadID);
            
            res.json({
                success: true,
                message: "Thread unbanned successfully",
                threadID: threadID,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.get("/api/thread/leave", async (req, res) => {
        try {
            const threadID = req.query.id;
            
            if (!threadID) {
                return res.status(400).json({
                    success: false,
                    error: "Thread ID is required",
                    timestamp: new Date().toISOString()
                });
            }
            
            if (!global.client || !global.client.api) {
                return res.status(503).json({
                    success: false,
                    error: "Bot API not initialized yet",
                    timestamp: new Date().toISOString()
                });
            }
            
            global.client.api.sendMessage("Bot is leaving this group. Goodbye! 👋", threadID, (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: err.message,
                        timestamp: new Date().toISOString()
                    });
                }
                
                setTimeout(() => {
                    global.client.api.removeUserFromGroup(global.client.api.getCurrentUserID(), threadID, (leaveErr) => {
                        if (leaveErr) {
                            return res.status(500).json({
                                success: false,
                                error: leaveErr.message,
                                timestamp: new Date().toISOString()
                            });
                        }
                        
                        res.json({
                            success: true,
                            message: "Bot left the thread successfully",
                            threadID: threadID,
                            timestamp: new Date().toISOString()
                        });
                    });
                }, 2000);
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    });

    app.get("/api/files/list", (req, res) => {
        const targetPath = path.join(__dirname, '..', req.query.path || "");
        try {
            const files = fs.readdirSync(targetPath, { withFileTypes: true });
            const result = files.map(f => ({
                name: f.name,
                isDirectory: f.isDirectory()
            }));
            res.json(result);
        } catch (err) {
            res.status(500).send([]);
        }
    });

    app.get("/api/files/read", (req, res) => {
        const filePath = path.join(__dirname, '..', req.query.path);
        try {
            const content = fs.readFileSync(filePath, "utf8");
            res.json({ content });
        } catch (err) {
            res.status(500).json({ content: "" });
        }
    });

    app.post("/api/files/save", (req, res) => {
        const filePath = path.join(__dirname, '..', req.body.name);
        try {
            fs.writeFileSync(filePath, req.body.data);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    });

    app.post("/api/files/create", (req, res) => {
        const filePath = path.join(__dirname, '..', req.body.name);
        try {
            fs.writeFileSync(filePath, "");
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    });

    app.delete("/api/files/delete", (req, res) => {
        const filePath = path.join(__dirname, '..', req.query.path);
        try {
            if (fs.lstatSync(filePath).isDirectory()) {
                fs.rmSync(filePath, { recursive: true });
            } else {
                fs.unlinkSync(filePath);
            }
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    });

    app.post("/api/files/rename", (req, res) => {
        const oldPath = path.join(__dirname, '..', req.body.oldPath);
        const newPath = path.join(path.dirname(oldPath), req.body.newName);
        try {
            fs.renameSync(oldPath, newPath);
            res.json({ success: true });
        } catch (err) {
            res.status(500).json({ success: false });
        }
    });
}

module.exports = { setupAPIRoutes };