import * as dotenv from "dotenv";
dotenv.config();

import { MongoClient } from "mongodb";
import tls from "tls";

const uri = process.env.MONGODB_URI!;

// Direct hosts resolved from SRV
const hosts = [
  "ac-1jwslez-shard-00-00.rilz2iv.mongodb.net:27017",
  "ac-1jwslez-shard-00-01.rilz2iv.mongodb.net:27017",
  "ac-1jwslez-shard-00-02.rilz2iv.mongodb.net:27017",
];

async function checkTLS() {
  for (const host of hosts) {
    const [hostname, port] = host.split(":");
    console.log(`\nConnecting TLS directly to ${hostname}:${port}...`);
    await new Promise((resolve) => {
      const socket = tls.connect(
        {
          host: hostname,
          port: Number(port),
          servername: hostname,
          rejectUnauthorized: false,
        },
        () => {
          console.log(`✅ TLS connected to ${hostname}! Protocol: ${socket.getProtocol()}, Cipher:`, socket.getCipher());
          socket.end();
          resolve(true);
        }
      );
      socket.on("error", (err) => {
        console.log(`❌ TLS socket error on ${hostname}:`, err.message);
        resolve(false);
      });
    });
  }
}

checkTLS();
