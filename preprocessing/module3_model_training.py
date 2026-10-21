
import os
import numpy as np
import tensorflow as tf

from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix

# ==========================================
# PATHS
# ==========================================

BASE_PATH = os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))
)

DATA_PATH = os.path.join(
    BASE_PATH,
    "dataset",
    "processed"
)

MODEL_PATH = os.path.join(
    BASE_PATH,
    "models"
)

os.makedirs(MODEL_PATH, exist_ok=True)

# ==========================================
# LOAD DATA
# ==========================================

print("Loading sequence data...")

X_train = np.load(
    os.path.join(DATA_PATH, "X_train.npy")
)

y_train = np.load(
    os.path.join(DATA_PATH, "y_train.npy")
)

X_test = np.load(
    os.path.join(DATA_PATH, "X_test.npy")
)

y_test = np.load(
    os.path.join(DATA_PATH, "y_test.npy")
)

print("X_train:", X_train.shape)
print("y_train:", y_train.shape)
print("X_test:", X_test.shape)
print("y_test:", y_test.shape)

# ==========================================
# CLASS WEIGHTS
# ==========================================

classes = np.unique(y_train)

weights = compute_class_weight(
    class_weight="balanced",
    classes=classes,
    y=y_train
)

class_weights = dict(
    zip(classes, weights)
)

print("Class weights:", class_weights)

# ==========================================
# BUILD LSTM MODEL
# ==========================================

timesteps = X_train.shape[1]
features = X_train.shape[2]

model = Sequential([
    tf.keras.Input(
        shape=(timesteps, features)
    ),

    LSTM(
        64,
        return_sequences=True
    ),

    Dropout(0.3),

    LSTM(32),

    Dropout(0.3),

    Dense(16, activation="relu"),

    Dense(1, activation="sigmoid")
])

# ==========================================
# COMPILE MODEL
# ==========================================

model.compile(
    optimizer="adam",
    loss="binary_crossentropy",
    metrics=[
        "accuracy",
        tf.keras.metrics.Precision(name="precision"),
        tf.keras.metrics.Recall(name="recall"),
        tf.keras.metrics.AUC(name="auc")
    ]
)

model.summary()

# ==========================================
# CALLBACKS
# ==========================================

callbacks = [
    EarlyStopping(
        monitor="val_loss",
        patience=3,
        restore_best_weights=True
    ),

    ModelCheckpoint(
        os.path.join(
            MODEL_PATH,
            "sepsis_lstm.keras"
        ),
        monitor="val_loss",
        save_best_only=True
    )
]

# ==========================================
# TRAIN MODEL
# ==========================================

print("Starting model training...")

history = model.fit(
    X_train,
    y_train,

    validation_split=0.2,

    epochs=20,

    batch_size=128,

    class_weight=class_weights,

    callbacks=callbacks,

    verbose=1
)

# ==========================================
# EVALUATION
# ==========================================

print("Evaluating model...")

results = model.evaluate(
    X_test,
    y_test,
    verbose=1
)

for name, value in zip(
    model.metrics_names,
    results
):
    print(f"{name}: {value:.4f}")

# ==========================================
# CLASSIFICATION REPORT
# ==========================================

probabilities = model.predict(
    X_test,
    batch_size=128
).ravel()

predictions = (
    probabilities >= 0.5
).astype(int)

print("\nClassification Report:")

print(
    classification_report(
        y_test,
        predictions,
        zero_division=0
    )
)

print("\nConfusion Matrix:")

print(
    confusion_matrix(
        y_test,
        predictions
    )
)

print("\nMODEL TRAINING COMPLETED!")
