const express = require('express')

const mongoose = require('mongoose');

import { connect } from "mqtt"  // import connect from mqtt
const msgsModel = mongoose.model('msgs', { msg: String, sentOn: Date, createdOn: Date, topicId: String, receipientId: String, senderId: String });
export class FreeBot {
    topicPrefix = 'free-bot-0310'
    msgsModel: any;
    app = express()
    constructor() {
        this.initExpress()
        this.initMqttListener()
        this.initDB()
    }

    initDB() {
        mongoose.connect('mongodb+srv://freebot-cluster:Bhushan.0310@free-bot-cluster.rcy4s.mongodb.net/free-bot?retryWrites=true&w=majority');
    }

    initMqttListener() {
        const that = this;
        console.log(new Date(), 'Connecting to MQTT broker...')
        let client = connect('mqtt://test.mosquitto.org') // create a client
        client.on('error', function (e) {
            console.trace(new Date(), 'Error occured while connecting to MQTT broker', e)
        })
        client.on('connect', function () {
            client.subscribe(`${that.topicPrefix}/#`, function (err) { console.log(new Date(), 'Subscribed to ', `${that.topicPrefix}/#`) })
            client.publish(`${that.topicPrefix}/server`, JSON.stringify({ msg: 'Heyy from server itself' }))
        })

        client.on('message', function (topic, message) {
            // message is Buffer
            const msg = message.toString()
            console.log(new Date(), 'Received a message |', topic, '|', msg)

            const msgObject = JSON.parse(msg)

            msgObject.createdOn = new Date()
            msgObject.topicId = topic;
            const m = new msgsModel(msgObject);

            m.save().then(() => console.log(new Date(), 'saved to db', m));
        })


    }
    initExpress() {

        this.app.get('/', (req: any, res: any) => {
            res.json({ ok: true, timestamp: new Date().getTime() })
        })

        this.app.get('/channelId', (req: any, res: any) => {
            const { party1, party2 } = req.query
            const btoa = require('btoa')
            const channelId = this.topicPrefix + '/' + btoa(`${party1}_${party2}_${new Date().getTime}`)
            res.json({ channelId })
        })

        const port = process.env.PORT || 3070

        this.app.listen(port, () => {
            console.log(new Date(), 'Server running at', port)

        })
    }
}

new FreeBot()