const { resolveSoa } = require('dns');
const express = require('express');
const schedule = require('node-schedule');
const path = require('path');
const helper = require('./helper.js');
const fs = require('fs');


const app = express();	
const port = proces.env.PORT || 3000;


app.set('view engine', 'ejs');
app.use(express.static(path.join('resources')));

schedule.scheduleJob('0 4 * * *',async function(){
    let date = new Date();
    if(date.getDay() != 0 && date.getDate() != 1){
        await helper.initTable();
        await helper.saveData();
        await helper.saveSchedulerData(true);
    }else{
        await helper.saveSchedulerData(false);
    }
});


app.get("/readSchedulerData", (req, res) => {
    let counterExists = fs.existsSync('./resources/logs/scheduler.txt');
    if (counterExists) {
        let textRead = fs.readFileSync('./resources/logs/scheduler.txt','utf-8').split('\n')
        res.render('pages/schedulerData', {
            values: textRead
        });
    }else{
        res.send("File not available")
    }

});

app.get("/date", (req, res) => {
    let test = new Date();
    res.send(test.getDay().toString())
});

app.get("/saveData", async (req, res) => {
    let result = await helper.saveData();
    res.send(result)
});

app.get("/showData", async (req, res) => {
    let result = await helper.showData();
    res.render('pages/index', {
        values: result
    });
});


app.get("/initTable", async (req, res) => {
    let response = await helper.initTable();
    res.send(response);
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});



