import os
import glob
import shutil

def verify_dataset(images_path, labels_path):
    """
    Checks for missing labels or images and prints statistics.
    """
    images = glob.glob(os.path.join(images_path, '*'))
    labels = glob.glob(os.path.join(labels_path, '*'))
    
    img_names = {os.path.splitext(os.path.basename(x))[0] for x in images}
    lbl_names = {os.path.splitext(os.path.basename(x))[0] for x in labels}
    
    unlabeled = img_names - lbl_names
    orphan_labels = lbl_names - img_names
    
    print(f"Total Images: {len(img_names)}")
    print(f"Total Labels: {len(lbl_names)}")
    print(f"Unlabeled Images: {len(unlabeled)}")
    print(f"Orphan Labels: {len(orphan_labels)}")
    
    return unlabeled, orphan_labels

def combine_datasets(src_dirs, target_dir):
    """
    Merges multiple YOLO dataset folders into one.
    """
    # Create target structure
    for split in ['train', 'val', 'test']:
        os.makedirs(os.path.join(target_dir, split, 'images'), exist_ok=True)
        os.makedirs(os.path.join(target_dir, split, 'labels'), exist_ok=True)
    
    # Logic to copy files here...
    print("Merging logic logic defined here.")

if __name__ == "__main__":
    pass
