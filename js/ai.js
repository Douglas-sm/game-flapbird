const INPUT_SIZE = 5;

function ensureTensorFlow() {
  if (!window.tf) {
    throw new Error("TensorFlow.js not loaded. Check the tfjs script in index.html.");
  }
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
    // Keep all temporary tensors inside tidy to avoid disposing model variables by mistake.
    tf.tidy(() => {
      const sourceWeights = this.model.getWeights();
      const clonedWeights = sourceWeights.map((weight) => weight.clone());
      clonedModel.setWeights(clonedWeights);
    });

    return new BirdBrain(clonedModel);
  }

  crossover(otherBrain) {
    const childModel = BirdBrain.createModel();
    tf.tidy(() => {
      const firstWeights = this.model.getWeights();
      const secondWeights = otherBrain.model.getWeights();
      const mergedWeights = firstWeights.map((firstWeight, i) => {
        const secondWeight = secondWeights[i];
        const chooser = tf.randomUniform(firstWeight.shape).less(0.5);
        return tf.where(chooser, firstWeight, secondWeight);
      });

      childModel.setWeights(mergedWeights);
    });

    return new BirdBrain(childModel);
  }

  mutate(rate = 0.1, amount = 0.25) {
    tf.tidy(() => {
      const currentWeights = this.model.getWeights();
      const mutatedWeights = currentWeights.map((weightTensor) => {
        const mutationMask = tf.cast(
          tf.randomUniform(weightTensor.shape).less(rate),
          "float32"
        );
        const noise = tf.randomNormal(weightTensor.shape, 0, amount);
        return weightTensor.add(mutationMask.mul(noise));
      });

      this.model.setWeights(mutatedWeights);
    });
  }

  dispose() {
    this.model.dispose();
  }
}
