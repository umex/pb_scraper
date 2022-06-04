import express from "express";
import schedule  from "node-schedule";
import helper from "./helper.js";

const app = express();	
const port = 3000;


app.set('view engine', 'ejs');

var connection;

schedule.scheduleJob('0 0 6 * * *',async function(){
    let date = new Date();
    if(date.getDay() != 0 && date.getDate() != 6){
        helper.initTable();
        helper.saveData();
    }
});


app.get("/", (req, res) => {
  res.send("Hello World!");
});


app.get("/date", (req, res) => {
    let test = new Date();
    res.send("done")
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


