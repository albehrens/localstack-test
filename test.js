const fetch = require("node-fetch");

const callFunc = () => fetch("http://localhost:4566/restapis/q4kyuj3qyp/prod/_user_request_/items");

const run = async () => {
    const timer = Date.now();
    await Promise.all([
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
        callFunc(),
    ]);
    console.log(Date.now() - timer);
}

run();