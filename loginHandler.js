const express = require('express')
const path = require('path')
const USER_COOKIE_KEY = 'USER'
let db = new Map()

function cookieExists(req) {
    if (req.cookies) {
        if (req.cookies[USER_COOKIE_KEY]) {
            return true
        }
    }
    return false
}

function checkCookie(req) {
    if (cookieExists(req)) {
        const user = JSON.parse(req.cookies[USER_COOKIE_KEY])
        if (db.get(user.username)) {
            return true
        }
    }
    return false
}

function checkCookieFromHTTPRequest(req, cookieName) {
    // req.headers.cookie는 쿠키들을 문자열로 포함
    const cookies = req.headers.cookie;
  
    if (!cookies) {
      // 쿠키가 없는 경우
      return null;
    }
  
    // 쿠키 문자열을 배열로 변환하고, 각 쿠키를 key=value로 분리
    const cookieArray = cookies.split(';');
  
    // 쿠키 배열에서 원하는 쿠키를 찾기
    for (let i = 0; i < cookieArray.length; i++) {
      const [name, value] = cookieArray[i].trim().split('=');
      
      // 쿠키 이름이 일치하면 값 반환
      if (name === cookieName) {
        return value;
      }
    }
  
    // 쿠키를 찾지 못한 경우 null 반환
    return null;
}

function existIn(li, ele) { return li.indexOf(ele) > -1 }
function getCookie(req) { return JSON.parse(req.cookies[USER_COOKIE_KEY]); }
function removeCookie(res) { res.clearCookie(USER_COOKIE_KEY); }
function addCookie(data, res) { res.cookie(USER_COOKIE_KEY, JSON.stringify(data)); }

function secureStatic(paths) {
    let statics = express.static(path.join(__dirname, 'secure'));
    return (req, res, next) => {
        if (!paths.hasOwnProperty(req.path)) { return statics(req, res, next); }
        if (paths[req.path] === 'USER') {
            if (!checkCookie(db, req)) {
                return res.status(403).send('<h1>403 Forbidden</h1>');
            } else return statics(req, res, next);
        } else if (paths[req.path] === 'ADMIN') {
            if (req.cookies[USER_COOKIE_KEY]) {
                if (getCookie(req).password === 'wlqrkrhtlvek') return statics(req, res, next);
            } else return res.status(403).send('<h1>403 Forbidden</h1>');
        } else throw error('invalid auth type')
    };
}

module.exports = {
    checkCookie,
    getCookie,
    removeCookie,
    addCookie,
    secureStatic,
    cookieExists,
    existIn,
    db,
    checkCookieFromHTTPRequest
};