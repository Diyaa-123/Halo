import numpy as np
import tensorflow as tf
from tensorflow.keras import layers, models
from sklearn.utils.class_weight import compute_class_weight
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import os

def build_gait_cnn(n_timesteps, n_features, n_classes=3):
    inputs = tf.keras.Input(shape=(n_timesteps, n_features))
    
    # Block 1: capture step-level patterns (~0.5-1 second)
    x = layers.Conv1D(32, kernel_size=5, padding='same', activation='relu')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling1D(pool_size=2)(x)
    x = layers.Dropout(0.2)(x)
    
    # Block 2: capture stride-level patterns (~1-2 seconds)
    x = layers.Conv1D(64, kernel_size=5, padding='same', activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling1D(pool_size=2)(x)
    x = layers.Dropout(0.2)(x)
    
    # Block 3: high-level temporal features
    x = layers.Conv1D(64, kernel_size=3, padding='same', activation='relu')(x)
    x = layers.BatchNormalization()(x)
    x = layers.GlobalAveragePooling1D()(x)
    x = layers.Dropout(0.3)(x)
    
    # Classifier head
    x = layers.Dense(64, activation='relu')(x)
    x = layers.Dropout(0.2)(x)
    outputs = layers.Dense(n_classes, activation='softmax')(x)
    
    return models.Model(inputs, outputs, name='gait_1dcnn')

def main():
    print("Loading data...")
    # Paths are relative to repo root assuming run from there
    X_train = np.load('scripts/processed/X_train.npy')
    y_train = np.load('scripts/processed/y_train.npy')
    X_test = np.load('scripts/processed/X_test.npy')
    y_test = np.load('scripts/processed/y_test.npy')
    
    import json
    with open('scripts/processed/label_map.json', 'r') as f:
        class_to_id = json.load(f)
    labels = [k for k, v in sorted(class_to_id.items(), key=lambda item: item[1])]
    n_classes = len(labels)

    # Squeeze trailing channel dimension if present (e.g. from (N, 200, 256, 1) to (N, 200, 256))
    if len(X_train.shape) == 4 and X_train.shape[3] == 1:
        X_train = np.squeeze(X_train, axis=-1)
        X_test = np.squeeze(X_test, axis=-1)
    
    n_subcarriers = X_train.shape[2]
    print(f"Data loaded. n_subcarriers: {n_subcarriers}, X_train shape: {X_train.shape}, n_classes: {n_classes}")

    # Plot one sample from each class
    print("Saving sample visualization to scripts/models/gait_samples.png...")
    os.makedirs('scripts/models', exist_ok=True)
    fig, axes = plt.subplots(n_classes, 1, figsize=(10, 2 * n_classes))
    if n_classes == 1:
        axes = [axes]
    for i in range(n_classes):
        idx = np.where(y_train == i)[0]
        if len(idx) > 0:
            sample = X_train[idx[0]]
            ax = axes[i]
            # Transpose so time is x-axis, subcarriers is y-axis
            im = ax.imshow(sample.T, aspect='auto', cmap='viridis', origin='lower')
            ax.set_title(f"Class: {labels[i]}")
            ax.set_ylabel("Subcarriers")
    plt.xlabel("Time steps")
    plt.tight_layout()
    plt.savefig('scripts/models/gait_samples.png')
    plt.close()
    
    model = build_gait_cnn(200, n_subcarriers, n_classes=n_classes)
    model.summary()
    
    classes = np.unique(y_train)
    weights = compute_class_weight('balanced', classes=classes, y=y_train)
    class_weight_dict = dict(zip(classes, weights))
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )
    
    callbacks = [
        tf.keras.callbacks.EarlyStopping(
            monitor='val_loss', patience=5, restore_best_weights=True
        ),
        tf.keras.callbacks.ReduceLROnPlateau(
            monitor='val_loss', factor=0.5, patience=4, min_lr=1e-6, verbose=1
        )
    ]
    
    trainableParams = model.count_params()
    print(f"Total trainable parameters: {trainableParams}")

    print("Label distributions:")
    print("y_train:", np.unique(y_train, return_counts=True))
    print("y_test:", np.unique(y_test, return_counts=True))
    
    print("Data stats:")
    print("X_train shape:", X_train.shape)
    print("X_train min:", X_train.min())
    print("X_train max:", X_train.max())
    print("X_train mean:", X_train.mean())
    print("X_train std:", X_train.std())
    
    print("Training model...")
    history = model.fit(
        X_train, y_train,
        epochs=50,
        batch_size=64,
        validation_split=0.15,
        class_weight=class_weight_dict,
        callbacks=callbacks,
        verbose=1
    )
    
    print("Evaluating on test set...")
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Accuracy: {accuracy:.4f}")
    
    y_pred_probs = model.predict(X_test)
    y_pred = np.argmax(y_pred_probs, axis=1)
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=labels))
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    # Print readable table
    header = f"{'':>10} | " + " | ".join([f"Pred: {lbl[:6]:>6}" for lbl in labels])
    print(header)
    print("-" * len(header))
    for i, true_label in enumerate(labels):
        row = f"True: {true_label[:6]:<5} | " + " | ".join([f"{cm[i, j]:>12}" for j in range(len(labels))])
        print(row)
        
    os.makedirs('scripts/models', exist_ok=True)
    
    # Save confusion matrix plot
    plt.figure(figsize=(6, 5))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Confusion Matrix')
    plt.colorbar()
    tick_marks = np.arange(len(labels))
    plt.xticks(tick_marks, labels)
    plt.yticks(tick_marks, labels)
    plt.ylabel('True label')
    plt.xlabel('Predicted label')
    for i in range(len(labels)):
        for j in range(len(labels)):
            plt.text(j, i, format(cm[i, j], 'd'),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > cm.max() / 2. else "black")
    plt.tight_layout()
    plt.savefig('scripts/models/gait_confusion_matrix.png')
    
    # Save model
    model.save('scripts/models/gait_cnn.h5')
    print("Model saved to scripts/models/gait_cnn.h5")
    
    # Trainable params calculation moved before training
    
if __name__ == "__main__":
    main()
