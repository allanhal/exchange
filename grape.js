"use strict";
import { Grape } from "grenache-grape";

const g1 = new Grape({
  dht_port: 20001,
  api_port: 30001,
  dht_bootstrap: ["127.0.0.1:20002"],
});

g1.start();

const g2 = new Grape({
  dht_port: 20002,
  api_port: 40001,
  dht_bootstrap: ["127.0.0.1:20001"],
});

g2.start();
