"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FreeBot = void 0;
const express = require('express');
const mongoose = require('mongoose');
const mqtt_1 = require("mqtt"); // import connect from mqtt
const msgsModel = mongoose.model('msgs', { msg: String, sentOn: Date, createdOn: Date, topicId: String, receipientId: String, senderId: String });
class FreeBot {
    constructor() {
        this.topicPrefix = 'free-bot-0310';
        this.app = express();
        this.initExpress();
        this.initMqttListener();
        this.initDB();
    }
    initDB() {
        mongoose.connect('mongodb+srv://freebot-cluster:Bhushan.0310@free-bot-cluster.rcy4s.mongodb.net/free-bot?retryWrites=true&w=majority');
    }
    initMqttListener() {
        const that = this;
        console.log(new Date(), 'Connecting to MQTT broker...');
        let client = (0, mqtt_1.connect)('mqtt://test.mosquitto.org'); // create a client
        client.on('error', function (e) {
            console.trace(new Date(), 'Error occured while connecting to MQTT broker', e);
        });
        client.on('connect', function () {
            client.subscribe(`${that.topicPrefix}/#`, function (err) { console.log(new Date(), 'Subscribed to ', `${that.topicPrefix}/#`); });
            client.publish(`${that.topicPrefix}/server`, JSON.stringify({ msg: 'Heyy from server itself' }));
        });
        client.on('message', function (topic, message) {
            // message is Buffer
            const msg = message.toString();
            console.log(new Date(), 'Received a message |', topic, '|', msg);
            const msgObject = JSON.parse(msg);
            msgObject.createdOn = new Date();
            msgObject.topicId = topic;
            const m = new msgsModel(msgObject);
            m.save().then(() => console.log(new Date(), 'saved to db', m));
        });
    }
    initExpress() {
        this.app.get('/', (req, res) => {
            res.json({ ok: true, timestamp: new Date().getTime() });
        });
        this.app.get('/channelId', (req, res) => {
            const { party1, party2 } = req.query;
            const btoa = require('btoa');
            const channelId = this.topicPrefix + '/' + btoa(`${party1}_${party2}_${new Date().getTime}`);
            res.json({ channelId });
        });
        const port = process.env.PORT || 3070;
        this.app.listen(port, () => {
            console.log(new Date(), 'Server running at', port);
        });
    }
}
exports.FreeBot = FreeBot;
new FreeBot();
//# sourceMappingURL=index.js.map