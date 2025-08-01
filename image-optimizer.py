#!/usr/bin/env python3
"""
Image Optimizer for 8weeks Gallery
Compresses and optimizes images for web delivery
"""

import os
import sys
from PIL import Image, ImageOps
import json
from pathlib import Path

class ImageOptimizer:
    def __init__(self, source_dir, target_dir):
        self.source_dir = Path(source_dir)
        self.target_dir = Path(target_dir)
        self.target_dir.mkdir(exist_ok=True)
        
        # Compression settings
        self.sizes = {
            'thumbnail': 300,
            'medium': 800,
            'large': 1600,
            'original': 2400
        }
        
        self.quality_settings = {
            'thumbnail': 85,
            'medium': 90,
            'large': 85,
            'original': 80
        }
    
    def optimize_image(self, input_path, output_path, max_width, quality=85):
        """Optimize a single image"""
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
                
                return os.path.getsize(output_path)
                
        except Exception as e:
            print(f"Error optimizing {input_path}: {e}")
            return 0
    
    def process_directory(self, subdir_name):
        """Process all images in a subdirectory"""
        source_subdir = self.source_dir / subdir_name
        if not source_subdir.exists():
            print(f"Directory {source_subdir} not found")
            return
        
        results = {
            'property': subdir_name,
            'images': [],
            'total_original_size': 0,
            'total_optimized_size': 0
        }
        
        # Create output subdirectories for each size
        for size in self.sizes.keys():
            (self.target_dir / subdir_name / size).mkdir(parents=True, exist_ok=True)
        
        # Process each image
        for img_file in source_subdir.glob('*.jpeg'):
            if img_file.is_file():
                original_size = img_file.stat().st_size
                results['total_original_size'] += original_size
                
                image_info = {
                    'filename': img_file.name,
                    'original_size': original_size,
                    'optimized_sizes': {}
                }
                
                # Create optimized versions for each size
                for size_name, max_width in self.sizes.items():
                    output_path = self.target_dir / subdir_name / size_name / img_file.name
                    quality = self.quality_settings[size_name]
                    
                    optimized_size = self.optimize_image(
                        img_file, 
                        output_path, 
                        max_width, 
                        quality
                    )
                    
                    if optimized_size > 0:
                        image_info['optimized_sizes'][size_name] = {
                            'size': optimized_size,
                            'path': str(output_path.relative_to(self.target_dir))
                        }
                        results['total_optimized_size'] += optimized_size
                
                results['images'].append(image_info)
                print(f"Processed: {img_file.name}")
        
        return results
    
    def generate_gallery_data(self, results_list):
        """Generate optimized gallery data structure"""
        gallery_data = {
            'properties': {},
            'optimization_info': {
                'total_original_size': sum(r['total_original_size'] for r in results_list),
                'total_optimized_size': sum(r['total_optimized_size'] for r in results_list),
                'compression_ratio': 0,
                'generated_at': ''
            }
        }
        
        # Calculate compression ratio
        total_orig = gallery_data['optimization_info']['total_original_size']
        total_opt = gallery_data['optimization_info']['total_optimized_size']
        if total_orig > 0:
            gallery_data['optimization_info']['compression_ratio'] = round(
                (1 - total_opt / total_orig) * 100, 2
            )
        
        # Add timestamp
        from datetime import datetime
        gallery_data['optimization_info']['generated_at'] = datetime.now().isoformat()
        
        # Process each property
        for results in results_list:
            property_name = results['property'].lower().replace(' ', '_')
            gallery_data['properties'][property_name] = {
                'name': f"8weeks {results['property'].title()}",
                'photos': []
            }
            
            # Add photo entries
            for img_info in results['images']:
                photo_entry = {
                    'filename': img_info['filename'],
                    'sizes': {}
                }
                
                # Add size variants
                for size_name, size_info in img_info['optimized_sizes'].items():
                    photo_entry['sizes'][size_name] = {
                        'src': f"optimized/{size_info['path']}",
                        'size': size_info['size']
                    }
                
                gallery_data['properties'][property_name]['photos'].append(photo_entry)
        
        return gallery_data

def main():
    if len(sys.argv) < 2:
        print("Usage: python image-optimizer.py <source_directory> [target_directory]")
        print("Example: python image-optimizer.py '.' 'optimized'")
        return
    
    source_dir = sys.argv[1]
    target_dir = sys.argv[2] if len(sys.argv) > 2 else 'optimized'
    
    optimizer = ImageOptimizer(source_dir, target_dir)
    
    # Process subdirectories
    subdirs = ['Quriu Photo', 'Studio Photos', 'Host Photo']
    results_list = []
    
    for subdir in subdirs:
        print(f"\nProcessing {subdir}...")
        results = optimizer.process_directory(subdir)
        if results:
            results_list.append(results)
            
            # Print statistics
            orig_size_mb = results['total_original_size'] / (1024 * 1024)
            opt_size_mb = results['total_optimized_size'] / (1024 * 1024)
            compression = (1 - results['total_optimized_size'] / results['total_original_size']) * 100
            
            print(f"  Original size: {orig_size_mb:.1f} MB")
            print(f"  Optimized size: {opt_size_mb:.1f} MB")
            print(f"  Compression: {compression:.1f}%")
    
    # Generate optimized gallery data
    if results_list:
        gallery_data = optimizer.generate_gallery_data(results_list)
        
        # Save gallery data
        with open(f'{target_dir}/optimized-gallery-data.json', 'w', encoding='utf-8') as f:
            json.dump(gallery_data, f, indent=2, ensure_ascii=False)
        
        print(f"\nOptimization complete!")
        print(f"Gallery data saved to: {target_dir}/optimized-gallery-data.json")
        
        # Print overall statistics
        opt_info = gallery_data['optimization_info']
        print(f"Total original size: {opt_info['total_original_size'] / (1024*1024):.1f} MB")
        print(f"Total optimized size: {opt_info['total_optimized_size'] / (1024*1024):.1f} MB")
        print(f"Overall compression: {opt_info['compression_ratio']:.1f}%")

if __name__ == "__main__":
    main()