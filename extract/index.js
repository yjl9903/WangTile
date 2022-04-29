const { writeFileSync, createWriteStream, readFileSync } = require('fs');
const { lightGreen, bgLightGreen, bgYellow, bgMagenta, bgBlue } = require('kolorist');
const Jimp = require('jimp');
const execa = require('execa');

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

function parse(raw) {
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
  return ans;
}

function print(raw) {
  const ans = parse(raw);

  for (let i = 0; i < 8; i++) {
    const t = (c) => [bgLightGreen(' '), bgYellow(' '), bgMagenta(' '), bgBlue(' ')][c];
    console.log(ans[i].map((c) => ` ${t(c[0])} `).join(' '));
    console.log(ans[i].map((c) => `${t(c[3])} ${t(c[1])}`).join(' '));
    console.log(ans[i].map((c) => ` ${t(c[2])} `).join(' '));
    console.log();
  }
  writeFileSync('./data.json', JSON.stringify(ans), 'utf-8');
}

const H = 8;
const W = 12;

async function genSAT(raw) {
  const parsed = parse(raw);
  const ans = [].concat(
    ...[].concat(...parsed).map(([a, b, c, d]) => {
      return [
        [a, b, c, d],
        [b, c, d, a],
        [c, d, a, b],
        [d, a, b, c]
      ];
    })
  );

  const clause = [];
  const add = (...vars) => {
    clause.push(vars);
  };

  for (let k = 0; k < ans.length; k += 4) {
    const list = [];
    for (let i = 0; i < H; i++) {
      for (let j = 0; j < W; j++) {
        const base = (i * W + j) * ans.length + k + 1;
        list.push(base, base + 1, base + 2, base + 3);
      }
    }
    add(...list);
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        add(-list[i], -list[j]);
      }
    }
  }

  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      const list = [];
      const base = (i * W + j) * ans.length + 1;
      for (let k = 0; k < ans.length; k++) {
        list.push(base + k);
      }
      add(...list);
      for (let i = 0; i < list.length; i++) {
        for (let j = i + 1; j < list.length; j++) {
          add(-list[i], -list[j]);
        }
      }
    }
  }
  for (let i = 0; i < H; i++) {
    for (let j = 0; j < W; j++) {
      if (j + 1 === W) continue;
      const base = (i * W + j) * ans.length + 1;
      for (let x = 0; x < ans.length; x++) {
        const clause = [-(base + x)];
        for (let y = x + 1; y < ans.length; y++) {
          if (ans[x][1] == ans[y][3]) {
            clause.push(base + ans.length + y);
          }
        }
        add(...clause);
      }
    }
  }
  for (let i = 0; i < H; i++) {
    if (i + 1 === H) continue;
    for (let j = 0; j < W; j++) {
      const base = (i * W + j) * ans.length + 1;
      for (let x = 0; x < ans.length; x++) {
        const clause = [-(base + x)];
        for (let y = x + 1; y < ans.length; y++) {
          if (ans[x][2] == ans[y][0]) {
            clause.push(base + W * ans.length + y);
          }
        }
        add(...clause);
      }
    }
  }

  const stream = createWriteStream('tile.cnf');
  stream.write(`p cnf ${H * W * ans.length} ${clause.length}\n`, 'utf-8');
  for (let i = 0; i < clause.length; i += 100000) {
    const content = clause
      .slice(i, i + 100000)
      .map((c) => c.join(' ') + ' 0\n')
      .join('');
    await new Promise((res, rej) => {
      stream.write(content, 'utf-8', (err) => {
        if (err) rej(err);
        else res();
      });
    });
  }
  await new Promise((res) => stream.end(() => res()));
  console.log(`${lightGreen('OK')} tile.cnf`);

  try {
    await execa('varisat', ['tile.cnf']);
  } catch (err) {
    getAnswer(ans, err.stdout);
  }
}

function getAnswer(ans, stdout) {
  const result = stdout.split('\n').slice(-1)[0].split(' ').slice(1, -1);
  if (result.length === H * W * ans.length) {
    const set = new Set(result.map((v) => +v));
    const map = [];
    const used = new Set();
    for (let i = 0; i < H; i++) {
      const row = [];
      map.push(row);
      for (let j = 0; j < W; j++) {
        const base = (i * W + j) * ans.length;
        const choice = [];
        for (let k = 0; k < ans.length; k++) {
          if (set.has(base + k + 1)) {
            choice.push(k);
          } else if (!set.has(-base - k - 1)) {
            console.log('Fail');
          }
        }
        if (choice.length === 1) {
          used.add(choice[0]);
          row.push(ans[choice[0]]);
        } else {
          console.log(`Fail at L${i}, C${j}`);
        }
      }
    }
    console.log(`${lightGreen('OK')} solved (use: ${used.size})`);
    writeFileSync('./answer.json', JSON.stringify(map), 'utf-8');
  } else {
    console.log(stdout);
  }
}

function solve(raw) {
  const parsed = parse(raw);
  const ans = [].concat(
    ...[].concat(...parsed).map(([a, b, c, d]) => {
      return [
        [a, b, c, d],
        [b, c, d, a],
        [c, d, a, b],
        [d, a, b, c]
      ];
    })
  );
  const stdout = readFileSync('ans.cnf', 'utf-8');
  getAnswer(ans, stdout);
}

const result = `
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
 G   G   Y   Y   O   B   Y   G   B   O   G   Y`;

// process();
// print(result);
genSAT(result);
// solve(result);
