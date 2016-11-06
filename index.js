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

console.log('making the network')
// var myNetwork = new Architect.Perceptron(memory_width, 2, image_size)
console.log('done making the network')
// var trainer = new Trainer(myNetwork)

var memory_data = JSON.parse(fs.readFileSync('./memory_data.json').toString())
var image_data = []

console.log('mem data length', memory_data.length)

var jpegData
var rawImageData
console.log('loading image data')
memory_data.slice(0,1).forEach(function(v,idx){
  if(idx%10 === 0){
    console.log(idx)
  }
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

console.log('image_data length', image_data.length)
console.log(image_data[0].length)

// var trainingSet = [
//   {
//     input: [0,0],
//     output: [0]
//   },
// ]

// trainer.train(trainingSet);
