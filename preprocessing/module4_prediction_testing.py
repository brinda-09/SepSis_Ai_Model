
import os
import numpy as np
import tensorflow as tf

# Paths
BASE_PATH = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_PATH = os.path.join(
    BASE_PATH, "dataset", "processed"
)

MODEL_PATH = os.path.join(
    BASE_PATH, "models", "sepsis_lstm.keras"
)

# Load model
model = tf.keras.models.load_model(MODEL_PATH)

# Load test data
X_test = np.load(
    os.path.join(DATA_PATH, "X_test.npy")
)

y_test = np.load(
    os.path.join(DATA_PATH, "y_test.npy")
)

# Select one patient sequence
sample = X_test[0:1]

actual_label = y_test[0]

# Predict
probability = model.predict(
    sample, verbose=0
)[0][0]

prediction = int(probability >= 0.5)

print("\n===== SEPSIS PREDICTION =====")

print("Actual Label:", actual_label)

print("Prediction Probability:",
      round(float(probability), 4))

print("Predicted Label:", prediction)

if prediction == 1:
    print("Result: Sepsis Risk Detected")
else:
    print("Result: No Sepsis Risk Detected")

print("=============================")
