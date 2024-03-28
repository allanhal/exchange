"use strict";

export class Order {
  constructor({ id, type, quantity, price }) {
    this.id = id;
    this.type = type;
    this.quantity = quantity;
    this.price = price;
  }
}

export class OrderBook {
  constructor({ lastUpdate, buyOrders, sellOrders } = {}) {
    this.buyOrders = buyOrders || [];
    this.sellOrders = sellOrders || [];
    this.lastUpdate = lastUpdate || "";
  }

  async addOrder(order) {
    const buyOrders = this.buyOrders;
    const sellOrders = this.sellOrders;

    if (order.type === "buy") {
      buyOrders.push({ id: new Date().getTime(), ...order });
    } else if (order.type === "sell") {
      sellOrders.push({ id: new Date().getTime(), ...order });
    } else {
      throw new Error("Invalid order type");
    }

    return Promise.resolve(
      new OrderBook({ lastUpdate: new Date(), buyOrders, sellOrders })
    );
  }

  async matchOrders() {
    const buyOrders = JSON.parse(JSON.stringify(this.buyOrders)).sort(
      (a, b) => b.price - a.price
    );
    const sellOrders = JSON.parse(JSON.stringify(this.sellOrders)).sort(
      (a, b) => a.price - b.price
    );

    let buyIndex = 0;
    let sellIndex = 0;

    while (buyIndex < buyOrders.length && sellIndex < sellOrders.length) {
      const buyOrder = buyOrders[buyIndex];
      const sellOrder = sellOrders[sellIndex];

      if (buyOrder.price >= sellOrder.price) {
        if (buyOrder.quantity >= sellOrder.quantity) {
          buyOrder.quantity -= sellOrder.quantity;
          sellOrder.quantity = 0;
          sellIndex++;
        } else {
          sellOrder.quantity -= buyOrder.quantity;
          buyOrder.quantity = 0;
          buyIndex++;
        }
      } else {
        buyIndex++;
      }
      if (buyIndex === buyOrders.length) {
        buyIndex = 0;
        sellIndex++;
      }
    }

    return Promise.resolve(
      new OrderBook({
        lastUpdate: new Date(),
        buyOrders: buyOrders.filter((order) => order.quantity > 0),
        sellOrders: sellOrders.filter((order) => order.quantity > 0),
      })
    );
  }

  async merge(newOrderbook) {
    const sumArrays = (orders1, orders2) => {
      const result = orders1;
      orders2.forEach((order) => {
        if (!orders1.some((order1) => order.id === order1.id)) {
          result.push(order);
        }
      });

      return result;
    };

    return Promise.resolve(
      new OrderBook({
        lastUpdate: new Date(),
        buyOrders: sumArrays(this.buyOrders, newOrderbook.buyOrders),
        sellOrders: sumArrays(this.sellOrders, newOrderbook.sellOrders),
      })
    );
  }
}
