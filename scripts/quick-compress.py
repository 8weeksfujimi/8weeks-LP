#!/usr/bin/env python3
"""
Quick Image Compressor - Process images in batches
"""
import os
from PIL import Image, ImageOps
from pathlib import Path

def compress_image(input_path, output_path, max_width=800, quality=85):
    """Compress a single image"""
    try:
        with Image.open(input_path) as img:
            # Auto-rotate based on EXIF data
            img = ImageOps.exif_transpose(img)
            
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = rgb_img
            
            # Calculate new dimensions
            width, height = img.size
            if width > max_width:
                aspect_ratio = height / width
                new_width = max_width
                new_height = int(max_width * aspect_ratio)
                img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Save optimized image
            img.save(
                output_path,
                'JPEG',
                quality=quality,
                optimize=True,
                progressive=True
            )
            
            original_size = os.path.getsize(input_path)
            compressed_size = os.path.getsize(output_path)
            compression_ratio = (1 - compressed_size / original_size) * 100
            
            print(f"✓ {input_path.name}: {original_size/1024/1024:.1f}MB → {compressed_size/1024/1024:.1f}MB ({compression_ratio:.1f}% reduction)")
            return True
            
    except Exception as e:
        print(f"✗ Error compressing {input_path}: {e}")
        return False

def main():
    base_dir = Path(".")
    output_dir = Path("optimized")
    output_dir.mkdir(exist_ok=True)
    
    # Process each directory
    directories = ["Quriu Photo", "Studio Photos"]
    
    for dir_name in directories:
        source_dir = base_dir / dir_name
        if not source_dir.exists():
            print(f"Directory {source_dir} not found, skipping...")
            continue
            
        target_dir = output_dir / dir_name
        target_dir.mkdir(exist_ok=True)
        
        print(f"\nProcessing {dir_name}...")
        
        # Get first 5 images for quick test
        jpeg_files = list(source_dir.glob("*.jpeg"))[:5]
        
        success_count = 0
        for img_file in jpeg_files:
            output_path = target_dir / img_file.name
            if compress_image(img_file, output_path):
                success_count += 1
        
        print(f"Processed {success_count}/{len(jpeg_files)} images in {dir_name}")

if __name__ == "__main__":
    main()