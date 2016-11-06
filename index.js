var jpeg = require('jpeg-js')
var fs = require('fs')
var synaptic = require('synaptic'); // this line is not needed in the browser


console.log('starting up')

var Neuron = synaptic.Neuron,
    Layer = synaptic.Layer,
    Network = synaptic.Network,
    Trainer = synaptic.Trainer,
    Architect = synaptic.Architect;

function Perceptron(input, hidden, output)
{
    // create the layers
    var inputLayer = new Layer(input);
    var hiddenLayer = new Layer(hidden);
    var outputLayer = new Layer(output);

    // connect the layers
    inputLayer.project(hiddenLayer);
    hiddenLayer.project(outputLayer);

    // set the layers
    this.set({
        input: inputLayer,
        hidden: [hiddenLayer],
        output: outputLayer
    });
}

// extend the prototype chain
Perceptron.prototype = new Network();
Perceptron.prototype.constructor = Perceptron;

var memory_width = 2048
var image_size = 256 * 240 * 3

var memory_size_to_load = 32

console.log('making the network')
var myNetwork = new Architect.Perceptron(memory_size_to_load + 1, 8, 32, 1)
console.log('done making the network')
var trainer = new Trainer(myNetwork)

var memory_data = JSON.parse(fs.readFileSync('./memory_data.json').toString())
var image_data = []

console.log('mem data length', memory_data.length)

var jpegData
var rawImageData
console.log('loading image data')
var images_to_load = 2
var mem_step = Math.ceil(memory_data.length / images_to_load)

memory_data.forEach(function(v,idx){

  if(idx % mem_step !== 0){
    return
  }
  console.log(idx)
  jpegData = fs.readFileSync('./output/'+idx+'.jpg')
  rawImageData = jpeg.decode(jpegData, true)
  var img = []

  // console.log(rawImageData.data.slice(0,100))

  rawImageData.data.forEach(function(v,idx){
    // console.log(idx,idx%4,v)
    if(idx % 4 === 3){
    } else {
      img.push(v)
    }
  })
  image_data.push(img)
})

console.log('number of images loaded', image_data.length)
console.log('values found in the image', image_data[0].length)

// build the training data for each pixel
// input: [[memory],[pixel_index]]    // memory + pixel index
// output: pixel_bufer[pixel_index]   // pixel value

var trainingSet = []
image_data.forEach(function(d,idx){

  var memory_data_remapped = memory_data[idx].slice(0,memory_size_to_load)
  memory_data_remapped = memory_data_remapped.map(function(o){return o *= (1.0/255.0) })

  // for each pixel
  d.forEach(function(pixel_value, pixel_idx){
    // append the pixel index to the memory data
    var input_data = memory_data_remapped.concat([pixel_idx/d.length])
    // console.log(input_data[memory_size_to_load])
    trainingSet.push({
      input: input_data,
      output: [pixel_value].map(function(o){return o *= (1.0/255.0) })
    })
  })
  console.log(idx,'training set size', trainingSet.length)
})

// trainer.train(trainingSet.slice(0,1000),{
console.log('runing trainer')
trainer.train(trainingSet,{
    rate: .001,
    iterations: 1000,
    error: .005,
    shuffle: false,
    log: 1,
    cost: Trainer.cost.CROSS_ENTROPY,
    schedule: {
      every: 20, // repeat this task every 500 iterations
      do: function(data) {
          console.log('writing network')
          fs.writeFileSync('./network.json', JSON.stringify(myNetwork.toJSON(),null,2), 'utf-8')
          // custom log
          // console.log("error", data.error, "iterations", data.iterations, "rate", data.rate);
          // if (someCondition)
              // return true; // abort/stop training
          return false;
      }
    }
});

fs.writeFileSync('./network.json', JSON.stringify(myNetwork.toJSON(),null,2), 'utf-8')

// trainer.train(trainingSet.slice(0,100));
console.log('dunzo')
