import pandas as pd
import numpy as np
import os

# ==========================================
# MODULE 2 - TIME SERIES SEQUENCE CREATION
# ==========================================

BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

TRAIN_PATH = os.path.join(
    BASE_PATH,
    "dataset",
    "processed",
    "train_timeseries.csv"
)

TEST_PATH = os.path.join(
    BASE_PATH,
    "dataset",
    "processed",
    "test_timeseries.csv"
)

OUTPUT_PATH = os.path.join(
    BASE_PATH,
    "dataset",
    "processed"
)

# Number of previous hours used for prediction
WINDOW_SIZE = 6


# ==========================================
# FUNCTION TO CREATE SEQUENCES
# ==========================================

def create_sequences(df, window_size):

    X = []
    y = []

    # Patient-wise processing
    for patient_id, patient_data in df.groupby("patient_id"):

        # Sort according to ICU time
        patient_data = patient_data.sort_values("ICULOS")

        # Reset index
        patient_data = patient_data.reset_index(drop=True)

        # Remove columns that should not be model inputs
        feature_columns = [
            col for col in patient_data.columns
            if col not in ["SepsisLabel", "patient_id"]
        ]

        features = patient_data[feature_columns].values
        labels = patient_data["SepsisLabel"].values

        # Need at least window_size + 1 rows
        if len(patient_data) <= window_size:
            continue

        # Sliding window
        for i in range(len(patient_data) - window_size):

            # Previous 6 hours
            window = features[i:i + window_size]

            # Next hour's sepsis label
            target = labels[i + window_size]

            X.append(window)
            y.append(target)

    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int32)


# ==========================================
# LOAD TRAINING DATA
# ==========================================

print("=" * 50)
print("MODULE 2 - TIME SERIES SEQUENCE CREATION")
print("=" * 50)

print("\nLoading training data...")

train_df = pd.read_csv(TRAIN_PATH)

print("Training data shape:", train_df.shape)
print("Training patients:", train_df["patient_id"].nunique())


# ==========================================
# LOAD TEST DATA
# ==========================================

print("\nLoading testing data...")

test_df = pd.read_csv(TEST_PATH)

print("Testing data shape:", test_df.shape)
print("Testing patients:", test_df["patient_id"].nunique())


# ==========================================
# CREATE TRAINING SEQUENCES
# ==========================================

print("\nCreating training sequences...")

X_train, y_train = create_sequences(
    train_df,
    WINDOW_SIZE
)

print("X_train shape:", X_train.shape)
print("y_train shape:", y_train.shape)


# ==========================================
# CREATE TESTING SEQUENCES
# ==========================================

print("\nCreating testing sequences...")

X_test, y_test = create_sequences(
    test_df,
    WINDOW_SIZE
)

print("X_test shape:", X_test.shape)
print("y_test shape:", y_test.shape)


# ==========================================
# TARGET DISTRIBUTION
# ==========================================

print("\nTraining target distribution:")

unique, counts = np.unique(y_train, return_counts=True)

for value, count in zip(unique, counts):
    print(f"{value}: {count}")


print("\nTesting target distribution:")

unique, counts = np.unique(y_test, return_counts=True)

for value, count in zip(unique, counts):
    print(f"{value}: {count}")


# ==========================================
# SAVE SEQUENCES
# ==========================================

np.save(
    os.path.join(OUTPUT_PATH, "X_train.npy"),
    X_train
)

np.save(
    os.path.join(OUTPUT_PATH, "y_train.npy"),
    y_train
)

np.save(
    os.path.join(OUTPUT_PATH, "X_test.npy"),
    X_test
)

np.save(
    os.path.join(OUTPUT_PATH, "y_test.npy"),
    y_test
)


# ==========================================
# FINAL INFORMATION
# ==========================================

print("\n" + "=" * 50)
print("MODULE 2 COMPLETED SUCCESSFULLY!")
print("=" * 50)

print("\nWindow size:", WINDOW_SIZE)

print("\nFinal sequence shapes:")
print("X_train:", X_train.shape)
print("y_train:", y_train.shape)
print("X_test :", X_test.shape)
print("y_test :", y_test.shape)

print("\nFiles generated:")

print("1. X_train.npy")
print("2. y_train.npy")
print("3. X_test.npy")
print("4. y_test.npy")