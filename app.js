const express = require("express")
const WebSocket = require("ws")
const dotenv = require("dotenv")
const ping = require("ping")
const wol = require("wake_on_lan")
const path = require("path")
dotenv.config()

const port = parseInt(process.env.PORT)

if (!(port >= 0 && port <=  65535)) {
     console.error(`Invalid Port: "${process.env.PORT}"`)
     process.exit(1)
}



const app = express()
const server = require("http").createServer(app)

let allHosts = []
for (const [host, addresses] of Object.entries(process.env).filter(([env, val]) => /^HOST_PC_/.test(env))) {
     const PC_NAME = host.replace(/^HOST_PC_/, "")
     const SPLITTED_ADDRESSES = addresses.split(",")

     let hostEntry = {
          PC_NAME,
          MAC: SPLITTED_ADDRESSES[0]
     }
     if (SPLITTED_ADDRESSES.length > 1) {
          hostEntry.IP = SPLITTED_ADDRESSES[1]
     }

     console.log(`add host-entry: ${hostEntry.PC_NAME} MAC: ${hostEntry.MAC} IP: ${hostEntry.IP}`)
     allHosts.push(hostEntry)
}

app.use(express.static(path.join(__dirname, "node_modules", "bootstrap", "dist")))
app.use(express.static(path.join(__dirname, "frontend")))

const wss = new WebSocket.Server({
     server: server
})

wss.on("connection", function(ws) {
     ws.on("message", function(message) {
          const MESSAGE_TOKENS = JSON.parse(String(message))
          const COMMAND = MESSAGE_TOKENS.shift()

          switch (COMMAND) {
               case "GETHOSTSTATES":
                    ws.send(JSON.stringify([COMMAND, allHosts]))
                    break;
               case "WAKE":
                    let findHost = allHosts.find(host => host.PC_NAME === MESSAGE_TOKENS[0])
                    if (findHost !== undefined) {
                         wol.wake(findHost.MAC)
                    }
                    break;
          
               default:
                    break;
          }

     })
})



server.listen(process.env.PORT, () => console.log(`Listening on port ${process.env.PORT}`))


updatePingStates()
setInterval(updatePingStates, 5000)



async function updatePingStates() {
     let pingStates = []

     for (const hostEntry of allHosts) {
          if (!hostEntry.hasOwnProperty("IP")) continue

          pingStates.push(ping.promise.probe(hostEntry.IP, {
               timeout: 1
          }))
     }

     let allResults = await Promise.all(pingStates)
     for (const pingResult of allResults) {
          allHosts.find(hostEntry => hostEntry.IP === pingResult.host).isAlive = pingResult.alive
     }
}