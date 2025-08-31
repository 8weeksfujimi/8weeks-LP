#!/usr/bin/env python3
"""
LINE ALBUM Photos Compressor - Compress new LINE ALBUM photos for Fujimi
"""
import os
from PIL import Image, ImageOps
from pathlib import Path

def compress_image(input_path, output_path, max_width=1200, quality=85):
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
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
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
    base_dir = Path("assets/images/gallery")
    fujimi_dir = base_dir / "Fujimi Photos"
    output_dir = base_dir / "optimized" / "Fujimi Photos"
    
    if not fujimi_dir.exists():
        print(f"Source directory {fujimi_dir} not found!")
        return
    
    output_dir.mkdir(parents=True, exist_ok=True)
    
    print(f"Processing LINE ALBUM Photos...")
    print(f"Source: {fujimi_dir}")
    print(f"Output: {output_dir}")
    print("-" * 50)
    
    # Get all LINE_ALBUM image files
    line_album_files = list(fujimi_dir.glob("LINE_ALBUM_*.jpg"))
    line_album_files.extend(list(fujimi_dir.glob("LINE_ALBUM_*.JPG")))
    
    if not line_album_files:
        print("No LINE_ALBUM files found!")
        return
    
    success_count = 0
    total_original_size = 0
    total_compressed_size = 0
    
    for img_file in sorted(line_album_files):
        output_path = output_dir / f"{img_file.stem}.jpg"
        
        original_size = os.path.getsize(img_file)
        total_original_size += original_size
        
        if compress_image(img_file, output_path):
            success_count += 1
            total_compressed_size += os.path.getsize(output_path)
    
    print("-" * 50)
    print(f"\nProcessed {success_count}/{len(line_album_files)} images")
    print(f"Total size: {total_original_size/1024/1024:.1f}MB → {total_compressed_size/1024/1024:.1f}MB")
    if total_original_size > 0:
        print(f"Total reduction: {(1 - total_compressed_size/total_original_size) * 100:.1f}%")

if __name__ == "__main__":
    main()