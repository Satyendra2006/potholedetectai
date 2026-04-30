import os
import shutil
import yaml
from ultralytics import YOLO

def train_pothole_model(data_yaml_path, epochs=100, imgsz=640, batch=16):
    """
    Trains a YOLOv8-seg model for pothole detection.
    
    Args:
        data_yaml_path (str): Path to the data.yaml file.
        epochs (int): Number of training epochs.
        imgsz (int): Input image size.
        batch (int): Batch size.
    """
    # Load the base nano segmentation model
    model = YOLO('yolov8n-seg.pt')
    
    print(f"Starting training on {data_yaml_path}...")
    
    # Train the model
    results = model.train(
        data=data_yaml_path,
        epochs=epochs,
        imgsz=imgsz,
        batch=batch,
        patience=50,      # Early stopping
        save=True,
        device=0,         # Use GPU 0. Set to 'cpu' if no GPU.
        workers=8,
        project='pothole_segmentation',
        name='v8n_seg_base',
        exist_ok=True,
        # Augmentations
        hsv_h=0.015,      # Hue
        hsv_s=0.7,        # Saturation
        hsv_v=0.4,        # Brightness
        degrees=10.0,     # Rotation
        translate=0.1,    # Translation
        scale=0.5,        # Gain
        shear=2.0,        # Shear
        perspective=0.0001,
        flipud=0.0,       # Flip up-down
        fliplr=0.5,       # Flip left-right
        mosaic=1.0,       # Mosaic
        mixup=0.1,        # Mixup
        copy_paste=0.1    # Segment copy-paste
    )
    
    print("Training complete. Results saved in 'pothole_segmentation/v8n_seg_base'")
    return results

if __name__ == "__main__":
    # Example usage:
    # train_pothole_model('path/to/combined_data.yaml')
    pass
