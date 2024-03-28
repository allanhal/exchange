"use strict";

import { PeerRPCServer, PeerRPCClient } from "grenache-nodejs-ws";
import Link from "grenache-nodejs-link";
import { OrderBook } from "./model/order-book.js";

const [, , port, command] = process.argv;
console.log({ port, command });

// -----------
// SERVER-PART
// -----------

let orderBook = new OrderBook();

const changeOrderBook = async ({ action, payload }) => {
  switch (action) {
    case "merge":
      orderBook = await orderBook.merge(payload);
      break;
    case "matchOrders":
      orderBook = await orderBook.matchOrders();
      break;
    case "addOrder":
      orderBook = await orderBook.addOrder(payload);
      break;
  }
};

const linkServer = new Link({
  grape: "http://localhost:30001",
});
linkServer.start();

const server = new PeerRPCServer(linkServer, {});
server.init();

const service = server.transport("server");
service.listen(port ? Number(port) : 1337);

setInterval(() => {
  linkServer.announce("syncOrderbook", service.port, {});
  linkServer.announce("show", service.port, {});
  linkServer.announce("retrieve", service.port, {});
}, 1000);

service.on("request", (rid, key, payload, handler) => {
  let result = {};
  switch (key) {
    case "syncOrderbook":
      sync(null, payload);
      result = orderBook;
      break;
    case "show":
      result = {
        rid,
        key,
        payload,
        handler,
        orderBook,
      };
      break;
    default:
      break;
  }
  handler.reply(null, result);
});

// -----------
// CLIENT-PART
// -----------

const linkClient = new Link({
  grape: "http://localhost:30001",
  requestTimeout: 10000,
});
linkClient.start();

const client = new PeerRPCClient(linkClient, {});
client.init();

const closeApp = false;

const sync = async (err, res) => {
  if (res && Object.keys(res).length > 0) {
    await changeOrderBook({ action: "merge", payload: res });
    await changeOrderBook({ action: "matchOrders" });
  }
  console.log("buyOrders:", orderBook.buyOrders);
  console.log("sellOrders:", orderBook.sellOrders);
};

const run = async (command) => {
  switch (command) {
    case "buy1":
      await changeOrderBook({
        action: "addOrder",
        payload: {
          type: "buy",
          quantity: 10,
          price: 105,
        },
      });
      linkClient.lookup("syncOrderbook", (err, peers) => {
        peers?.forEach(() => {
          client.request("syncOrderbook", orderBook, { timeout: 2000 }, sync);
        });
      });
      break;
    case "buy2":
      await changeOrderBook({
        action: "addOrder",
        payload: {
          type: "buy",
          quantity: 10,
          price: 120,
        },
      });
      linkClient.lookup("syncOrderbook", (err, peers) => {
        peers?.forEach(() => {
          client.request("syncOrderbook", orderBook, { timeout: 2000 }, sync);
        });
      });
      break;
    case "sell1":
      await changeOrderBook({
        action: "addOrder",
        payload: {
          type: "sell",
          quantity: 20,
          price: 105,
        },
      });
      linkClient.lookup("syncOrderbook", (err, peers) => {
        peers?.forEach(() => {
          client.request("syncOrderbook", orderBook, { timeout: 2000 }, sync);
        });
      });
      break;
    case "sell2":
      await changeOrderBook({
        action: "addOrder",
        payload: {
          type: "sell",
          quantity: 8,
          price: 110,
        },
      });
      linkClient.lookup("syncOrderbook", (err, peers) => {
        peers?.forEach(() => {
          client.request("syncOrderbook", orderBook, { timeout: 2000 }, sync);
        });
      });
    default:
      console.log("no command sent");
      console.log("OrderBook", orderBook);
      closeApp && process.exit(0);
  }
};

run(command);

// node client-server.js 1339 buy2
// node client-server.js 1341 sell2
// node client-server.js 1338 buy1
// node client-server.js 1340 sell1
