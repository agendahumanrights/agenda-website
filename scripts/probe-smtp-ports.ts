import net from "node:net";

function probe(host: string, port: number): Promise<void> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port, timeout: 8000 }, () => {
      console.log("OPEN", host, port);
      socket.end();
      resolve();
    });
    socket.on("error", (error) => {
      console.log("FAIL", host, port, error.message);
      resolve();
    });
    socket.on("timeout", () => {
      console.log("TIMEOUT", host, port);
      socket.destroy();
      resolve();
    });
  });
}

async function main() {
  await probe("smtp.gmail.com", 465);
  await probe("smtp.gmail.com", 587);
  await probe("smtp.gmail.com", 25);
}

main();
