const express = require("express")
const app = express()
const server = require("http").createServer(app)
const WebSocket = require("ws")
const dotenv = require("dotenv")
const ping = require("ping")
const wol = require("wake_on_lan")
const path = require("path")
dotenv.config()


let allHosts = []
for (const [host, addresses] of Object.entries(process.env).filter(([env, val]) => /^HOST_PC_/.test(env))) {
     const PC_NAME = host.replace(/^HOST_PC_/, "")
     let addressMap = {}
     const SPLITTED_ADDRESSES = addresses.split(",")

     let hostEntry = {
          PC_NAME,
          MAC: SPLITTED_ADDRESSES[0]
     }
     if (SPLITTED_ADDRESSES.length > 1) {
          hostEntry.IP = SPLITTED_ADDRESSES[1]
     }


     allHosts.push(hostEntry)
}

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



app.use(express.static(path.join(__dirname, "node_modules", "bootstrap", "dist")))
app.use(express.static(path.join(__dirname, "frontend")))


// app.get("/", (req, res) => {
//      res.send("Hello")
// })

server.listen(3000, () => console.log("Listening on port 3000"))


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