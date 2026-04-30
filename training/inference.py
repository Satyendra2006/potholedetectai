import argparse
import cv2
import numpy as np
from ultralytics import YOLO
import os

def run_inference(model_path, source, save=True):
    """
    Runs inference on image or video.
    
    Args:
        model_path (str): Path to the trained .pt file.
        source (str): Path to image/video or camera index.
        save (bool): Whether to save results.
    """
    model = YOLO(model_path)
    
    # Run inference
    results = model.predict(
        source=source,
        conf=0.25,
        iou=0.7,
        show=False,
        save=save,
        stream=True
    )
    
    for result in results:
        # masks is a list of Segment objects (instance segmentation)
        masks = result.masks
        boxes = result.boxes
        
        if masks is not None:
            # Calculate area
            for i, mask in enumerate(masks.data):
                # Mask is a binary tensor
                area_pixels = mask.sum().item()
                # Estimation: Percentage of image
                img_area = mask.shape[0] * mask.shape[1]
                damage_percentage = (area_pixels / img_area) * 100
                
                print(f"Pothole {i}: Area {area_pixels} px ({damage_percentage:.2f}%)")
        
        # Access original image if needed
        # img = result.orig_img
        
    print("Inference finished.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run YOLO inference for pothole detection')
    parser.add_argument('--model', type=str, default='yolov8n-seg.pt',
                        help='Path to the YOLO model file or pretrained model name')
    parser.add_argument('--source', type=str, required=True,
                        help='Path to image/video file or camera index (e.g. 0)')
    parser.add_argument('--no-save', action='store_true',
                        help="Don't save inference results")
    args = parser.parse_args()

    # Allow numeric camera indexes like 0, 1, etc.
    source = args.source
    if source.isdigit():
        source = int(source)
    elif not os.path.exists(source):
        raise FileNotFoundError(
            f"Source '{args.source}' does not exist.\n"
            "Please provide a valid image/video path or a camera index like 0."
        )

    run_inference(args.model, source, save=not args.no_save)
