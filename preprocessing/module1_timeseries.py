import os
import pandas as pd
import numpy as np
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

# ============================================================
# 1. PATHS
# ============================================================

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

DATA_PATH = os.path.join(
    BASE_DIR,
    "dataset",
    "raw",
    "training",
    "training_setA"
)

PROCESSED_PATH = os.path.join(
    BASE_DIR,
    "dataset",
    "processed"
)

os.makedirs(PROCESSED_PATH, exist_ok=True)


# ============================================================
# 2. LOAD PATIENT FILES
# ============================================================

files = [
    f for f in os.listdir(DATA_PATH)
    if f.endswith(".psv")
]

print("Number of patient files:", len(files))


dataframes = []

for file in files:

    file_path = os.path.join(DATA_PATH, file)

    try:
        df = pd.read_csv(file_path, sep="|")

        # Patient ID from filename
        patient_id = os.path.splitext(file)[0]

        df["patient_id"] = patient_id

        dataframes.append(df)

    except Exception as e:
        print("Error reading:", file)
        print(e)


# ============================================================
# 3. COMBINE ALL PATIENT DATA
# ============================================================

data = pd.concat(
    dataframes,
    ignore_index=True
)

print("\nCombined dataset shape:")
print(data.shape)

print("\nColumns:")
print(data.columns.tolist())

print("\nFirst 5 rows:")
print(data.head())


# ============================================================
# 4. BASIC INFORMATION
# ============================================================

print("\nDataset Information:")
print(data.info())


# ============================================================
# 5. DUPLICATE CHECK
# ============================================================

duplicate_count = data.duplicated().sum()

print("\nDuplicate rows:", duplicate_count)

if duplicate_count > 0:
    data = data.drop_duplicates()

print("Shape after duplicate removal:", data.shape)


# ============================================================
# 6. MISSING VALUE ANALYSIS
# ============================================================

print("\nMissing values BEFORE preprocessing:")

missing = data.isnull().sum()

missing = missing[missing > 0].sort_values(
    ascending=False
)

print(missing)


print("\nMissing value percentage:")

missing_percentage = (
    data.isnull().mean() * 100
).sort_values(ascending=False)

print(
    missing_percentage[
        missing_percentage > 0
    ]
)


# ============================================================
# 7. CHECK TARGET DISTRIBUTION
# ============================================================

print("\nSepsis Label Distribution:")

print(
    data["SepsisLabel"].value_counts()
)


print("\nSepsis Label Percentage:")

print(
    data["SepsisLabel"]
    .value_counts(normalize=True)
    .mul(100)
)


# ============================================================
# 8. CONSTANT COLUMN CHECK
# ============================================================

constant_columns = []

for column in data.columns:

    if data[column].nunique(dropna=False) <= 1:
        constant_columns.append(column)

print("\nConstant columns:")

print(constant_columns)


# ============================================================
# 9. REMOVE UNNECESSARY CONSTANT COLUMNS
# ============================================================

print("\nKeeping all columns to preserve the model feature schema:")
print(data.shape)


# ============================================================
# 10. SORT BY PATIENT + TIME
# ============================================================

data = data.sort_values(
    by=["patient_id", "ICULOS"]
).reset_index(drop=True)

print("\nData sorted by patient_id and ICULOS.")


# ============================================================
# 11. NUMERICAL COLUMNS
# ============================================================

numerical_columns = data.select_dtypes(
    include=["int64", "float64"]
).columns.tolist()

print("\nNumerical columns:")
print(numerical_columns)


# Remove target from numerical features

if "SepsisLabel" in numerical_columns:
    numerical_columns.remove("SepsisLabel")


# ============================================================
# 12. CATEGORICAL COLUMNS
# ============================================================

categorical_columns = data.select_dtypes(
    include=["object"]
).columns.tolist()

print("\nCategorical columns:")
print(categorical_columns)


# patient_id is an identifier, not a feature

if "patient_id" in categorical_columns:
    categorical_columns.remove("patient_id")


# ============================================================
# 13. MISSING VALUE HANDLING
# ============================================================

print("\nHandling missing values...")


# Numerical columns:
# Forward fill within each patient
# Then backward fill
# Remaining missing values -> median

for column in numerical_columns:

    data[column] = (
        data.groupby("patient_id")[column]
        .transform(
            lambda x: x.ffill().bfill()
        )
    )

    # Remaining missing values
    if data[column].isnull().sum() > 0:

        median_value = data[column].median()

        data[column] = data[column].fillna(
            median_value
        )


# ============================================================
# 14. CATEGORICAL VALUE HANDLING
# ============================================================

for column in categorical_columns:

    mode_value = data[column].mode()

    if len(mode_value) > 0:

        data[column] = data[column].fillna(
            mode_value.iloc[0]
        )

    else:

        data[column] = data[column].fillna(
            "Unknown"
        )


# ============================================================
# 15. CHECK MISSING VALUES AFTER HANDLING
# ============================================================

remaining_missing = data.isnull().sum().sum()

print("\nTotal missing values AFTER preprocessing:")

print(remaining_missing)


# ============================================================
# 16. CHECK SEPSIS LABEL
# ============================================================

print("\nFinal Sepsis Label Distribution:")

print(
    data["SepsisLabel"].value_counts()
)


# ============================================================
# 17. SAVE CLEANED TIME-SERIES DATA
# ============================================================

cleaned_file = os.path.join(
    PROCESSED_PATH,
    "cleaned_timeseries.csv"
)

data.to_csv(
    cleaned_file,
    index=False
)

print("\nCleaned time-series data saved:")

print(cleaned_file)


# ============================================================
# 18. PATIENT-LEVEL TRAIN / TEST SPLIT
# ============================================================

print("\nCreating patient-level train/test split...")


patient_ids = data["patient_id"].unique()

train_patients, test_patients = train_test_split(
    patient_ids,
    test_size=0.20,
    random_state=42
)


train_data = data[
    data["patient_id"].isin(train_patients)
].copy()


test_data = data[
    data["patient_id"].isin(test_patients)
].copy()


print("\nTraining patients:", len(train_patients))
print("Testing patients:", len(test_patients))

print("\nTraining shape:")
print(train_data.shape)

print("\nTesting shape:")
print(test_data.shape)


# ============================================================
# 19. TARGET DISTRIBUTION
# ============================================================

print("\nTraining target distribution:")

print(
    train_data["SepsisLabel"].value_counts()
)


print("\nTesting target distribution:")

print(
    test_data["SepsisLabel"].value_counts()
)


# ============================================================
# 20. SAVE TRAIN / TEST DATA
# ============================================================

train_file = os.path.join(
    PROCESSED_PATH,
    "train_timeseries.csv"
)

test_file = os.path.join(
    PROCESSED_PATH,
    "test_timeseries.csv"
)


train_data.to_csv(
    train_file,
    index=False
)


test_data.to_csv(
    test_file,
    index=False
)


print("\nTrain data saved:")
print(train_file)

print("\nTest data saved:")
print(test_file)


# ============================================================
# 21. FINAL SUMMARY
# ============================================================

print("\n========================================")
print("MODULE 1 TIME-SERIES PREPROCESSING DONE")
print("========================================")

print("Total patients:", len(patient_ids))
print("Training patients:", len(train_patients))
print("Testing patients:", len(test_patients))

print("Total rows:", len(data))
print("Training rows:", len(train_data))
print("Testing rows:", len(test_data))

print("\nFinal columns:")
print(data.columns.tolist())

print("\nFiles generated:")
print("1. cleaned_timeseries.csv")
print("2. train_timeseries.csv")
print("3. test_timeseries.csv")

print("\nModule 1 completed successfully!")