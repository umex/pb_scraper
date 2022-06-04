import mysql from "mysql";
import util from 'util';
import fetch from "node-fetch";
import { JSDOM } from  "jsdom";

var connection;

const username = process.env.USERNAME;
const password = process.env.PASSWORD;
const host = process.env.HOST;
const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;
const database = process.env.DATABASE;

const startingValue = process.env.STARTING_VALUE;



function createConnection(){
    connection  = mysql.createConnection({
        host: host,
        user: dbUser,
        password: dbPassword,
        database: database
    });
}

async function showData(){
    createConnection();
    let tableExistsSQL = "SELECT * FROM dobrez_db_test.trading_data";
    let fn = util.promisify(connection.query).bind(connection);
    let values = await fn(tableExistsSQL);
    connection.end();
    let result = Object.values(JSON.parse(JSON.stringify(values)));
    console.log(result);
    return result;
}

async function saveData(){
    createConnection();
    let tableExistsSQL = "SELECT * FROM dobrez_db_test.trading_data ORDER BY id LIMIT 1";
    let fn = util.promisify(connection.query).bind(connection);
    let values = await fn(tableExistsSQL);
    
    if(values.length == 0){
        let base_value = await getLatestValue();
        let daily_return = 0;
        let daily_percentage = 0;
        let ROI = ((base_value - startingValue) / startingValue) * 100;
        var sql = `INSERT INTO trading_data ( date, base_value, daily_return, daily_percentage, ROI) VALUES ( NOW(), ${base_value}, ${daily_return}, ${daily_percentage}, ${ROI})`;
        let resp = await fn(sql);
        connection.end();
        return resp
    }else{
        let base_value = await getLatestValue();
        let daily_return = base_value - values[0].base_value;
        let daily_percentage = (diff / base_value) * 100;
        let ROI = ((base_value - startingValue) / startingValue) * 100;
        var sql = `INSERT INTO trading_data ( date, base_value, daily_return, daily_percentage, ROI) VALUES ( NOW(), ${base_value}, ${daily_return}, ${daily_percentage}, ${ROI})`;
        let resp = await fn(sql);
        connection.end();
        return resp
    }
    
}

async function initTable(){
    createConnection();
    let tableExistsSQL = "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'dobrez_db_test' AND table_name = 'trading_data' LIMIT 1";
    let fn = util.promisify(connection.query).bind(connection);
    let rows = await fn(tableExistsSQL);
    rows = JSON.parse(JSON.stringify(rows[0]))

    if(rows.count == 0){
        var sql = "CREATE TABLE trading_data (id INT AUTO_INCREMENT PRIMARY KEY, date DATE, base_value DECIMAL(6,2), daily_return DECIMAL(5,2), daily_percentage DECIMAL(3,2), ROI DECIMAL(5,2))";
        connection.query(sql, function (err, result) {
            if (err) {
                console.log(err);
            }
            console.log("trading_data sucessfully created");
            return "trading_data sucessfully created";

        });
        connection.end();
    }else{
        console.log("trading_data table already exists");
        connection.end();
        return "trading_data table already exists!";
    }
}

async function getLatestValue(){
	let firstHtml = await fetch("http://perfectoptionbinary.info/sign-in.php", {
		method: 'GET',
	}).then(res =>{
		return res.text();
	})

	let dom = new JSDOM(firstHtml);
	let { document } = dom.window;
	let csrf_token = document.getElementsByName("csrf_token")[0].value;

	var paramsObj = {
		csrf_token: csrf_token,
		username: username,
		password: password,
		login: ""
	};

	const searchParams = new URLSearchParams(paramsObj);

	let postResponse = await fetch("http://perfectoptionbinary.info/ajax-login.php", {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
		},
		body: searchParams
	  }).then(res =>{
		  return res;
	})

	let postCookie = parseCookies(postResponse);

	let secondHtml = await fetch("http://perfectoptionbinary.info/account/index.php", {
		'headers': {
			'accept': '*/*',
			'cookie': postCookie,
		},	
		method: 'GET',
		credentials: 'include'
	}).then(res =>{
		return res.text();
	})

	let dom2 = new JSDOM(secondHtml);
	let document2 = dom2.window.document;
	let value = document2.getElementsByClassName("text-white modal-title")[0].textContent.trim()
	value = value.replace(/\D/g, '');
	return value;
}

function parseCookies(response) {
	const raw = response.headers.raw()['set-cookie'];
	return raw.map((entry) => {
		const parts = entry.split(';');
		const cookiePart = parts[0];
		return cookiePart;
	}).join(';');
}

export default {saveData, showData, initTable, getLatestValue};