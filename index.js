var jpeg = require('jpeg-js')
var fs = require('fs')
var synaptic = require('synaptic'); // this line is not needed in the browser

var TRAINING_RATE = 0.0001
var ITERATIONS = 1000000
var HIDDEN_SIZE = 16
var INPUT_SIZE = 32
var images_to_load = 64
var RANDOM = false

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

var width = 25
var height = 23
image_size = width * height * 3

var memory_size_to_load = INPUT_SIZE

console.log('making the network')
var myNetwork = new Architect.Perceptron(memory_size_to_load + 1, HIDDEN_SIZE, 3)
console.log('done making the network')
var trainer = new Trainer(myNetwork)

var memory_data = JSON.parse(fs.readFileSync('./memory_data.json').toString())
var image_data = []

console.log('mem data length', memory_data.length)

var jpegData
var rawImageData
console.log('loading image data')

var mem_step = Math.ceil(memory_data.length / images_to_load)

memory_data.forEach(function(v,idx){

  if(idx % mem_step !== 0){
    return
  }
  console.log(idx)
  jpegData = fs.readFileSync('./output/test/'+idx+'.jpg')
  rawImageData = jpeg.decode(jpegData, true)
  var img = []  // [r,g,b], [r,g,b]
  for(var i = 0; i < rawImageData.data.length; i+=4){
    img.push([
      rawImageData.data[i],
      rawImageData.data[i+1],
      rawImageData.data[i+2]
    ])
  }
  // console.log('img[3010]', img[3010])
  image_data.push(img)
})

console.log('number of images loaded', image_data.length)
console.log('values found in the image', image_data[0].length)

// build the training data for each pixel
// input: [[memory],[pixel_index]]    // memory + pixel index
// output: [r,g,b]   // pixel value

var trainingSet = []
image_data.forEach(function(d,idx){

  var memory_data_remapped = memory_data[idx].slice(0,memory_size_to_load)
  memory_data_remapped = memory_data_remapped.map(function(o){return o *= (1.0/255.0) })

  // for each pixel
  d.forEach(function(pixel_values, pixel_idx){
    // append the pixel index to the memory data
    var input_data = memory_data_remapped.concat([pixel_idx/d.length])
    // console.log(input_data[memory_size_to_load])
    // console.log(pixel_values.map(function(o){return o *= (1.0/255.0)}))
    trainingSet.push({
      input: input_data,
      output: pixel_values.map(function(o){return o *= (1.0/255.0) })
    })
  })
  console.log(idx,'training set size', trainingSet.length)
})

// trainer.train(trainingSet.slice(0,1000),{
console.log('running trainer')
trainer.train(trainingSet,{
    rate: TRAINING_RATE,
    iterations: ITERATIONS,
    error: .005,
    shuffle: true,
    log: 1,
    cost: Trainer.cost.CROSS_ENTROPY,
    schedule: {
      every: 5, // repeat this task every 500 iterations
      do: function(data) {
          // console.log('writing network')
          var jpeg = require('jpeg-js');
          // var width = 256, height = 240;
          var frameData = new Buffer(width * height * 4);
          var i = 0;

          var test_memory_idx = Math.floor(Math.random()*memory_data.length)
          var m_data = memory_data[test_memory_idx].slice(0,memory_size_to_load).map(function(o){return o *= (1.0/255.0) })

          if(RANDOM){
            m_data = m_data.map(function(o) { return Math.random() })
          }

          var pixel_idx = 0
          var pixel_length = width * height * 3
          var position_percent
          while (i < frameData.length) {
            position_percent = pixel_idx/pixel_length
            var pixels = myNetwork.activate(m_data.concat([position_percent]))

            if(Math.random() < 0.0001){
              console.log(Math.floor(pixels[0] * 255), position_percent)
            }

            frameData[i] = Math.floor(pixels[0] * 255); // red
            i++
            pixel_idx++
            frameData[i] = Math.floor(pixels[1] * 255); // g
            i++
            frameData[i] = Math.floor(pixels[2] * 255) // b
            i++
            frameData[i] = 0xFF; // alpha - ignored in JPEGs
            i++
          }
          var rawImageData = {
            data: frameData,
            width: width,
            height: height
          };
          var jpegImageData = jpeg.encode(rawImageData, 100);
          // console.log(jpegImageData)
          fs.writeFileSync('./test.jpg', jpegImageData.data)

          return false;
      }
    }
});

fs.writeFileSync('./network.json', JSON.stringify(myNetwork.toJSON(),null,2), 'utf-8')

// trainer.train(trainingSet.slice(0,100));
console.log('dunzo')
