import 'uno.css';
import '@unocss/reset/normalize.css';
import '@unocss/reset/eric-meyer.css';
import '@unocss/reset/tailwind.css';
import './styles/main.css';

import { fabric } from 'fabric';

import answer from '../answer.json';
import data from '../data.json';

function render(data: number[][][]) {
  const WIDTH = 50,
    HEIGHT = 50;
  const ROW = data.length,
    COLUMN = data[0].length;

  const canvas = new fabric.StaticCanvas('board', {
    width: WIDTH * COLUMN,
    height: HEIGHT * ROW,
    backgroundColor: 'white'
  });

  function renderBoard() {
    const COLOR = ['rgb(80,198,81)', 'rgb(239,222,76)', 'rgb(249,145,65)', 'rgb(64,77,141)'];
    for (let i = 0; i < ROW; i++) {
      for (let j = 0; j < COLUMN; j++) {
        const tr0 = new fabric.Triangle({
          top: i * HEIGHT + HEIGHT / 2,
          left: j * WIDTH + WIDTH,
          angle: 180,
          width: WIDTH,
          height: HEIGHT / 2,
          fill: COLOR[data[i][j][0]],
          borderColor: 'white'
        });
        const tr1 = new fabric.Triangle({
          top: i * HEIGHT + HEIGHT,
          left: j * WIDTH + WIDTH / 2,
          angle: 270,
          width: WIDTH,
          height: HEIGHT / 2,
          fill: COLOR[data[i][j][1]],
          borderColor: 'white'
        });
        const tr2 = new fabric.Triangle({
          top: i * HEIGHT + HEIGHT / 2,
          left: j * WIDTH,
          width: WIDTH,
          height: HEIGHT / 2,
          fill: COLOR[data[i][j][2]],
          borderColor: 'white'
        });
        const tr3 = new fabric.Triangle({
          top: i * HEIGHT,
          left: j * WIDTH + WIDTH / 2,
          angle: 90,
          width: WIDTH,
          height: HEIGHT / 2,
          fill: COLOR[data[i][j][3]],
          borderColor: 'white'
        });
        canvas.add(tr0, tr1, tr2, tr3);
      }
    }
  }

  renderBoard();
}

const pathname = window.location.pathname;
if (pathname.startsWith('/ans')) {
  render(answer);
} else {
  render(data);
}
