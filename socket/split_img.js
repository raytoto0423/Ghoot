const webSocket = require('ws')
const vote = require('./vote.js')

const path = require("path");
const fs = require('fs');
const folderPath = path.join(__dirname, "..", "db_char");

let imageFiles = [];

try {
    const files = fs.readdirSync(folderPath);
    imageFiles = files.filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));

    if (imageFiles.length === 0) {
        console.log("이미지 파일이 없습니다.");
    }

} catch (err) {
    console.error(`폴더를 읽는 중 오류 발생 (${folderPath}):`, err);
}

function shuffle(array = entry) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function nextRound(array = winner, round  = round) { return {
    winner : shuffle(array),
    entry : winner,
    round : round // 2
}}

let winner = [];
let entry = imageFiles;
let round = imageFiles.length;

function handleRestart(ws) {
    if (imageFiles.length < 2) {
        console.error("월드컵 종료");
        return;
    }

    const shuffledImages = shuffle([...imageFiles]);
    const selectedImages = shuffledImages.slice(0, 2);
    imageFiles = imageFiles.filter(file => !selectedImages.includes(file));

    ws.send(JSON.stringify({
        action: "restart",
        vote1: `/db_char/${selectedImages[0]}`,
        vote2: `/db_char/${selectedImages[1]}`,
        url: "/template_for_admin.html"
    }));
}

module.exports = { handleRestart, nextRound }