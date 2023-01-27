const circ_opt = {
  parent:'#cell1',
  radius: {0: 50},
  fill: 'none',
  stroke: 'red',
  opacity: {1: 0},
  duration: 4500,
  strokeWidth: 3,
};

const circ = new mojs.Shape({
  ...circ_opt
});

const circ2 = new mojs.Shape({
  ...circ_opt,
  delay: 200
});

const circ3 = new mojs.Shape({
  ...circ_opt,
  delay: 300
});

const circ4 = new mojs.Shape({
  ...circ_opt,
  delay: 500
});



const timeline = new mojs.Timeline({
  repeat: 999
})
  .add(circ, circ2,circ3,circ4)
  .play();