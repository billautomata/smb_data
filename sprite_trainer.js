var jpeg = require('jpeg-js')
var fs = require('fs')
var synaptic = require('synaptic'); // this line is not needed in the browser

var TRAINING_RATE = 0.001
var ITERATIONS = 1000000
var HIDDEN_SIZE = 4

console.log('starting up')

var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

var useful_indexes = [ 0,1,2,3,4,5,6,7,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,128,129,130,131,132,133,134,135,144,145,146,147,148,149,150,151,160,161,162,163,164,165,166,167,192,193,194,195,196,197,198,199,212 ]
var memory_data_all = JSON.parse(fs.readFileSync('./sprite_data.json').toString())
var memory_data = []
memory_data_all.forEach(function(m,idx){
  var useful_values = []
  useful_indexes.forEach(function(v){
    useful_values.push(m[v])
  })
  memory_data.push(useful_values)
})
console.log('training data length', memory_data.length)
console.log('inputs length', memory_data[0].length)

// remap the controls data to only use the useful buttons
var control_data_all = JSON.parse(fs.readFileSync('./inputs_data.json').toString())
var control_data = []
control_data_all.forEach(function(state){
  control_data.push([state[0], state[6], state[7]])
})

// console.log(control_data[0])

console.log('making the network')
var myNetwork = new Architect.Perceptron(
  memory_data[0].length,
  HIDDEN_SIZE * 2,
  HIDDEN_SIZE,
  control_data[0].length
)
console.log('done making the network')
var trainer = new Trainer(myNetwork)

// build the training data for each pixel
// input: [sprite memory data]
// output: [controls]

var trainingSet = []
memory_data.forEach(function(o,idx){
  // console.log(memory_data[idx].map(function(o){ return o/256.0 }))
  // console.log(control_data[idx].map(function(o){ return o-64 }))
  trainingSet.push({
    input: memory_data[idx].map(function(o){ return o/256.0 }),
    output: control_data[idx].map(function(o){ return o-64 })
  })
})

//
// trainingSet.push({
//   input: input_data,
//   output: pixel_values.map(function(o){return o *= (1.0/255.0) })
// })

// trainer.train(trainingSet.slice(0,1000),{
console.log('running trainer')
trainer.train(trainingSet,{
    rate: TRAINING_RATE,
    iterations: ITERATIONS,
    error: .005,
    shuffle: true,
    log: 1,
    cost: Trainer.cost.MSE,
    schedule: {
      every: 5, // repeat this task every 500 iterations
      do: function(data) {
          // console.log(data.error)
          fs.writeFileSync('./condensed_inputs.json', JSON.stringify(myNetwork.toJSON(),null,2), 'utf-8')
          return false;
      }
    }
});

fs.writeFileSync('./mb_ppu_network.json', JSON.stringify(myNetwork.toJSON(),null,2), 'utf-8')

// trainer.train(trainingSet.slice(0,100));
console.log('dunzo')
