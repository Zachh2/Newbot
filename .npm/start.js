const { spawn } = require("child_process");

function startBot() {

    const child = spawn("node", ["--trace-warnings", "--async-stack-traces", "main.js"], {

        cwd: __dirname,

        stdio: "inherit",

        shell: true

    });

    child.on("close", (codeExit) => {

        console.log(`Bot process exited with code: ${codeExit}`);

        if (codeExit !== 0) {

            setTimeout(startBot, 3000);

        }

    });

    child.on("error", (error) => {

        console.error(`An error occurred starting the bot: ${error}`);

        setTimeout(startBot, 3000);

    });

}

startBot();