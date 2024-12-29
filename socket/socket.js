const webSocket = require('ws');
const loginHandler = require('../loginHandler');
const fs = require('fs')
const path = require('path')
const votes = require('./vote.js');
const htmlParser = require('./htmlParser.js');
const splitImg = require('./split_img.js');

let sockets = []
let admin_acc

function parseCookies(cookieHeader) {
    if (!cookieHeader) return {};
    return Object.fromEntries(
        cookieHeader.split(';').map(cookie => {
            const [key, value] = cookie.split('=').map(c => c.trim());
            return [key, decodeURIComponent(value)];
        })
    );
}

module.exports = (port, db) => {
    const wss = new webSocket.Server({port: port})

    wss.on('connection', (ws, req) => {
        const cookies = parseCookies(req.headers.cookie);
        const USER_COOKIE_KEY = "USER"
        if (!loginHandler.checkCookieFromHTTPRequest(req, USER_COOKIE_KEY)) {
            ws.close(1008, "Authentication Failed");
            return;
        }
        ws.id = req.headers['sec-websocket-key']
        sockets.push(ws)
        console.log("CONNECTED: ", sockets.length)

        const user_data = JSON.parse(cookies[USER_COOKIE_KEY])
        if (user_data.password === 'wlqrkrhtlvek') {
            admin_acc = ws
            ws.on('message', (res) => {
                const message = JSON.parse(res.toString());
                if (message.action === "startVote") { // 투표 시작
                    console.log("start vote")
                    sockets.forEach(cl => {
                        if (cl.id !== admin_acc.id) {
                            cl.send(JSON.stringify({ action: 'redirect', url: '/template_for_user.html' }))
                        } else {
                            cl.send(JSON.stringify({ action: 'redirect', url: '/template_for_admin.html' }))
                            splitImg.handleRestart(ws);
                        }
                    })
                    votes.vote_started = true
                } else if (message.action === "end_vote") { // 각 투표 종료
                    console.log("end vote")
                    let results = votes.get_vote();
                    results = results[0];
                    admin_acc.send(JSON.stringify({ action: 'result', url: '/vote_graph_admin.html', result: results }));
                    votes.vote_started = false
                } else if (message.action === "restart") {
                    sockets.forEach(cl => {
                        if (cl.id !== admin_acc) {
                            cl.send(JSON.stringify({ action: 'redirect', url: '/template_for_user.html' }));
                        } else {
                            splitImg.handleRestart(cl);
                        }
                    });
                }
            });
        } else {
            ws.on('message', (req) => {
                const msg = JSON.parse(req.toString());
                const acc = msg.acc.username;
                if (msg.action === "vote") {
                    console.log("vote", msg)
                    if (!votes.acc_exist(acc)) {
                        if (loginHandler.checkCookie(db, `{cookies: {USER: ${msg.acc}}}`)) votes.vote(msg.num, acc);
                        else ws.send(`<script>alert("로그인 정보 오류. 다시 로그인하세요.")</script>`)
                    } else ws.send(`<script>alert("재투표할 수 없습니다.")</script>`)
                }
            });
        }
        
        ws.on('close', (code, reason)=>{
            sockets = sockets.filter(v => {
                return ws.id !== v.id
            })
            if (ws.id === admin_acc) {
                admin_acc = null
            }
            console.log(sockets.length, code, reason)
        })
    })
}