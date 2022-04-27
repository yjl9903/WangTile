const { writeFileSync } = require('fs');
const Jimp = require('jimp');
const { bgLightGreen, bgYellow, bgMagenta, bgBlue } = require('kolorist');

function getColor({ r, g, b }) {
  const abs = (x, y) => (x - y) * (x - y);
  const dis = [
    [80, 198, 81], // green
    [239, 222, 76], // yellow
    [248, 126, 62], // orange
    [64, 77, 141] // blue
  ].map(([x, y, z]) => {
    return 0.3 * 0.3 * abs(r, x) + 0.59 * 0.59 * abs(g, y) + 0.11 * 0.11 * abs(b, z);
    // return (r - x) * (r - x) + (g - y) * (g - y) + (b - z) * (b - z);
  });
  let id = 0;
  for (let i = 1; i < dis.length; i++) {
    if (dis[i] < dis[id]) id = i;
  }
  return id;
}

async function process() {
  const image = await Jimp.read('./extract/pic.png');

  const ans = new Array(8)
    .fill(null)
    .map(() => new Array(12).fill(null).map(() => [-1, -1, -1, -1]));

  for (let i = 0; i < 16; i++) {
    for (let j = 0; j < 12; j++) {
      const ux = image.bitmap.height / 16;
      const uy = image.bitmap.width / 12;
      const x = (uy * j + uy / 2) | 0;
      const y = (ux * i + ux / 2) | 0;
      const c = getColor(Jimp.intToRGBA(image.getPixelColor(x, y)));
      if (i % 2 == 0) {
        ans[i / 2][j][0] = c;
      } else {
        ans[(i - 1) / 2][j][2] = c;
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 24; j++) {
      const ux = image.bitmap.height / 8;
      const uy = image.bitmap.width / 24;
      const x = (uy * j + uy / 2) | 0;
      const y = (ux * i + ux / 2) | 0;
      const c = getColor(Jimp.intToRGBA(image.getPixelColor(x, y)));
      if (j % 2 == 0) {
        ans[i][j / 2][3] = c;
      } else {
        ans[i][(j - 1) / 2][1] = c;
      }
    }
  }

  for (let i = 0; i < 8; i++) {
    const t = (c) => ['G', 'Y', 'O', 'B'][c];
    console.log(ans[i].map((c) => ` ${t(c[0])} `).join(' '));
    console.log(ans[i].map((c) => `${t(c[3])} ${t(c[1])}`).join(' '));
    console.log(ans[i].map((c) => ` ${t(c[2])} `).join(' '));
    console.log();
  }

  // for (let i = 0; i < 8; i++) {
  //   const t = (c) => [bgLightGreen(' '), bgYellow(' '), bgMagenta(' '), bgBlue(' ')][c]
  //   console.log(ans[i].map(c => ` ${t(c[0])} `).join(' '));
  //   console.log(ans[i].map(c => `${t(c[3])} ${t(c[1])}`).join(' '));
  //   console.log(ans[i].map(c => ` ${t(c[2])} `).join(' '));
  //   console.log()
  // }
}

function print(raw) {
  const ans = new Array(8)
    .fill(null)
    .map(() => new Array(12).fill(null).map(() => [-1, -1, -1, -1]));
  const lines = raw.split('\n').slice(1);
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 12; j++) {
      const t = (c) => ({ G: 0, Y: 1, O: 2, B: 3 }[c]);
      ans[i][j][0] = t(lines[i * 4][j * 4 + 1]);
      ans[i][j][1] = t(lines[i * 4 + 1][j * 4 + 2]);
      ans[i][j][2] = t(lines[i * 4 + 2][j * 4 + 1]);
      ans[i][j][3] = t(lines[i * 4 + 1][j * 4]);
    }
  }

  for (let i = 0; i < 8; i++) {
    const t = (c) => [bgLightGreen(' '), bgYellow(' '), bgMagenta(' '), bgBlue(' ')][c];
    console.log(ans[i].map((c) => ` ${t(c[0])} `).join(' '));
    console.log(ans[i].map((c) => `${t(c[3])} ${t(c[1])}`).join(' '));
    console.log(ans[i].map((c) => ` ${t(c[2])} `).join(' '));
    console.log();
  }
  writeFileSync('./data.json', JSON.stringify(ans), 'utf-8');
}

// process();
print(`
 O   G   B   G   Y   Y   Y   G   B   B   B   O 
Y O O G B B O O O O G O G O G Y G O O Y Y B G B
 G   B   O   G   G   G   B   Y   O   Y   B   G

 Y   Y   Y   B   B   O   B   O   G   B   B   Y
O Y G Y B O G G G O G O O O G Y Y Y G B B G Y O
 Y   B   B   O   Y   Y   Y   G   G   O   Y   B

 O   O   B   G   B   B   G   Y   B   O   B   O
G B G B O B O G G O B O B G Y B O O B Y G B B G
 O   B   O   B   B   G   G   B   G   O   Y   G

 B   O   O   G   O   O   B   Y   B   B   O   B
B Y Y Y Y B G B B O B G B Y O B Y O B O Y Y B O
 B   G   B   Y   Y   O   B   O   O   G   B   Y

 Y   B   Y   G   B   O   G   O   Y   Y   B   G
Y O B G Y B B B G O O B B Y O B B B Y B B O B G
 O   Y   O   B   B   O   Y   B   B   B   G   O

 G   G   Y   O   Y   Y   B   Y   Y   Y   G   Y
O G O G O G Y G B O Y B O B O B G Y B Y O B Y Y
 Y   G   Y   G   O   B   O   G   B   B   O   B

 G   G   G   O   G   G   O   Y   Y   G   G   B
B O Y B O G Y Y G G B Y G O Y Y B G O B O O G Y
 Y   O   B   Y   Y   G   B   G   B   Y   O   Y

 O   Y   B   Y   G   O   O   B   B   O   Y   G
O Y O Y G G O Y B O B B B G O Y Y B G B B G O G
 G   G   Y   Y   O   B   Y   G   B   O   G   Y`);
