#!/usr/bin/env python3
"""
Compress all gallery images for web optimization
"""
import os
from PIL import Image, ImageOps
from pathlib import Path
import shutil

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
            
            return True
            
    except Exception as e:
        print(f"✗ Error compressing {input_path}: {e}")
        return False

def main():
    base_dir = Path(".")
    output_dir = Path("optimized")
    
    # Clean and recreate output directory
    if output_dir.exists():
        shutil.rmtree(output_dir)
    output_dir.mkdir()
    
    # Process each directory
    directories = ["Quriu Photo", "Studio Photos", "Host Photo"]
    
    total_original = 0
    total_compressed = 0
    total_files = 0
    
    for dir_name in directories:
        source_dir = base_dir / dir_name
        if not source_dir.exists():
            print(f"Directory {source_dir} not found, skipping...")
            continue
            
        target_dir = output_dir / dir_name
        target_dir.mkdir(exist_ok=True)
        
        print(f"\nProcessing {dir_name}...")
        
        # Get all jpeg files
        jpeg_files = list(source_dir.glob("*.jpeg")) + list(source_dir.glob("*.jpg")) + list(source_dir.glob("*.JPEG")) + list(source_dir.glob("*.JPG"))
        
        success_count = 0
        dir_original = 0
        dir_compressed = 0
        
        for img_file in jpeg_files:
            output_path = target_dir / img_file.name
            
            original_size = img_file.stat().st_size
            dir_original += original_size
            
            if compress_image(img_file, output_path):
                compressed_size = output_path.stat().st_size
                dir_compressed += compressed_size
                compression_ratio = (1 - compressed_size / original_size) * 100
                
                print(f"✓ {img_file.name}: {original_size/1024/1024:.1f}MB → {compressed_size/1024/1024:.1f}MB ({compression_ratio:.1f}% reduction)")
                success_count += 1
        
        total_original += dir_original
        total_compressed += dir_compressed
        total_files += success_count
        
        print(f"✓ {dir_name}: {success_count}/{len(jpeg_files)} images processed")
        print(f"  Directory size: {dir_original/1024/1024:.1f}MB → {dir_compressed/1024/1024:.1f}MB")
    
    # Final statistics
    overall_compression = (1 - total_compressed / total_original) * 100 if total_original > 0 else 0
    
    print(f"\n🎉 COMPRESSION COMPLETE!")
    print(f"📁 Files processed: {total_files}")
    print(f"📊 Total size: {total_original/1024/1024:.1f}MB → {total_compressed/1024/1024:.1f}MB")
    print(f"💾 Space saved: {(total_original - total_compressed)/1024/1024:.1f}MB ({overall_compression:.1f}% reduction)")
    print(f"🚀 Gallery should now load much faster!")

if __name__ == "__main__":
    main()