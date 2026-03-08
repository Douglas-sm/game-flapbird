const INPUT_SIZE = 5;

function ensureTensorFlow() {
  if (!window.tf) {
    throw new Error("TensorFlow.js not loaded. Check the tfjs script in index.html.");
  }
}

function gaussianNoise() {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export class BirdBrain {
  constructor(model = null) {
    ensureTensorFlow();
    this.model = model ?? BirdBrain.createModel();
  }

  static createModel() {
    ensureTensorFlow();

    const model = tf.sequential();
    model.add(
      tf.layers.dense({
        inputShape: [INPUT_SIZE],
        units: 8,
        activation: "relu",
      })
    );
    model.add(
      tf.layers.dense({
        units: 6,
        activation: "relu",
      })
    );
    model.add(
      tf.layers.dense({
        units: 1,
        activation: "sigmoid",
      })
    );

    return model;
  }

  predict(inputs) {
    return tf.tidy(() => {
      const inputTensor = tf.tensor2d([inputs], [1, INPUT_SIZE]);
      const outputTensor = this.model.predict(inputTensor);
      return outputTensor.dataSync()[0];
    });
  }

  clone() {
    const clonedModel = BirdBrain.createModel();
    const sourceWeights = this.model.getWeights();
    const clonedWeights = sourceWeights.map((weight) => weight.clone());

    clonedModel.setWeights(clonedWeights);

    sourceWeights.forEach((weight) => weight.dispose());
    clonedWeights.forEach((weight) => weight.dispose());

    return new BirdBrain(clonedModel);
  }

  crossover(otherBrain) {
    const childModel = BirdBrain.createModel();
    const firstWeights = this.model.getWeights();
    const secondWeights = otherBrain.model.getWeights();
    const mergedWeights = [];

    for (let i = 0; i < firstWeights.length; i += 1) {
      const aData = firstWeights[i].dataSync();
      const bData = secondWeights[i].dataSync();
      const mixed = new Float32Array(aData.length);

      for (let j = 0; j < mixed.length; j += 1) {
        mixed[j] = Math.random() < 0.5 ? aData[j] : bData[j];
      }

      mergedWeights.push(tf.tensor(mixed, firstWeights[i].shape));
    }

    childModel.setWeights(mergedWeights);

    firstWeights.forEach((weight) => weight.dispose());
    secondWeights.forEach((weight) => weight.dispose());
    mergedWeights.forEach((weight) => weight.dispose());

    return new BirdBrain(childModel);
  }

  mutate(rate = 0.1, amount = 0.25) {
    const currentWeights = this.model.getWeights();
    const mutatedWeights = currentWeights.map((weightTensor) => {
      const weightData = weightTensor.dataSync();
      const mutatedData = new Float32Array(weightData.length);

      for (let i = 0; i < weightData.length; i += 1) {
        const shouldMutate = Math.random() < rate;
        mutatedData[i] = shouldMutate
          ? weightData[i] + gaussianNoise() * amount
          : weightData[i];
      }

      return tf.tensor(mutatedData, weightTensor.shape);
    });

    this.model.setWeights(mutatedWeights);

    currentWeights.forEach((weight) => weight.dispose());
    mutatedWeights.forEach((weight) => weight.dispose());
  }

  dispose() {
    this.model.dispose();
  }
}
